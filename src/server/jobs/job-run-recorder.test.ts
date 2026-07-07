import assert from "node:assert/strict";
import test from "node:test";
import { runWithJobRun } from "./job-run-recorder";

test("runWithJobRun records successful job counts", async () => {
  const calls: unknown[] = [];
  const result = await runWithJobRun({
    jobType: "translate:candidates",
    metadata: {
      digestDate: "2026-07-07",
    },
    deps: {
      createJobRun: async (sourceId, jobType, metadata) => {
        calls.push({ sourceId, jobType, metadata });

        return "job-1";
      },
      finishJobRun: async (input) => {
        calls.push(input);
      },
    },
    execute: async () => ({
      failedCount: 0,
      message: "translated",
      scannedCount: 20,
      translatedCount: 20,
    }),
    mapResult: (value) => ({
      status: "SUCCESS",
      scannedCount: value.scannedCount,
      createdCount: value.translatedCount,
      skippedCount: value.failedCount,
      metadata: value,
    }),
  });

  assert.equal(result.translatedCount, 20);
  assert.deepEqual(calls, [
    {
      sourceId: null,
      jobType: "translate:candidates",
      metadata: {
        digestDate: "2026-07-07",
      },
    },
    {
      id: "job-1",
      status: "SUCCESS",
      scannedCount: 20,
      createdCount: 20,
      skippedCount: 0,
      metadata: {
        failedCount: 0,
        message: "translated",
        scannedCount: 20,
        translatedCount: 20,
      },
    },
  ]);
});

test("runWithJobRun records failed exceptions and rethrows", async () => {
  const calls: unknown[] = [];

  await assert.rejects(
    runWithJobRun({
      jobType: "article:enrich",
      deps: {
        createJobRun: async () => "job-2",
        finishJobRun: async (input) => {
          calls.push(input);
        },
      },
      execute: async () => {
        throw new Error("network failed");
      },
      mapResult: () => ({
        status: "SUCCESS",
        scannedCount: 0,
        createdCount: 0,
        skippedCount: 0,
      }),
    }),
    /network failed/,
  );

  assert.deepEqual(calls, [
    {
      id: "job-2",
      status: "FAILED",
      scannedCount: 0,
      createdCount: 0,
      skippedCount: 0,
      errorMessage: "network failed",
    },
  ]);
});
