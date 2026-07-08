import Database from "better-sqlite3";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { GithubPagesSnapshot } from "./github-pages-data";

const DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/dev.db";
const OUTPUT_PATH = path.resolve("public/github-pages-snapshot.json");

type DigestRow = {
  candidateCount: number;
  digestDate: string;
  generatedAt: string | null;
  id: string;
  status: string;
  summary: string | null;
  title: string;
};

type ItemRow = {
  author: string | null;
  candidateId: string;
  canonicalUrl: string;
  contentText: string | null;
  interpretation: string;
  publishedAt: string;
  rank: number;
  signals: string | null;
  sourceName: string;
  sourceType: string;
  summary: string | null;
  title: string;
  translatedContent: string | null;
  translatedSummary: string | null;
  urlSnapshot: string;
};

type TopicRow = {
  candidateId: string;
  label: string;
};

function sqlitePath(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("GitHub Pages snapshot export only supports local SQLite file: URLs.");
  }

  return path.resolve(databaseUrl.replace(/^file:/, ""));
}

function parseSignals(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return [];
    }

    return Object.entries(parsed)
      .filter(([, item]) => typeof item === "string" || typeof item === "number")
      .map(([key, item]) => `${key}: ${String(item)}`)
      .slice(0, 6);
  } catch {
    return [];
  }
}

function main() {
  const db = new Database(sqlitePath(DATABASE_URL), { readonly: true });

  const digest = db
    .prepare(
      `
      select
        id,
        digestDate,
        status,
        title,
        summary,
        generatedAt,
        (
          select count(*)
          from CandidateItem
          where date(publishedAt) >= date(DailyDigest.digestDate, '-1 day')
        ) as candidateCount
      from DailyDigest
      where status = 'PUBLISHED'
      order by digestDate desc
      limit 1
    `,
    )
    .get() as DigestRow | undefined;

  const itemRows = digest
    ? (db
        .prepare(
          `
          select
            di.candidateId,
            di.rank,
            di.titleSnapshot as title,
            di.urlSnapshot,
            di.interpretation,
            di.signals,
            ci.summary,
            ci.translatedSummary,
            ci.translatedContent,
            ci.contentText,
            ci.author,
            ci.publishedAt,
            ci.canonicalUrl,
            s.name as sourceName,
            s.type as sourceType
          from DigestItem di
          join CandidateItem ci on ci.id = di.candidateId
          join Source s on s.id = ci.sourceId
          where di.digestId = ?
          order by di.rank asc
        `,
        )
        .all(digest.id) as ItemRow[])
    : [];

  const topicRows = digest
    ? (db
        .prepare(
          `
          select ct.candidateId, tt.label
          from CandidateTopic ct
          join TopicTag tt on tt.id = ct.topicId
          where ct.candidateId in (${itemRows.map(() => "?").join(",") || "null"})
          order by tt.label asc
        `,
        )
        .all(...itemRows.map((item) => item.candidateId)) as TopicRow[])
    : [];

  const topicMap = new Map<string, string[]>();

  for (const topic of topicRows) {
    topicMap.set(topic.candidateId, [...(topicMap.get(topic.candidateId) ?? []), topic.label]);
  }

  const snapshot: GithubPagesSnapshot = {
    digest: digest
      ? {
          candidateCount: Number(digest.candidateCount),
          date: digest.digestDate,
          generatedAt: digest.generatedAt ?? "",
          selectedCount: itemRows.length,
          status: digest.status,
          summary: digest.summary ?? "",
          title: digest.title,
        }
      : null,
    exportedAt: new Date().toISOString(),
    items: itemRows.map((item) => ({
      author: item.author ?? "",
      id: item.candidateId,
      interpretation: item.interpretation,
      originalSummary: item.summary ?? item.contentText ?? "",
      originalUrl: item.urlSnapshot || item.canonicalUrl,
      publishedAt: item.publishedAt,
      rank: Number(item.rank),
      signals: parseSignals(item.signals),
      source: item.sourceName,
      sourceType: item.sourceType,
      title: item.title,
      topicTags: topicMap.get(item.candidateId) ?? [],
      translatedContent: item.translatedContent ?? "",
      translatedSummary: item.translatedSummary ?? "",
    })),
  };

  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Exported ${snapshot.items.length} items to ${OUTPUT_PATH}`);
}

main();

