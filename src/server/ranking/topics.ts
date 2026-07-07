import type { RankingCandidate } from "@/server/ranking/types";

const MAX_TOPIC_TAGS = 4;

const topicRules: Array<{
  label: string;
  patterns: RegExp[];
}> = [
  {
    label: "AI Agent",
    patterns: [/\bagents?\b/i, /\bagentic\b/i, /智能体/i],
  },
  {
    label: "AI 编程",
    patterns: [
      /\bcoding\b/i,
      /\bcode\b/i,
      /\bdeveloper\b/i,
      /\bgithub\b/i,
      /\bide\b/i,
      /编程/i,
      /代码/i,
      /开发者/i,
    ],
  },
  {
    label: "模型发布",
    patterns: [/\bmodel\b/i, /\brelease\b/i, /\bopenai\b/i, /\banthropic\b/i, /\bqwen\b/i, /\bdeepseek\b/i, /模型/i, /发布/i],
  },
  {
    label: "开源项目",
    patterns: [/\bopen source\b/i, /\bgithub\b/i, /\brepo\b/i, /\brepository\b/i, /开源/i],
  },
  {
    label: "视频内容",
    patterns: [/\byoutube\b/i, /\bvideo\b/i, /视频/i],
  },
];

export function normalizeTopicTags(tags: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const label = tag?.replace(/\s+/g, " ").trim();

    if (!label || label.length > 40) {
      continue;
    }

    const key = label.toLocaleLowerCase("zh-CN");
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(label);

    if (normalized.length >= MAX_TOPIC_TAGS) {
      break;
    }
  }

  return normalized;
}

export function inferCandidateTopicTags(candidate: RankingCandidate): string[] {
  const text = [candidate.title, candidate.summary, candidate.source.name, candidate.source.type]
    .filter(Boolean)
    .join(" ");
  const matched = topicRules
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(text)))
    .map((rule) => rule.label);

  return normalizeTopicTags(matched.length > 0 ? matched : [sourceTypeTopic(candidate.source.type)]);
}

export function topicSlug(label: string) {
  return label
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("zh-CN")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sourceTypeTopic(type: RankingCandidate["source"]["type"]) {
  if (type === "OFFICIAL_BLOG") {
    return "官方发布";
  }

  if (type === "YOUTUBE") {
    return "视频内容";
  }

  if (type === "GITHUB") {
    return "开源项目";
  }

  return "行业新闻";
}
