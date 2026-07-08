import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
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
  topicTags: string[];
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

function topicBreakdown(items: DigestItem[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    for (const topic of item.topicTags) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      count,
      label,
      percent: items.length > 0 ? Math.round((count / items.length) * 100) : 0,
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

export function DigestHome({
  candidateCount,
  dateLabel,
  generatedAt,
  items,
  selectedCount,
  taskStatus,
}: DigestHomeProps) {
  const topics = topicBreakdown(items).slice(0, 8);

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

      <section className="my-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <div className="grid gap-3">
          <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-subtle)] sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">排序列表</h2>
              <p className="text-sm leading-6 text-[var(--muted)]">
                {selectedCount} 条精选，来自近 24 小时 {candidateCount} 条候选。
              </p>
            </div>
            <Link
              className="focus-ring inline-flex w-fit items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--accent-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              href="/digests"
            >
              历史回看
              <ArrowRight size={15} weight="bold" />
            </Link>
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

        <div className="grid gap-3 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">主题雷达</h2>
          </div>
          {topics.length > 0 ? (
            <div className="grid gap-2">
              {topics.map((topic) => (
                <Link
                  className="focus-ring grid gap-1 rounded-[var(--radius-sm)] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2 transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                  href={`/digests?topic=${encodeURIComponent(topic.label)}`}
                  key={topic.label}
                >
                  <span className="flex items-center justify-between gap-3 text-xs font-medium">
                    <span className="text-[var(--foreground)]">{topic.label}</span>
                    <span className="text-[var(--muted-strong)]">{topic.count} 条</span>
                  </span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-white">
                    <span
                      className="block h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${topic.percent}%` }}
                    />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-[var(--radius-sm)] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm leading-6 text-[var(--muted)]">
              暂无主题标签，生成带主题的每日精选后自动统计。
            </p>
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

function DigestListItem({ item }: { item: DigestItem }) {
  const signals = item.signals
    .split(/[，,、;；]/)
    .map((signal) => signal.trim())
    .filter(Boolean)
    .slice(0, 4);

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
          <span className="rounded-full border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-2.5 py-1 font-medium text-[var(--accent-strong)]">
            站内详情
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
        {item.topicTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {item.topicTags.slice(0, 4).map((topic) => (
              <Link
                className="focus-ring rounded-full border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-2 py-1 text-xs font-medium text-[var(--accent-strong)] hover:border-[var(--accent)]"
                href={`/digests?topic=${encodeURIComponent(topic)}`}
                key={`${item.id}-${topic}`}
              >
                {topic}
              </Link>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          {signals.length > 0 ? (
            signals.map((signal) => (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--muted-strong)]"
                key={`${item.id}-${signal}`}
              >
                <TrendUp size={13} weight="bold" className="text-[var(--accent)]" />
                {signal}
              </span>
            ))
          ) : (
            <span className="text-xs leading-5 text-[var(--muted)]">暂无结构化信号</span>
          )}
        </div>
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
