export type GithubPagesSnapshot = {
  exportedAt: string;
  digest: {
    candidateCount: number;
    date: string;
    generatedAt: string;
    selectedCount: number;
    status: string;
    summary: string;
    title: string;
  } | null;
  items: Array<{
    author: string;
    id: string;
    interpretation: string;
    originalSummary: string;
    originalUrl: string;
    publishedAt: string;
    rank: number;
    signals: string[];
    source: string;
    sourceType: string;
    title: string;
    topicTags: string[];
    translatedContent: string;
    translatedSummary: string;
  }>;
};

