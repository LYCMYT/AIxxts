"use client";

import { useRouter } from "next/navigation";
import { CheckCircle, Plus, WarningCircle } from "@phosphor-icons/react";
import { useId, useState, type FormEvent } from "react";

type SubmitTone = "idle" | "running" | "success" | "error";

type SubmitState = {
  label: string;
  tone: SubmitTone;
};

const initialState: SubmitState = {
  label: "等待录入候选内容",
  tone: "idle",
};

const inputClass =
  "min-w-0 w-full rounded-[14px] border border-[var(--line-soft)] bg-white/85 px-3.5 py-2.5 text-sm text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] disabled:cursor-not-allowed disabled:bg-[var(--surface-soft)] disabled:text-[var(--muted)]";

function defaultPublishedAt() {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 16);
}

async function readResponseBody(response: Response) {
  return (await response.json().catch(() => null)) as unknown;
}

function responseMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") {
    return fallback;
  }

  const record = body as Record<string, unknown>;

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  if (typeof record.createdCount === "number") {
    return `已加入候选池：新增 ${record.createdCount} 条`;
  }

  return fallback;
}

function Field({
  children,
  helper,
  id,
  label,
}: {
  children: React.ReactNode;
  helper?: string;
  id: string;
  label: string;
}) {
  return (
    <div className="grid min-w-0 gap-2 text-sm font-medium text-[var(--muted-strong)]">
      <label htmlFor={id}>{label}</label>
      {children}
      {helper ? <span className="text-xs font-normal text-[var(--muted)]">{helper}</span> : null}
    </div>
  );
}

export function ManualCandidateForm() {
  const router = useRouter();
  const titleId = useId();
  const sourceId = useId();
  const urlId = useId();
  const publishedAtId = useId();
  const summaryId = useId();
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("手动录入");
  const [url, setUrl] = useState("");
  const [publishedAt, setPublishedAt] = useState(defaultPublishedAt);
  const [summary, setSummary] = useState("");
  const [state, setState] = useState<SubmitState>(initialState);
  const running = state.tone === "running";
  const canSubmit = title.trim() && source.trim() && url.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || running) {
      return;
    }

    setState({
      label: "正在加入候选池",
      tone: "running",
    });

    try {
      const response = await fetch("/api/admin/candidates/manual", {
        body: JSON.stringify({
          title: title.trim(),
          sourceName: source.trim(),
          url: url.trim(),
          summary: summary.trim() || undefined,
          publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const body = await readResponseBody(response);

      if (!response.ok) {
        throw new Error(responseMessage(body, `提交失败：${response.status}`));
      }

      setTitle("");
      setUrl("");
      setSummary("");
      setState({
        label: responseMessage(body, "候选已加入候选池"),
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setState({
        label: error instanceof Error ? error.message : "候选提交失败",
        tone: "error",
      });
    }
  }

  return (
    <form aria-label="手动候选录入" className="grid min-w-0 gap-4" onSubmit={handleSubmit}>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Field id={titleId} label="标题">
          <input
            className={inputClass}
            disabled={running}
            id={titleId}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="输入候选内容标题"
            required
            type="text"
            value={title}
          />
        </Field>
        <Field id={sourceId} label="来源">
          <input
            className={inputClass}
            disabled={running}
            id={sourceId}
            onChange={(event) => setSource(event.target.value)}
            placeholder="例如：官方博客、直播回放、小红书"
            required
            type="text"
            value={source}
          />
        </Field>
        <Field id={urlId} label="URL">
          <input
            className={inputClass}
            disabled={running}
            id={urlId}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://来源页面链接"
            required
            type="url"
            value={url}
          />
        </Field>
        <Field id={publishedAtId} label="发布时间">
          <input
            className={inputClass}
            disabled={running}
            id={publishedAtId}
            onChange={(event) => setPublishedAt(event.target.value)}
            type="datetime-local"
            value={publishedAt}
          />
        </Field>
      </div>

      <Field
        helper="建议保留事实信息，不写未经核验的判断。"
        id={summaryId}
        label="摘要"
      >
        <textarea
          className={`${inputClass} min-h-28 resize-y leading-6`}
          disabled={running}
          id={summaryId}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="概括候选内容的事实、影响范围和入选理由"
          rows={4}
          value={summary}
        />
      </Field>

      <div className="flex min-w-0 flex-col gap-3 rounded-[16px] border border-[var(--line-soft)] bg-white/60 p-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className={`min-w-0 break-words rounded-[14px] px-3 py-2 text-sm leading-6 ${
            state.tone === "error"
              ? "bg-[var(--danger-soft)] text-[var(--danger)]"
              : state.tone === "success"
                ? "bg-[var(--success-soft)] text-[var(--success)]"
                : "text-[var(--muted)]"
          }`}
          role="status"
        >
          <span className="inline-flex min-w-0 items-start gap-2">
            {state.tone === "error" ? (
              <WarningCircle className="mt-1 shrink-0" size={15} weight="bold" />
            ) : state.tone === "success" ? (
              <CheckCircle className="mt-1 shrink-0" size={15} weight="bold" />
            ) : null}
            <span>{state.label}</span>
          </span>
        </p>
        <button
          aria-label="加入候选池"
          className="focus-ring inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[var(--foreground)] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(24,24,27,0.14)] transition hover:bg-[var(--accent-strong)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
          disabled={running || !canSubmit}
          type="submit"
        >
          <Plus size={16} weight="bold" />
          {running ? "提交中" : "加入候选池"}
        </button>
      </div>
    </form>
  );
}
