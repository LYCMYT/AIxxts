import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Database,
  Lightning,
  ListChecks,
  Newspaper,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";

export type DigestItem = {
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
    | "GitHub"
    | "X"
    | "Douyin"
    | "Xiaohongshu"
    | "Manual";
  publishedAt: string;
  signals: string;
  interpretation: string;
  url: string;
};

type DigestHomeProps = {
  dateLabel: string;
  generatedAt: string;
  taskStatus: string;
  candidateCount: number;
  selectedCount: number;
  lastSuccessDate: string;
  items: DigestItem[];
};

const sourceTypeLabel: Record<DigestItem["sourceType"], string> = {
  RSS: "RSS",
  Blog: "官方博客",
  HN: "Hacker News",
  Reddit: "Reddit",
  YouTube: "YouTube",
  GitHub: "GitHub",
  X: "X",
  Douyin: "抖音",
  Xiaohongshu: "小红书",
  Manual: "人工录入",
};

export function DigestHome({
  candidateCount,
  dateLabel,
  generatedAt,
  items,
  lastSuccessDate,
  selectedCount,
  taskStatus,
}: DigestHomeProps) {
  return (
    <main className="mx-auto w-full max-w-[1160px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="rounded-[var(--radius-lg)] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--muted-strong)]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-1.5">
                <CheckCircle size={15} weight="bold" className="text-[var(--accent)]" />
                {taskStatus}
              </span>
              <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-1.5">
                内部情报工作台
              </span>
            </div>
            <div className="grid gap-2">
              <h1 className="text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl">
                今日精选
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
                按影响力、社区热度、新鲜度和多源可信度排序，帮助团队快速扫读今天最值得关注的 AI 行业动态。
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3 lg:min-w-[420px]">
            <StatusField label="日期" value={dateLabel} />
            <StatusField label="生成时间" value={generatedAt} />
            <StatusField label="覆盖窗口" value="近 24 小时" />
          </dl>
        </div>
      </section>

      <section className="grid gap-3 py-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Database size={18} weight="bold" />}
          label="候选池"
          value={candidateCount.toString()}
          helper="去重后进入排序"
        />
        <MetricCard
          icon={<ListChecks size={18} weight="bold" />}
          label="精选数"
          value={selectedCount.toString()}
          helper="今日公开给团队"
        />
        <MetricCard
          icon={<Clock size={18} weight="bold" />}
          label="生成时间"
          value={generatedAt}
          helper="计划任务 08:00"
        />
        <MetricCard
          icon={<Lightning size={18} weight="bold" />}
          label="任务状态"
          value={taskStatus}
          helper="最近一次运行成功"
        />
      </section>

      <section className="grid gap-4">
        <div className="grid gap-3">
          <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-subtle)] sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">排序列表</h2>
              <p className="text-sm leading-6 text-[var(--muted)]">
                统一排序，不按来源分组。每条先进入站内中文详情，原文入口保留在详情页用于核验。
              </p>
            </div>
            <span className="text-xs font-medium text-[var(--muted-strong)]">
              最近成功生成：{lastSuccessDate}
            </span>
          </div>

          {items.length > 0 ? (
            <div className="grid gap-3">
              {items.map((item) => (
                <DigestListItem item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-5 text-sm leading-6 text-[var(--muted)] shadow-[var(--shadow-subtle)]">
              暂无可展示的精选条目，请查看任务日志或等待下一次生成。
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatusField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-subtle)]">
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 truncate font-semibold text-[var(--foreground)]">{value}</dd>
    </div>
  );
}

function MetricCard({
  helper,
  icon,
  label,
  value,
}: {
  helper: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-sm font-medium text-[var(--muted-strong)]">{label}</p>
          <p className="text-2xl font-semibold leading-none text-[var(--foreground)]">{value}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--accent-soft)] bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{helper}</p>
    </div>
  );
}

function DigestListItem({ item }: { item: DigestItem }) {
  return (
    <article className="grid gap-4 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)] transition hover:border-[var(--line)] hover:shadow-[var(--shadow-soft)] md:grid-cols-[42px_minmax(0,1fr)_minmax(180px,220px)]">
      <div className="flex md:block">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--surface-soft)] text-sm font-semibold text-[var(--foreground)]">
          {item.rank}
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-soft)] bg-[var(--surface-soft)] px-2.5 py-1">
            <Newspaper size={14} />
            {item.source}
          </span>
          <span className="rounded-full border border-[var(--line-soft)] px-2.5 py-1">
            {sourceTypeLabel[item.sourceType]}
          </span>
          <span className="rounded-full border border-[var(--line-soft)] px-2.5 py-1">
            {item.publishedAt}
          </span>
        </div>
        <h3 className="mt-3 break-words text-base font-semibold leading-6 text-[var(--foreground)]">
          <Link
            className="focus-ring rounded-[var(--radius-sm)] transition hover:text-[var(--accent-strong)]"
            href={`/items/${item.id}`}
          >
            {item.title}
          </Link>
        </h3>
        <p className="mt-2 break-words text-sm leading-6 text-[var(--muted-strong)] [overflow-wrap:anywhere]">
          <span className="font-semibold text-[var(--foreground)]">AI 解读：</span>
          {item.interpretation}
        </p>
      </div>

      <div className="grid content-start gap-3 rounded-[var(--radius-sm)] border border-[var(--line-soft)] bg-[var(--surface-soft)] p-3 md:border-0 md:bg-transparent md:p-0">
        <p className="flex items-start gap-2 break-words text-xs leading-5 text-[var(--muted-strong)] [overflow-wrap:anywhere]">
          <TrendUp size={15} weight="bold" className="mt-0.5 shrink-0 text-[var(--accent)]" />
          <span>{item.signals}</span>
        </p>
        <Link
          aria-label={`查看站内详情：${item.title}`}
          className="focus-ring inline-flex w-fit items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--accent-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
          href={`/items/${item.id}`}
        >
          查看详情
          <ArrowRight size={15} weight="bold" />
        </Link>
      </div>
    </article>
  );
}
