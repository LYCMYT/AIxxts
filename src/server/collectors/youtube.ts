import { google } from "googleapis";
import Parser from "rss-parser";
import type { youtube_v3 } from "googleapis";

import { env } from "@/server/env";

import { requestErrorDiagnostics } from "./request-diagnostics";
import type { AdapterFetchResult, CandidateInput, SourceRow } from "./types";

type YouTubeConfig = {
  keyword: string;
  channelId?: string;
  feedUrl?: string;
  keywords: string[];
  excludeKeywords: string[];
  regionCode?: string;
  relevanceLanguage?: string;
  maxResults: number;
};

type YouTubeRssItem = Parser.Item & Record<string, unknown>;
type YouTubeRssFeed = {
  title?: string;
  items: YouTubeRssItem[];
};

type YouTubeCollectorDeps = {
  parseRssFeed?: (feedUrl: string) => Promise<YouTubeRssFeed>;
};

const youtubeFeedParser = new Parser<Record<string, unknown>, YouTubeRssItem>({
  timeout: 20000,
});
const YOUTUBE_RSS_MAX_ATTEMPTS = 2;

function configObject(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function clampMaxResults(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 10;
  }

  return Math.min(50, Math.max(1, Math.trunc(value)));
}

function parseYouTubeConfig(source: SourceRow): YouTubeConfig | null {
  const config = configObject(source.config);
  const keyword = optionalString(config.keyword) ?? source.name.trim();

  if (!keyword) {
    return null;
  }

  return {
    keyword,
    channelId: optionalString(config.channelId),
    feedUrl: optionalString(config.feedUrl),
    keywords: stringList(config.keywords),
    excludeKeywords: stringList(config.excludeKeywords),
    regionCode: optionalString(config.regionCode),
    relevanceLanguage: optionalString(config.relevanceLanguage),
    maxResults: clampMaxResults(config.maxResults),
  };
}

function parsePublishedAt(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date();

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function youtubeFeedUrl(source: SourceRow, config: YouTubeConfig) {
  if (source.url) {
    return source.url;
  }

  if (config.feedUrl) {
    return config.feedUrl;
  }

  if (config.channelId) {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(config.channelId)}`;
  }

  return null;
}

function videoIdFromUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (url.hostname.endsWith("youtube.com")) {
      return url.searchParams.get("v");
    }
  } catch {
    return null;
  }

  return null;
}

function videoIdFromRssItem(item: YouTubeRssItem, link: string | null) {
  const id = firstString(item.id, item.guid);

  if (id?.startsWith("yt:video:")) {
    return id.replace("yt:video:", "");
  }

  return id ?? videoIdFromUrl(link);
}

function keywordMatches(item: YouTubeRssItem, config: YouTubeConfig) {
  const haystack = [item.title, item.contentSnippet, item.summary, item.content, item.author]
    .map((value) => (typeof value === "string" ? value.toLowerCase() : ""))
    .join(" ");
  const includesRequired =
    config.keywords.length === 0 ||
    config.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
  const includesExcluded = config.excludeKeywords.some((keyword) =>
    haystack.includes(keyword.toLowerCase()),
  );

  return includesRequired && !includesExcluded;
}

function mapSearchResult(
  source: SourceRow,
  item: youtube_v3.Schema$SearchResult,
): CandidateInput | null {
  const videoId = item.id?.videoId;
  const snippet = item.snippet;
  const title = snippet?.title?.trim();

  if (!videoId || !title) {
    return null;
  }

  return {
    sourceId: source.id,
    externalId: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title,
    summary: snippet?.description ?? null,
    contentText: snippet?.description ?? null,
    author: snippet?.channelTitle ?? null,
    publishedAt: parsePublishedAt(snippet?.publishedAt),
    rawPayload: item,
  };
}

function mapRssItem(
  source: SourceRow,
  item: YouTubeRssItem,
  feedTitle: string | undefined,
): CandidateInput | null {
  const link = firstString(item.link, item.guid);
  const videoId = videoIdFromRssItem(item, link);
  const title = firstString(item.title);

  if (!link || !videoId || !title) {
    return null;
  }

  const summary = firstString(item.contentSnippet, item.summary, item.content);

  return {
    sourceId: source.id,
    externalId: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title,
    summary,
    contentText: summary,
    author: firstString(item.author, item.creator, feedTitle),
    publishedAt: parsePublishedAt(firstString(item.isoDate, item.pubDate, item.date)),
    rawPayload: item,
  };
}

async function collectYouTubeFeedSource(
  source: SourceRow,
  config: YouTubeConfig,
  deps: YouTubeCollectorDeps,
): Promise<AdapterFetchResult> {
  const feedUrl = youtubeFeedUrl(source, config);

  if (!feedUrl) {
    return {
      status: "SKIPPED",
      scannedCount: 0,
      createdCount: 0,
      skippedCount: 1,
      errorMessage: "YouTube feed URL or channelId is required when YOUTUBE_API_KEY is not configured.",
      metadata: {
        reason: "missing_youtube_feed",
      },
    };
  }

  const { attemptCount, feed, lastError, lastErrorCategory } = await parseRssFeedWithRetry(feedUrl, deps);
  const rawItems = feed.items.slice(0, config.maxResults);
  const items = rawItems
    .filter((item) => keywordMatches(item, config))
    .map((item) => mapRssItem(source, item, feed.title))
    .filter((item): item is CandidateInput => item !== null);

  return {
    status: "SUCCESS",
    items,
    metadata: {
      method: "youtube_channel_rss",
      feedTitle: feed.title,
      feedUrl,
      rssAttemptCount: attemptCount,
      ...(lastError ? { rssLastError: lastError } : {}),
      ...(lastErrorCategory ? { rssLastErrorCategory: lastErrorCategory } : {}),
      rawItemCount: feed.items.length,
      filteredItemCount: rawItems.length,
      matchedItemCount: items.length,
      keywords: config.keywords,
      excludeKeywords: config.excludeKeywords,
    },
  };
}

export async function collectYouTubeSource(
  source: SourceRow,
  deps: YouTubeCollectorDeps = {},
): Promise<AdapterFetchResult> {
  const apiKey = env.YOUTUBE_API_KEY?.trim();
  const config = parseYouTubeConfig(source);

  if (!config) {
    return {
      status: "SKIPPED",
      scannedCount: 0,
      createdCount: 0,
      skippedCount: 1,
      errorMessage: "YouTube source keyword is required.",
      metadata: {
        reason: "missing_keyword",
      },
    };
  }

  if (!apiKey) {
    return collectYouTubeFeedSource(source, config, deps);
  }

  const youtube = google.youtube("v3");
  const response = await youtube.search.list({
    key: apiKey,
    part: ["snippet"],
    q: config.keyword,
    type: ["video"],
    order: "date",
    maxResults: config.maxResults,
    regionCode: config.regionCode,
    relevanceLanguage: config.relevanceLanguage,
    safeSearch: "none",
  });

  const rawItems = response.data.items ?? [];
  const items = rawItems
    .map((item) => mapSearchResult(source, item))
    .filter((item): item is CandidateInput => item !== null);

  return {
    status: "SUCCESS",
    items,
    metadata: {
      keyword: config.keyword,
      regionCode: config.regionCode,
      relevanceLanguage: config.relevanceLanguage,
      requestedMaxResults: config.maxResults,
      rawItemCount: rawItems.length,
    },
  };
}

async function parseRssFeedWithRetry(feedUrl: string, deps: YouTubeCollectorDeps) {
  const parseRssFeed =
    deps.parseRssFeed ?? ((url: string) => youtubeFeedParser.parseURL(url));
  let lastError: string | undefined;
  let lastErrorCategory: string | undefined;

  for (let attempt = 1; attempt <= YOUTUBE_RSS_MAX_ATTEMPTS; attempt += 1) {
    try {
      const feed = await parseRssFeed(feedUrl);

      return {
        attemptCount: attempt,
        feed,
        lastError,
        lastErrorCategory,
      };
    } catch (error) {
      const diagnostics = requestErrorDiagnostics(error);
      lastError = diagnostics.message;
      lastErrorCategory = diagnostics.category;

      if (attempt === YOUTUBE_RSS_MAX_ATTEMPTS) {
        throw error;
      }
    }
  }

  throw new Error(lastError ?? "YouTube RSS feed request failed.");
}
