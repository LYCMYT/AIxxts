import assert from "node:assert/strict";
import test from "node:test";
import {
  AdminTopicActionError,
  mergeAdminTopics,
  normalizeMergeTopicsInput,
  topicActionErrorResponse,
} from "./topics";
import type { AdminTopicActionDeps } from "./topics";

function deps(overrides: Partial<AdminTopicActionDeps> = {}): AdminTopicActionDeps {
  return {
    createCandidateTopic: async () => {},
    deleteCandidateTopic: async () => {},
    deleteTopic: async () => {},
    findCandidateTopic: async () => null,
    findTopicById: async (id) =>
      id === "source-topic"
        ? { id, label: "AI Agents", slug: "ai-agents" }
        : { id, label: "AI Agent", slug: "ai-agent" },
    listCandidateTopics: async () => [
      {
        candidateId: "candidate-1",
        confidence: null,
        createdAt: new Date("2026-07-07T00:00:00.000Z"),
        source: "rule",
        topicId: "source-topic",
      },
    ],
    ...overrides,
  };
}

test("normalizeMergeTopicsInput accepts two distinct topic ids", () => {
  assert.deepEqual(
    normalizeMergeTopicsInput({
      sourceTopicId: " source-topic ",
      targetTopicId: "target-topic",
    }),
    {
      sourceTopicId: "source-topic",
      targetTopicId: "target-topic",
    },
  );
});

test("normalizeMergeTopicsInput rejects same source and target", () => {
  assert.throws(
    () =>
      normalizeMergeTopicsInput({
        sourceTopicId: "topic-1",
        targetTopicId: "topic-1",
      }),
    {
      message: "sourceTopicId and targetTopicId must be different.",
      status: 400,
    },
  );
});

test("mergeAdminTopics moves source links and deletes the duplicate topic", async () => {
  const calls: string[] = [];
  const result = await mergeAdminTopics(
    {
      sourceTopicId: "source-topic",
      targetTopicId: "target-topic",
    },
    deps({
      createCandidateTopic: async (link) => {
        calls.push(`create:${link.candidateId}:${link.topicId}:${link.source}`);
      },
      deleteCandidateTopic: async (candidateId, topicId) => {
        calls.push(`delete-link:${candidateId}:${topicId}`);
      },
      deleteTopic: async (topicId) => {
        calls.push(`delete-topic:${topicId}`);
      },
    }),
  );

  assert.deepEqual(calls, [
    "create:candidate-1:target-topic:rule",
    "delete-link:candidate-1:source-topic",
    "delete-topic:source-topic",
  ]);
  assert.deepEqual(result, {
    deletedTopicLabel: "AI Agents",
    movedCount: 1,
    skippedDuplicateCount: 0,
    sourceTopicId: "source-topic",
    targetTopicId: "target-topic",
    targetTopicLabel: "AI Agent",
  });
});

test("mergeAdminTopics skips links that already exist on the target topic", async () => {
  const calls: string[] = [];
  const result = await mergeAdminTopics(
    {
      sourceTopicId: "source-topic",
      targetTopicId: "target-topic",
    },
    deps({
      deleteCandidateTopic: async (candidateId, topicId) => {
        calls.push(`delete-link:${candidateId}:${topicId}`);
      },
      deleteTopic: async (topicId) => {
        calls.push(`delete-topic:${topicId}`);
      },
      findCandidateTopic: async () => ({
        candidateId: "candidate-1",
        confidence: null,
        createdAt: new Date("2026-07-07T00:00:00.000Z"),
        source: "manual",
        topicId: "target-topic",
      }),
    }),
  );

  assert.deepEqual(calls, ["delete-link:candidate-1:source-topic", "delete-topic:source-topic"]);
  assert.equal(result.movedCount, 0);
  assert.equal(result.skippedDuplicateCount, 1);
});

test("mergeAdminTopics reports missing topics", async () => {
  await assert.rejects(
    () =>
      mergeAdminTopics(
        {
          sourceTopicId: "missing",
          targetTopicId: "target-topic",
        },
        deps({
          findTopicById: async (id) =>
            id === "target-topic" ? { id, label: "AI Agent", slug: "ai-agent" } : null,
        }),
      ),
    {
      message: "source topic not found.",
      status: 404,
    },
  );
});

test("topicActionErrorResponse maps topic action errors to JSON", async () => {
  const response = topicActionErrorResponse(new AdminTopicActionError("bad topic", 400));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "bad topic",
  });
});
