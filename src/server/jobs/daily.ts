import { CandidateStatus, DigestStatus, Prisma } from "@/generated/prisma/client";
import { rankCandidatesWithLlm } from "@/server/llm/client";
import { prisma } from "@/server/db/prisma";
import { env } from "@/server/env";
import { runArticleEnrichmentJob } from "@/server/jobs/enrich-articles";
import { runCandidateTranslationJob } from "@/server/jobs/translate-candidates";
import { rankCandidatesWithFallback } from "@/server/ranking/fallback";
import {
  inferCandidateTopicTags,
  normalizeTopicTags,
  topicSlug,
} from "@/server/ranking/topics";
import type {
  ArticleEnrichmentJobResult,
  RunArticleEnrichmentJobOptions,
} from "@/server/jobs/enrich-articles";
import type {
  CandidateTranslationJobResult,
  RunCandidateTranslationJobOptions,
} from "@/server/jobs/translate-candidates";
import type {
  DigestRankingResult,
  RankingCandidate,
  RankingLimits,
} from "@/server/ranking/types";

const dailyRankingLimits: RankingLimits = {
  minItems: 10,
  maxItems: 20,
};

type RunDailyDigestOptions = {
  digestDate?: string;
  now?: Date;
};

export type DailyDigestJobResult = {
  digestDate: string;
  status: "written" | "published_preserved" | "failed";
  provider: "openai-compatible" | "deterministic-fallback";
  candidateCount: number;
  itemCount: number;
  digestId?: string;
  llmRunId: string;
  message: string;
  articleEnrichment?: ArticleEnrichmentJobResult;
  translation?: CandidateTranslationJobResult;
};

type ArticleEnrichmentRunner = (
  options?: RunArticleEnrichmentJobOptions,
) => Promise<ArticleEnrichmentJobResult>;

type CandidateTranslationRunner = (
  options?: RunCandidateTranslationJobOptions,
) => Promise<CandidateTranslationJobResult>;

export async function runDailyDigestJob(
  options: RunDailyDigestOptions = {},
): Promise<DailyDigestJobResult> {
  const now = options.now ?? new Date();
  const digestDate = options.digestDate ?? formatDate(now);
  validateDigestDate(digestDate);

  const windowEnd = options.digestDate ? getNextLocalDateStart(digestDate) : now;
  const windowStart = new Date(windowEnd.getTime() - 24 * 60 * 60 * 1000);
  const candidates = await loadCandidates(windowStart, windowEnd);
  const provider = env.LLM_API_KEY?.trim() ? "openai-compatible" : "deterministic-fallback";

  try {
    if (provider === "deterministic-fallback") {
      const ranking = rankCandidatesWithFallback(candidates, digestDate, dailyRankingLimits, windowEnd);

      const result = await writeSuccessfulDigest({
        digestDate,
        candidates,
        provider,
        model: env.LLM_MODEL,
        ranking,
        responseJson: {
          method: "deterministic-fallback",
          ranking,
        },
      });

      return await attachCandidateTranslationsToDailyResult(result);
    }

    const llmResult = await rankCandidatesWithLlm(candidates, digestDate, dailyRankingLimits);

    const result = await writeSuccessfulDigest({
      digestDate,
      candidates,
      provider,
      model: env.LLM_MODEL,
      ranking: llmResult.ranking,
      responseJson: llmResult.rawJson,
      promptHash: llmResult.promptHash,
      inputTokens: llmResult.inputTokens,
      outputTokens: llmResult.outputTokens,
    });

    return await attachCandidateTranslationsToDailyResult(result);
  } catch (error) {
    return await writeFailedDigest({
      digestDate,
      candidates,
      provider,
      model: env.LLM_MODEL,
      error,
    });
  }
}

export async function attachCandidateTranslationsToDailyResult(
  result: DailyDigestJobResult,
  translateCandidates: CandidateTranslationRunner = runCandidateTranslationJob,
  enrichArticles: ArticleEnrichmentRunner = runArticleEnrichmentJob,
): Promise<DailyDigestJobResult> {
  if (result.status === "failed") {
    return result;
  }

  let articleEnrichment: ArticleEnrichmentJobResult | undefined;

  try {
    articleEnrichment = await enrichArticles({
      digestDate: result.digestDate,
      selectedOnly: true,
    });
  } catch (error) {
    articleEnrichment = {
      scannedCount: 0,
      attemptedCount: 0,
      enrichedCount: 0,
      failedCount: 0,
      skippedCount: 0,
      message: `每日精选已生成，但原文正文自动抓取失败：${getErrorMessage(error)}`,
    };
  }

  try {
    const translation = await translateCandidates({
      digestDate: result.digestDate,
      selectedOnly: true,
    });

    return {
      ...result,
      articleEnrichment,
      translation,
    };
  } catch (error) {
    return {
      ...result,
      articleEnrichment,
      translation: {
        status: "failed",
        provider: "openai-compatible",
        scannedCount: 0,
        translatedCount: 0,
        failedCount: 0,
        message: `每日精选已生成，但中文翻译自动补齐失败：${getErrorMessage(error)}`,
      },
    };
  }
}

async function loadCandidates(windowStart: Date, windowEnd: Date): Promise<RankingCandidate[]> {
  return await prisma.candidateItem.findMany({
    where: {
      publishedAt: {
        gte: windowStart,
        lt: windowEnd,
      },
      status: {
        notIn: [CandidateStatus.DUPLICATE, CandidateStatus.REJECTED],
      },
    },
    include: {
      source: {
        select: {
          name: true,
          type: true,
        },
      },
    },
    orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
  });
}

async function writeSuccessfulDigest(input: {
  digestDate: string;
  candidates: RankingCandidate[];
  provider: DailyDigestJobResult["provider"];
  model: string;
  ranking: DigestRankingResult;
  responseJson: Prisma.InputJsonValue;
  promptHash?: string;
  inputTokens?: number;
  outputTokens?: number;
}): Promise<DailyDigestJobResult> {
  return await prisma.$transaction(async (tx) => {
    const llmRun = await tx.llmRun.create({
      data: {
        purpose: "daily_digest",
        provider: input.provider,
        model: input.model,
        promptHash: input.promptHash,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        responseJson: input.responseJson,
      },
    });

    const existingDigest = await tx.dailyDigest.findUnique({
      where: {
        digestDate: input.digestDate,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingDigest?.status === DigestStatus.PUBLISHED) {
      return {
        digestDate: input.digestDate,
        status: "published_preserved",
        provider: input.provider,
        candidateCount: input.candidates.length,
        itemCount: input.ranking.items.length,
        digestId: existingDigest.id,
        llmRunId: llmRun.id,
        message: "当天 DailyDigest 已发布，本次仅记录 LlmRun，未覆盖已发布内容。",
      };
    }

    const digest = await tx.dailyDigest.upsert({
      where: {
        digestDate: input.digestDate,
      },
      create: {
        digestDate: input.digestDate,
        status: DigestStatus.DRAFT,
        title: input.ranking.digestTitle,
        summary: input.ranking.digestSummary,
        generatedAt: new Date(),
        llmRunId: llmRun.id,
      },
      update: {
        status: DigestStatus.DRAFT,
        title: input.ranking.digestTitle,
        summary: input.ranking.digestSummary,
        generatedAt: new Date(),
        llmRunId: llmRun.id,
      },
    });

    await tx.digestItem.deleteMany({
      where: {
        digestId: digest.id,
      },
    });

    if (input.ranking.items.length > 0) {
      const candidatesById = new Map(input.candidates.map((candidate) => [candidate.id, candidate]));

      await tx.digestItem.createMany({
        data: input.ranking.items.map((item) => {
          const candidate = candidatesById.get(item.candidateId);

          if (!candidate) {
            throw new Error(`Unknown candidateId in ranking result: ${item.candidateId}`);
          }

          return {
            digestId: digest.id,
            candidateId: candidate.id,
            rank: item.rank,
            titleSnapshot: candidate.title,
            sourceSnapshot: candidate.source.name,
            urlSnapshot: candidate.canonicalUrl,
            interpretation: item.interpretation,
            score: item.score,
            signals: {
              method: input.provider === "deterministic-fallback" ? "确定性规则排序" : "LLM 评分",
              sourceType: candidate.source.type,
              publishedAt: candidate.publishedAt.toISOString(),
              hotScore: candidate.hotScore,
              influenceScore: candidate.influenceScore,
              impactReason: item.impactReason ?? null,
              heatReason: item.heatReason ?? null,
              topicTags: item.topicTags ?? [],
            },
          };
        }),
      });

      await writeCandidateTopicTags({
        candidatesById,
        items: input.ranking.items,
        provider: input.provider,
        tx,
      });
    }

    return {
      digestDate: input.digestDate,
      status: "written",
      provider: input.provider,
      candidateCount: input.candidates.length,
      itemCount: input.ranking.items.length,
      digestId: digest.id,
      llmRunId: llmRun.id,
      message: "每日精选已生成草稿。",
    };
  });
}

async function writeCandidateTopicTags(input: {
  candidatesById: Map<string, RankingCandidate>;
  items: DigestRankingResult["items"];
  provider: DailyDigestJobResult["provider"];
  tx: Prisma.TransactionClient;
}) {
  const candidateIds = input.items.map((item) => item.candidateId);
  const source = input.provider === "deterministic-fallback" ? "rule" : "llm";

  await input.tx.candidateTopic.deleteMany({
    where: {
      candidateId: {
        in: candidateIds,
      },
      source: {
        in: ["ranking", "rule", "llm"],
      },
    },
  });

  for (const item of input.items) {
    const candidate = input.candidatesById.get(item.candidateId);

    if (!candidate) {
      continue;
    }

    const topicTags = normalizeTopicTags(
      item.topicTags && item.topicTags.length > 0
        ? item.topicTags
        : inferCandidateTopicTags(candidate),
    );

    for (const label of topicTags) {
      const topic = await input.tx.topicTag.upsert({
        where: {
          slug: topicSlug(label),
        },
        create: {
          label,
          slug: topicSlug(label),
        },
        update: {
          label,
        },
      });

      await input.tx.candidateTopic.upsert({
        where: {
          candidateId_topicId: {
            candidateId: candidate.id,
            topicId: topic.id,
          },
        },
        create: {
          candidateId: candidate.id,
          topicId: topic.id,
          source,
        },
        update: {
          source,
        },
      });
    }
  }
}

async function writeFailedDigest(input: {
  digestDate: string;
  candidates: RankingCandidate[];
  provider: DailyDigestJobResult["provider"];
  model: string;
  error: unknown;
}): Promise<DailyDigestJobResult> {
  const message = getErrorMessage(input.error);

  return await prisma.$transaction(async (tx) => {
    const llmRun = await tx.llmRun.create({
      data: {
        purpose: "daily_digest",
        provider: input.provider,
        model: input.model,
        errorMessage: message,
      },
    });

    const existingDigest = await tx.dailyDigest.findUnique({
      where: {
        digestDate: input.digestDate,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingDigest?.status === DigestStatus.PUBLISHED) {
      return {
        digestDate: input.digestDate,
        status: "failed",
        provider: input.provider,
        candidateCount: input.candidates.length,
        itemCount: 0,
        digestId: existingDigest.id,
        llmRunId: llmRun.id,
        message: `生成失败，已保留错误记录，未覆盖已发布内容：${message}`,
      };
    }

    const digest = await tx.dailyDigest.upsert({
      where: {
        digestDate: input.digestDate,
      },
      create: {
        digestDate: input.digestDate,
        status: DigestStatus.FAILED,
        title: `${input.digestDate} 每日精选生成失败`,
        summary: truncateError(message),
        llmRunId: llmRun.id,
      },
      update: {
        status: DigestStatus.FAILED,
        title: `${input.digestDate} 每日精选生成失败`,
        summary: truncateError(message),
        llmRunId: llmRun.id,
      },
    });

    return {
      digestDate: input.digestDate,
      status: "failed",
      provider: input.provider,
      candidateCount: input.candidates.length,
      itemCount: 0,
      digestId: digest.id,
      llmRunId: llmRun.id,
      message,
    };
  });
}

function validateDigestDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("digestDate must use YYYY-MM-DD.");
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    throw new Error("digestDate is not a valid calendar date.");
  }
}

function getNextLocalDateStart(digestDate: string) {
  const [year, month, day] = digestDate.split("-").map(Number);

  return new Date(year, month - 1, day + 1);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function truncateError(message: string) {
  return message.length <= 500 ? message : `${message.slice(0, 499)}…`;
}
