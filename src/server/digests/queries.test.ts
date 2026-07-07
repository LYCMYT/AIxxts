import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDigestArchiveWhere,
  digestItemToHome,
  getHomeDigestTaskStatus,
  homeDigestPreviewStatuses,
  normalizeDigestArchiveFilters,
} from "./queries";

test("home digest preview statuses prefer published and then draft", () => {
  assert.deepEqual(homeDigestPreviewStatuses, ["PUBLISHED", "DRAFT"]);
});

test("home digest task status distinguishes published and draft previews", () => {
  assert.equal(getHomeDigestTaskStatus("PUBLISHED"), "已发布");
  assert.equal(getHomeDigestTaskStatus("DRAFT"), "草稿预览");
});

test("home digest items expose the candidate id for internal detail links", () => {
  const item = digestItemToHome({
    rank: 1,
    titleSnapshot: "OpenAI ships a model update",
    sourceSnapshot: "OpenAI Blog",
    urlSnapshot: "https://example.com/original",
    interpretation: "这条内容说明模型能力更新，值得团队快速查看。",
    signals: {
      impact: 4,
      heat: 3,
    },
    candidate: {
      id: "candidate-123",
      publishedAt: new Date("2026-07-06T12:30:00.000Z"),
      source: {
        type: "OFFICIAL_BLOG",
      },
    },
  });

  assert.equal(item.id, "candidate-123");
  assert.equal(item.url, "https://example.com/original");
});

test("digest archive filters normalize GET params for keyword and status", () => {
  assert.deepEqual(
    normalizeDigestArchiveFilters({
      q: "  agent   memory  ",
      status: "success",
      topic: "  AI Agent  ",
    }),
    {
      q: "agent memory",
      status: "success",
      topic: "AI Agent",
    },
  );

  assert.deepEqual(
    normalizeDigestArchiveFilters({
      q: ["first", "second"],
      status: "unknown",
    }),
    {
      q: "first",
      status: "",
      topic: "",
    },
  );
});

test("digest archive where searches digest and item text with status", () => {
  assert.deepEqual(buildDigestArchiveWhere({ q: "agent memory", status: "success" }), {
    OR: [
      {
        title: {
          contains: "agent memory",
        },
      },
      {
        summary: {
          contains: "agent memory",
        },
      },
      {
        items: {
          some: {
            OR: [
              {
                titleSnapshot: {
                  contains: "agent memory",
                },
              },
              {
                interpretation: {
                  contains: "agent memory",
                },
              },
            ],
          },
        },
      },
    ],
    status: {
      in: ["PUBLISHED"],
    },
  });
});

test("digest archive where filters by topic tag", () => {
  assert.deepEqual(buildDigestArchiveWhere({ topic: "AI Agent" }), {
    items: {
      some: {
        candidate: {
          topicTags: {
            some: {
              topic: {
                label: "AI Agent",
              },
            },
          },
        },
      },
    },
  });
});
