import Link from "next/link";
import {
  ArrowSquareOut,
  CalendarBlank,
  CheckCircle,
  Clock,
  FileText,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { DailyDigestData, DigestStatusView } from "@/server/digests/queries";

const statusStyles: Record<DigestStatusView, string> = {
  success: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]",
  running: "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  failed: "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]",
  empty: "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--muted-strong)]",
};

function StatusBadge({ status, label }: { status: DigestStatusView; label: string }) {
  const Icon = status === "failed" ? WarningCircle : status === "success" ? CheckCircle : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      <Icon size={14} />
      {label}
    </span>
  );
}

function createEmptyDigest(date: string): DailyDigestData {
  return {
    date,
    weekday: "",
    generatedAt: "未生成",
    duration: "无",
    status: "empty",
    statusLabel: "暂无日报",
    selectedCount: 0,
    candidateCount: 0,
    failedCount: 0,
    summary: "当前日期没有可展示的日报数据。",
    items: [],
  };
}

export function DigestDayPage({
  date,
  digest: databaseDigest,
}: {
  date: string;
  digest?: DailyDigestData | null;
}) {
  const digest = databaseDigest ?? createEmptyDigest(date);

  return (
    <main className="mx-auto grid w-full max-w-[1160px] gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
        <Link
          className="focus-ring inline-flex w-fit items-center gap-2 rounded-full px-2 py-1 text-sm font-medium text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
          href="/digests"
        >
          <CalendarBlank size={16} />
          返回历史回看
        </Link>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={digest.statusLabel} status={digest.status} />
            </div>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              {digest.date} 每日精选
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{digest.summary}</p>
          </div>

          <dl className="grid grid-cols-3 gap-2 text-sm sm:w-[360px]">
            <div className="rounded-[var(--radius-sm)] border border-[var(--line-soft)] bg-[var(--surface)] p-3 shadow-[var(--shadow-subtle)]">
              <dt className="text-xs text-[var(--muted)]">精选</dt>
              <dd className="mt-1 text-xl font-semibold">{digest.selectedCount}</dd>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--line-soft)] bg-[var(--surface)] p-3 shadow-[var(--shadow-subtle)]">
              <dt className="text-xs text-[var(--muted)]">候选</dt>
              <dd className="mt-1 text-xl font-semibold">{digest.candidateCount}</dd>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--line-soft)] bg-[var(--surface)] p-3 shadow-[var(--shadow-subtle)]">
              <dt className="text-xs text-[var(--muted)]">失败</dt>
              <dd className="mt-1 text-xl font-semibold">{digest.failedCount}</dd>
            </div>
          </dl>
        </div>
      </header>

      {digest.status === "success" && digest.items.length > 0 ? (
        <section className="grid gap-3">
          {digest.items.map((item) => (
            <article
              className="grid gap-4 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)] transition hover:border-[var(--line)] md:grid-cols-[44px_minmax(0,1fr)_minmax(140px,180px)]"
              key={item.id}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--surface-soft)] text-sm font-semibold text-[var(--foreground)]">
                {item.rank}
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                  <span>{item.source}</span>
                  <span>{item.sourceType}</span>
                  <span>{item.publishedAt}</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold leading-7">{item.title}</h2>
                <p className="mt-2 break-words text-sm leading-6 text-[var(--muted)] [overflow-wrap:anywhere]">
                  {item.interpretation}
                </p>
                <p className="mt-3 break-words rounded-[var(--radius-sm)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-medium leading-5 text-[var(--muted-strong)] [overflow-wrap:anywhere]">
                  热度信号：{item.signals}
                </p>
              </div>

              <div className="flex flex-col gap-2 md:items-end">
                <Link
                  aria-label={`查看详情：${item.title}`}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-[var(--accent-soft)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--accent-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                  href={`/items/${item.id}`}
                >
                  查看详情
                  <ArrowSquareOut size={15} />
                </Link>
                <a
                  aria-label={`打开原文：${item.title}`}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
                  href={item.originalUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  打开原文
                  <ArrowSquareOut size={15} />
                </a>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-6 shadow-[var(--shadow-subtle)]">
          {digest.status === "failed" ? (
            <>
              <WarningCircle size={26} className="text-[var(--danger)]" />
              <h2 className="mt-3 text-lg font-semibold">生成失败</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                {digest.error ?? "任务没有返回可展示结果，请查看任务日志后重跑。"}
              </p>
            </>
          ) : (
            <>
              <FileText size={26} className="text-[var(--muted)]" />
              <h2 className="mt-3 text-lg font-semibold">暂无精选内容</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                当前日期没有可展示的精选条目，页面保留状态和候选统计，避免用户进入空白页。
              </p>
            </>
          )}
        </section>
      )}
    </main>
  );
}
