import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DigestHome } from "./digest-home";

test("DigestHome keeps the reader entry focused on the daily list", () => {
  const html = renderToStaticMarkup(
    <DigestHome
      candidateCount={30}
      dateLabel="2026年7月8日"
      generatedAt="08:00"
      items={[
        {
          id: "item-1",
          interpretation: "这条内容说明模型工具链进入新阶段。",
          publishedAt: "2026-07-08 07:30",
          rank: 1,
          signals: "模型发布, 开发者热度",
          source: "OpenAI Blog",
          sourceType: "Blog",
          title: "模型工具链更新",
          topicTags: ["模型发布"],
          url: "/items/item-1",
        },
      ]}
      lastSuccessDate="2026-07-08"
      selectedCount={12}
      taskStatus="已发布"
    />,
  );

  assert.match(html, /今日精选/);
  assert.match(html, /模型工具链更新/);
  assert.match(html, /历史回看/);
  assert.doesNotMatch(html, /今日阅读路径/);
  assert.doesNotMatch(html, /候选池/);
});
