"use client";

import { useState } from "react";
import { ArrowClockwise, CheckCircle, Play, WarningCircle } from "@phosphor-icons/react";

type JobActionState = {
  label: string;
  tone: "idle" | "running" | "success" | "error";
};

const initialState: JobActionState = {
  label: "任务待执行",
  tone: "idle",
};

async function postJob(url: string) {
  const response = await fetch(url, {
    method: "POST",
  });
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

function summarizeJobResult(result: unknown) {
  if (!result || typeof result !== "object") {
    return "任务已触发";
  }

  const record = result as Record<string, unknown>;

  if (typeof record.message === "string") {
    return record.message;
  }

  if (
    typeof record.createdCount === "number" ||
    typeof record.scannedCount === "number" ||
    typeof record.skippedCount === "number"
  ) {
    return `扫描 ${record.scannedCount ?? 0} 条，新增 ${record.createdCount ?? 0} 条`;
  }

  if (typeof record.itemCount === "number" || typeof record.candidateCount === "number") {
    return `候选 ${record.candidateCount ?? 0} 条，精选 ${record.itemCount ?? 0} 条`;
  }

  return "任务已完成";
}

export function JobActionButtons() {
  const [state, setState] = useState<JobActionState>(initialState);

  async function runAction(kind: "collect" | "daily") {
    const label = kind === "collect" ? "正在执行采集" : "正在重跑每日精选";
    const url = kind === "collect" ? "/api/admin/jobs/collect" : "/api/admin/jobs/daily";

    setState({
      label,
      tone: "running",
    });

    try {
      const result = await postJob(url);

      setState({
        label: summarizeJobResult(result),
        tone: "success",
      });
    } catch (error) {
      setState({
        label: error instanceof Error ? error.message : "任务执行失败",
        tone: "error",
      });
    }
  }

  const running = state.tone === "running";

  return (
    <div className="grid gap-2">
      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
        <button
          aria-label="重跑每日精选"
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-subtle)] transition hover:bg-[var(--accent-strong)] active:translate-y-px disabled:cursor-wait disabled:opacity-70"
          disabled={running}
          onClick={() => void runAction("daily")}
          type="button"
        >
          <ArrowClockwise size={16} weight="bold" />
          重跑每日精选
        </button>
        <button
          aria-label="执行采集任务"
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-[var(--accent-strong)] shadow-[var(--shadow-subtle)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] active:translate-y-px disabled:cursor-wait disabled:opacity-70"
          disabled={running}
          onClick={() => void runAction("collect")}
          type="button"
        >
          <Play size={16} weight="bold" />
          执行采集
        </button>
      </div>

      <p
        aria-live="polite"
        className={`flex items-start gap-2 rounded-[var(--radius)] border px-3 py-2 text-xs leading-5 ${
          state.tone === "error"
            ? "border-[var(--danger-soft)] bg-[var(--danger-soft)] text-[var(--danger)]"
            : state.tone === "success"
              ? "border-[var(--success-soft)] bg-[var(--success-soft)] text-[var(--success)]"
              : "border-[var(--line-soft)] bg-[var(--surface-soft)] text-[var(--muted)]"
        }`}
      >
        {state.tone === "error" ? (
          <WarningCircle className="mt-0.5 shrink-0" size={14} weight="bold" />
        ) : state.tone === "success" ? (
          <CheckCircle className="mt-0.5 shrink-0" size={14} weight="bold" />
        ) : null}
        <span>{state.label}</span>
      </p>
    </div>
  );
}
