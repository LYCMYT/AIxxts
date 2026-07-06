const TRACKING_QUERY_PREFIXES = ["utm_"];

const TRACKING_QUERY_PARAMS = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
  "spm",
]);

function isTrackingParam(name: string) {
  const normalized = name.toLowerCase();

  return (
    TRACKING_QUERY_PARAMS.has(normalized) ||
    TRACKING_QUERY_PREFIXES.some((prefix) => normalized.startsWith(prefix))
  );
}

function canonicalizeYouTubeUrl(url: URL) {
  const hostname = url.hostname.replace(/^www\./, "");

  if (hostname === "youtu.be") {
    const videoId = url.pathname.split("/").filter(Boolean)[0];
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
  }

  if (hostname === "youtube.com" || hostname === "m.youtube.com") {
    const videoId = url.searchParams.get("v");

    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
  }

  return undefined;
}

export function canonicalizeUrl(input: string | null | undefined, baseUrl?: string | null) {
  const trimmed = input?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = baseUrl ? new URL(trimmed, baseUrl) : new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    const youtubeUrl = canonicalizeYouTubeUrl(url);

    if (youtubeUrl !== undefined) {
      return youtubeUrl;
    }

    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";

    for (const key of Array.from(url.searchParams.keys())) {
      if (isTrackingParam(key)) {
        url.searchParams.delete(key);
      }
    }

    url.searchParams.sort();

    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }

    return url.toString();
  } catch {
    return null;
  }
}
