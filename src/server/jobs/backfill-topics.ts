import { DigestStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import {
  type JobRunResultSummary,
  runWithJobRun,
} from "@/server/jobs/job-run-recorder";
import {
  inferCandidateTopicTags,
  normalizeTopicTags,
  topicSlug,
} from "@/server/ranking/topics";
import type { RankingCandidate } from "@/server/ranking/types";

const DEFAULT_TOPIC_BACKFILL_LIMIT = 50;
const MAX_TOPIC_BACKFILL_LIMIT = 200;
const managedTopicSources = ["ranking", "rule", "llm"];

export type RunTopicBackfillJobOptions = {
  digestDate?: string;
  force?: boolean;
  limit?: number;
  selectedOnly?: boolean;
};

export type TopicBackfillJobResult = {
  status: "backfilled" | "skipped";
  scannedCount: number;
  updatedCount: number;
  createdTopicCount: number;
  skippedCount: number;
  message: string;
};

type TopicBackfillCandidate = Prisma.CandidateItemGetPayload<{
  include: {
    source: true;
    topicTags: {
      include: {
        topic: true;
      };
    };
  };
}>;

export async function runTopicBackfillJob(
  options: RunTopicBackfillJobOptions = {},
): Promise<TopicBackfillJobResult> {
  return await runWithJobRun({
    jobType: "candidate:topic-backfill",
    metadata: normalizeJobMetadata(options),
    execute: () => runTopicBackfillJobCore(options),
    mapResult: mapTopicBackfillJobRunResult,
  });
}

export function mapTopicBackfillJobRunResult(
  result: TopicBackfillJobResult,
): JobRunResultSummary {
  const status = result.status === "backfilled" ? "SUCCESS" : "SKIPPED";

  return {
    status,
    scannedCount: result.scannedCount,
    createdCount: result.updatedCount,
    skippedCount: result.skippedCount,
    metadata: result,
  };
}

async function runTopicBackfillJobCore(
  options: RunTopicBackfillJobOptions = {},
): Promise<TopicBackfillJobResult> {
  const limit = normalizeTopicBackfillLimit(options.limit);
  const selectedOnly = options.selectedOnly ?? true;
  const force = options.force ?? false;
  const digestDate = options.digestDate?.trim();
  const candidates = await prisma.candidateItem.findMany({
    where: buildTopicBackfillCandidateWhere({
      digestDate,
      force,
      selectedOnly,
    }),
    include: {
      source: true,
      topicTags: {
        include: {
          topic: true,
        },
      },
    },
    orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
    take: limit,
  });

  if (candidates.length === 0) {
    return {
      status: "skipped",
      scannedCount: 0,
      updatedCount: 0,
      createdTopicCount: 0,
      skippedCount: 0,
      message: "没有需要回填主题标签的候选内容。",
    };
  }

  let updatedCount = 0;
  let createdTopicCount = 0;
  let skippedCount = 0;

  for (const candidate of candidates) {
    const topicTags = normalizeTopicTags(
      inferCandidateTopicTags(candidateToRankingCandidate(candidate)),
    );

    if (topicTags.length === 0) {
      skippedCount += 1;
      continue;
    }

    const result = await writeCandidateTopicTags({
      candidateId: candidate.id,
      source: "rule",
      topicTags,
    });

    updatedCount += result.updated ? 1 : 0;
    createdTopicCount += result.createdTopicCount;
    skippedCount += result.updated ? 0 : 1;
  }

  if (updatedCount === 0) {
    return {
      status: "skipped",
      scannedCount: candidates.length,
      updatedCount,
      createdTopicCount,
      skippedCount,
      message: "已扫描候选内容，但没有新增主题标签。",
    };
  }

  return {
    status: "backfilled",
    scannedCount: candidates.length,
    updatedCount,
    createdTopicCount,
    skippedCount,
    message: `已为 ${updatedCount} 条候选内容回填主题标签，新增主题 ${createdTopicCount} 个。`,
  };
}

export function buildTopicBackfillCandidateWhere({
  digestDate,
  force,
  selectedOnly,
}: {
  digestDate?: string;
  force: boolean;
  selectedOnly: boolean;
}): Prisma.CandidateItemWhereInput {
  return {
    ...(force
      ? {}
      : {
          topicTags: {
            none: {},
          },
        }),
    ...(selectedOnly
      ? {
          digestItems: {
            some: {
              digest: {
                ...(digestDate ? { digestDate } : {}),
                status: {
                  in: [DigestStatus.DRAFT, DigestStatus.PUBLISHED],
                },
              },
            },
          },
        }
      : {}),
  };
}

export function normalizeTopicBackfillLimit(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_TOPIC_BACKFILL_LIMIT;
  }

  return Math.max(1, Math.min(MAX_TOPIC_BACKFILL_LIMIT, Math.floor(value)));
}

function normalizeJobMetadata(options: RunTopicBackfillJobOptions) {
  return {
    digestDate: options.digestDate?.trim() || null,
    force: options.force ?? false,
    limit: normalizeTopicBackfillLimit(options.limit),
    selectedOnly: options.selectedOnly ?? true,
  };
}

async function writeCandidateTopicTags(input: {
  candidateId: string;
  source: string;
  topicTags: string[];
}) {
  const slugs = input.topicTags.map(topicSlug);
  const existingTopics = await prisma.topicTag.findMany({
    where: {
      slug: {
        in: slugs,
      },
    },
    select: {
      slug: true,
    },
  });
  const existingSlugs = new Set(existingTopics.map((topic) => topic.slug));
  let createdTopicCount = 0;
  let linkedCount = 0;

  await prisma.$transaction(async (tx) => {
    await tx.candidateTopic.deleteMany({
      where: {
        candidateId: input.candidateId,
        source: {
          in: managedTopicSources,
        },
      },
    });

    for (const label of input.topicTags) {
      const slug = topicSlug(label);
      const topic = await tx.topicTag.upsert({
        where: {
          slug,
        },
        create: {
          label,
          slug,
        },
        update: {
          label,
        },
      });

      if (!existingSlugs.has(slug)) {
        createdTopicCount += 1;
        existingSlugs.add(slug);
      }

      const existingLink = await tx.candidateTopic.findUnique({
        where: {
          candidateId_topicId: {
            candidateId: input.candidateId,
            topicId: topic.id,
          },
        },
      });

      if (existingLink && !managedTopicSources.includes(existingLink.source)) {
        continue;
      }

      await tx.candidateTopic.upsert({
        where: {
          candidateId_topicId: {
            candidateId: input.candidateId,
            topicId: topic.id,
          },
        },
        create: {
          candidateId: input.candidateId,
          topicId: topic.id,
          source: input.source,
        },
        update: {
          source: input.source,
        },
      });
      linkedCount += 1;
    }
  });

  return {
    createdTopicCount,
    updated: linkedCount > 0,
  };
}

function candidateToRankingCandidate(candidate: TopicBackfillCandidate): RankingCandidate {
  return {
    id: candidate.id,
    title: candidate.title,
    summary: candidate.summary,
    canonicalUrl: candidate.canonicalUrl,
    publishedAt: candidate.publishedAt,
    hotScore: candidate.hotScore,
    influenceScore: candidate.influenceScore,
    source: {
      name: candidate.source.name,
      type: candidate.source.type,
    },
  };
}
