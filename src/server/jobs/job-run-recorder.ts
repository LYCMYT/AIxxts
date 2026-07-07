import {
  createJobRun,
  finishJobRun,
} from "@/server/collectors/source-store";
import type { JobRunStatus } from "@/server/collectors/types";

type FinishJobRunInput = Parameters<typeof finishJobRun>[0];

export type JobRunRecorderDeps = {
  createJobRun: (
    sourceId: string | null,
    jobType: string,
    metadata?: unknown,
  ) => Promise<string>;
  finishJobRun: (input: FinishJobRunInput) => Promise<void>;
};

export type JobRunResultSummary = {
  status: Exclude<JobRunStatus, "RUNNING">;
  scannedCount: number;
  createdCount: number;
  skippedCount: number;
  errorMessage?: string;
  metadata?: unknown;
};

export type RunWithJobRunOptions<T> = {
  jobType: string;
  metadata?: unknown;
  deps?: JobRunRecorderDeps;
  execute: () => Promise<T>;
  mapResult: (result: T) => JobRunResultSummary;
};

const defaultDeps: JobRunRecorderDeps = {
  createJobRun,
  finishJobRun,
};

export async function runWithJobRun<T>({
  deps = defaultDeps,
  execute,
  jobType,
  mapResult,
  metadata,
}: RunWithJobRunOptions<T>) {
  const jobRunId = await deps.createJobRun(null, jobType, metadata);

  try {
    const result = await execute();
    const summary = mapResult(result);

    await deps.finishJobRun({
      id: jobRunId,
      ...summary,
    });

    return result;
  } catch (error) {
    await deps.finishJobRun({
      id: jobRunId,
      status: "FAILED",
      scannedCount: 0,
      createdCount: 0,
      skippedCount: 0,
      errorMessage: getErrorMessage(error),
    });

    throw error;
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
