import { env } from "@/server/env";

import type { AdapterFetchResult, CandidateInput, SourceRow } from "./types";

type Fetcher = typeof fetch;

type GitHubConfig = {
  mode: "search" | "releases";
  queries: string[];
  repositories: string[];
  sort: "stars" | "forks" | "help-wanted-issues" | "updated";
  order: "asc" | "desc";
  sinceDays: number;
  maxResultsPerQuery: number;
  maxReleasesPerRepo: number;
  includePrereleases: boolean;
};

type GitHubRepo = {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  pushed_at: string | null;
  updated_at: string | null;
  language: string | null;
  topics?: string[];
  owner?: {
    login?: string;
  };
};

type GitHubSearchResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
};

type GitHubRelease = {
  id: number;
  tag_name: string;
  name: string | null;
  html_url: string;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  created_at: string | null;
  author?: {
    login?: string;
  };
  assets?: Array<{
    name: string;
    download_count: number;
  }>;
};

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2026-03-10";

function configObject(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T) {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(numberValue)));
}

function repositoryFromUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (!url.hostname.endsWith("github.com")) {
      return null;
    }

    const [owner, repo] = url.pathname.split("/").filter(Boolean);

    return owner && repo ? `${owner}/${repo.replace(/\.git$/i, "")}` : null;
  } catch {
    return null;
  }
}

function normalizeRepository(value: string) {
  const match = value.trim().match(/^([^/\s]+)\/([^/\s]+)$/);

  return match ? `${match[1]}/${match[2].replace(/\.git$/i, "")}` : null;
}

function parseGitHubConfig(source: SourceRow): GitHubConfig {
  const config = configObject(source.config);
  const repositories = [
    ...stringList(config.repositories),
    ...(optionalString(config.repository) ? [optionalString(config.repository)!] : []),
    ...(repositoryFromUrl(source.url) ? [repositoryFromUrl(source.url)!] : []),
  ]
    .map(normalizeRepository)
    .filter((item): item is string => Boolean(item));
  const queries = [
    ...stringList(config.queries),
    ...(optionalString(config.query) ? [optionalString(config.query)!] : []),
  ];
  const mode =
    enumValue(config.mode, ["search", "releases"] as const, repositories.length > 0 ? "releases" : "search");

  return {
    mode,
    queries,
    repositories: [...new Set(repositories)],
    sort: enumValue(config.sort, ["stars", "forks", "help-wanted-issues", "updated"] as const, "updated"),
    order: enumValue(config.order, ["asc", "desc"] as const, "desc"),
    sinceDays: clampInteger(config.sinceDays, 14, 1, 365),
    maxResultsPerQuery: clampInteger(config.maxResultsPerQuery ?? config.maxResults, 10, 1, 50),
    maxReleasesPerRepo: clampInteger(config.maxReleasesPerRepo ?? config.maxResults, 2, 1, 10),
    includePrereleases: config.includePrereleases === true,
  };
}

function githubHeaders() {
  const token = env.GITHUB_TOKEN?.trim();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "AIxxts-collector",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseJsonResponse(response: Response) {
  return (await response.json().catch(() => null)) as unknown;
}

function rateLimitMessage(response: Response) {
  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");
  const retryAfter = response.headers.get("retry-after");

  if (retryAfter) {
    return ` retry after ${retryAfter}s`;
  }

  if (remaining === "0" && reset) {
    return ` rate limit resets at ${new Date(Number(reset) * 1000).toISOString()}`;
  }

  return "";
}

async function githubRequest<T>(path: string, fetcher: Fetcher): Promise<T> {
  const response = await fetcher(`${GITHUB_API_BASE}${path}`, {
    headers: githubHeaders(),
  });
  const body = await parseJsonResponse(response);

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message)
        : response.statusText;

    throw new Error(`GitHub API ${response.status}: ${message}.${rateLimitMessage(response)}`);
  }

  return body as T;
}

function parseDate(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date();

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function truncate(value: string | null | undefined, maxLength: number) {
  const text = value?.replace(/\s+/g, " ").trim() ?? "";

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}...`;
}

function githubScore(repo: GitHubRepo, extra = 0) {
  const starScore = Math.log10(repo.stargazers_count + 1) * 12;
  const forkScore = Math.log10(repo.forks_count + 1) * 6;
  const issueScore = Math.log10(repo.open_issues_count + 1) * 2;

  return Number((starScore + forkScore + issueScore + extra).toFixed(3));
}

function withSinceQualifier(query: string, sinceDays: number) {
  if (/\b(pushed|created|updated):/i.test(query)) {
    return query;
  }

  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return `${query} pushed:>=${since}`;
}

function repoCandidate(source: SourceRow, repo: GitHubRepo, query: string): CandidateInput {
  const score = githubScore(repo);
  const summary = [
    truncate(repo.description, 180),
    `${repo.stargazers_count} stars, ${repo.forks_count} forks`,
    repo.language ? `language: ${repo.language}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    sourceId: source.id,
    externalId: String(repo.id),
    url: repo.html_url,
    title: `GitHub repo: ${repo.full_name}`,
    summary,
    contentText: summary,
    author: repo.owner?.login ?? null,
    publishedAt: parseDate(repo.pushed_at ?? repo.updated_at),
    hotScore: score,
    influenceScore: score,
    rawEngagement: {
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      openIssues: repo.open_issues_count,
      language: repo.language,
      topics: repo.topics ?? [],
      query,
    },
    rawPayload: repo,
  };
}

async function collectRepositorySearch(
  source: SourceRow,
  config: GitHubConfig,
  fetcher: Fetcher,
): Promise<AdapterFetchResult> {
  const queries = config.queries.length > 0 ? config.queries : [source.name];
  const items: CandidateInput[] = [];
  const metadataQueries: Array<{
    query: string;
    totalCount: number;
    incompleteResults: boolean;
    returnedCount: number;
  }> = [];

  for (const rawQuery of queries.slice(0, 5)) {
    const query = withSinceQualifier(rawQuery, config.sinceDays);
    const params = new URLSearchParams({
      q: query,
      sort: config.sort,
      order: config.order,
      per_page: String(config.maxResultsPerQuery),
    });
    const result = await githubRequest<GitHubSearchResponse>(
      `/search/repositories?${params.toString()}`,
      fetcher,
    );

    metadataQueries.push({
      query,
      totalCount: result.total_count,
      incompleteResults: result.incomplete_results,
      returnedCount: result.items.length,
    });
    items.push(...result.items.map((repo) => repoCandidate(source, repo, query)));
  }

  return {
    status: "SUCCESS",
    items,
    metadata: {
      method: "github_repository_search",
      queries: metadataQueries,
      sort: config.sort,
      order: config.order,
      authenticated: Boolean(env.GITHUB_TOKEN?.trim()),
    },
  };
}

function releaseDownloadCount(release: GitHubRelease) {
  return release.assets?.reduce((sum, asset) => sum + asset.download_count, 0) ?? 0;
}

function releaseCandidate(source: SourceRow, repo: GitHubRepo, release: GitHubRelease): CandidateInput {
  const downloadCount = releaseDownloadCount(release);
  const score = githubScore(repo, Math.log10(downloadCount + 1) * 4);
  const releaseName = release.name?.trim() || release.tag_name;
  const summary = [
    truncate(release.body, 220),
    `${repo.stargazers_count} stars, ${repo.forks_count} forks`,
    downloadCount > 0 ? `${downloadCount} asset downloads` : null,
    release.prerelease ? "prerelease" : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    sourceId: source.id,
    externalId: String(release.id),
    url: release.html_url,
    title: `${repo.full_name} release: ${releaseName}`,
    summary,
    contentText: truncate(release.body, 2000),
    author: release.author?.login ?? repo.owner?.login ?? null,
    publishedAt: parseDate(release.published_at ?? release.created_at),
    hotScore: score,
    influenceScore: score,
    rawEngagement: {
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      openIssues: repo.open_issues_count,
      releaseDownloads: downloadCount,
      prerelease: release.prerelease,
      tagName: release.tag_name,
    },
    rawPayload: {
      repository: repo,
      release,
    },
  };
}

async function collectRepositoryReleases(
  source: SourceRow,
  config: GitHubConfig,
  fetcher: Fetcher,
): Promise<AdapterFetchResult> {
  if (config.repositories.length === 0) {
    return {
      status: "SKIPPED",
      scannedCount: 0,
      createdCount: 0,
      skippedCount: 1,
      errorMessage: "GitHub releases source requires repositories or a GitHub repository URL.",
      metadata: {
        reason: "missing_repositories",
      },
    };
  }

  const items: CandidateInput[] = [];
  const repositories: Array<{
    repository: string;
    releaseCount: number;
  }> = [];

  for (const repository of config.repositories.slice(0, 20)) {
    const [owner, repoName] = repository.split("/");
    const repo = await githubRequest<GitHubRepo>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`,
      fetcher,
    );
    const releases = await githubRequest<GitHubRelease[]>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/releases?per_page=${config.maxReleasesPerRepo}`,
      fetcher,
    );
    const visibleReleases = releases
      .filter((release) => !release.draft)
      .filter((release) => config.includePrereleases || !release.prerelease)
      .slice(0, config.maxReleasesPerRepo);

    repositories.push({
      repository,
      releaseCount: visibleReleases.length,
    });
    items.push(...visibleReleases.map((release) => releaseCandidate(source, repo, release)));
  }

  return {
    status: "SUCCESS",
    items,
    metadata: {
      method: "github_repository_releases",
      repositories,
      authenticated: Boolean(env.GITHUB_TOKEN?.trim()),
    },
  };
}

export async function collectGitHubSource(
  source: SourceRow,
  fetcher: Fetcher = fetch,
): Promise<AdapterFetchResult> {
  const config = parseGitHubConfig(source);

  if (config.mode === "releases") {
    return collectRepositoryReleases(source, config, fetcher);
  }

  return collectRepositorySearch(source, config, fetcher);
}
