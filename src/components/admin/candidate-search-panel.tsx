import type { AdminDashboardData } from "@/server/admin/queries";

type CandidateSearchPanelProps = {
  candidates: AdminDashboardData["candidates"];
  filters: AdminDashboardData["candidateFilters"];
  options: AdminDashboardData["candidateFilterOptions"];
  pagination: AdminDashboardData["candidatePagination"];
};

type BadgeTone = AdminDashboardData["candidates"][number]["selectedStatus"]["tone"];

const inputClass =
  "w-full rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--foreground)] transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]";

const badgeToneClass: Record<BadgeTone, string> = {
  accent: "border-transparent bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  danger: "border-transparent bg-[var(--danger-soft)] text-[var(--danger)]",
  muted: "border-[var(--line-soft)] bg-[var(--surface)] text-[var(--muted-strong)]",
  success: "border-transparent bg-[var(--success-soft)] text-[var(--success)]",
  warning: "border-transparent bg-[var(--warning-soft)] text-[var(--warning)]",
};

function CandidateField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
      <span>{label}</span>
      {children}
    </label>
  );
}

function CandidateBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-[14px] border px-2.5 py-1 text-xs font-semibold leading-none ${badgeToneClass[tone]}`}
    >
      {label}
    </span>
  );
}

function candidateListHref(filters: CandidateSearchPanelProps["filters"], page: number) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("candidateQ", filters.q);
  }

  if (filters.sourceId) {
    params.set("candidateSourceId", filters.sourceId);
  }

  if (filters.topic) {
    params.set("candidateTopic", filters.topic);
  }

  if (filters.selected) {
    params.set("candidateSelected", filters.selected);
  }

  if (page > 1) {
    params.set("candidatePage", String(page));
  }

  const query = params.toString();

  return query ? `/admin?${query}#candidates` : "/admin#candidates";
}

function CandidatePaginationLink({
  children,
  disabled,
  href,
}: {
  children: React.ReactNode;
  disabled: boolean;
  href: string;
}) {
  return (
    <a
      aria-disabled={disabled}
      className={`focus-ring inline-flex min-h-9 items-center justify-center rounded-[var(--radius)] border px-3 text-sm font-semibold transition ${
        disabled
          ? "pointer-events-none border-[var(--line-soft)] bg-[var(--surface-soft)] text-[var(--muted)]"
          : "border-[var(--line-soft)] bg-[var(--surface)] text-[var(--muted-strong)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
      }`}
      href={href}
    >
      {children}
    </a>
  );
}

export function CandidateSearchPanel({
  candidates,
  filters,
  options,
  pagination,
}: CandidateSearchPanelProps) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">候选检索</h3>
          <p className="text-xs leading-5 text-[var(--muted)]">
            共 {pagination.totalCount} 条候选，当前第 {pagination.page} / {pagination.totalPages} 页。
          </p>
        </div>
      </div>

      <form
        action="/admin#candidates"
        className="grid gap-3 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)] p-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto_auto]"
        method="get"
      >
        <CandidateField label="关键词">
          <input
            className={inputClass}
            defaultValue={filters.q}
            name="candidateQ"
            placeholder="标题、摘要或中文翻译"
            type="search"
          />
        </CandidateField>
        <CandidateField label="来源">
          <select className={inputClass} defaultValue={filters.sourceId} name="candidateSourceId">
            <option value="">全部来源</option>
            {options.sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </CandidateField>
        <CandidateField label="主题">
          <select className={inputClass} defaultValue={filters.topic} name="candidateTopic">
            <option value="">全部主题</option>
            {options.topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </CandidateField>
        <CandidateField label="入选状态">
          <select className={inputClass} defaultValue={filters.selected} name="candidateSelected">
            <option value="">全部候选</option>
            <option value="selected">已入选日报</option>
            <option value="unselected">未入选日报</option>
          </select>
        </CandidateField>
        <div className="flex items-end">
          <button
            className="focus-ring inline-flex min-h-10 w-full items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-subtle)] transition hover:bg-[var(--accent-strong)] active:translate-y-px"
            type="submit"
          >
            筛选
          </button>
        </div>
        <div className="flex items-end">
          <a
            className="focus-ring inline-flex min-h-10 w-full items-center justify-center rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-[var(--muted-strong)] shadow-[var(--shadow-subtle)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
            href="/admin#candidates"
          >
            清除
          </a>
        </div>
      </form>

      <div className="-mx-4 max-w-[calc(100%+2rem)] overflow-x-auto px-4 sm:mx-0 sm:max-w-full sm:px-0">
        <div className="min-w-full overflow-hidden rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)]">
          <table className="min-w-[980px] w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="whitespace-nowrap border-b border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3 text-left text-xs font-semibold text-[var(--muted-strong)]">
                  候选内容
                </th>
                <th className="whitespace-nowrap border-b border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3 text-left text-xs font-semibold text-[var(--muted-strong)]">
                  来源
                </th>
                <th className="whitespace-nowrap border-b border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3 text-left text-xs font-semibold text-[var(--muted-strong)]">
                  主题
                </th>
                <th className="whitespace-nowrap border-b border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3 text-left text-xs font-semibold text-[var(--muted-strong)]">
                  入选状态
                </th>
                <th className="whitespace-nowrap border-b border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3 text-left text-xs font-semibold text-[var(--muted-strong)]">
                  发布时间
                </th>
                <th className="whitespace-nowrap border-b border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3 text-left text-xs font-semibold text-[var(--muted-strong)]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {candidates.length > 0 ? (
                candidates.map((candidate) => (
                  <tr className="transition hover:bg-[var(--surface-soft)] last:[&_td]:border-b-0" key={candidate.id}>
                    <td className="border-b border-[var(--line-soft)] px-3.5 py-3.5 align-middle text-sm">
                      <div className="grid gap-1">
                        <a
                          className="focus-ring rounded-[var(--radius-sm)] font-semibold text-[var(--foreground)] transition hover:text-[var(--accent-strong)]"
                          href={candidate.detailHref}
                        >
                          {candidate.title}
                        </a>
                        <span className="text-xs text-[var(--muted)]">{candidate.candidateStatus}</span>
                      </div>
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-3.5 py-3.5 align-middle text-sm text-[var(--muted-strong)]">
                      <div className="grid gap-1">
                        <span className="font-medium text-[var(--foreground)]">{candidate.source}</span>
                        <span className="text-xs text-[var(--muted)]">{candidate.sourceType}</span>
                      </div>
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-3.5 py-3.5 align-middle text-sm text-[var(--muted-strong)]">
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.topicTags.length > 0 ? (
                          candidate.topicTags.map((topic) => (
                            <a
                              className="focus-ring inline-flex rounded-[14px] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
                              href={candidateListHref({ ...filters, topic }, 1)}
                              key={topic}
                            >
                              {topic}
                            </a>
                          ))
                        ) : (
                          <span className="text-xs text-[var(--muted)]">未标注</span>
                        )}
                      </div>
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-3.5 py-3.5 align-middle text-sm text-[var(--muted-strong)]">
                      <CandidateBadge
                        label={candidate.selectedStatus.label}
                        tone={candidate.selectedStatus.tone}
                      />
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-3.5 py-3.5 align-middle text-sm text-[var(--muted-strong)]">
                      <div className="grid gap-1">
                        <span>{candidate.publishedAt}</span>
                        <span className="text-xs text-[var(--muted)]">采集 {candidate.collectedAt}</span>
                      </div>
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-3.5 py-3.5 align-middle text-sm">
                      <a
                        className="focus-ring inline-flex min-h-9 items-center justify-center rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
                        href={candidate.detailHref}
                      >
                        查看详情
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="border-b border-[var(--line-soft)] px-3.5 py-6 text-center text-sm text-[var(--muted)]"
                    colSpan={6}
                  >
                    暂无符合条件的候选内容。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <nav aria-label="候选检索分页" className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--muted)]">
          显示 {candidates.length} 条，共 {pagination.totalCount} 条
        </p>
        <div className="flex gap-2">
          <CandidatePaginationLink
            disabled={!pagination.hasPreviousPage}
            href={candidateListHref(filters, Math.max(1, pagination.page - 1))}
          >
            上一页
          </CandidatePaginationLink>
          <CandidatePaginationLink
            disabled={!pagination.hasNextPage}
            href={candidateListHref(filters, pagination.page + 1)}
          >
            下一页
          </CandidatePaginationLink>
        </div>
      </nav>
    </div>
  );
}
