import { prisma } from "@/server/db/prisma";
import { canonicalizeUrl } from "@/server/normalizer/url";

import { createId } from "./source-store";
import type { CandidateInput, CandidateWriteResult } from "./types";

type ExistingCandidateRow = {
  id: string;
};

function jsonOrNull(value: unknown) {
  return value === undefined ? null : JSON.stringify(value);
}

function normalizeTitle(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isUniqueConstraintError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /unique|constraint/i.test(error.message);
}

async function candidateExists(canonicalUrl: string) {
  const rows = await prisma.$queryRaw<ExistingCandidateRow[]>`
    SELECT "id"
    FROM "CandidateItem"
    WHERE "canonicalUrl" = ${canonicalUrl}
    LIMIT 1
  `;

  return rows.length > 0;
}

export async function upsertCandidateItems(
  items: CandidateInput[],
  baseUrl?: string | null,
): Promise<CandidateWriteResult> {
  const seenUrls = new Set<string>();
  let createdCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    const canonicalUrl = canonicalizeUrl(item.url, baseUrl);
    const title = normalizeTitle(item.title);

    if (!canonicalUrl || !title || seenUrls.has(canonicalUrl)) {
      skippedCount += 1;
      continue;
    }

    seenUrls.add(canonicalUrl);

    if (await candidateExists(canonicalUrl)) {
      skippedCount += 1;
      continue;
    }

    try {
      await prisma.$executeRaw`
        INSERT INTO "CandidateItem" (
          "id",
          "sourceId",
          "externalId",
          "canonicalUrl",
          "title",
          "summary",
          "contentText",
          "author",
          "publishedAt",
          "rawEngagement",
          "rawPayload",
          "status"
        )
        VALUES (
          ${createId()},
          ${item.sourceId},
          ${item.externalId ?? null},
          ${canonicalUrl},
          ${title},
          ${item.summary ?? null},
          ${item.contentText ?? null},
          ${item.author ?? null},
          ${item.publishedAt.toISOString()},
          ${jsonOrNull(item.rawEngagement)},
          ${jsonOrNull(item.rawPayload)},
          ${"NEW"}
        )
      `;

      createdCount += 1;
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      skippedCount += 1;
    }
  }

  return {
    scannedCount: items.length,
    createdCount,
    skippedCount,
  };
}
