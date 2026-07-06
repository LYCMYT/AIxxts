import { google } from "googleapis";
import type { youtube_v3 } from "googleapis";

import { env } from "@/server/env";

import type { AdapterFetchResult, CandidateInput, SourceRow } from "./types";

type YouTubeConfig = {
  keyword: string;
  regionCode?: string;
  relevanceLanguage?: string;
  maxResults: number;
};

function configObject(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
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
    regionCode: optionalString(config.regionCode),
    relevanceLanguage: optionalString(config.relevanceLanguage),
    maxResults: clampMaxResults(config.maxResults),
  };
}

function parsePublishedAt(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date();

  return Number.isNaN(date.getTime()) ? new Date() : date;
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

export async function collectYouTubeSource(source: SourceRow): Promise<AdapterFetchResult> {
  const apiKey = env.YOUTUBE_API_KEY?.trim();

  if (!apiKey) {
    return {
      status: "SKIPPED",
      scannedCount: 0,
      createdCount: 0,
      skippedCount: 0,
      errorMessage: "YOUTUBE_API_KEY is not configured.",
      metadata: {
        reason: "missing_youtube_api_key",
      },
    };
  }

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
