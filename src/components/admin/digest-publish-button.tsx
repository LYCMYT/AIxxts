"use client";

import { useRouter } from "next/navigation";
import { CheckCircle, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";
import { useState } from "react";

type PublishTone = "idle" | "running" | "success" | "error";

type PublishState = {
  label: string;
  tone: PublishTone;
};

function isDigestDate(value: string | null | undefined): value is string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "");
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

  if (typeof record.digestDate === "string" && typeof record.selectedCount === "number") {
    return `${record.digestDate} 草稿已发布，精选 ${record.selectedCount} 条`;
  }

  return fallback;
}

export function DigestPublishButton({ digestDate }: { digestDate?: string | null }) {
  const router = useRouter();
  const publishDate = isDigestDate(digestDate) ? digestDate : null;
  const [state, setState] = useState<PublishState>({
    label: publishDate ? `${publishDate} 草稿待发布` : "暂无草稿可发布",
    tone: "idle",
  });
  const running = state.tone === "running";
  const disabled = !publishDate || running;

  async function publishDigest() {
    if (!publishDate || running) {
      return;
    }

    setState({
      label: "正在发布今日草稿",
      tone: "running",
    });

    try {
      const response = await fetch(`/api/admin/digests/${encodeURIComponent(publishDate)}/publish`, {
        method: "POST",
      });
      const body = await readResponseBody(response);

      if (!response.ok) {
        throw new Error(responseMessage(body, `发布失败：${response.status}`));
      }

      setState({
        label: responseMessage(body, `${publishDate} 草稿已发布`),
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setState({
        label: error instanceof Error ? error.message : "草稿发布失败",
        tone: "error",
      });
    }
  }

  return (
    <div className="grid min-w-0 gap-2">
      <button
        aria-label="发布今日草稿"
        className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[14px] border border-[var(--line-soft)] bg-white/85 px-3.5 py-2 text-sm font-semibold text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
        disabled={disabled}
        onClick={() => void publishDigest()}
        type="button"
      >
        <PaperPlaneTilt size={16} weight="bold" />
        {running ? "发布中" : "发布今日草稿"}
      </button>
      <p
        aria-live="polite"
        className={`flex min-w-0 items-start gap-2 break-words rounded-[14px] border px-3 py-2 text-xs leading-5 ${
          state.tone === "error"
            ? "border-[var(--danger-soft)] bg-[var(--danger-soft)] text-[var(--danger)]"
            : state.tone === "success"
              ? "border-[var(--success-soft)] bg-[var(--success-soft)] text-[var(--success)]"
              : "border-[var(--line-soft)] bg-white/70 text-[var(--muted)]"
        }`}
        role="status"
      >
        {state.tone === "error" ? (
          <WarningCircle className="mt-0.5 shrink-0" size={14} weight="bold" />
        ) : state.tone === "success" ? (
          <CheckCircle className="mt-0.5 shrink-0" size={14} weight="bold" />
        ) : null}
        <span>{publishDate ? state.label : "暂无草稿可发布"}</span>
      </p>
    </div>
  );
}
