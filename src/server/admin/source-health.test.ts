import assert from "node:assert/strict";
import test from "node:test";
import { mapSourceHealth } from "./queries";

function job(status: string, startedAt: string, errorMessage: string | null = null) {
  return {
    errorMessage,
    finishedAt: startedAt,
    startedAt,
    status,
  };
}

test("mapSourceHealth counts newest consecutive failures and keeps latest timestamps", () => {
  const health = mapSourceHealth({
    enabled: true,
    jobs: [
      job("FAILED", "2026-07-07T09:00:00.000Z", "Timeout"),
      job("FAILED", "2026-07-07T08:00:00.000Z", "HTTP 503"),
      job("SUCCESS", "2026-07-06T08:00:00.000Z"),
    ],
    lastError: null,
    sourceId: "source-1",
    sourceName: "OpenAI Blog",
  });

  assert.equal(health.consecutiveFailures, 2);
  assert.deepEqual(health.status, { label: "需处理", tone: "warning" });
  assert.equal(health.latestFailure, "2026-07-07 05:00");
  assert.equal(health.latestSuccess, "2026-07-06 04:00");
  assert.equal(health.lastError, "Timeout");
});

test("mapSourceHealth escalates when a source fails three times in a row", () => {
  const health = mapSourceHealth({
    enabled: true,
    jobs: [
      job("FAILED", "2026-07-07T09:00:00.000Z", "Timeout"),
      job("FAILED", "2026-07-07T08:00:00.000Z", "HTTP 503"),
      job("FAILED", "2026-07-07T07:00:00.000Z", "Bad gateway"),
      job("SUCCESS", "2026-07-06T08:00:00.000Z"),
    ],
    lastError: null,
    sourceId: "source-1",
    sourceName: "OpenAI Blog",
  });

  assert.equal(health.consecutiveFailures, 3);
  assert.deepEqual(health.status, { label: "连续失败", tone: "danger" });
});

test("mapSourceHealth reports normal after the newest run succeeds", () => {
  const health = mapSourceHealth({
    enabled: true,
    jobs: [
      job("SUCCESS", "2026-07-07T09:00:00.000Z"),
      job("FAILED", "2026-07-07T08:00:00.000Z", "Older error"),
    ],
    lastError: null,
    sourceId: "source-1",
    sourceName: "OpenAI Blog",
  });

  assert.equal(health.consecutiveFailures, 0);
  assert.deepEqual(health.status, { label: "正常", tone: "success" });
  assert.equal(health.latestSuccess, "2026-07-07 05:00");
});

test("mapSourceHealth separates disabled and never-run sources", () => {
  assert.deepEqual(
    mapSourceHealth({
      enabled: false,
      jobs: [],
      lastError: null,
      sourceId: "source-1",
      sourceName: "OpenAI Blog",
    }).status,
    { label: "停用", tone: "muted" },
  );

  assert.deepEqual(
    mapSourceHealth({
      enabled: true,
      jobs: [],
      lastError: null,
      sourceId: "source-2",
      sourceName: "YouTube RSS",
    }).status,
    { label: "暂无运行", tone: "muted" },
  );
});
