import type { CandidateInput } from "@/server/collectors/types";

const MIN_ARTICLE_TEXT_CHARS = 180;
const MAX_FETCH_CHARS = 600_000;
const DEFAULT_ENRICH_LIMIT = 8;
const REQUEST_TIMEOUT_MS = 12_000;

type MinimalFetchResponse = {
  ok: boolean;
  status: number;
  headers: {
    get(name: string): string | null;
  };
  text(): Promise<string>;
};

type ArticleFetch = (url: string, init?: { signal?: AbortSignal }) => Promise<MinimalFetchResponse>;

export type ArticleEnrichmentOptions = {
  fetcher?: ArticleFetch;
  maxItems?: number;
};

export type ArticleEnrichmentResult = {
  items: CandidateInput[];
  attemptedCount: number;
  enrichedCount: number;
  failedCount: number;
};

export function extractArticleTextFromHtml(html: string): string | null {
  const prepared = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<(nav|header|footer|aside|form|iframe|button)[\s\S]*?<\/\1>/gi, " ");
  const mainHtml = firstMatch(prepared, /<article\b[^>]*>([\s\S]*?)<\/article>/i)
    ?? firstMatch(prepared, /<main\b[^>]*>([\s\S]*?)<\/main>/i)
    ?? firstMatch(prepared, /<section\b[^>]*(?:class|id)=["'][^"']*(?:article|content|post|entry)[^"']*["'][^>]*>([\s\S]*?)<\/section>/i)
    ?? firstMatch(prepared, /<body\b[^>]*>([\s\S]*?)<\/body>/i)
    ?? prepared;
  const text = htmlToText(mainHtml);

  return isUsefulArticleText(text) ? text : null;
}

export async function fetchArticleText(
  url: string,
  fetcher: ArticleFetch = defaultFetch,
): Promise<string | null> {
  if (!isHttpUrl(url) || shouldSkipUrl(url)) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetcher(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return null;
    }

    const html = (await response.text()).slice(0, MAX_FETCH_CHARS);

    return extractArticleTextFromHtml(html);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function enrichCandidateItemsWithArticleText(
  items: CandidateInput[],
  options: ArticleEnrichmentOptions = {},
): Promise<ArticleEnrichmentResult> {
  const maxItems = Math.max(0, Math.floor(options.maxItems ?? DEFAULT_ENRICH_LIMIT));
  const fetcher = options.fetcher ?? defaultFetch;
  let attemptedCount = 0;
  let enrichedCount = 0;
  let failedCount = 0;

  const enrichedItems: CandidateInput[] = [];

  for (const item of items) {
    if (attemptedCount >= maxItems || !needsArticleText(item)) {
      enrichedItems.push(item);
      continue;
    }

    attemptedCount += 1;
    const articleText = await fetchArticleText(item.url, fetcher);

    if (!articleText) {
      failedCount += 1;
      enrichedItems.push(item);
      continue;
    }

    enrichedCount += 1;
    enrichedItems.push({
      ...item,
      summary: isUsefulArticleText(item.summary) ? item.summary : summarizeArticleText(articleText),
      contentText: articleText,
    });
  }

  return {
    items: enrichedItems,
    attemptedCount,
    enrichedCount,
    failedCount,
  };
}

export function isUsefulArticleText(value: string | null | undefined) {
  const text = value?.trim();

  if (!text || text.length < MIN_ARTICLE_TEXT_CHARS) {
    return false;
  }

  return !isMetadataOnlyText(text);
}

function htmlToText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<(h[1-6]|p|li|blockquote|div|section|br)\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t\f\v]+/g, " ")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function firstMatch(value: string, pattern: RegExp) {
  return value.match(pattern)?.[1] ?? null;
}

function needsArticleText(item: CandidateInput) {
  return !isUsefulArticleText(item.contentText) && !shouldSkipUrl(item.url);
}

export function summarizeArticleText(text: string) {
  return text.length <= 700 ? text : `${text.slice(0, 700).trim()}...`;
}

function isHttpUrl(url: string) {
  try {
    const parsed = new URL(url);

    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function shouldSkipUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();

    return (
      hostname === "youtube.com" ||
      hostname === "youtu.be" ||
      hostname === "github.com" ||
      hostname === "api.github.com"
    );
  } catch {
    return true;
  }
}

function isMetadataOnlyText(value: string) {
  const normalized = value.toLowerCase();
  const hasUrl = /https?:\/\//i.test(value);
  const hasEnglishMetadata =
    normalized.includes("article url") &&
    normalized.includes("comments url") &&
    (normalized.includes("points") || normalized.includes("comments"));
  const hasChineseMetadata =
    value.includes("文章网址") &&
    value.includes("评论网址") &&
    (value.includes("积分") || value.includes("评论数"));

  return hasUrl && (hasEnglishMetadata || hasChineseMetadata);
}

async function defaultFetch(url: string, init?: { signal?: AbortSignal }) {
  return (await fetch(url, {
    headers: {
      "User-Agent": "AIxxts-article-extractor",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: init?.signal,
  })) as MinimalFetchResponse;
}
