"use client";

import { useMemo, useState } from "react";
import type { AdminDashboardData } from "@/server/admin/queries";

type CandidateSearchPanelProps = {
  candidates: AdminDashboardData["candidates"];
  filters: AdminDashboardData["candidateFilters"];
  options: AdminDashboardData["candidateFilterOptions"];
  pagination: AdminDashboardData["candidatePagination"];
};

type BadgeTone = AdminDashboardData["candidates"][number]["selectedStatus"]["tone"];
type CandidateStatusAction = "archive" | "reject" | "restore";
type CandidateActionState = {
  message: string;
  tone: "idle" | "running" | "success" | "error";
};

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

  if (filters.status) {
    params.set("candidateStatus", filters.status);
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

async function parseCandidateActionResponse(response: Response) {
  const body = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error?: unknown }).error)
        : `请求失败：${response.status}`;

    throw new Error(message);
  }

  return body as { updatedCount?: unknown };
}

export function CandidateSearchPanel({
  candidates,
  filters,
  options,
  pagination,
}: CandidateSearchPanelProps) {
  const candidateIds = useMemo(() => candidates.map((candidate) => candidate.id), [candidates]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionState, setActionState] = useState<CandidateActionState>({
    message: "",
    tone: "idle",
  });
  const running = actionState.tone === "running";
  const selectedIdSet = new Set(selectedIds);
  const allSelected =
    candidateIds.length > 0 && candidateIds.every((candidateId) => selectedIdSet.has(candidateId));

  function toggleCandidate(candidateId: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, candidateId]));
      }

      return current.filter((id) => id !== candidateId);
    });
  }

  function togglePage(checked: boolean) {
    setSelectedIds(checked ? candidateIds : []);
  }

  async function updateCandidateStatus(action: CandidateStatusAction) {
    if (selectedIds.length === 0) {
      setActionState({
        message: "请先选择候选内容。",
        tone: "error",
      });

      return;
    }

    setActionState({
      message: "正在更新候选状态...",
      tone: "running",
    });

    try {
      const result = await parseCandidateActionResponse(
        await fetch("/api/admin/candidates/status", {
          body: JSON.stringify({
            action,
            candidateIds: selectedIds,
          }),
          headers: {
            "content-type": "application/json",
          },
          method: "PATCH",
        }),
      );
      const updatedCount =
        typeof result.updatedCount === "number" ? result.updatedCount : selectedIds.length;

      setActionState({
        message: `已更新 ${updatedCount} 条候选。`,
        tone: "success",
      });
      setSelectedIds([]);

      if (typeof window !== "undefined") {
        window.setTimeout(() => window.location.reload(), 500);
      }
    } catch (error) {
      setActionState({
        message: error instanceof Error ? error.message : "候选状态更新失败。",
        tone: "error",
      });
    }
  }

  return (
    <div
      className="grid gap-4"
      data-candidate-status-endpoint="/api/admin/candidates/status"
    >
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
        className="grid gap-3 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)] p-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto_auto]"
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
        <CandidateField label="处理状态">
          <select className={inputClass} defaultValue={filters.status} name="candidateStatus">
            <option value="">全部状态</option>
            {options.statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
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

      <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">批量处理</p>
          <p className="text-xs leading-5 text-[var(--muted)]">
            已选择 {selectedIds.length} 条。归档和拒绝会阻止候选进入后续每日精选，恢复会改回待处理。
          </p>
          {actionState.message ? (
            <p
              aria-live="polite"
              className={`text-xs leading-5 ${
                actionState.tone === "error"
                  ? "text-[var(--danger)]"
                  : actionState.tone === "success"
                    ? "text-[var(--success)]"
                    : "text-[var(--muted)]"
              }`}
            >
              {actionState.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="focus-ring inline-flex min-h-9 items-center justify-center rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={running || selectedIds.length === 0}
            onClick={() => void updateCandidateStatus("archive")}
            type="button"
          >
            归档
          </button>
          <button
            className="focus-ring inline-flex min-h-9 items-center justify-center rounded-[var(--radius)] border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-3 text-sm font-semibold text-[var(--danger)] transition hover:border-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={running || selectedIds.length === 0}
            onClick={() => void updateCandidateStatus("reject")}
            type="button"
          >
            拒绝
          </button>
          <button
            className="focus-ring inline-flex min-h-9 items-center justify-center rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={running || selectedIds.length === 0}
            onClick={() => void updateCandidateStatus("restore")}
            type="button"
          >
            恢复待处理
          </button>
        </div>
      </div>

      <div className="-mx-4 max-w-[calc(100%+2rem)] overflow-x-auto px-4 sm:mx-0 sm:max-w-full sm:px-0">
        <div className="min-w-full overflow-hidden rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)]">
          <table className="min-w-[940px] w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="whitespace-nowrap border-b border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3 text-left text-xs font-semibold text-[var(--muted-strong)]">
                  <input
                    aria-label="选择本页候选"
                    checked={allSelected}
                    className="h-4 w-4 rounded border-[var(--line-soft)] text-[var(--accent)]"
                    disabled={candidateIds.length === 0}
                    onChange={(event) => togglePage(event.currentTarget.checked)}
                    type="checkbox"
                  />
                </th>
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
              </tr>
            </thead>
            <tbody>
              {candidates.length > 0 ? (
                candidates.map((candidate) => (
                  <tr className="transition hover:bg-[var(--surface-soft)] last:[&_td]:border-b-0" key={candidate.id}>
                    <td className="border-b border-[var(--line-soft)] px-3.5 py-3.5 align-middle text-sm">
                      <input
                        aria-label={`选择候选 ${candidate.title}`}
                        checked={selectedIdSet.has(candidate.id)}
                        className="h-4 w-4 rounded border-[var(--line-soft)] text-[var(--accent)]"
                        onChange={(event) =>
                          toggleCandidate(candidate.id, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-3.5 py-3.5 align-middle text-sm">
                      <div className="grid gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            className="focus-ring rounded-[var(--radius-sm)] font-semibold text-[var(--foreground)] transition hover:text-[var(--accent-strong)]"
                            href={candidate.detailHref}
                          >
                            {candidate.title}
                          </a>
                          <a
                            className="focus-ring inline-flex min-h-7 items-center justify-center whitespace-nowrap rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-2.5 text-xs font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                            href={candidate.detailHref}
                          >
                            查看详情
                          </a>
                        </div>
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
