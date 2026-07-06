import type { SourceType } from "@/generated/prisma/client";
import type {
  DigestRankingItem,
  DigestRankingResult,
  RankingCandidate,
  RankingLimits,
} from "@/server/ranking/types";

const sourceTypePriority: Record<SourceType, number> = {
  OFFICIAL_BLOG: 9,
  HACKER_NEWS: 8,
  REDDIT: 7,
  YOUTUBE: 6,
  RSS: 5,
  X: 4,
  MANUAL: 4,
  DOUYIN: 3,
  XIAOHONGSHU: 3,
};

export function rankCandidatesWithFallback(
  candidates: RankingCandidate[],
  digestDate: string,
  limits: RankingLimits,
  asOf: Date = new Date(),
): DigestRankingResult {
  const selectedCount = Math.min(limits.maxItems, candidates.length);
  const ranked = [...candidates]
    .sort((left, right) => compareCandidates(left, right))
    .slice(0, selectedCount)
    .map<DigestRankingItem>((candidate, index) => ({
      candidateId: candidate.id,
      rank: index + 1,
      score: calculateFallbackScore(candidate, asOf),
      interpretation: buildFallbackInterpretation(candidate),
      impactReason: "未配置 LLM_API_KEY，未生成影响力解读。",
      heatReason: "按 hotScore、influenceScore、发布时间和来源类型进行确定性排序。",
    }));

  return {
    digestTitle: `${digestDate} AI 行业每日精选`,
    digestSummary:
      ranked.length > 0
        ? "当前未配置 LLM_API_KEY，本次使用确定性规则排序，解读仅引用标题和摘要。"
        : "过去 24 小时没有可用于每日精选的候选内容。",
    items: ranked,
  };
}

function compareCandidates(left: RankingCandidate, right: RankingCandidate) {
  return (
    compareNumber(right.hotScore, left.hotScore) ||
    compareNumber(right.influenceScore, left.influenceScore) ||
    right.publishedAt.getTime() - left.publishedAt.getTime() ||
    getSourcePriority(right.source.type) - getSourcePriority(left.source.type) ||
    left.title.localeCompare(right.title, "zh-CN")
  );
}

function compareNumber(left: number | null, right: number | null) {
  return (left ?? 0) - (right ?? 0);
}

function calculateFallbackScore(candidate: RankingCandidate, asOf: Date) {
  const hoursOld = Math.max(
    0,
    Math.min(24, (asOf.getTime() - candidate.publishedAt.getTime()) / 3_600_000),
  );
  const recencyScore = 24 - hoursOld;
  const score =
    (candidate.hotScore ?? 0) * 0.45 +
    (candidate.influenceScore ?? 0) * 0.35 +
    recencyScore * 0.1 +
    getSourcePriority(candidate.source.type);

  return Number(score.toFixed(3));
}

function getSourcePriority(type: SourceType) {
  return sourceTypePriority[type] ?? 0;
}

function buildFallbackInterpretation(candidate: RankingCandidate) {
  const title = truncateText(candidate.title, 80);
  const summary = candidate.summary?.trim();

  if (!summary) {
    return `基于标题「${title}」，该条目被选入候选排序。当前未配置 LLM_API_KEY，系统不补充标题之外的事实解读。`;
  }

  return `基于标题「${title}」和摘要「${truncateText(
    summary,
    140,
  )}」，该条目被选入候选排序。当前未配置 LLM_API_KEY，系统不补充标题和摘要之外的事实解读。`;
}

function truncateText(value: string, maxLength: number) {
  const text = value.trim().replace(/\s+/g, " ");

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}
