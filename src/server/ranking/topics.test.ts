import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTopicTags, topicSlug } from "./topics";

test("normalizeTopicTags trims, deduplicates, and caps topic labels", () => {
  assert.deepEqual(
    normalizeTopicTags([
      " AI Agent ",
      "AI   Agent",
      "AI 编程",
      "模型发布",
      "开源项目",
      "视频内容",
      "",
      "x".repeat(41),
    ]),
    ["AI Agent", "AI 编程", "模型发布", "开源项目"],
  );
});

test("topicSlug creates stable URL-safe slugs", () => {
  assert.equal(topicSlug("AI Agent"), "ai-agent");
  assert.equal(topicSlug("模型发布"), "模型发布");
});
