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
    name: "MIT Technology Review AI",
    type: "RSS",
    url: "https://www.technologyreview.com/topic/artificial-intelligence/feed/",
    config: {
      category: "media",
      topic: "AI",
    },
    fetchIntervalMinutes: 120,
  },
  {
    name: "VentureBeat AI",
    type: "RSS",
    url: "https://venturebeat.com/category/ai/feed/",
    config: {
      category: "media",
      topic: "AI",
    },
    fetchIntervalMinutes: 120,
  },
  {
    name: "arXiv cs.AI",
    type: "RSS",
    url: "https://rss.arxiv.org/rss/cs.AI",
    fetchIntervalMinutes: 720,
  },
  {
    name: "arXiv cs.CL",
    type: "RSS",
    url: "https://rss.arxiv.org/rss/cs.CL",
    fetchIntervalMinutes: 720,
  },
  {
    name: "arXiv cs.LG",
    type: "RSS",
    url: "https://rss.arxiv.org/rss/cs.LG",
    fetchIntervalMinutes: 720,
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
    name: "GitHub vLLM Releases",
    type: "RSS",
    url: "https://github.com/vllm-project/vllm/releases.atom",
    config: {
      category: "github-release",
      owner: "vllm-project/vllm",
    },
    fetchIntervalMinutes: 360,
  },
  {
    name: "GitHub Transformers Releases",
    type: "RSS",
    url: "https://github.com/huggingface/transformers/releases.atom",
    config: {
      category: "github-release",
      owner: "huggingface/transformers",
    },
    fetchIntervalMinutes: 360,
  },
  {
    name: "GitHub LangChain Releases",
    type: "RSS",
    url: "https://github.com/langchain-ai/langchain/releases.atom",
    config: {
      category: "github-release",
      owner: "langchain-ai/langchain",
    },
    fetchIntervalMinutes: 360,
  },
  {
    name: "GitHub llama.cpp Releases",
    type: "RSS",
    url: "https://github.com/ggml-org/llama.cpp/releases.atom",
    config: {
      category: "github-release",
      owner: "ggml-org/llama.cpp",
    },
    fetchIntervalMinutes: 360,
  },
  {
    name: "GitHub Core LLM Releases REST",
    type: "GITHUB",
    url: null,
    config: {
      mode: "releases",
      repositories: [
        "vllm-project/vllm",
        "huggingface/transformers",
        "langchain-ai/langchain",
        "ggml-org/llama.cpp",
      ],
      maxReleasesPerRepo: 2,
      includePrereleases: false,
    },
    fetchIntervalMinutes: 360,
  },
  {
    name: "GitHub AI Repository Search",
    type: "GITHUB",
    url: null,
    config: {
      mode: "search",
      queries: ["topic:llm", "topic:generative-ai", "topic:ai-agent"],
      sort: "updated",
      order: "desc",
      sinceDays: 14,
      maxResultsPerQuery: 10,
    },
    fetchIntervalMinutes: 360,
  },
  {
    name: "YouTube OpenAI",
    type: "YOUTUBE",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCXZCJLdBC09xxGZ6gcdrc6A",
    config: {
      keyword: "OpenAI AI",
      channelId: "UCXZCJLdBC09xxGZ6gcdrc6A",
      keywords: ["AI", "model", "Codex", "ChatGPT", "agent", "developer", "research"],
      regionCode: "US",
      relevanceLanguage: "en",
      maxResults: 15,
    },
    fetchIntervalMinutes: 120,
    replaces: [
      {
        name: "YouTube AI Agents",
        type: "YOUTUBE",
        url: null,
      },
    ],
  },
  {
    name: "YouTube Google DeepMind",
    type: "YOUTUBE",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCP7jMXSY2xbc3KCAE0MHQ-A",
    config: {
      keyword: "Google DeepMind AI",
      channelId: "UCP7jMXSY2xbc3KCAE0MHQ-A",
      keywords: ["AI", "agent", "model", "Gemini", "research", "robot", "learning"],
      regionCode: "US",
      relevanceLanguage: "en",
      maxResults: 15,
    },
    fetchIntervalMinutes: 120,
    replaces: [
      {
        name: "YouTube LLM Research",
        type: "YOUTUBE",
        url: null,
      },
    ],
  },
  {
    name: "YouTube Two Minute Papers",
    type: "YOUTUBE",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg",
    config: {
      keyword: "AI research explained",
      channelId: "UCbfYPyITQ-7l4upoX8nvctg",
      keywords: ["AI", "neural", "model", "learning", "research", "paper", "robot"],
      regionCode: "US",
      relevanceLanguage: "en",
      maxResults: 15,
    },
    fetchIntervalMinutes: 120,
    replaces: [
      {
        name: "YouTube AI Coding",
        type: "YOUTUBE",
        url: null,
      },
    ],
  },
  {
    name: "YouTube Yannic Kilcher",
    type: "YOUTUBE",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCZHmQk67mSJgfCCTn7xBfew",
    config: {
      keyword: "machine learning papers",
      channelId: "UCZHmQk67mSJgfCCTn7xBfew",
      keywords: ["AI", "LLM", "machine learning", "paper", "model", "agent", "neural"],
      maxResults: 15,
    },
    fetchIntervalMinutes: 180,
  },
  {
    name: "YouTube Google for Developers AI",
    type: "YOUTUBE",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw",
    config: {
      keyword: "AI developer tools",
      channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
      keywords: ["AI", "Gemini", "agent", "model", "developer", "machine learning"],
      excludeKeywords: ["shorts"],
      maxResults: 15,
    },
    fetchIntervalMinutes: 180,
  },
  {
    name: "YouTube Lex Fridman AI",
    type: "YOUTUBE",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCSHZKyawb77ixDdsGog4iWA",
    config: {
      keyword: "AI interview",
      channelId: "UCSHZKyawb77ixDdsGog4iWA",
      keywords: ["AI", "artificial intelligence", "DeepMind", "OpenAI", "robot", "machine learning"],
      maxResults: 15,
    },
    fetchIntervalMinutes: 240,
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
    const legacyRows =
      replacedSource.url === null
        ? await prisma.$queryRaw<ExistingSourceRow[]>`
            SELECT "id"
            FROM "Source"
            WHERE "name" = ${replacedSource.name}
              AND "type" = ${replacedSource.type}
              AND "url" IS NULL
            LIMIT 1
          `
        : await prisma.$queryRaw<ExistingSourceRow[]>`
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
      if (replacedSource.url === null) {
        await prisma.$executeRaw`
          UPDATE "Source"
          SET
            "enabled" = ${false},
            "lastError" = ${`Replaced by seed source: ${source.name}`},
            "updatedAt" = ${now}
          WHERE "name" = ${replacedSource.name}
            AND "type" = ${replacedSource.type}
            AND "url" IS NULL
        `;
      } else {
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
