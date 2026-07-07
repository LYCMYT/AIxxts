import assert from "node:assert/strict";
import test from "node:test";
import { rankCandidatesWithFallback } from "./fallback";
import type { RankingCandidate } from "./types";

function candidate(overrides: Partial<RankingCandidate> = {}): RankingCandidate {
  return {
    id: "candidate-1",
    title: "OpenAI releases new agent coding model",
    summary: "The update improves AI agent coding workflows and developer tools.",
    canonicalUrl: "https://example.com/item",
    publishedAt: new Date("2026-07-07T08:00:00.000Z"),
    hotScore: 8,
    influenceScore: 9,
    source: {
      name: "OpenAI Blog",
      type: "OFFICIAL_BLOG",
    },
    ...overrides,
  };
}

test("fallback ranking emits stable topic tags for selected candidates", () => {
  const ranking = rankCandidatesWithFallback(
    [candidate()],
    "2026-07-07",
    {
      minItems: 1,
      maxItems: 5,
    },
    new Date("2026-07-07T09:00:00.000Z"),
  );

  assert.deepEqual(ranking.items[0].topicTags, ["AI Agent", "AI 编程", "模型发布"]);
});
