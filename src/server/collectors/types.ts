export const RSS_LIKE_SOURCE_TYPES = [
  "RSS",
  "OFFICIAL_BLOG",
  "HACKER_NEWS",
  "REDDIT",
] as const;

export const COLLECTABLE_SOURCE_TYPES = [
  ...RSS_LIKE_SOURCE_TYPES,
  "YOUTUBE",
] as const;

export type RssLikeSourceType = (typeof RSS_LIKE_SOURCE_TYPES)[number];
export type CollectableSourceType = (typeof COLLECTABLE_SOURCE_TYPES)[number];
export type JobRunStatus = "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";

export type SourceRow = {
  id: string;
  name: string;
  type: CollectableSourceType;
  url: string | null;
  config: unknown;
  enabled: boolean | number;
  fetchIntervalMinutes: number;
  lastFetchedAt: string | Date | null;
  lastError: string | null;
};

export type CandidateInput = {
  sourceId: string;
  externalId?: string | null;
  url: string;
  title: string;
  summary?: string | null;
  contentText?: string | null;
  author?: string | null;
  publishedAt: Date;
  rawEngagement?: unknown;
  rawPayload?: unknown;
};

export type AdapterFetchResult =
  | {
      status: "SUCCESS";
      items: CandidateInput[];
      metadata?: Record<string, unknown>;
    }
  | {
      status: "SKIPPED";
      scannedCount?: number;
      createdCount?: number;
      skippedCount?: number;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
    };

export type CandidateWriteResult = {
  scannedCount: number;
  createdCount: number;
  skippedCount: number;
};

export type SourceCollectResult = {
  sourceId: string;
  sourceName: string;
  sourceType: CollectableSourceType;
  status: JobRunStatus;
  scannedCount: number;
  createdCount: number;
  skippedCount: number;
  errorMessage?: string;
};

export type CollectJobSummary = {
  sourceCount: number;
  scannedCount: number;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  skippedSourceCount: number;
  results: SourceCollectResult[];
};
