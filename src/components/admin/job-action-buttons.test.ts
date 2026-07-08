import assert from "node:assert/strict";
import test from "node:test";
import { buildJobBody } from "./job-action-buttons";

test("buildJobBody requests forced sentence-by-sentence translation for translate action", () => {
  assert.deepEqual(buildJobBody("translate", "2026-07-07"), {
    digestDate: "2026-07-07",
    force: true,
    limit: 20,
    selectedOnly: true,
  });
});

test("buildJobBody requests selected topic backfill without forcing existing manual tags", () => {
  assert.deepEqual(buildJobBody("topicBackfill", "2026-07-07"), {
    digestDate: "2026-07-07",
    limit: 100,
    selectedOnly: true,
  });
});
