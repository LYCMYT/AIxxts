import assert from "node:assert/strict";
import test from "node:test";
import { attachCandidateTranslationsToDailyResult } from "./daily";
import type { CandidateTranslationJobResult } from "./translate-candidates";

const translatedResult: CandidateTranslationJobResult = {
  status: "translated",
  provider: "openai-compatible",
  scannedCount: 12,
  translatedCount: 12,
  failedCount: 0,
  llmRunId: "translation-run-1",
  message: "已翻译 12 条候选内容。",
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

test("attachCandidateTranslationsToDailyResult translates after a written digest", async () => {
  let calls = 0;

  const result = await attachCandidateTranslationsToDailyResult(dailyResult("written"), async (options) => {
    calls += 1;
    assert.deepEqual(options, {
      digestDate: "2026-07-06",
      selectedOnly: true,
    });

    return translatedResult;
  });

  assert.equal(calls, 1);
  assert.equal(result.translation?.translatedCount, 12);
});

test("attachCandidateTranslationsToDailyResult translates when a published digest is preserved", async () => {
  let calls = 0;

  const result = await attachCandidateTranslationsToDailyResult(
    dailyResult("published_preserved"),
    async (options) => {
      calls += 1;
      assert.equal(options?.digestDate, "2026-07-06");

      return translatedResult;
    },
  );

  assert.equal(calls, 1);
  assert.equal(result.translation?.status, "translated");
});

test("attachCandidateTranslationsToDailyResult skips translation after a failed digest", async () => {
  let calls = 0;

  const result = await attachCandidateTranslationsToDailyResult(dailyResult("failed"), async () => {
    calls += 1;

    return translatedResult;
  });

  assert.equal(calls, 0);
  assert.equal(result.translation, undefined);
});
