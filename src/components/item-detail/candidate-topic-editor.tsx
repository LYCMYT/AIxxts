"use client";

import { useMemo, useState } from "react";
import { CheckCircle, FloppyDisk, WarningCircle } from "@phosphor-icons/react";

type TopicOption = {
  id: string;
  label: string;
};

type SaveState = {
  message: string;
  tone: "idle" | "running" | "success" | "error";
};

const inputClass =
  "w-full rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]";

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

function labelsFromText(value: string) {
  return value
    .split(/[\n,，、;；]+/)
    .map((label) => label.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function CandidateTopicEditor({
  candidateId,
  currentTopicTags,
  topicOptions,
}: {
  candidateId: string;
  currentTopicTags: string[];
  topicOptions: TopicOption[];
}) {
  const [value, setValue] = useState(currentTopicTags.join("\n"));
  const [state, setState] = useState<SaveState>({
    message: "保存后会覆盖该候选当前主题，新的关联来源标记为 manual。",
    tone: "idle",
  });
  const optionLabels = useMemo(
    () =>
      topicOptions
        .map((topic) => topic.label)
        .filter((label, index, labels) => labels.indexOf(label) === index)
        .slice(0, 10),
    [topicOptions],
  );
  const running = state.tone === "running";

  async function saveTopics() {
    setState({
      message: "正在保存主题",
      tone: "running",
    });

    try {
      const result = (await parseJsonResponse(
        await fetch(`/api/admin/candidates/${encodeURIComponent(candidateId)}/topics`, {
          body: JSON.stringify({
            topicLabels: labelsFromText(value),
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PUT",
        }),
      )) as { topicLabels?: string[] };

      setState({
        message: `已保存 ${result.topicLabels?.length ?? 0} 个主题。`,
        tone: "success",
      });

      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : "主题保存失败",
        tone: "error",
      });
    }
  }

  return (
    <div
      className="mt-4 rounded-[var(--radius-sm)] border border-[var(--line-soft)] bg-[var(--surface-soft)] p-3"
      data-testid="candidate-topic-editor"
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-[var(--foreground)]">管理员主题修正</p>
        <p className="text-xs leading-5 text-[var(--muted)]">
          每行一个主题，或用逗号分隔。保存为空会清空该候选主题。
        </p>
      </div>

      <textarea
        className={`${inputClass} mt-3 min-h-[104px] resize-y leading-6`}
        onChange={(event) => setValue(event.target.value)}
        placeholder={"AI Agent\n模型发布"}
        value={value}
      />

      {optionLabels.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {optionLabels.map((label) => (
            <button
              className="focus-ring rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--accent-strong)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              key={label}
              onClick={() => {
                const labels = labelsFromText(value);

                if (!labels.some((item) => item.toLocaleLowerCase("zh-CN") === label.toLocaleLowerCase("zh-CN"))) {
                  setValue([...labels, label].join("\n"));
                }
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <button
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white shadow-[var(--shadow-subtle)] transition hover:bg-[var(--accent-strong)] active:translate-y-px disabled:cursor-wait disabled:opacity-70"
          disabled={running}
          onClick={() => void saveTopics()}
          type="button"
        >
          <FloppyDisk size={15} weight="bold" />
          保存主题
        </button>
      </div>
    </div>
  );
}
