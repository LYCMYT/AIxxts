import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeCandidateTopicLabelsInput,
  updateAdminCandidateTopics,
} from "./topics";
import type { AdminCandidateTopicEditDeps } from "./topics";

function deps(overrides: Partial<AdminCandidateTopicEditDeps> = {}): AdminCandidateTopicEditDeps {
  return {
    deleteCandidateTopic: async () => {},
    findCandidateById: async (candidateId) => ({ id: candidateId }),
    listCandidateTopicsByCandidate: async () => [
      {
        candidateId: "candidate-1",
        confidence: null,
        createdAt: new Date("2026-07-07T00:00:00.000Z"),
        source: "rule",
        topicId: "topic-old",
      },
    ],
    upsertCandidateTopic: async () => {},
    upsertTopicByLabel: async (label) => ({
      id: `topic-${label.toLocaleLowerCase("zh-CN").replace(/\s+/g, "-")}`,
      label,
      slug: label.toLocaleLowerCase("zh-CN").replace(/\s+/g, "-"),
    }),
    ...overrides,
  };
}

test("normalizeCandidateTopicLabelsInput trims, deduplicates, and caps labels", () => {
  assert.deepEqual(
    normalizeCandidateTopicLabelsInput({
      topicLabels: [" AI Agent ", "ai agent", "模型发布", "", "x".repeat(80)],
    }),
    ["AI Agent", "模型发布"],
  );
});

test("normalizeCandidateTopicLabelsInput accepts an empty array for clearing topics", () => {
  assert.deepEqual(
    normalizeCandidateTopicLabelsInput({
      topicLabels: [],
    }),
    [],
  );
});

test("normalizeCandidateTopicLabelsInput rejects non-array topic labels", () => {
  assert.throws(
    () =>
      normalizeCandidateTopicLabelsInput({
        topicLabels: "AI Agent",
      }),
    {
      message: "topicLabels must be an array.",
      status: 400,
    },
  );
});

test("updateAdminCandidateTopics replaces current links and writes manual sources", async () => {
  const calls: string[] = [];
  const result = await updateAdminCandidateTopics(
    "candidate-1",
    {
      topicLabels: ["AI Agent", "模型发布"],
    },
    deps({
      deleteCandidateTopic: async (candidateId, topicId) => {
        calls.push(`delete:${candidateId}:${topicId}`);
      },
      listCandidateTopicsByCandidate: async () => [
        {
          candidateId: "candidate-1",
          confidence: null,
          createdAt: new Date("2026-07-07T00:00:00.000Z"),
          source: "rule",
          topicId: "topic-old",
        },
        {
          candidateId: "candidate-1",
          confidence: null,
          createdAt: new Date("2026-07-07T00:00:00.000Z"),
          source: "rule",
          topicId: "topic-ai-agent",
        },
      ],
      upsertCandidateTopic: async (link) => {
        calls.push(`upsert:${link.candidateId}:${link.topicId}:${link.source}`);
      },
    }),
  );

  assert.deepEqual(calls, [
    "upsert:candidate-1:topic-ai-agent:manual",
    "upsert:candidate-1:topic-模型发布:manual",
    "delete:candidate-1:topic-old",
  ]);
  assert.deepEqual(result, {
    candidateId: "candidate-1",
    topicLabels: ["AI Agent", "模型发布"],
    updatedCount: 2,
  });
});

test("updateAdminCandidateTopics can clear every topic link", async () => {
  const calls: string[] = [];
  const result = await updateAdminCandidateTopics(
    "candidate-1",
    {
      topicLabels: [],
    },
    deps({
      deleteCandidateTopic: async (candidateId, topicId) => {
        calls.push(`delete:${candidateId}:${topicId}`);
      },
    }),
  );

  assert.deepEqual(calls, ["delete:candidate-1:topic-old"]);
  assert.deepEqual(result, {
    candidateId: "candidate-1",
    topicLabels: [],
    updatedCount: 0,
  });
});

test("updateAdminCandidateTopics reports missing candidates", async () => {
  await assert.rejects(
    () =>
      updateAdminCandidateTopics(
        "missing",
        {
          topicLabels: ["AI Agent"],
        },
        deps({
          findCandidateById: async () => null,
        }),
      ),
    {
      message: "candidate not found.",
      status: 404,
    },
  );
});
