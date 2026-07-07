import { DigestStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import { env } from "@/server/env";
import {
  type JobRunResultSummary,
  runWithJobRun,
} from "@/server/jobs/job-run-recorder";
import { translateCandidateWithLlm } from "@/server/llm/client";

const DEFAULT_TRANSLATION_LIMIT = 20;
const MAX_TRANSLATION_LIMIT = 50;

export type RunCandidateTranslationJobOptions = {
  digestDate?: string;
  limit?: number;
  selectedOnly?: boolean;
};

export type CandidateTranslationJobResult = {
  status: "translated" | "skipped" | "partial" | "failed";
  provider: "openai-compatible" | "unconfigured";
  scannedCount: number;
  translatedCount: number;
  failedCount: number;
  llmRunId?: string;
  message: string;
};

export async function runCandidateTranslationJob(
  options: RunCandidateTranslationJobOptions = {},
): Promise<CandidateTranslationJobResult> {
  return await runWithJobRun({
    jobType: "candidate:translate",
    metadata: normalizeJobMetadata(options),
    execute: () => runCandidateTranslationJobCore(options),
    mapResult: mapCandidateTranslationJobRunResult,
  });
}

export function mapCandidateTranslationJobRunResult(
  result: CandidateTranslationJobResult,
): JobRunResultSummary {
  const status =
    result.status === "translated"
      ? "SUCCESS"
      : result.status === "skipped"
        ? "SKIPPED"
        : "FAILED";

  return {
    status,
    scannedCount: result.scannedCount,
    createdCount: result.translatedCount,
    skippedCount: result.failedCount,
    errorMessage: status === "FAILED" ? result.message : undefined,
    metadata: result,
  };
}

async function runCandidateTranslationJobCore(
  options: RunCandidateTranslationJobOptions = {},
): Promise<CandidateTranslationJobResult> {
  const limit = normalizeLimit(options.limit);
  const selectedOnly = options.selectedOnly ?? true;
  const digestDate = options.digestDate?.trim();

  if (!env.LLM_API_KEY?.trim()) {
    return {
      status: "skipped",
      provider: "unconfigured",
      scannedCount: 0,
      translatedCount: 0,
      failedCount: 0,
      message: "未配置 LLM_API_KEY，已跳过候选内容中文翻译。",
    };
  }

  const candidates = await prisma.candidateItem.findMany({
    where: {
      OR: [
        {
          translatedTitle: null,
        },
        {
          translatedSummary: null,
        },
        {
          translatedAt: null,
        },
      ],
      ...(selectedOnly
        ? {
            digestItems: {
              some: {
                digest: {
                  ...(digestDate
                    ? {
                        digestDate,
                      }
                    : {}),
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
    take: limit,
  });

  if (candidates.length === 0) {
    return {
      status: "skipped",
      provider: "openai-compatible",
      scannedCount: 0,
      translatedCount: 0,
      failedCount: 0,
      message: "没有需要翻译的候选内容。",
    };
  }

  const translatedIds: string[] = [];
  const failedItems: Array<{ id: string; title: string; error: string }> = [];
  const promptHashes: Array<{ id: string; promptHash: string }> = [];
  let inputTokens = 0;
  let outputTokens = 0;

  for (const candidate of candidates) {
    try {
      const translation = await translateCandidateWithLlm({
        title: candidate.title,
        summary: candidate.summary,
        contentText: candidate.contentText,
      });

      await prisma.candidateItem.update({
        where: {
          id: candidate.id,
        },
        data: {
          translatedTitle: translation.translatedTitle,
          translatedSummary: translation.translatedSummary,
          translatedContent: translation.translatedContent,
          translatedAt: new Date(),
        },
      });

      translatedIds.push(candidate.id);
      promptHashes.push({
        id: candidate.id,
        promptHash: translation.promptHash,
      });
      inputTokens += translation.inputTokens ?? 0;
      outputTokens += translation.outputTokens ?? 0;
    } catch (error) {
      failedItems.push({
        id: candidate.id,
        title: candidate.title,
        error: getErrorMessage(error),
      });
    }
  }

  const llmRun = await prisma.llmRun.create({
    data: {
      purpose: "candidate_translation",
      provider: "openai-compatible",
      model: env.LLM_MODEL,
      inputTokens: inputTokens > 0 ? inputTokens : undefined,
      outputTokens: outputTokens > 0 ? outputTokens : undefined,
      responseJson: {
        selectedOnly,
        digestDate: digestDate || null,
        limit,
        translatedIds,
        failedItems,
        promptHashes,
      } satisfies Prisma.InputJsonValue,
      errorMessage:
        translatedIds.length === 0 && failedItems.length > 0
          ? failedItems.map((item) => `${item.id}: ${item.error}`).join("\n").slice(0, 2_000)
          : undefined,
    },
  });

  const status =
    translatedIds.length === 0 ? "failed" : failedItems.length > 0 ? "partial" : "translated";

  return {
    status,
    provider: "openai-compatible",
    scannedCount: candidates.length,
    translatedCount: translatedIds.length,
    failedCount: failedItems.length,
    llmRunId: llmRun.id,
    message:
      failedItems.length > 0
        ? `已翻译 ${translatedIds.length} 条，${failedItems.length} 条失败。`
        : `已翻译 ${translatedIds.length} 条候选内容。`,
  };
}

function normalizeLimit(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_TRANSLATION_LIMIT;
  }

  return Math.max(1, Math.min(MAX_TRANSLATION_LIMIT, Math.floor(value)));
}

function normalizeJobMetadata(options: RunCandidateTranslationJobOptions) {
  return {
    digestDate: options.digestDate?.trim() || null,
    limit: normalizeLimit(options.limit),
    selectedOnly: options.selectedOnly ?? true,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
