import assert from "node:assert/strict";
import test from "node:test";
import {
  formatJobMetadataText,
  mapJobMetadataDetails,
  normalizeAdminJobFilters,
} from "./queries";

test("mapJobMetadataDetails exposes YouTube RSS diagnostics", () => {
  const details = mapJobMetadataDetails({
    method: "youtube_channel_rss",
    feedTitle: "OpenAI",
    feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UCXZCJLdBC09xxGZ6gcdrc6A",
    rssAttemptCount: 2,
    rssLastError: "Request timed out after 20000ms",
    rssLastErrorCategory: "网络超时",
    rawItemCount: 15,
    filteredItemCount: 15,
    matchedItemCount: 12,
    keywords: ["AI", "ChatGPT", "agent"],
    articleExtraction: {
      attemptedCount: 3,
      enrichedCount: 1,
      failedCount: 2,
    },
  });

  assert.deepEqual(details, [
    { label: "采集方式", value: "youtube_channel_rss" },
    { label: "Feed 标题", value: "OpenAI" },
    { label: "RSS 尝试", value: "2 次" },
    { label: "上次 RSS 错误", value: "Request timed out after 20000ms" },
    { label: "上次 RSS 错误归类", value: "网络超时" },
    { label: "匹配结果", value: "12 / 15 / 15" },
    { label: "关键词", value: "AI, ChatGPT, agent" },
    { label: "正文抓取", value: "尝试 3，成功 1，失败 2" },
  ]);
});

test("formatJobMetadataText pretty prints object metadata and ignores empty values", () => {
  assert.equal(formatJobMetadataText(null), null);
  assert.equal(formatJobMetadataText(""), null);
  assert.match(
    formatJobMetadataText({
      method: "youtube_channel_rss",
      rssAttemptCount: 1,
    }) ?? "",
    /"rssAttemptCount": 1/,
  );
});

test("normalizeAdminJobFilters keeps valid filters and resets invalid page values", () => {
  assert.deepEqual(
    normalizeAdminJobFilters({
      jobType: "collect:YOUTUBE",
      page: "3",
      sourceId: "source-1",
      status: "FAILED",
    }),
    {
      jobType: "collect:YOUTUBE",
      page: 3,
      pageSize: 10,
      sourceId: "source-1",
      status: "FAILED",
    },
  );
  assert.deepEqual(
    normalizeAdminJobFilters({
      jobType: " ".repeat(120),
      page: "0",
      sourceId: "",
      status: "BROKEN",
    }),
    {
      jobType: "",
      page: 1,
      pageSize: 10,
      sourceId: "",
      status: "",
    },
  );
});
