import Link from "next/link";
import {
  ArrowSquareOut,
  CalendarBlank,
  ChartBar,
  CheckCircle,
  FileText,
  LinkSimple,
  ListChecks,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { ItemDetailData } from "@/server/digests/queries";

type RelatedSource = ItemDetailData["duplicateSources"][number];

function DetailMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--line-soft)] bg-[var(--surface-soft)] p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold leading-none">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{note}</p>
    </div>
  );
}

function RelatedSourceList({ sources, emptyText }: { sources: RelatedSource[]; emptyText: string }) {
  if (sources.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-3 text-sm leading-6 text-[var(--muted)]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {sources.map((source) => (
        <a
          aria-label={`打开补充来源：${source.name}`}
          className="focus-ring grid gap-1 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)] p-3 transition hover:border-[var(--accent)] hover:bg-[var(--surface)]"
          href={source.url}
          key={`${source.name}-${source.publishedAt}`}
          rel="noreferrer"
          target="_blank"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="font-medium">{source.name}</span>
            <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--muted-strong)]">
              {source.type}
            </span>
          </span>
          <span className="text-xs text-[var(--muted)]">{source.publishedAt}</span>
          <span className="break-words text-sm leading-6 text-[var(--muted-strong)] [overflow-wrap:anywhere]">
            {source.note}
          </span>
        </a>
      ))}
    </div>
  );
}

function EmptyItemState({ itemId }: { itemId: string }) {
  return (
    <main className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Link
        className="focus-ring inline-flex w-fit items-center gap-2 rounded-full px-2 py-1 text-sm font-medium text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
        href="/digests"
      >
        <CalendarBlank size={16} />
        返回历史回看
      </Link>
      <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-subtle)]">
        <FileText size={26} className="text-[var(--muted)]" />
        <h1 className="mt-3 text-2xl font-semibold">未找到内容详情</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          数据库中没有 ID 为 {itemId} 的条目。请返回历史页查看已生成日报，或先执行采集和每日精选任务。
        </p>
      </section>
    </main>
  );
}

function MetadataPanel({ item }: { item: ItemDetailData }) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)]">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <ListChecks size={18} className="text-[var(--accent)]" />
        元数据
      </h2>
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-[var(--line-soft)] pb-3">
          <dt className="text-[var(--muted)]">来源</dt>
          <dd className="text-right font-medium">{item.source}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-[var(--line-soft)] pb-3">
          <dt className="text-[var(--muted)]">来源类型</dt>
          <dd className="text-right font-medium">{item.sourceType}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-[var(--line-soft)] pb-3">
          <dt className="text-[var(--muted)]">发布时间</dt>
          <dd className="text-right font-medium">{item.publishedAt}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-[var(--line-soft)] pb-3">
          <dt className="text-[var(--muted)]">采集时间</dt>
          <dd className="text-right font-medium">{item.collectedAt}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--muted)]">所属日报</dt>
          <dd className="text-right font-medium">
            {item.digestRank > 0 ? (
              <Link className="text-[var(--accent-strong)]" href={`/digests/${item.digestDate}`}>
                {item.digestDate} 第 {item.digestRank} 条
              </Link>
            ) : (
              <span>{item.digestDate}</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function ItemDetailPage({
  itemId,
  item,
}: {
  itemId: string;
  item?: ItemDetailData | null;
}) {
  if (!item) {
    return <EmptyItemState itemId={itemId} />;
  }

  return (
    <main className="mx-auto grid w-full max-w-[1160px] gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            className="focus-ring inline-flex items-center gap-2 rounded-full px-2 py-1 font-medium text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
            href="/digests"
          >
            <CalendarBlank size={16} />
            历史回看
          </Link>
          <span className="text-[var(--muted)]">/</span>
          {item.digestRank > 0 ? (
            <>
              <Link
                className="focus-ring rounded-full px-2 py-1 font-medium text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
                href={`/digests/${item.digestDate}`}
              >
                {item.digestDate}
              </Link>
              <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--muted-strong)] shadow-[var(--shadow-subtle)]">
                第 {item.digestRank} 条
              </span>
            </>
          ) : (
            <span className="font-medium text-[var(--muted-strong)]">{item.digestDate}</span>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 font-medium text-[var(--accent-strong)]">
                {item.sourceType}
              </span>
              <span>{item.source}</span>
              <span>{item.author}</span>
            </div>
            <h1 className="break-words text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">
              {item.title}
            </h1>
            <p className="max-w-3xl break-words text-sm leading-6 text-[var(--muted)] [overflow-wrap:anywhere]">
              {item.originalSummary}
            </p>
          </div>

          <div className="grid gap-2">
            <a
              aria-label={`打开原文：${item.title}`}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white shadow-[var(--shadow-subtle)] transition hover:bg-[var(--accent-strong)]"
              href={item.originalUrl}
              rel="noreferrer"
              target="_blank"
            >
              打开原文
              <ArrowSquareOut size={15} />
            </a>
            <a
              aria-label={`查看来源主页：${item.source}`}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
              href={item.sourceUrl}
              rel="noreferrer"
              target="_blank"
            >
              查看来源
              <LinkSimple size={15} />
            </a>
          </div>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-5">
          <section className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow-subtle)]">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <CheckCircle size={18} className="text-[var(--accent)]" />
              入选原因
            </h2>
            <p className="mt-3 break-words text-sm leading-7 text-[var(--muted-strong)] [overflow-wrap:anywhere]">
              {item.selectionReason}
            </p>
          </section>

          <section className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow-subtle)]">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ChartBar size={18} className="text-[var(--accent)]" />
              AI 解读
            </h2>
            <p className="mt-3 break-words text-sm leading-7 text-[var(--muted-strong)] [overflow-wrap:anywhere]">
              {item.aiInterpretation}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.llmSignals.map((signal) => (
                <span
                  className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-soft)] px-2.5 py-1 text-xs text-[var(--muted-strong)]"
                  key={signal}
                >
                  {signal}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow-subtle)]">
            <h2 className="text-base font-semibold">重复来源 / 补充来源</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <h3 className="text-sm font-semibold">重复来源</h3>
                <RelatedSourceList
                  emptyText="当前条目没有检测到重复报道，保留主来源作为唯一证据。"
                  sources={item.duplicateSources}
                />
              </div>
              <div className="grid gap-2">
                <h3 className="text-sm font-semibold">补充来源</h3>
                <RelatedSourceList
                  emptyText="暂无补充来源，后续采集任务可继续追加。"
                  sources={item.supplementalSources}
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="grid gap-5 self-start">
          <MetadataPanel item={item} />

          <section className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)]">
            <h2 className="text-base font-semibold">互动数据</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {item.interactions.map((metric) => (
                <DetailMetric
                  key={metric.label}
                  label={metric.label}
                  note={metric.note}
                  value={metric.value}
                />
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)]">
            <h2 className="text-base font-semibold">原文操作</h2>
            <div className="mt-4 grid gap-2">
              <a
                aria-label={`打开原文：${item.title}`}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white shadow-[var(--shadow-subtle)] transition hover:bg-[var(--accent-strong)]"
                href={item.originalUrl}
                rel="noreferrer"
                target="_blank"
              >
                打开原文
                <ArrowSquareOut size={15} />
              </a>
              <a
                aria-label={`打开来源主页：${item.source}`}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
                href={item.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                打开来源主页
                <LinkSimple size={15} />
              </a>
            </div>
          </section>

          <section
            className={`rounded-[var(--radius)] border p-4 shadow-[var(--shadow-subtle)] ${
              item.rawStatus === "ready"
                ? "border-[var(--success-soft)] bg-[var(--surface)]"
                : "border-[var(--danger-soft)] bg-[var(--surface)]"
            }`}
          >
            {item.rawStatus === "ready" ? (
              <CheckCircle size={20} className="text-[var(--success)]" />
            ) : (
              <WarningCircle size={20} className="text-[var(--danger)]" />
            )}
            <h2 className="mt-2 text-base font-semibold">
              {item.rawStatus === "ready" ? "原文采集成功" : "原文解析失败"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.rawStatusNote}</p>
          </section>
        </aside>
      </section>

    </main>
  );
}
