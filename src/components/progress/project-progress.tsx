import {
  ArrowRight,
  CheckCircle,
  ClockClockwise,
  Database,
  ListChecks,
  PlayCircle,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { AdminDashboardData } from "@/server/admin/queries";
import type { DigestArchiveData } from "@/server/digests/queries";

type ProgressStatus = "done" | "active" | "next" | "risk";

type ProgressItem = {
  title: string;
  description: string;
  status: ProgressStatus;
};

type ProjectProgressProps = {
  adminData: AdminDashboardData | null;
  archive: DigestArchiveData;
};

const statusClass: Record<ProgressStatus, string> = {
  done: "border-transparent bg-[var(--success-soft)] text-[var(--success)]",
  active: "border-transparent bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  next: "border-[var(--line-soft)] bg-[var(--surface)] text-[var(--muted-strong)]",
  risk: "border-transparent bg-[var(--warning-soft)] text-[var(--warning)]",
};

const statusLabel: Record<ProgressStatus, string> = {
  done: "已完成",
  active: "进行中",
  next: "下一步",
  risk: "待确认",
};

const completedItems: ProgressItem[] = [
  {
    title: "PRD 拆解和技术栈基线",
    description: "已确定 Next.js App Router、TypeScript、Tailwind CSS、Prisma、SQLite、pnpm、Caddy 自托管路线。",
    status: "done",
  },
  {
    title: "数据模型和本地数据库",
    description: "已落地 Source、CandidateItem、DailyDigest、DigestItem、LlmRun、JobRun 等核心表和迁移。",
    status: "done",
  },
  {
    title: "RSS / 社区采集闭环",
    description: "已接入 RSS、官方博客、Hacker News、Reddit、YouTube source 配置和采集任务。",
    status: "done",
  },
  {
    title: "每日精选生成",
    description: "已实现每日任务入口；未配置 LLM key 时只对真实候选池做规则排序，不注入演示内容。",
    status: "done",
  },
  {
    title: "前端工作台",
    description: "已完成今日精选、历史回看、条目详情、管理后台和开发进度页面。",
    status: "done",
  },
  {
    title: "发布和后台动作闭环",
    description: "已完成草稿发布、手动候选录入、来源启停和任务触发入口，首页只读取已发布日报或真实空状态。",
    status: "done",
  },
  {
    title: "登录取消",
    description: "当前阶段已取消页面和 API 登录拦截，保留 auth 基础代码以便未来恢复。",
    status: "done",
  },
  {
    title: "真实密钥和定时任务",
    description:
      "LLM key 已接入 DeepSeek；YouTube 无 key 时走频道 RSS 真实视频。Windows 计划任务已注册：采集每 30 分钟一次，每日精选 08:00 生成。",
    status: "done",
  },
  {
    title: "默认数据源池扩展",
    description:
      "已补充 MIT Technology Review、VentureBeat AI，以及 vLLM、Transformers、LangChain、llama.cpp 的 GitHub release Atom 信号。",
    status: "done",
  },
  {
    title: "source 新增和编辑",
    description:
      "管理后台已支持新增和编辑自动采集来源，可维护名称、类型、URL、间隔、启用状态和 JSON config。",
    status: "done",
  },
  {
    title: "GitHub REST collector",
    description:
      "已接入 GitHub REST repository search / releases，支持 star、fork、release 下载数和限流错误信息，GITHUB_TOKEN 可选。",
    status: "done",
  },
];

const nextItems: ProgressItem[] = [
  {
    title: "管理后台动作落地",
    description: "新增、编辑、启停、重跑、全量采集、每日精选、发布草稿和手动候选已接入；下一步补删除、批量操作和确认弹窗。",
    status: "next",
  },
  {
    title: "Phase 2 平台决策",
    description: "X 需要预算上限；抖音和小红书需要选择人工整理还是付费数据服务。",
    status: "risk",
  },
];

const commandItems = [
  {
    command: "pnpm dev",
    note: "启动本地网页，使用 Next.js 开发服务器。",
  },
  {
    command: "pnpm seed:sources",
    note: "写入或更新默认数据源。",
  },
  {
    command: "pnpm job:collect",
    note: "运行一轮候选内容采集。",
  },
  {
    command: "pnpm job:daily",
    note: "生成当天每日精选草稿。",
  },
];

function StatusPill({ status }: { status: ProgressStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-[14px] border px-2.5 py-1 text-xs font-semibold ${statusClass[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Database;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-subtle)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <Icon size={17} weight="bold" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
    </div>
  );
}

function ProgressList({ items }: { items: ProgressItem[] }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line-soft)] bg-[var(--surface)] shadow-[var(--shadow-subtle)]">
      {items.map((item) => (
        <div
          className="grid gap-3 border-b border-[var(--line-soft)] p-4 transition last:border-b-0 hover:bg-[var(--surface-soft)] sm:grid-cols-[1fr_auto] sm:items-start"
          key={item.title}
        >
          <div className="grid min-w-0 gap-1">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{item.title}</h3>
            <p className="text-sm leading-6 text-[var(--muted)]">{item.description}</p>
          </div>
          <StatusPill status={item.status} />
        </div>
      ))}
    </div>
  );
}

function latestDigestLabel(archive: DigestArchiveData) {
  const latest = archive.digests[0];

  if (!latest) {
    return "暂无";
  }

  return `${latest.date}，${latest.selectedCount} 条`;
}

function latestJobLabel(archive: DigestArchiveData) {
  const latest = archive.jobRuns[0];

  if (!latest) {
    return "暂无";
  }

  return `${latest.statusLabel}，${latest.finishedAt}`;
}

export function ProjectProgress({ adminData, archive }: ProjectProgressProps) {
  const summary = adminData?.summary;
  const enabledSources = summary ? `${summary.enabledSources} / ${summary.totalSources}` : "暂无";
  const todayCandidates = summary ? `${summary.todayCandidates} 条` : "暂无";
  const pendingErrors = summary ? `${summary.pendingErrors} 条` : "暂无";

  return (
    <main className="min-h-[100dvh] bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
      <header className="rounded-[var(--radius-lg)] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid min-w-0 gap-2">
            <p className="text-sm font-medium text-[var(--accent-strong)]">开发进度</p>
            <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
              当前做了什么，下一步做什么
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
              这个页面用于把开发状态放到产品里直接查看。当前版本取消登录拦截，团队打开网页即可看到 MVP 的运行状态和下一批工作。
            </p>
          </div>
          <a
            aria-label="查看管理后台"
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-subtle)] transition hover:bg-[var(--accent-strong)] active:translate-y-px"
            href="/admin"
          >
            查看管理后台
            <ArrowRight size={16} weight="bold" />
          </a>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="当前运行指标">
        <Metric icon={Database} label="启用数据源" value={enabledSources} />
        <Metric icon={ListChecks} label="24 小时候选" value={todayCandidates} />
        <Metric icon={CheckCircle} label="最近日报" value={latestDigestLabel(archive)} />
        <Metric icon={WarningCircle} label="历史失败任务" value={pendingErrors} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="text-base font-semibold">已完成</h2>
            <span className="rounded-[var(--radius-sm)] border border-[var(--line-soft)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--muted-strong)]">
              {completedItems.length} 项
            </span>
          </div>
          <ProgressList items={completedItems} />
        </div>

        <div className="grid content-start gap-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="text-base font-semibold">下一步</h2>
            <span className="rounded-[var(--radius-sm)] border border-[var(--line-soft)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--muted-strong)]">
              {nextItems.length} 项
            </span>
          </div>
          <ProgressList items={nextItems} />
        </div>
      </section>

      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid min-w-0 gap-1">
            <h2 className="text-base font-semibold">开发运行方式</h2>
            <p className="text-sm leading-6 text-[var(--muted)]">
              这些命令已经写入 package scripts。当前最新任务状态：{latestJobLabel(archive)}。
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-[var(--radius-sm)] border border-transparent bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-strong)]">
            <ClockClockwise size={14} weight="bold" />
            本地开发可用
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {commandItems.map((item) => (
            <div
              className="grid gap-1 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)] p-3"
              key={item.command}
            >
              <code className="text-sm font-semibold text-[var(--foreground)]">{item.command}</code>
              <p className="text-sm leading-6 text-[var(--muted)]">{item.note}</p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-[var(--radius)] border border-transparent bg-[var(--warning-soft)] p-3 text-sm leading-6 text-[var(--warning)]">
          <PlayCircle className="mt-1 shrink-0" size={17} weight="bold" />
          <p>
            下一次开发优先扩展默认数据源池和管理后台动作，这样团队可以在不改代码的情况下持续提高候选覆盖面。
          </p>
        </div>
      </section>
      </div>
    </main>
  );
}
