export type InteractionMetric = {
  label: string;
  value: string;
  note: string;
};

export type RelatedSource = {
  name: string;
  type: string;
  publishedAt: string;
  note: string;
  url: string;
};

export type ItemDetail = {
  id: string;
  title: string;
  source: string;
  sourceType: string;
  sourceUrl: string;
  originalUrl: string;
  publishedAt: string;
  collectedAt: string;
  digestDate: string;
  digestRank: number;
  author: string;
  originalSummary: string;
  selectionReason: string;
  aiInterpretation: string;
  llmSignals: string[];
  interactions: InteractionMetric[];
  duplicateSources: RelatedSource[];
  supplementalSources: RelatedSource[];
  rawStatus: "ready" | "failed";
  rawStatusNote: string;
};

export const detailItems: ItemDetail[] = [
  {
    id: "frontier-agent-safety",
    title: "Frontier Labs 发布智能体安全评估框架，覆盖工具调用和长期任务",
    source: "OpenAI Blog",
    sourceType: "Blog",
    sourceUrl: "https://example.com/source/openai-blog",
    originalUrl: "https://example.com/frontier-agent-safety",
    publishedAt: "2026-07-06 06:30",
    collectedAt: "2026-07-06 07:12",
    digestDate: "2026-07-06",
    digestRank: 1,
    author: "Safety Systems Team",
    originalSummary:
      "文章介绍一套面向智能体系统的安全评估框架，重点覆盖工具调用权限、长任务执行、外部系统写入和异常回退。框架建议在上线前使用沙盒任务和真实日志样本交叉验证。",
    selectionReason:
      "该内容来自官方博客，直接影响智能体产品的上线评测流程。它把抽象安全风险拆成工程团队可执行的检查项，并且与近期社区对工具调用失控的讨论高度相关。",
    aiInterpretation:
      "这条更新值得排在首位，因为它提供了可操作的智能体安全分层方法。对内部团队而言，最直接的价值是把权限、任务时长和外部写入变成上线前的固定验收项。",
    llmSignals: [
      "官方来源优先级高",
      "多社区同步讨论",
      "对智能体产品上线流程有直接影响",
      "无投资建议或未验证事实",
    ],
    interactions: [
      { label: "HN 分数", value: "312", note: "4 小时内进入首页" },
      { label: "Reddit 评论", value: "86", note: "集中讨论工具权限" },
      { label: "引用来源", value: "12", note: "官方博客和开发者社区" },
      { label: "内部热度", value: "高", note: "适合本周评审会阅读" },
    ],
    duplicateSources: [
      {
        name: "Hacker News",
        type: "HN",
        publishedAt: "2026-07-06 06:52",
        note: "同一官方链接的社区讨论。",
        url: "https://example.com/hn-agent-safety",
      },
      {
        name: "Reddit r/LocalLLaMA",
        type: "Reddit",
        publishedAt: "2026-07-06 07:04",
        note: "围绕工具调用权限展开补充讨论。",
        url: "https://example.com/reddit-agent-safety",
      },
    ],
    supplementalSources: [
      {
        name: "Developer Tooling Weekly",
        type: "RSS",
        publishedAt: "2026-07-06 07:28",
        note: "补充了 IDE 插件接入安全检查的案例。",
        url: "https://example.com/tooling-weekly-agent-safety",
      },
    ],
    rawStatus: "ready",
    rawStatusNote: "原文摘要、正文链接和社区互动数据均已采集。",
  },
  {
    id: "open-model-routing",
    title: "多家云厂商开始公开模型路由策略，成本和延迟成为默认指标",
    source: "Hacker News",
    sourceType: "HN",
    sourceUrl: "https://example.com/source/hacker-news",
    originalUrl: "https://example.com/open-model-routing",
    publishedAt: "2026-07-06 05:42",
    collectedAt: "2026-07-06 06:05",
    digestDate: "2026-07-06",
    digestRank: 2,
    author: "community thread",
    originalSummary:
      "讨论串整理了几家云厂商近期公开的模型路由策略，包括基于延迟、成本、上下文长度和失败率的动态选择方式。",
    selectionReason:
      "模型路由正在成为平台默认能力，影响应用侧的成本控制、SLA 设计和模型供应商依赖。",
    aiInterpretation:
      "这条内容的核心价值不是某个厂商的单点功能，而是模型路由从内部优化变成可解释的产品能力。团队需要提前定义预算上限、回退链路和观测指标。",
    llmSignals: ["社区热度高", "多厂商同向变化", "与平台成本治理相关"],
    interactions: [
      { label: "HN 分数", value: "428", note: "讨论增长快" },
      { label: "评论", value: "141", note: "集中在延迟和成本" },
      { label: "补充来源", value: "34", note: "包含厂商文档" },
      { label: "内部热度", value: "中高", note: "适合平台组跟进" },
    ],
    duplicateSources: [],
    supplementalSources: [
      {
        name: "Cloud Model Notes",
        type: "Blog",
        publishedAt: "2026-07-06 05:58",
        note: "补充具体路由指标样例。",
        url: "https://example.com/cloud-routing-notes",
      },
    ],
    rawStatus: "ready",
    rawStatusNote: "原文链接和社区指标已采集，部分厂商文档待管理员确认。",
  },
  {
    id: "developer-tooling-protocol",
    title: "主流 IDE 插件更新上下文协议，开始限制敏感文件默认读取",
    source: "GitHub Releases",
    sourceType: "RSS",
    sourceUrl: "https://example.com/source/github-releases",
    originalUrl: "https://example.com/developer-tooling-protocol",
    publishedAt: "2026-07-05 23:18",
    collectedAt: "2026-07-06 00:09",
    digestDate: "2026-07-06",
    digestRank: 3,
    author: "release automation",
    originalSummary:
      "多个 IDE 插件在 release notes 中更新了上下文读取策略，默认排除密钥文件、环境变量和部分构建产物。",
    selectionReason:
      "该变化会影响团队接入 AI 编程工具时的默认安全边界，适合纳入内部开发规范。",
    aiInterpretation:
      "插件生态正在把敏感文件隔离变成默认行为。团队如果有自定义上下文注入，需要检查是否与这些默认排除策略冲突。",
    llmSignals: ["Release 来源稳定", "开发者工具相关", "安全配置影响直接"],
    interactions: [
      { label: "GitHub issue", value: "54", note: "主要是迁移问题" },
      { label: "讨论热度", value: "中", note: "开发者社区传播" },
      { label: "重复来源", value: "2", note: "同一事件多处提及" },
      { label: "内部热度", value: "中", note: "适合工具链负责人阅读" },
    ],
    duplicateSources: [
      {
        name: "IDE Plugin Changelog",
        type: "RSS",
        publishedAt: "2026-07-05 23:26",
        note: "同一版本更新的镜像订阅源。",
        url: "https://example.com/ide-plugin-changelog",
      },
    ],
    supplementalSources: [],
    rawStatus: "failed",
    rawStatusNote: "原文正文解析失败，仅保留标题、release notes 摘要和链接。",
  },
];

export function getItemDetail(id: string) {
  return detailItems.find((item) => item.id === id);
}
