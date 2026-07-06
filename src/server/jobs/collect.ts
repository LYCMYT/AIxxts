import { collectRssSource } from "@/server/collectors/rss";
import {
  createJobRun,
  findEnabledSources,
  finishJobRun,
  markSourceFetchFailure,
  markSourceFetchSkipped,
  markSourceFetchSuccess,
} from "@/server/collectors/source-store";
import {
  COLLECTABLE_SOURCE_TYPES,
  RSS_LIKE_SOURCE_TYPES,
  type AdapterFetchResult,
  type CollectJobSummary,
  type CollectableSourceType,
  type SourceCollectResult,
  type SourceRow,
} from "@/server/collectors/types";
import { collectYouTubeSource } from "@/server/collectors/youtube";
import { upsertCandidateItems } from "@/server/collectors/candidate-store";

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isRssLikeSourceType(type: CollectableSourceType) {
  return RSS_LIKE_SOURCE_TYPES.includes(
    type as (typeof RSS_LIKE_SOURCE_TYPES)[number],
  );
}

async function fetchSource(source: SourceRow): Promise<AdapterFetchResult> {
  if (isRssLikeSourceType(source.type)) {
    return collectRssSource(source);
  }

  if (source.type === "YOUTUBE") {
    return collectYouTubeSource(source);
  }

  return {
    status: "SKIPPED",
    scannedCount: 0,
    createdCount: 0,
    skippedCount: 1,
    errorMessage: `Unsupported source type: ${source.type}`,
    metadata: {
      reason: "unsupported_source_type",
    },
  };
}

function emptySummary(): CollectJobSummary {
  return {
    sourceCount: 0,
    scannedCount: 0,
    createdCount: 0,
    skippedCount: 0,
    failedCount: 0,
    skippedSourceCount: 0,
    results: [],
  };
}

function addResult(summary: CollectJobSummary, result: SourceCollectResult) {
  summary.results.push(result);
  summary.sourceCount += 1;
  summary.scannedCount += result.scannedCount;
  summary.createdCount += result.createdCount;
  summary.skippedCount += result.skippedCount;

  if (result.status === "FAILED") {
    summary.failedCount += 1;
  }

  if (result.status === "SKIPPED") {
    summary.skippedSourceCount += 1;
  }
}

export async function collectSource(source: SourceRow): Promise<SourceCollectResult> {
  const jobRunId = await createJobRun(source.id, `collect:${source.type}`, {
    sourceName: source.name,
  });

  try {
    const fetchResult = await fetchSource(source);

    if (fetchResult.status === "SKIPPED") {
      const result = {
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.type,
        status: fetchResult.status,
        scannedCount: fetchResult.scannedCount ?? 0,
        createdCount: fetchResult.createdCount ?? 0,
        skippedCount: fetchResult.skippedCount ?? 0,
        errorMessage: fetchResult.errorMessage,
      } satisfies SourceCollectResult;

      await finishJobRun({
        id: jobRunId,
        status: result.status,
        scannedCount: result.scannedCount,
        createdCount: result.createdCount,
        skippedCount: result.skippedCount,
        errorMessage: result.errorMessage,
        metadata: fetchResult.metadata,
      });
      await markSourceFetchSkipped(source.id, result.errorMessage);

      return result;
    }

    const writeResult = await upsertCandidateItems(fetchResult.items, source.url);
    const result = {
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.type,
      status: "SUCCESS",
      ...writeResult,
    } satisfies SourceCollectResult;

    await finishJobRun({
      id: jobRunId,
      status: result.status,
      scannedCount: result.scannedCount,
      createdCount: result.createdCount,
      skippedCount: result.skippedCount,
      metadata: fetchResult.metadata,
    });
    await markSourceFetchSuccess(source.id);

    return result;
  } catch (error) {
    const message = errorMessage(error);
    const result = {
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.type,
      status: "FAILED",
      scannedCount: 0,
      createdCount: 0,
      skippedCount: 0,
      errorMessage: message,
    } satisfies SourceCollectResult;

    await finishJobRun({
      id: jobRunId,
      status: result.status,
      scannedCount: result.scannedCount,
      createdCount: result.createdCount,
      skippedCount: result.skippedCount,
      errorMessage: message,
    });
    await markSourceFetchFailure(source.id, message);

    return result;
  }
}

export async function runCollectJob(): Promise<CollectJobSummary> {
  const summary = emptySummary();
  const sources = await findEnabledSources(COLLECTABLE_SOURCE_TYPES);

  for (const source of sources) {
    const result = await collectSource(source);
    addResult(summary, result);
  }

  return summary;
}
