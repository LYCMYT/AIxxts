import { DigestHome, type DigestItem } from "@/components/digest/digest-home";
import { getTodayPublishedDigestHome } from "@/server/digests/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const digest = await getTodayPublishedDigestHome();

  return (
    <DigestHome
      candidateCount={digest?.candidateCount ?? 186}
      dateLabel={digest?.dateLabel ?? "2026年7月6日"}
      generatedAt={digest?.generatedAt ?? "08:04"}
      items={digest?.items ?? digestItems}
      lastSuccessDate={digest?.lastSuccessDate ?? "2026年7月5日"}
      selectedCount={digest?.selectedCount ?? digestItems.length}
      taskStatus={digest?.taskStatus ?? "已生成"}
    />
  );
}

const digestItems: DigestItem[] = [
  {
    rank: 1,
    title: "OpenAI 发布面向企业工作流的新模型路由能力",
    source: "OpenAI Blog",
    sourceType: "Blog",
    publishedAt: "07:20",
    signals: "官方发布，多个开发者社区同步讨论，影响模型接入策略。",
    interpretation:
      "该能力会改变团队在成本、延迟和质量之间的调度方式，值得后续评估是否纳入内部 LLM 网关。",
    url: "https://openai.com/",
  },
  {
    rank: 2,
    title: "Anthropic 更新 Claude Code 的团队协作与审计能力",
    source: "Anthropic News",
    sourceType: "RSS",
    publishedAt: "06:45",
    signals: "官方 RSS 入库，HN 评论增长快，开发工具圈关注度高。",
    interpretation:
      "更新重点从单人编码扩展到团队治理，说明企业采购时会更关注权限、日志和代码变更可追溯性。",
    url: "https://www.anthropic.com/news",
  },
  {
    rank: 3,
    title: "Hacker News 热议浏览器自动化代理的安全边界",
    source: "Hacker News",
    sourceType: "HN",
    publishedAt: "05:58",
    signals: "HN 421 分，186 条评论，安全和代理框架话题集中。",
    interpretation:
      "讨论集中在凭据隔离、权限提示和误操作回滚，对内部自动化代理设计有直接参考价值。",
    url: "https://news.ycombinator.com/",
  },
  {
    rank: 4,
    title: "Google DeepMind 公布长上下文评测方法更新",
    source: "Google DeepMind",
    sourceType: "Blog",
    publishedAt: "04:30",
    signals: "官方博客，研究账号转发密集，评测方法可复用。",
    interpretation:
      "长上下文不再只看可输入长度，而更强调检索、抗干扰和跨段推理，适合更新内部模型评估清单。",
    url: "https://deepmind.google/discover/blog/",
  },
  {
    rank: 5,
    title: "Reddit 开发者社区集中反馈多模态 API 成本波动",
    source: "r/MachineLearning",
    sourceType: "Reddit",
    publishedAt: "03:52",
    signals: "Reddit 310 赞，92 条评论，成本案例较具体。",
    interpretation:
      "多模态工作流的账单不确定性仍是落地阻力，后续设计产品用量提示时需要展示图片、视频和推理拆分。",
    url: "https://www.reddit.com/r/MachineLearning/",
  },
  {
    rank: 6,
    title: "Meta 开源新一批语音理解模型和基准脚本",
    source: "Meta AI",
    sourceType: "RSS",
    publishedAt: "02:40",
    signals: "官方源入库，GitHub 镜像 Star 增长，语音场景相关。",
    interpretation:
      "开源权重和基准脚本降低了语音质检、会议纪要和客服分析的试验门槛，可纳入后续能力雷达。",
    url: "https://ai.meta.com/blog/",
  },
  {
    rank: 7,
    title: "YouTube 创作者发布 Agent 工作流实测，覆盖本地浏览器任务",
    source: "AI Explained",
    sourceType: "YouTube",
    publishedAt: "01:55",
    signals: "公开视频 6 小时内 8.4 万播放，评论聚焦可靠性。",
    interpretation:
      "大众视角开始从模型能力转向任务完成率，产品演示需要提供真实失败路径和人工接管设计。",
    url: "https://www.youtube.com/",
  },
  {
    rank: 8,
    title: "Mistral 发布小模型推理优化说明",
    source: "Mistral AI",
    sourceType: "Blog",
    publishedAt: "00:48",
    signals: "官方博客，欧洲 AI 社群转发，推理成本话题相关。",
    interpretation:
      "小模型优化继续压低边缘和高并发场景成本，适合关注摘要、分类和检索增强中的轻量任务替换。",
    url: "https://mistral.ai/news/",
  },
  {
    rank: 9,
    title: "手动录入：国内团队上线企业知识库 Agent 灰度版本",
    source: "人工候选",
    sourceType: "Manual",
    publishedAt: "昨天 23:10",
    signals: "客户群线索，暂未进入自动采集源，需要后续核验。",
    interpretation:
      "该动态可能反映企业知识库产品开始转向可执行 Agent，但目前证据不足，应先作为观察项处理。",
    url: "https://example.com/internal-manual-candidate",
  },
  {
    rank: 10,
    title: "开源社区讨论 RAG 评测从离线指标转向任务成功率",
    source: "GitHub Discussions",
    sourceType: "RSS",
    publishedAt: "昨天 22:36",
    signals: "多项目讨论串相互引用，维护者参与，工程实践价值较高。",
    interpretation:
      "评测重点从答案相似度转向真实任务闭环，说明内部知识库验收也应增加端到端任务样例。",
    url: "https://github.com/",
  },
];
