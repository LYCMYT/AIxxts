import { prisma } from "@/server/db/prisma";
import { createId } from "@/server/collectors/source-store";
import type { CollectableSourceType } from "@/server/collectors/types";

type SeedSource = {
  name: string;
  type: CollectableSourceType;
  url: string | null;
  config?: Record<string, unknown>;
  fetchIntervalMinutes?: number;
  replaces?: Array<{
    name: string;
    type: CollectableSourceType;
    url: string | null;
  }>;
};

type ExistingSourceRow = {
  id: string;
};

const seedSources: SeedSource[] = [
  {
    name: "OpenAI News",
    type: "OFFICIAL_BLOG",
    url: "https://openai.com/news/rss.xml",
    fetchIntervalMinutes: 60,
  },
  {
    name: "TechCrunch AI",
    type: "RSS",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    fetchIntervalMinutes: 60,
    replaces: [
      {
        name: "Anthropic News",
        type: "OFFICIAL_BLOG",
        url: "https://www.anthropic.com/news/rss.xml",
      },
    ],
  },
  {
    name: "Google AI Blog",
    type: "OFFICIAL_BLOG",
    url: "https://blog.google/technology/ai/rss/",
    fetchIntervalMinutes: 60,
  },
  {
    name: "Hugging Face Blog",
    type: "RSS",
    url: "https://huggingface.co/blog/feed.xml",
    fetchIntervalMinutes: 120,
  },
  {
    name: "Hacker News AI",
    type: "HACKER_NEWS",
    url: "https://hnrss.org/newest?q=AI",
    fetchIntervalMinutes: 30,
  },
  {
    name: "Reddit LocalLLaMA",
    type: "REDDIT",
    url: "https://www.reddit.com/r/LocalLLaMA/.rss",
    fetchIntervalMinutes: 60,
  },
  {
    name: "YouTube AI Agents",
    type: "YOUTUBE",
    url: null,
    config: {
      keyword: "AI agents",
      regionCode: "US",
      relevanceLanguage: "en",
      maxResults: 10,
    },
    fetchIntervalMinutes: 120,
  },
  {
    name: "YouTube LLM Research",
    type: "YOUTUBE",
    url: null,
    config: {
      keyword: "large language models",
      regionCode: "US",
      relevanceLanguage: "en",
      maxResults: 10,
    },
    fetchIntervalMinutes: 120,
  },
  {
    name: "YouTube AI Coding",
    type: "YOUTUBE",
    url: null,
    config: {
      keyword: "AI coding tools",
      regionCode: "US",
      relevanceLanguage: "en",
      maxResults: 10,
    },
    fetchIntervalMinutes: 120,
  },
];

async function findExistingSource(source: SeedSource) {
  const directRows = await prisma.$queryRaw<ExistingSourceRow[]>`
    SELECT "id"
    FROM "Source"
    WHERE "name" = ${source.name}
      AND "type" = ${source.type}
    LIMIT 1
  `;

  if (directRows[0]) {
    return directRows[0];
  }

  for (const replacedSource of source.replaces ?? []) {
    const legacyRows = await prisma.$queryRaw<ExistingSourceRow[]>`
      SELECT "id"
      FROM "Source"
      WHERE "name" = ${replacedSource.name}
        AND "type" = ${replacedSource.type}
        AND "url" = ${replacedSource.url}
      LIMIT 1
    `;

    if (legacyRows[0]) {
      return legacyRows[0];
    }
  }

  return null;
}

async function upsertSeedSource(source: SeedSource) {
  const existing = await findExistingSource(source);
  const now = new Date().toISOString();
  const config = source.config === undefined ? null : JSON.stringify(source.config);
  const fetchIntervalMinutes = source.fetchIntervalMinutes ?? 60;

  if (existing) {
    await prisma.$executeRaw`
      UPDATE "Source"
      SET
        "name" = ${source.name},
        "type" = ${source.type},
        "url" = ${source.url},
        "config" = ${config},
        "enabled" = ${true},
        "fetchIntervalMinutes" = ${fetchIntervalMinutes},
        "lastError" = ${null},
        "updatedAt" = ${now}
      WHERE "id" = ${existing.id}
    `;

    return "updated" as const;
  }

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
      ${createId()},
      ${source.name},
      ${source.type},
      ${source.url},
      ${config},
      ${true},
      ${fetchIntervalMinutes},
      ${now},
      ${now}
    )
  `;

  return "created" as const;
}

async function retireReplacedSources(sources: SeedSource[]) {
  const now = new Date().toISOString();

  for (const source of sources) {
    for (const replacedSource of source.replaces ?? []) {
      await prisma.$executeRaw`
        UPDATE "Source"
        SET
          "enabled" = ${false},
          "lastError" = ${`Replaced by seed source: ${source.name}`},
          "updatedAt" = ${now}
        WHERE "name" = ${replacedSource.name}
          AND "type" = ${replacedSource.type}
          AND "url" = ${replacedSource.url}
      `;
    }
  }
}

async function main() {
  let createdCount = 0;
  let updatedCount = 0;

  for (const source of seedSources) {
    const result = await upsertSeedSource(source);

    if (result === "created") {
      createdCount += 1;
    } else {
      updatedCount += 1;
    }
  }

  await retireReplacedSources(seedSources);

  console.log(
    JSON.stringify(
      {
        sourceCount: seedSources.length,
        createdCount,
        updatedCount,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
