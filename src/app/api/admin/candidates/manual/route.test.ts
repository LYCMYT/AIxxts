import assert from "node:assert/strict";
import test from "node:test";

import {
  submitManualCandidate,
  type ManualCandidateWriteDeps,
} from "../../../../../server/admin/manual-candidates";
import * as manualRoute from "./route";

function jsonRequest(body: unknown) {
  return new Request("http://127.0.0.1/api/admin/candidates/manual", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
}

test("manual candidate route exposes a POST handler", () => {
  assert.equal(typeof manualRoute.POST, "function");
});

test("manual candidate route rejects invalid fields with 400 JSON errors", async () => {
  const cases = [
    {
      body: {
        title: " ",
        url: "https://example.com/post",
        publishedAt: "2026-07-06T12:00:00.000Z",
      },
      error: "title is required",
    },
    {
      body: {
        title: "Valid title",
        url: "notaurl",
        publishedAt: "2026-07-06T12:00:00.000Z",
      },
      error: "valid url is required",
    },
    {
      body: {
        title: "Valid title",
        url: "https://example.com/post",
        publishedAt: "not-a-date",
      },
      error: "valid publishedAt is required",
    },
  ];

  for (const item of cases) {
    const response = await manualRoute.POST(jsonRequest(item.body));

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: item.error,
    });
  }
});

test("submitManualCandidate writes through the manual source and returns canonical URL", async () => {
  const capturedItems: unknown[] = [];
  const deps = {
    ensureManualSource: async () => ({ id: "manual-source-1" }),
    upsertCandidateItems: async (items) => {
      capturedItems.push(...items);

      return {
        scannedCount: 1,
        createdCount: 1,
        skippedCount: 0,
      };
    },
  } satisfies ManualCandidateWriteDeps;

  const result = await submitManualCandidate(
    {
      title: "  Test   title  ",
      sourceName: "Submitted source",
      url: "HTTPS://Example.com/post/?utm_source=newsletter&b=2&a=1#section",
      publishedAt: "2026-07-06T12:00:00.000Z",
      summary: "Short summary",
      author: "Author Name",
    },
    deps,
  );

  assert.deepEqual(result, {
    scannedCount: 1,
    createdCount: 1,
    skippedCount: 0,
    canonicalUrl: "https://example.com/post?a=1&b=2",
  });
  assert.equal(capturedItems.length, 1);
  assert.deepEqual(capturedItems[0], {
    sourceId: "manual-source-1",
    url: "https://example.com/post?a=1&b=2",
    title: "Test title",
    summary: "Short summary",
    author: "Author Name",
    publishedAt: new Date("2026-07-06T12:00:00.000Z"),
    rawPayload: {
      entryMode: "admin_manual",
      sourceName: "Submitted source",
    },
  });
});

test("submitManualCandidate preserves skipped count for duplicate canonical URLs", async () => {
  const deps = {
    ensureManualSource: async () => ({ id: "manual-source-1" }),
    upsertCandidateItems: async () => ({
      scannedCount: 1,
      createdCount: 0,
      skippedCount: 1,
    }),
  } satisfies ManualCandidateWriteDeps;

  const result = await submitManualCandidate(
    {
      title: "Existing post",
      sourceName: "Submitted source",
      url: "https://example.com/existing?utm_source=a",
      publishedAt: "2026-07-06T12:00:00.000Z",
    },
    deps,
  );

  assert.deepEqual(result, {
    scannedCount: 1,
    createdCount: 0,
    skippedCount: 1,
    canonicalUrl: "https://example.com/existing",
  });
});
