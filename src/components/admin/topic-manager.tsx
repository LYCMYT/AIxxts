"use client";

import { useMemo, useState } from "react";
import { CheckCircle, GitMerge, WarningCircle } from "@phosphor-icons/react";
import type { AdminTopicRow } from "@/server/admin/topics";

type TopicManagerProps = {
  topics: AdminTopicRow[];
};

type MergeState = {
  message: string;
  tone: "idle" | "running" | "success" | "error";
};

const inputClass =
  "w-full rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--foreground)] transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]";

async function parseJsonResponse(response: Response) {
  const body = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error?: unknown }).error)
        : `请求失败：${response.status}`;

    throw new Error(message);
  }

  return body;
}

function topicOptionLabel(topic: AdminTopicRow) {
  return `${topic.label} (${topic.candidateCount})`;
}

function firstTopicId(topics: AdminTopicRow[], excludeId?: string) {
  return topics.find((topic) => topic.id !== excludeId)?.id ?? "";
}

export function TopicManager({ topics }: TopicManagerProps) {
  const sortedTopics = useMemo(
    () =>
      [...topics].sort(
        (left, right) => right.candidateCount - left.candidateCount || left.label.localeCompare(right.label),
      ),
    [topics],
  );
  const [sourceTopicId, setSourceTopicId] = useState(() => firstTopicId(sortedTopics));
  const [targetTopicId, setTargetTopicId] = useState(() => firstTopicId(sortedTopics, sourceTopicId));
  const [state, setState] = useState<MergeState>({
    message: "合并重复主题会把候选关联迁移到目标主题，并删除源主题。",
    tone: "idle",
  });
  const running = state.tone === "running";
  const canMerge = sortedTopics.length >= 2 && sourceTopicId && targetTopicId && sourceTopicId !== targetTopicId;
  const targetOptions = sortedTopics.filter((topic) => topic.id !== sourceTopicId);

  function updateSourceTopic(nextSourceTopicId: string) {
    setSourceTopicId(nextSourceTopicId);

    if (nextSourceTopicId === targetTopicId) {
      setTargetTopicId(firstTopicId(sortedTopics, nextSourceTopicId));
    }
  }

  async function mergeTopics() {
    setState({
      message: "正在合并主题",
      tone: "running",
    });

    try {
      const result = (await parseJsonResponse(
        await fetch("/api/admin/topics/merge", {
          body: JSON.stringify({
            sourceTopicId,
            targetTopicId,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }),
      )) as { deletedTopicLabel?: string; movedCount?: number; skippedDuplicateCount?: number };

      setState({
        message: `已合并 ${result.deletedTopicLabel ?? "重复主题"}，迁移 ${result.movedCount ?? 0} 条，跳过重复 ${result.skippedDuplicateCount ?? 0} 条。`,
        tone: "success",
      });

      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : "主题合并失败",
        tone: "error",
      });
    }
  }

  return (
    <div className="grid gap-4">
      <div
        className="grid gap-3 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)] p-3"
        data-testid="topic-merge-form"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">合并重复主题</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              选择要删除的源主题和保留的目标主题，系统会自动迁移候选关联。
            </p>
          </div>
          <span className="inline-flex w-fit rounded-[14px] border border-[var(--line-soft)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--muted-strong)]">
            {sortedTopics.length} 个主题
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            <span>源主题</span>
            <select
              className={inputClass}
              disabled={sortedTopics.length < 2 || running}
              onChange={(event) => updateSourceTopic(event.target.value)}
              value={sourceTopicId}
            >
              {sortedTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topicOptionLabel(topic)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            <span>目标主题</span>
            <select
              className={inputClass}
              disabled={targetOptions.length === 0 || running}
              onChange={(event) => setTargetTopicId(event.target.value)}
              value={targetTopicId}
            >
              {targetOptions.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topicOptionLabel(topic)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              className="focus-ring inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-subtle)] transition hover:bg-[var(--accent-strong)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70 lg:w-auto"
              disabled={!canMerge || running}
              onClick={() => void mergeTopics()}
              type="button"
            >
              <GitMerge size={16} weight="bold" />
              合并主题
            </button>
          </div>
        </div>

        <p
          aria-live="polite"
          className={`flex min-w-0 items-start gap-2 text-xs leading-5 ${
            state.tone === "error"
              ? "text-[var(--danger)]"
              : state.tone === "success"
                ? "text-[var(--success)]"
                : "text-[var(--muted)]"
          }`}
        >
          {state.tone === "error" ? (
            <WarningCircle className="mt-0.5 shrink-0" size={14} weight="bold" />
          ) : state.tone === "success" ? (
            <CheckCircle className="mt-0.5 shrink-0" size={14} weight="bold" />
          ) : null}
          <span>{state.message}</span>
        </p>
      </div>

      <div className="-mx-4 max-w-[calc(100%+2rem)] overflow-x-auto px-4 sm:mx-0 sm:max-w-full sm:px-0">
        <div className="min-w-full overflow-hidden rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)]">
          <table className="min-w-[760px] w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="whitespace-nowrap border-b border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3 text-left text-xs font-semibold text-[var(--muted-strong)]">
                  主题
                </th>
                <th className="whitespace-nowrap border-b border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3 text-left text-xs font-semibold text-[var(--muted-strong)]">
                  Slug
                </th>
                <th className="whitespace-nowrap border-b border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3 text-left text-xs font-semibold text-[var(--muted-strong)]">
                  候选关联
                </th>
                <th className="whitespace-nowrap border-b border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3 text-left text-xs font-semibold text-[var(--muted-strong)]">
                  创建时间
                </th>
                <th className="whitespace-nowrap border-b border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3 text-left text-xs font-semibold text-[var(--muted-strong)]">
                  查看
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTopics.length > 0 ? (
                sortedTopics.map((topic) => (
                  <tr className="transition hover:bg-[var(--surface-soft)] last:[&_td]:border-b-0" key={topic.id}>
                    <td className="border-b border-[var(--line-soft)] px-3.5 py-3.5 align-middle text-sm font-semibold text-[var(--foreground)]">
                      {topic.label}
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-3.5 py-3.5 align-middle font-mono text-xs text-[var(--muted-strong)]">
                      {topic.slug}
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-3.5 py-3.5 align-middle text-sm text-[var(--muted-strong)]">
                      {topic.candidateCount} 条
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-3.5 py-3.5 align-middle text-sm text-[var(--muted-strong)]">
                      {topic.createdAt}
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-3.5 py-3.5 align-middle text-sm">
                      <a
                        className="focus-ring inline-flex min-h-9 items-center justify-center rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                        href={`/digests?topic=${encodeURIComponent(topic.label)}`}
                      >
                        历史精选
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="border-b border-[var(--line-soft)] px-3.5 py-6 text-center text-sm text-[var(--muted)]"
                    colSpan={5}
                  >
                    暂无主题标签。请先运行每日精选或主题回填任务。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
