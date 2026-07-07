import assert from "node:assert/strict";
import test from "node:test";
import { collectYouTubeSource } from "./youtube";
import type { SourceRow } from "./types";

function youtubeSource(overrides: Partial<SourceRow> = {}): SourceRow {
  return {
    id: "youtube-source-1",
    name: "YouTube OpenAI",
    type: "YOUTUBE",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCXZCJLdBC09xxGZ6gcdrc6A",
    config: {
      keyword: "OpenAI AI",
      keywords: ["AI", "OpenAI"],
      maxResults: 10,
    },
    enabled: true,
    fetchIntervalMinutes: 60,
    lastFetchedAt: null,
    lastError: null,
    ...overrides,
  };
}

test("collectYouTubeSource retries transient RSS feed failures", async () => {
  let attemptCount = 0;
  const result = await collectYouTubeSource(youtubeSource(), {
    parseRssFeed: async () => {
      attemptCount += 1;

      if (attemptCount === 1) {
        throw new Error("Request timed out after 20000ms");
      }

      return {
        title: "OpenAI",
        items: [
          {
            title: "OpenAI model update for developers",
            link: "https://www.youtube.com/watch?v=video123",
            id: "yt:video:video123",
            contentSnippet: "OpenAI shares an AI model update for developers.",
            isoDate: "2026-07-07T00:00:00.000Z",
          },
        ],
      };
    },
  });

  assert.equal(result.status, "SUCCESS");
  assert.equal(attemptCount, 2);

  if (result.status === "SUCCESS") {
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].externalId, "video123");
    assert.equal(result.metadata?.rssAttemptCount, 2);
    assert.equal(result.metadata?.rssLastError, "Request timed out after 20000ms");
  }
});
