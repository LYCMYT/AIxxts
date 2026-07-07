import { DigestStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import {
  fetchArticleText,
  isUsefulArticleText,
  summarizeArticleText,
} from "@/server/article-extraction/extractor";
import {
  type JobRunResultSummary,
  runWithJobRun,
} from "@/server/jobs/job-run-recorder";

const DEFAULT_ENRICH_LIMIT = 20;
const MAX_ENRICH_LIMIT = 50;

export type RunArticleEnrichmentJobOptions = {
  digestDate?: string;
  limit?: number;
  selectedOnly?: boolean;
};

export type ArticleEnrichmentJobResult = {
  scannedCount: number;
  attemptedCount: number;
  enrichedCount: number;
  failedCount: number;
  skippedCount: number;
  message: string;
};

export async function runArticleEnrichmentJob(
  options: RunArticleEnrichmentJobOptions = {},
): Promise<ArticleEnrichmentJobResult> {
  return await runWithJobRun({
    jobType: "article:enrich",
    metadata: normalizeJobMetadata(options),
    execute: () => runArticleEnrichmentJobCore(options),
    mapResult: mapArticleEnrichmentJobRunResult,
  });
}

export function mapArticleEnrichmentJobRunResult(
  result: ArticleEnrichmentJobResult,
): JobRunResultSummary {
  const status =
    result.attemptedCount === 0
      ? "SKIPPED"
      : result.failedCount > 0 && result.enrichedCount === 0
        ? "FAILED"
        : "SUCCESS";

  return {
    status,
    scannedCount: result.scannedCount,
    createdCount: result.enrichedCount,
    skippedCount: result.skippedCount + result.failedCount,
    errorMessage: status === "FAILED" ? result.message : undefined,
    metadata: result,
  };
}

async function runArticleEnrichmentJobCore(
  options: RunArticleEnrichmentJobOptions = {},
): Promise<ArticleEnrichmentJobResult> {
  const limit = normalizeLimit(options.limit);
  const selectedOnly = options.selectedOnly ?? true;
  const digestDate = options.digestDate?.trim();
  const candidates = await prisma.candidateItem.findMany({
    where: {
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
    },
    orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
    take: limit * 3,
  });

  let attemptedCount = 0;
  let enrichedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const candidate of candidates) {
    if (attemptedCount >= limit) {
      skippedCount += 1;
      continue;
    }

    if (isUsefulArticleText(candidate.contentText)) {
      skippedCount += 1;
      continue;
    }

    attemptedCount += 1;
    const articleText = await fetchArticleText(candidate.canonicalUrl);

    if (!articleText) {
      failedCount += 1;
      continue;
    }

    await prisma.candidateItem.update({
      where: {
        id: candidate.id,
      },
      data: {
        contentText: articleText,
        summary: isUsefulArticleText(candidate.summary)
          ? candidate.summary
          : summarizeArticleText(articleText),
        translatedSummary: null,
        translatedContent: null,
        translatedAt: null,
      },
    });
    enrichedCount += 1;
  }

  return {
    scannedCount: candidates.length,
    attemptedCount,
    enrichedCount,
    failedCount,
    skippedCount,
    message: `已尝试抓取 ${attemptedCount} 条，成功补正文 ${enrichedCount} 条，失败 ${failedCount} 条。`,
  };
}

function normalizeLimit(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_ENRICH_LIMIT;
  }

  return Math.max(1, Math.min(MAX_ENRICH_LIMIT, Math.floor(value)));
}

function normalizeJobMetadata(options: RunArticleEnrichmentJobOptions) {
  return {
    digestDate: options.digestDate?.trim() || null,
    limit: normalizeLimit(options.limit),
    selectedOnly: options.selectedOnly ?? true,
  };
}
