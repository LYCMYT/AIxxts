import assert from "node:assert/strict";
import test from "node:test";
import {
  enrichCandidateItemsWithArticleText,
  extractArticleTextFromHtml,
  isUsefulArticleText,
} from "./extractor";
import type { CandidateInput } from "@/server/collectors/types";

const baseCandidate: CandidateInput = {
  sourceId: "source-1",
  url: "https://example.com/post",
  title: "A useful article",
  summary: "Short summary",
  contentText: null,
  publishedAt: new Date("2026-07-06T12:00:00.000Z"),
};

test("extractArticleTextFromHtml prefers article body and removes page chrome", () => {
  const html = `
    <html>
      <head>
        <style>.hidden { display: none; }</style>
        <script>window.analytics = true;</script>
      </head>
      <body>
        <nav>Home Products Pricing</nav>
        <article>
          <h1>AI infrastructure update</h1>
          <p>The company released a new inference stack for large language models.</p>
          <p>It reduces serving latency while keeping deployment costs visible.</p>
          <p>${"The article explains rollout details, infrastructure changes, and operational tradeoffs for enterprise AI teams. ".repeat(4)}</p>
        </article>
        <footer>Subscribe to our newsletter</footer>
      </body>
    </html>
  `;

  const text = extractArticleTextFromHtml(html);

  assert.match(text ?? "", /AI infrastructure update/);
  assert.match(text ?? "", /reduces serving latency/);
  assert.doesNotMatch(text ?? "", /Home Products Pricing/);
  assert.doesNotMatch(text ?? "", /analytics/);
  assert.doesNotMatch(text ?? "", /newsletter/);
});

test("extractArticleTextFromHtml decodes entities and rejects thin pages", () => {
  assert.equal(extractArticleTextFromHtml("<article><p>Short page.</p></article>"), null);

  const html = `<main><p>${"OpenAI &amp; Anthropic discussed model safety. ".repeat(12)}</p></main>`;
  const text = extractArticleTextFromHtml(html);

  assert.match(text ?? "", /OpenAI & Anthropic/);
  assert.equal(isUsefulArticleText(text), true);
});

test("enrichCandidateItemsWithArticleText fetches only candidates with weak content", async () => {
  const highQualityContent = "This is already a detailed article body. ".repeat(30);
  const calls: string[] = [];
  const items: CandidateInput[] = [
    {
      ...baseCandidate,
      url: "https://example.com/needs-body",
      contentText: "Article URL: https://example.com/needs-body Comments URL: https://news.ycombinator.com/item?id=1 Points: 2 Comments: 0",
    },
    {
      ...baseCandidate,
      url: "https://example.com/has-body",
      contentText: highQualityContent,
    },
  ];

  const result = await enrichCandidateItemsWithArticleText(items, {
    fetcher: async (url) => {
      calls.push(url);

      return {
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => (name.toLowerCase() === "content-type" ? "text/html" : null),
        },
        text: async () =>
          `<article><p>${"Fetched primary article body with useful details. ".repeat(20)}</p></article>`,
      };
    },
    maxItems: 10,
  });

  assert.deepEqual(calls, ["https://example.com/needs-body"]);
  assert.equal(result.attemptedCount, 1);
  assert.equal(result.enrichedCount, 1);
  assert.match(result.items[0].contentText ?? "", /Fetched primary article body/);
  assert.equal(result.items[1].contentText, highQualityContent);
});
