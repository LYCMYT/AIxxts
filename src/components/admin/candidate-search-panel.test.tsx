import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CandidateSearchPanel } from "./candidate-search-panel";

test("CandidateSearchPanel renders candidate filters, rows, topics, and detail links", () => {
  const html = renderToStaticMarkup(
    <CandidateSearchPanel
      candidates={[
        {
          candidateStatus: "NEW",
          collectedAt: "2026-07-07 08:30",
          detailHref: "/items/candidate-1",
          id: "candidate-1",
          publishedAt: "2026-07-07 08:00",
          selectedStatus: {
            label: "已入选",
            tone: "success",
          },
          source: "Anthropic Blog",
          sourceType: "官方博客",
          title: "Claude Code 发布",
          topicTags: ["AI Agent", "开发者工具"],
        },
      ]}
      filters={{
        page: 2,
        pageSize: 10,
        q: "agent",
        selected: "selected",
        sourceId: "source-1",
        topic: "AI Agent",
      }}
      options={{
        sources: [{ id: "source-1", name: "Anthropic Blog" }],
        topics: ["AI Agent", "模型发布"],
      }}
      pagination={{
        hasNextPage: true,
        hasPreviousPage: true,
        page: 2,
        pageSize: 10,
        totalCount: 13,
        totalPages: 2,
      }}
    />,
  );

  assert.match(html, /候选检索/);
  assert.match(html, /name="candidateQ"/);
  assert.match(html, /value="agent"/);
  assert.match(html, /name="candidateSelected"/);
  assert.match(html, /Claude Code 发布/);
  assert.match(html, /AI Agent/);
  assert.match(html, /已入选/);
  assert.match(html, /href="\/items\/candidate-1"/);
  assert.match(html, /共 13 条/);
  assert.match(html, /candidatePage=3#candidates/);
});
