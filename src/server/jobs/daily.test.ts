import assert from "node:assert/strict";
import test from "node:test";
import { CandidateStatus } from "@/generated/prisma/client";
import { attachCandidateTranslationsToDailyResult, buildDailyCandidateWhere } from "./daily";
import type { CandidateTranslationJobResult } from "./translate-candidates";
import type { ArticleEnrichmentJobResult } from "./enrich-articles";

const translatedResult: CandidateTranslationJobResult = {
  status: "translated",
  provider: "openai-compatible",
  scannedCount: 12,
  translatedCount: 12,
  failedCount: 0,
  llmRunId: "translation-run-1",
  message: "已翻译 12 条候选内容。",
};

const enrichedResult: ArticleEnrichmentJobResult = {
  scannedCount: 12,
  attemptedCount: 6,
  enrichedCount: 4,
  failedCount: 2,
  skippedCount: 6,
  message: "已尝试抓取 6 条，成功补正文 4 条，失败 2 条。",
};

function dailyResult(status: "written" | "published_preserved" | "failed") {
  return {
    digestDate: "2026-07-06",
    status,
    provider: "openai-compatible" as const,
    candidateCount: 42,
    itemCount: status === "failed" ? 0 : 12,
    digestId: "digest-1",
    llmRunId: "daily-run-1",
    message: "daily job result",
  };
}

test("buildDailyCandidateWhere excludes rejected, duplicate, and archived candidates", () => {
  const windowStart = new Date("2026-07-06T00:00:00.000Z");
  const windowEnd = new Date("2026-07-07T00:00:00.000Z");

  assert.deepEqual(buildDailyCandidateWhere(windowStart, windowEnd), {
    publishedAt: {
      gte: windowStart,
      lt: windowEnd,
    },
    status: {
      notIn: [
        CandidateStatus.DUPLICATE,
        CandidateStatus.REJECTED,
        CandidateStatus.ARCHIVED,
      ],
    },
  });
});

test("attachCandidateTranslationsToDailyResult translates after a written digest", async () => {
  const calls: string[] = [];

  const result = await attachCandidateTranslationsToDailyResult(
    dailyResult("written"),
    async (options) => {
      calls.push(`translate:${options?.digestDate}`);
      assert.deepEqual(options, {
        digestDate: "2026-07-06",
        selectedOnly: true,
      });

      return translatedResult;
    },
    async (options) => {
      calls.push(`enrich:${options?.digestDate}`);
      assert.deepEqual(options, {
        digestDate: "2026-07-06",
        selectedOnly: true,
      });

      return enrichedResult;
    },
  );

  assert.deepEqual(calls, ["enrich:2026-07-06", "translate:2026-07-06"]);
  assert.equal(result.articleEnrichment?.enrichedCount, 4);
  assert.equal(result.translation?.translatedCount, 12);
});

test("attachCandidateTranslationsToDailyResult translates when a published digest is preserved", async () => {
  const calls: string[] = [];

  const result = await attachCandidateTranslationsToDailyResult(
    dailyResult("published_preserved"),
    async (options) => {
      calls.push(`translate:${options?.digestDate}`);
      assert.equal(options?.digestDate, "2026-07-06");

      return translatedResult;
    },
    async (options) => {
      calls.push(`enrich:${options?.digestDate}`);

      return enrichedResult;
    },
  );

  assert.deepEqual(calls, ["enrich:2026-07-06", "translate:2026-07-06"]);
  assert.equal(result.translation?.status, "translated");
});

test("attachCandidateTranslationsToDailyResult skips translation after a failed digest", async () => {
  let calls = 0;

  const result = await attachCandidateTranslationsToDailyResult(
    dailyResult("failed"),
    async () => {
      calls += 1;

      return translatedResult;
    },
    async () => {
      calls += 1;

      return enrichedResult;
    },
  );

  assert.equal(calls, 0);
  assert.equal(result.articleEnrichment, undefined);
  assert.equal(result.translation, undefined);
});
