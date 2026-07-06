import { randomUUID } from "node:crypto";

import { prisma } from "@/server/db/prisma";

import {
  COLLECTABLE_SOURCE_TYPES,
  type CollectableSourceType,
  type JobRunStatus,
  type SourceRow,
} from "./types";

type RawSourceRow = Omit<SourceRow, "config"> & {
  config: string | null;
};

export type SourceSaveRecord = {
  config: unknown | null;
  enabled: boolean;
  fetchIntervalMinutes: number;
  name: string;
  type: CollectableSourceType;
  url: string | null;
};

function parseJsonValue(value: unknown) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function compactErrorMessage(errorMessage: string | undefined) {
  return errorMessage?.slice(0, 1000) ?? null;
}

export function createId() {
  return randomUUID();
}

export async function findEnabledSources(types: readonly CollectableSourceType[]) {
  if (types.length === 0) {
    return [];
  }

  const placeholders = types.map(() => "?").join(", ");
  const rows = await prisma.$queryRawUnsafe<RawSourceRow[]>(
    `
      SELECT
        "id",
        "name",
        "type",
        "url",
        "config",
        "enabled",
        "fetchIntervalMinutes",
        "lastFetchedAt",
        "lastError"
      FROM "Source"
      WHERE "enabled" = 1
        AND "type" IN (${placeholders})
      ORDER BY "type", "name"
    `,
    ...types,
  );

  return rows.map<SourceRow>((row) => ({
    ...row,
    config: parseJsonValue(row.config),
  }));
}

export async function findCollectableSourceById(sourceId: string) {
  const placeholders = COLLECTABLE_SOURCE_TYPES.map(() => "?").join(", ");
  const rows = await prisma.$queryRawUnsafe<RawSourceRow[]>(
    `
      SELECT
        "id",
        "name",
        "type",
        "url",
        "config",
        "enabled",
        "fetchIntervalMinutes",
        "lastFetchedAt",
        "lastError"
      FROM "Source"
      WHERE "id" = ?
        AND "type" IN (${placeholders})
      LIMIT 1
    `,
    sourceId,
    ...COLLECTABLE_SOURCE_TYPES,
  );
  const row = rows[0];

  return row
    ? {
        ...row,
        config: parseJsonValue(row.config),
      }
    : null;
}

export async function setSourceEnabled(sourceId: string, enabled: boolean) {
  const updatedCount = await prisma.$executeRaw`
    UPDATE "Source"
    SET
      "enabled" = ${enabled},
      "updatedAt" = ${nowIso()}
    WHERE "id" = ${sourceId}
  `;

  return updatedCount > 0;
}

function jsonParameter(value: unknown | null) {
  return value === null ? null : JSON.stringify(value);
}

export async function createSourceRecord(input: SourceSaveRecord) {
  const id = createId();
  const now = nowIso();

  await prisma.$executeRaw`
    INSERT INTO "Source" (
      "id",
      "name",
      "type",
      "url",
      "config",
      "enabled",
      "fetchIntervalMinutes",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${id},
      ${input.name},
      ${input.type},
      ${input.url},
      ${jsonParameter(input.config)},
      ${input.enabled},
      ${input.fetchIntervalMinutes},
      ${now},
      ${now}
    )
  `;

  return id;
}

export async function updateSourceRecord(sourceId: string, input: SourceSaveRecord) {
  const updatedCount = await prisma.$executeRaw`
    UPDATE "Source"
    SET
      "name" = ${input.name},
      "type" = ${input.type},
      "url" = ${input.url},
      "config" = ${jsonParameter(input.config)},
      "enabled" = ${input.enabled},
      "fetchIntervalMinutes" = ${input.fetchIntervalMinutes},
      "lastError" = NULL,
      "updatedAt" = ${nowIso()}
    WHERE "id" = ${sourceId}
  `;

  return updatedCount > 0;
}

export async function createJobRun(sourceId: string, jobType: string, metadata?: unknown) {
  const id = createId();
  const now = nowIso();

  await prisma.$executeRaw`
    INSERT INTO "JobRun" (
      "id",
      "jobType",
      "sourceId",
      "status",
      "startedAt",
      "metadata"
    )
    VALUES (
      ${id},
      ${jobType},
      ${sourceId},
      ${"RUNNING"},
      ${now},
      ${metadata === undefined ? null : JSON.stringify(metadata)}
    )
  `;

  return id;
}

export async function finishJobRun(input: {
  id: string;
  status: JobRunStatus;
  scannedCount: number;
  createdCount: number;
  skippedCount: number;
  errorMessage?: string;
  metadata?: unknown;
}) {
  await prisma.$executeRaw`
    UPDATE "JobRun"
    SET
      "status" = ${input.status},
      "finishedAt" = ${nowIso()},
      "scannedCount" = ${input.scannedCount},
      "createdCount" = ${input.createdCount},
      "skippedCount" = ${input.skippedCount},
      "errorMessage" = ${compactErrorMessage(input.errorMessage)},
      "metadata" = ${input.metadata === undefined ? null : JSON.stringify(input.metadata)}
    WHERE "id" = ${input.id}
  `;
}

export async function markSourceFetchSuccess(sourceId: string) {
  await prisma.$executeRaw`
    UPDATE "Source"
    SET
      "lastFetchedAt" = ${nowIso()},
      "lastError" = NULL,
      "updatedAt" = ${nowIso()}
    WHERE "id" = ${sourceId}
  `;
}

export async function markSourceFetchSkipped(sourceId: string, message?: string) {
  await prisma.$executeRaw`
    UPDATE "Source"
    SET
      "lastFetchedAt" = ${nowIso()},
      "lastError" = ${compactErrorMessage(message) ?? null},
      "updatedAt" = ${nowIso()}
    WHERE "id" = ${sourceId}
  `;
}

export async function markSourceFetchFailure(sourceId: string, errorMessage: string) {
  await prisma.$executeRaw`
    UPDATE "Source"
    SET
      "lastFetchedAt" = ${nowIso()},
      "lastError" = ${compactErrorMessage(errorMessage)},
      "updatedAt" = ${nowIso()}
    WHERE "id" = ${sourceId}
  `;
}
