export type DigestStatus = "success" | "running" | "failed" | "empty";

export type DigestItemPreview = {
  id: string;
  rank: number;
  title: string;
  source: string;
  sourceType:
    | "RSS"
    | "Blog"
    | "HN"
    | "Reddit"
    | "YouTube"
    | "X"
    | "Douyin"
    | "Xiaohongshu"
    | "Manual";
  publishedAt: string;
  interpretation: string;
  signals: string;
  originalUrl: string;
};

export type DailyDigest = {
  date: string;
  weekday: string;
  generatedAt: string;
  duration: string;
  status: DigestStatus;
  statusLabel: string;
  selectedCount: number;
  candidateCount: number;
  failedCount: number;
  summary: string;
  error?: string;
  items: DigestItemPreview[];
};

export const dailyDigests: DailyDigest[] = [
  {
    date: "2026-07-06",
    weekday: "周一",
    generatedAt: "08:04",
    duration: "4 分 18 秒",
    status: "success",
    statusLabel: "生成成功",
    selectedCount: 16,
    candidateCount: 128,
    failedCount: 0,
    summary: "今日重点集中在智能体安全、开源模型路由和开发者工具协议更新。",
    items: [
      {
        id: "frontier-agent-safety",
        rank: 1,
        title: "Frontier Labs 发布智能体安全评估框架，覆盖工具调用和长期任务",
        source: "OpenAI Blog",
        sourceType: "Blog",
        publishedAt: "2026-07-06 06:30",
        interpretation:
          "框架把智能体风险拆成工具权限、任务持续时间和外部系统影响三层，适合作为内部评测清单的参考。",
        signals: "官方博客发布，HN 312 分，Reddit 86 条评论",
        originalUrl: "https://example.com/frontier-agent-safety",
      },
      {
        id: "open-model-routing",
        rank: 2,
        title: "多家云厂商开始公开模型路由策略，成本和延迟成为默认指标",
        source: "Hacker News",
        sourceType: "HN",
        publishedAt: "2026-07-06 05:42",
        interpretation:
          "模型路由从实验功能进入工程默认层，后续平台会更强调可观测性、回退策略和成本预算。",
        signals: "HN 428 分，34 个补充来源，GitHub 讨论升温",
        originalUrl: "https://example.com/open-model-routing",
      },
      {
        id: "developer-tooling-protocol",
        rank: 3,
        title: "主流 IDE 插件更新上下文协议，开始限制敏感文件默认读取",
        source: "GitHub Releases",
        sourceType: "RSS",
        publishedAt: "2026-07-05 23:18",
        interpretation:
          "开发者工具正在把隐私边界前置到默认配置，团队内部接入时需要同步检查仓库级排除规则。",
        signals: "Release notes，相关 issue 54 条，开发者社区二次传播",
        originalUrl: "https://example.com/developer-tooling-protocol",
      },
    ],
  },
  {
    date: "2026-07-05",
    weekday: "周日",
    generatedAt: "08:02",
    duration: "3 分 41 秒",
    status: "success",
    statusLabel: "生成成功",
    selectedCount: 13,
    candidateCount: 96,
    failedCount: 0,
    summary: "社区讨论偏向推理成本、模型压缩和企业知识库召回质量。",
    items: [
      {
        id: "retrieval-quality-audit",
        rank: 1,
        title: "企业知识库召回评测从离线指标转向真实工单抽样",
        source: "Reddit",
        sourceType: "Reddit",
        publishedAt: "2026-07-05 03:10",
        interpretation:
          "讨论显示团队更关心失败案例定位，而不是单一命中率，这会影响 RAG 产品的验收方式。",
        signals: "Reddit 122 条评论，3 个厂商博客跟进",
        originalUrl: "https://example.com/retrieval-quality-audit",
      },
    ],
  },
  {
    date: "2026-07-04",
    weekday: "周六",
    generatedAt: "08:00",
    duration: "1 分 07 秒",
    status: "failed",
    statusLabel: "生成失败",
    selectedCount: 0,
    candidateCount: 83,
    failedCount: 1,
    summary: "候选池已生成，但排序任务没有完成。",
    error: "LLM JSON 输出缺少 candidateId，已保留候选池并等待重跑。",
    items: [],
  },
  {
    date: "2026-07-03",
    weekday: "周五",
    generatedAt: "08:00",
    duration: "进行中",
    status: "running",
    statusLabel: "生成中",
    selectedCount: 0,
    candidateCount: 71,
    failedCount: 0,
    summary: "采集完成，正在进行去重和排序。",
    items: [],
  },
  {
    date: "2026-07-02",
    weekday: "周四",
    generatedAt: "未生成",
    duration: "无",
    status: "empty",
    statusLabel: "暂无日报",
    selectedCount: 0,
    candidateCount: 0,
    failedCount: 0,
    summary: "当天没有成功写入候选内容。",
    items: [],
  },
];

export function getDigestByDate(date: string) {
  return dailyDigests.find((digest) => digest.date === date);
}

export function getLatestSuccessfulDigest() {
  return dailyDigests.find((digest) => digest.status === "success") ?? dailyDigests[0];
}
