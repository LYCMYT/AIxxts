import Parser from "rss-parser";

import type { AdapterFetchResult, CandidateInput, SourceRow } from "./types";

type RssItem = Parser.Item & Record<string, unknown>;

const parser = new Parser<Record<string, unknown>, RssItem>({
  timeout: 20000,
});

function stripHtml(value: string | undefined) {
  return value
    ?.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function parsePublishedAt(item: RssItem) {
  const rawDate = firstString(item.isoDate, item.pubDate, item.date);
  const date = rawDate ? new Date(rawDate) : new Date();

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function itemUrl(item: RssItem, source: SourceRow) {
  const link = firstString(item.link, item.guid);

  if (link) {
    return link;
  }

  return source.url;
}

function mapRssItem(source: SourceRow, item: RssItem): CandidateInput | null {
  const url = itemUrl(item, source);
  const title = firstString(item.title);

  if (!url || !title) {
    return null;
  }

  const summary = stripHtml(
    firstString(item.contentSnippet, item.summary, item.content) ?? undefined,
  );

  return {
    sourceId: source.id,
    externalId: firstString(item.guid, item.id, item.link),
    url,
    title,
    summary,
    contentText: stripHtml(firstString(item.content) ?? undefined),
    author: firstString(item.creator, item.author),
    publishedAt: parsePublishedAt(item),
    rawPayload: item,
  };
}

export async function collectRssSource(source: SourceRow): Promise<AdapterFetchResult> {
  if (!source.url) {
    throw new Error("RSS source URL is required.");
  }

  const feed = await parser.parseURL(source.url);
  const items = feed.items
    .map((item) => mapRssItem(source, item))
    .filter((item): item is CandidateInput => item !== null);

  return {
    status: "SUCCESS",
    items,
    metadata: {
      feedTitle: feed.title,
      feedUrl: feed.feedUrl ?? source.url,
      rawItemCount: feed.items.length,
    },
  };
}
