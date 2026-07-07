import assert from "node:assert/strict";
import test from "node:test";
import { mapSourceHealth, summarizeSourceErrorCategories } from "./queries";

function failedJob(errorMessage: string) {
  return {
    errorMessage,
    finishedAt: "2026-07-07T09:00:00.000Z",
    startedAt: "2026-07-07T09:00:00.000Z",
    status: "FAILED",
  };
}

test("mapSourceHealth classifies common upstream and network errors", () => {
  assert.equal(
    mapSourceHealth({
      enabled: true,
      jobs: [failedJob("Request timed out after 20000ms")],
      lastError: null,
      sourceId: "source-1",
      sourceName: "YouTube RSS",
    }).errorCategory,
    "网络超时",
  );

  assert.equal(
    mapSourceHealth({
      enabled: true,
      jobs: [failedJob("fetch failed")],
      lastError: null,
      sourceId: "source-2",
      sourceName: "GitHub Search",
    }).errorCategory,
    "网络连接失败",
  );

  assert.equal(
    mapSourceHealth({
      enabled: true,
      jobs: [failedJob("HTTP 503 Bad gateway")],
      lastError: null,
      sourceId: "source-3",
      sourceName: "OpenAI Blog",
    }).errorCategory,
    "上游服务错误",
  );

  assert.equal(
    mapSourceHealth({
      enabled: true,
      jobs: [],
      lastError: "HTTP 429 Too Many Requests",
      sourceId: "source-4",
      sourceName: "GitHub Releases",
    }).errorCategory,
    "上游限流",
  );
});

test("summarizeSourceErrorCategories counts actionable error categories first", () => {
  const rows = [
    mapSourceHealth({
      enabled: true,
      jobs: [failedJob("fetch failed")],
      lastError: null,
      sourceId: "source-1",
      sourceName: "GitHub Search",
    }),
    mapSourceHealth({
      enabled: true,
      jobs: [failedJob("Request timed out after 20000ms")],
      lastError: null,
      sourceId: "source-2",
      sourceName: "YouTube RSS",
    }),
    mapSourceHealth({
      enabled: true,
      jobs: [failedJob("fetch failed")],
      lastError: null,
      sourceId: "source-3",
      sourceName: "GitHub Releases",
    }),
    mapSourceHealth({
      enabled: true,
      jobs: [],
      lastError: null,
      sourceId: "source-4",
      sourceName: "OpenAI Blog",
    }),
  ];

  assert.deepEqual(summarizeSourceErrorCategories(rows), [
    { category: "网络连接失败", count: 2 },
    { category: "网络超时", count: 1 },
  ]);
});
