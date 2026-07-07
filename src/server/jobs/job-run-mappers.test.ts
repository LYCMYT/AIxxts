import assert from "node:assert/strict";
import test from "node:test";
import { mapArticleEnrichmentJobRunResult } from "./enrich-articles";
import { mapCandidateTranslationJobRunResult } from "./translate-candidates";

test("article enrichment job run is skipped when there is no work", () => {
  const result = mapArticleEnrichmentJobRunResult({
    scannedCount: 0,
    attemptedCount: 0,
    enrichedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    message: "no work",
  });

  assert.equal(result.status, "SKIPPED");
  assert.equal(result.scannedCount, 0);
  assert.equal(result.createdCount, 0);
  assert.equal(result.skippedCount, 0);
  assert.equal(result.errorMessage, undefined);
});

test("article enrichment job run fails when every attempted item fails", () => {
  const result = mapArticleEnrichmentJobRunResult({
    scannedCount: 3,
    attemptedCount: 2,
    enrichedCount: 0,
    failedCount: 2,
    skippedCount: 1,
    message: "2 failed",
  });

  assert.equal(result.status, "FAILED");
  assert.equal(result.scannedCount, 3);
  assert.equal(result.createdCount, 0);
  assert.equal(result.skippedCount, 3);
  assert.equal(result.errorMessage, "2 failed");
});

test("candidate translation job run keeps skipped and partial states explicit", () => {
  const skipped = mapCandidateTranslationJobRunResult({
    status: "skipped",
    provider: "openai-compatible",
    scannedCount: 0,
    translatedCount: 0,
    failedCount: 0,
    message: "no work",
  });
  const partial = mapCandidateTranslationJobRunResult({
    status: "partial",
    provider: "openai-compatible",
    scannedCount: 2,
    translatedCount: 1,
    failedCount: 1,
    message: "1 failed",
  });

  assert.equal(skipped.status, "SKIPPED");
  assert.equal(skipped.errorMessage, undefined);
  assert.equal(partial.status, "FAILED");
  assert.equal(partial.scannedCount, 2);
  assert.equal(partial.createdCount, 1);
  assert.equal(partial.skippedCount, 1);
  assert.equal(partial.errorMessage, "1 failed");
});
