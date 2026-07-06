import type { SourceType } from "@/generated/prisma/client";

export type RankingCandidate = {
  id: string;
  title: string;
  summary: string | null;
  canonicalUrl: string;
  publishedAt: Date;
  hotScore: number | null;
  influenceScore: number | null;
  source: {
    name: string;
    type: SourceType;
  };
};

export type DigestRankingItem = {
  candidateId: string;
  rank: number;
  score: number;
  interpretation: string;
  impactReason?: string;
  heatReason?: string;
};

export type DigestRankingResult = {
  digestTitle: string;
  digestSummary: string;
  items: DigestRankingItem[];
};

export type RankingLimits = {
  minItems: number;
  maxItems: number;
};
