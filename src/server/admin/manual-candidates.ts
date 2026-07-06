import { prisma } from "@/server/db/prisma";
import { canonicalizeUrl } from "@/server/normalizer/url";
import { upsertCandidateItems } from "@/server/collectors/candidate-store";
import { createId } from "@/server/collectors/source-store";
import type { CandidateInput, CandidateWriteResult } from "@/server/collectors/types";

const MANUAL_SOURCE_NAME = "手动录入";
const MANUAL_SOURCE_TYPE = "MANUAL";

type ManualSource = {
  id: string;
};

type ManualSourceRow = ManualSource & {
  name: string;
  enabled: boolean | number;
};

type ManualCandidateInput = {
  title: string;
  sourceName: string | null;
  canonicalUrl: string;
  publishedAt: Date;
  summary: string | null;
  author: string | null;
};

export type ManualCandidateWriteResult = CandidateWriteResult & {
  canonicalUrl: string;
};

export type ManualCandidateWriteDeps = {
  ensureManualSource?: () => Promise<ManualSource>;
  upsertCandidateItems?: (
    items: CandidateInput[],
    baseUrl?: string | null,
  ) => Promise<CandidateWriteResult>;
};

export class ManualCandidateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManualCandidateValidationError";
  }
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  return normalized || null;
}

function parsePublishedAt(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseManualCandidatePayload(payload: unknown): ManualCandidateInput {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ManualCandidateValidationError("valid JSON object is required");
  }

  const record = payload as Record<string, unknown>;
  const title = normalizeText(record.title);

  if (!title) {
    throw new ManualCandidateValidationError("title is required");
  }

  const canonicalUrl =
    typeof record.url === "string" ? canonicalizeUrl(record.url) : null;

  if (!canonicalUrl) {
    throw new ManualCandidateValidationError("valid url is required");
  }

  const publishedAt = parsePublishedAt(record.publishedAt);

  if (!publishedAt) {
    throw new ManualCandidateValidationError("valid publishedAt is required");
  }

  return {
    title,
    sourceName: normalizeText(record.sourceName),
    canonicalUrl,
    publishedAt,
    summary: normalizeText(record.summary),
    author: normalizeText(record.author),
  };
}

function nowIso() {
  return new Date().toISOString();
}

export async function ensureManualSource(): Promise<ManualSource> {
  const rows = await prisma.$queryRaw<ManualSourceRow[]>`
    SELECT
      "id",
      "name",
      "enabled"
    FROM "Source"
    WHERE "type" = ${MANUAL_SOURCE_TYPE}
    ORDER BY "createdAt" ASC
    LIMIT 1
  `;

  if (rows[0]) {
    await prisma.$executeRaw`
      UPDATE "Source"
      SET
        "enabled" = ${true},
        "updatedAt" = ${nowIso()}
      WHERE "id" = ${rows[0].id}
    `;

    return {
      id: rows[0].id,
    };
  }

  const id = createId();

  await prisma.$executeRaw`
    INSERT INTO "Source" (
      "id",
      "name",
      "type",
      "url",
      "config",
      "enabled",
      "fetchIntervalMinutes",
      "updatedAt"
    )
    VALUES (
      ${id},
      ${MANUAL_SOURCE_NAME},
      ${MANUAL_SOURCE_TYPE},
      ${null},
      ${JSON.stringify({ entryMode: "admin_manual" })},
      ${true},
      ${0},
      ${nowIso()}
    )
  `;

  return {
    id,
  };
}

export async function submitManualCandidate(
  payload: unknown,
  deps: ManualCandidateWriteDeps = {},
): Promise<ManualCandidateWriteResult> {
  const input = parseManualCandidatePayload(payload);
  const source = await (deps.ensureManualSource ?? ensureManualSource)();
  const item: CandidateInput = {
    sourceId: source.id,
    url: input.canonicalUrl,
    title: input.title,
    summary: input.summary,
    author: input.author,
    publishedAt: input.publishedAt,
    rawPayload: {
      entryMode: "admin_manual",
      ...(input.sourceName ? { sourceName: input.sourceName } : {}),
    },
  };
  const result = await (deps.upsertCandidateItems ?? upsertCandidateItems)([item], null);

  return {
    ...result,
    canonicalUrl: input.canonicalUrl,
  };
}
