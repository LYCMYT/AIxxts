import Link from "next/link";
import {
  ArrowSquareOut,
  CalendarBlank,
  CheckCircle,
  CircleNotch,
  Clock,
  MagnifyingGlass,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import { digestArchiveStatusFilters } from "@/server/digests/queries";
import type {
  DailyDigestData,
  DigestArchiveFilters,
  DigestJobSummary,
  DigestStatusView,
} from "@/server/digests/queries";

const statusStyles: Record<DigestStatusView, string> = {
  success: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]",
  running: "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  failed: "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]",
  empty: "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--muted-strong)]",
};

const statusIcons = {
  success: CheckCircle,
  running: CircleNotch,
  failed: WarningCircle,
  empty: Clock,
};

const emptyFilters: DigestArchiveFilters = {
  q: "",
  status: "",
  topic: "",
};

const archiveStatusLabels: Record<Exclude<DigestArchiveFilters["status"], "">, string> = {
  success: "生成成功",
  failed: "生成失败",
  empty: "暂无日报",
};

function StatusBadge({ status, label }: { status: DigestStatusView; label: string }) {
  const Icon = statusIcons[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      <Icon size={14} />
      {label}
    </span>
  );
}

function HistoryFilters({ filters }: { filters: DigestArchiveFilters }) {
  const hasActiveFilters = Boolean(filters.q || filters.status || filters.topic);

  return (
    <form action="/digests" className="grid gap-3 border-t border-[var(--line-soft)] pt-4" method="get">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
          <span>关键词</span>
          <span className="relative">
            <MagnifyingGlass
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              size={16}
            />
            <input
              className="focus-ring min-h-11 w-full rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] py-2 pl-9 pr-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
              defaultValue={filters.q}
              name="q"
              placeholder="标题、摘要、条目标题或解读"
              type="search"
            />
          </span>
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
          <span>主题</span>
          <input
            className="focus-ring min-h-11 w-full rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
            defaultValue={filters.topic}
            name="topic"
            placeholder="例如 AI Agent"
            type="search"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
          <span>状态</span>
          <select
            className="focus-ring min-h-11 w-full rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--foreground)]"
            defaultValue={filters.status}
            name="status"
          >
            <option value="">全部状态</option>
            {digestArchiveStatusFilters.map((status) => (
              <option key={status} value={status}>
                {archiveStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)]"
          type="submit"
        >
          <MagnifyingGlass size={16} />
          筛选
        </button>
        {hasActiveFilters ? (
          <Link
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
            href="/digests"
          >
            <XCircle size={16} />
            清除筛选
          </Link>
        ) : null}
      </div>
    </form>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)]">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{note}</p>
    </div>
  );
}

type HistoryPageProps = {
  digests?: DailyDigestData[];
  filters?: DigestArchiveFilters;
  jobRuns?: DigestJobSummary[];
};

export function HistoryPage({ digests = [], filters = emptyFilters, jobRuns = [] }: HistoryPageProps = {}) {
  const sourceDigests = digests;
  const latest = sourceDigests.find((digest) => digest.status === "success") ?? null;
  const successCount = sourceDigests.filter((digest) => digest.status === "success").length;
  const failedCount = sourceDigests.filter((digest) => digest.status === "failed").length;
  const totalCandidates = sourceDigests.reduce((sum, digest) => sum + digest.candidateCount, 0);

  return (
    <main className="mx-auto grid w-full max-w-[1160px] gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">历史回看</h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
              按日期查看每日精选生成结果，快速定位成功、失败和等待生成的日报。
            </p>
          </div>
        </div>

        <HistoryFilters filters={filters} />

        <section className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="成功日报"
            value={`${successCount} 天`}
            note={latest ? `最近一次成功生成 ${latest.date}` : "暂无成功日报"}
          />
          <MetricCard label="失败日报" value={`${failedCount} 天`} note="失败项保留候选池，可重跑" />
          <MetricCard label="候选总量" value={`${totalCandidates}`} note="按当前列表统计" />
        </section>
      </header>

      <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="grid gap-3 self-start">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-semibold">日期列表</h2>
            <span className="text-xs text-[var(--muted)]">倒序</span>
          </div>

          <div className="grid gap-2">
            {sourceDigests.length > 0 ? (
              sourceDigests.map((digest) => (
                <article
                  className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-3 shadow-[var(--shadow-subtle)] transition hover:border-[var(--line)]"
                  key={digest.date}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CalendarBlank size={16} className="shrink-0 text-[var(--accent)]" />
                        <p className="font-semibold">{digest.date}</p>
                        <span className="text-xs text-[var(--muted)]">{digest.weekday}</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                        生成 {digest.generatedAt}，耗时 {digest.duration}
                      </p>
                    </div>
                    <StatusBadge label={digest.statusLabel} status={digest.status} />
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-soft)] px-2 py-2">
                      <dt className="text-[var(--muted)]">精选</dt>
                      <dd className="mt-1 font-semibold">{digest.selectedCount}</dd>
                    </div>
                    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-soft)] px-2 py-2">
                      <dt className="text-[var(--muted)]">候选</dt>
                      <dd className="mt-1 font-semibold">{digest.candidateCount}</dd>
                    </div>
                    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-soft)] px-2 py-2">
                      <dt className="text-[var(--muted)]">失败</dt>
                      <dd className="mt-1 font-semibold">{digest.failedCount}</dd>
                    </div>
                  </dl>

                  <div className="mt-3">
                    {digest.status === "success" ? (
                      <Link
                        aria-label={`打开 ${digest.date} 每日精选`}
                        className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--accent-soft)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--accent-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                        href={`/digests/${digest.date}`}
                      >
                        打开某日精选
                        <ArrowSquareOut size={15} />
                      </Link>
                    ) : (
                      <span className="inline-flex w-full items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-medium text-[var(--muted)]">
                        暂无可打开精选
                      </span>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--muted)] shadow-[var(--shadow-subtle)]">
                暂无日报记录。执行采集和每日精选任务后，这里会显示真实历史数据。
              </div>
            )}
          </div>
        </aside>

        <div className="grid gap-5">
          {latest ? (
            <section className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)] sm:p-5">
            <div className="flex flex-col justify-between gap-3 border-b border-[var(--line-soft)] pb-4 md:flex-row md:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={latest.statusLabel} status={latest.status} />
                  <span className="text-xs text-[var(--muted)]">{latest.date}</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold">最近成功生成概览</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  {latest.summary}
                </p>
                {latest.topicTags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {latest.topicTags.map((tag) => (
                      <Link
                        className="focus-ring rounded-full border border-[var(--line-soft)] bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent-strong)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                        href={`/digests?topic=${encodeURIComponent(tag)}`}
                        key={tag}
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
              <Link
                aria-label={`查看 ${latest.date} 完整日报`}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
                href={`/digests/${latest.date}`}
              >
                查看完整日报
                <ArrowSquareOut size={15} />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-[var(--line-soft)] overflow-hidden rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)]">
              {latest.items.map((item) => (
                <article
                  className="grid gap-3 p-4 md:grid-cols-[40px_minmax(0,1fr)_minmax(140px,180px)]"
                  key={item.id}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--surface)] text-sm font-semibold text-[var(--foreground)]">
                    {item.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                      <span>{item.source}</span>
                      <span>{item.sourceType}</span>
                      <span>{item.publishedAt}</span>
                    </div>
                    {item.topicTags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.topicTags.map((tag) => (
                          <Link
                            className="focus-ring rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-2 py-1 text-xs font-medium text-[var(--accent-strong)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                            href={`/digests?topic=${encodeURIComponent(tag)}`}
                            key={`${item.id}-${tag}`}
                          >
                            {tag}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                    <h3 className="mt-2 text-base font-semibold leading-6">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {item.interpretation}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-sm md:items-end">
                    <span className="rounded-[var(--radius-sm)] border border-[var(--line-soft)] bg-[var(--surface)] px-2.5 py-1.5 text-xs leading-5 text-[var(--muted-strong)]">
                      {item.signals}
                    </span>
                    <Link
                      aria-label={`查看详情：${item.title}`}
                      className="focus-ring inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-1.5 font-medium text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
                      href={`/items/${item.id}`}
                    >
                      查看详情
                      <ArrowSquareOut size={14} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            </section>
          ) : (
            <section className="rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-subtle)]">
              <h2 className="text-base font-semibold">暂无成功日报</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                当前数据库没有已发布的每日精选。请先运行采集和每日生成任务，或在管理后台发布草稿。
              </p>
            </section>
          )}

          {jobRuns.length > 0 ? (
            <section className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)] sm:p-5">
              <div className="flex flex-col justify-between gap-2 border-b border-[var(--line-soft)] pb-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-base font-semibold">最近任务摘要</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    来自 JobRun 的最近运行记录，用于判断日报生成和采集状态。
                  </p>
                </div>
                <span className="text-xs text-[var(--muted)]">最近 {jobRuns.length} 条</span>
              </div>

              <div className="mt-3 grid gap-2">
                {jobRuns.map((job) => (
                  <article
                    className="grid gap-3 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)] p-3 md:grid-cols-[minmax(0,1fr)_180px]"
                    key={job.id}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={job.statusLabel} status={job.status} />
                        <span className="text-xs text-[var(--muted)]">{job.finishedAt}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold">{job.name}</h3>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{job.summary}</p>
                    </div>
                    <div className="text-xs leading-5 text-[var(--muted-strong)] md:text-right">
                      {job.output}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

        </div>
      </section>
    </main>
  );
}
