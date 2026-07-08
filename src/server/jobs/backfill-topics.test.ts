import assert from "node:assert/strict";
import test from "node:test";
import { DigestStatus } from "@/generated/prisma/client";
import {
  buildTopicBackfillCandidateWhere,
  mapTopicBackfillJobRunResult,
  normalizeTopicBackfillLimit,
} from "./backfill-topics";

test("topic backfill where selects published or draft digest candidates missing tags", () => {
  assert.deepEqual(
    buildTopicBackfillCandidateWhere({
      digestDate: "2026-07-07",
      force: false,
      selectedOnly: true,
    }),
    {
      topicTags: {
        none: {},
      },
      digestItems: {
        some: {
          digest: {
            digestDate: "2026-07-07",
            status: {
              in: [DigestStatus.DRAFT, DigestStatus.PUBLISHED],
            },
          },
        },
      },
    },
  );
});

test("topic backfill force mode keeps selected digest filter but allows existing tags", () => {
  assert.deepEqual(
    buildTopicBackfillCandidateWhere({
      force: true,
      selectedOnly: true,
    }),
    {
      digestItems: {
        some: {
          digest: {
            status: {
              in: [DigestStatus.DRAFT, DigestStatus.PUBLISHED],
            },
          },
        },
      },
    },
  );
});

test("topic backfill limit has a stable default and upper bound", () => {
  assert.equal(normalizeTopicBackfillLimit(undefined), 50);
  assert.equal(normalizeTopicBackfillLimit(500), 200);
  assert.equal(normalizeTopicBackfillLimit(2.9), 2);
});

test("topic backfill job run result maps empty runs to skipped", () => {
  assert.deepEqual(
    mapTopicBackfillJobRunResult({
      status: "skipped",
      scannedCount: 0,
      updatedCount: 0,
      createdTopicCount: 0,
      skippedCount: 0,
      message: "没有需要回填主题标签的候选内容。",
    }),
    {
      status: "SKIPPED",
      scannedCount: 0,
      createdCount: 0,
      skippedCount: 0,
      metadata: {
        status: "skipped",
        scannedCount: 0,
        updatedCount: 0,
        createdTopicCount: 0,
        skippedCount: 0,
        message: "没有需要回填主题标签的候选内容。",
      },
    },
  );
});
