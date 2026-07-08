import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { TopicManager } from "./topic-manager";

test("TopicManager renders topic rows and merge controls", () => {
  const html = renderToStaticMarkup(
    <TopicManager
      topics={[
        {
          candidateCount: 12,
          createdAt: "2026-07-07 08:00",
          id: "topic-1",
          label: "AI Agent",
          slug: "ai-agent",
        },
        {
          candidateCount: 3,
          createdAt: "2026-07-07 09:00",
          id: "topic-2",
          label: "AI Agents",
          slug: "ai-agents",
        },
      ]}
    />,
  );

  assert.match(html, /AI Agent/);
  assert.match(html, /AI Agents/);
  assert.match(html, /12 条/);
  assert.match(html, /合并重复主题/);
  assert.match(html, /data-testid="topic-merge-form"/);
});
