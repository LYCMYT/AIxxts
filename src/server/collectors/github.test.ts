import assert from "node:assert/strict";
import test from "node:test";

import { collectGitHubSource } from "./github";
import type { SourceRow } from "./types";

const baseSource: SourceRow = {
  id: "github-source-1",
  name: "GitHub AI Search",
  type: "GITHUB",
  url: null,
  config: null,
  enabled: true,
  fetchIntervalMinutes: 360,
  lastFetchedAt: null,
  lastError: null,
};

function jsonResponse(body: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    status,
  });
}

test("collectGitHubSource maps repository search results into candidates", async () => {
  const seenUrls: string[] = [];
  const fetcher = (async (input: RequestInfo | URL) => {
    const url = String(input);
    seenUrls.push(url);

    assert.match(url, /\/search\/repositories\?/);
    assert.match(url, /topic%3Allm/);

    return jsonResponse({
      total_count: 1,
      incomplete_results: false,
      items: [
        {
          id: 123,
          full_name: "example/agent-kit",
          html_url: "https://github.com/example/agent-kit",
          description: "AI agent toolkit",
          stargazers_count: 1200,
          forks_count: 110,
          watchers_count: 1200,
          open_issues_count: 12,
          pushed_at: "2026-07-05T10:00:00Z",
          updated_at: "2026-07-05T11:00:00Z",
          language: "TypeScript",
          topics: ["llm", "agent"],
          owner: {
            login: "example",
          },
        },
      ],
    });
  }) as typeof fetch;

  const result = await collectGitHubSource(
    {
      ...baseSource,
      config: {
        mode: "search",
        queries: ["topic:llm"],
        maxResultsPerQuery: 5,
      },
    },
    fetcher,
  );

  assert.equal(result.status, "SUCCESS");
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].title, "GitHub repo: example/agent-kit");
  assert.equal(result.items[0].url, "https://github.com/example/agent-kit");
  assert.equal(result.items[0].author, "example");
  assert.equal(typeof result.items[0].hotScore, "number");
  assert.equal(seenUrls.length, 1);
});

test("collectGitHubSource maps repository releases into candidates", async () => {
  const fetcher = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith("/repos/example/agent-kit")) {
      return jsonResponse({
        id: 123,
        full_name: "example/agent-kit",
        html_url: "https://github.com/example/agent-kit",
        description: "AI agent toolkit",
        stargazers_count: 1200,
        forks_count: 110,
        watchers_count: 1200,
        open_issues_count: 12,
        pushed_at: "2026-07-05T10:00:00Z",
        updated_at: "2026-07-05T11:00:00Z",
        language: "TypeScript",
        owner: {
          login: "example",
        },
      });
    }

    if (url.includes("/repos/example/agent-kit/releases")) {
      return jsonResponse([
        {
          id: 456,
          tag_name: "v1.2.0",
          name: "v1.2.0",
          html_url: "https://github.com/example/agent-kit/releases/tag/v1.2.0",
          body: "Adds workflow orchestration.",
          draft: false,
          prerelease: false,
          published_at: "2026-07-06T08:00:00Z",
          created_at: "2026-07-06T07:30:00Z",
          author: {
            login: "maintainer",
          },
          assets: [
            {
              name: "agent-kit.zip",
              download_count: 42,
            },
          ],
        },
      ]);
    }

    return jsonResponse({ message: `unexpected url ${url}` }, 404);
  }) as typeof fetch;

  const result = await collectGitHubSource(
    {
      ...baseSource,
      name: "GitHub Agent Kit Releases",
      config: {
        mode: "releases",
        repositories: ["example/agent-kit"],
      },
    },
    fetcher,
  );

  assert.equal(result.status, "SUCCESS");
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].title, "example/agent-kit release: v1.2.0");
  assert.equal(result.items[0].externalId, "456");
  assert.equal(result.items[0].author, "maintainer");
});

test("collectGitHubSource skips release mode without repositories", async () => {
  const result = await collectGitHubSource({
    ...baseSource,
    config: {
      mode: "releases",
    },
  });

  assert.equal(result.status, "SKIPPED");
  assert.equal(result.errorMessage, "GitHub releases source requires repositories or a GitHub repository URL.");
});
