"use client";

import { useState } from "react";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { adminJobActions, type AdminJobActionKind } from "./job-action-config";

type JobActionState = {
  activeKind?: AdminJobActionKind;
  label: string;
  tone: "idle" | "running" | "success" | "error";
};

const initialState: JobActionState = {
  label: "任务待执行",
  tone: "idle",
};

async function postJob(url: string, body?: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    ...(body
      ? {
          body: JSON.stringify(body),
          headers: {
            "content-type": "application/json",
          },
        }
      : {}),
  });
  const responseBody = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      responseBody && typeof responseBody === "object" && "error" in responseBody
        ? String((responseBody as { error?: unknown }).error)
        : `请求失败：${response.status}`;

    throw new Error(message);
  }

  return responseBody;
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

export function buildJobBody(kind: AdminJobActionKind, digestDate: string) {
  if (kind === "collect") {
    return undefined;
  }

  const body: Record<string, unknown> = {
    selectedOnly: true,
  };

  if (digestDate) {
    body.digestDate = digestDate;
  }

  if (kind === "enrichArticles" || kind === "translate") {
    body.limit = 20;
  }

  if (kind === "translate") {
    body.force = true;
  }

  return body;
}

export function JobActionButtons({ digestDate }: { digestDate?: string | null }) {
  const [selectedDate, setSelectedDate] = useState(digestDate ?? "");
  const [state, setState] = useState<JobActionState>(initialState);

  async function runAction(kind: AdminJobActionKind) {
    const action = adminJobActions.find((item) => item.kind === kind);

    if (!action) {
      return;
    }

    setState({
      activeKind: kind,
      label: action.runningLabel,
      tone: "running",
    });

    try {
      const result = await postJob(action.url, buildJobBody(kind, selectedDate));

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
      <label className="grid gap-1.5 text-xs font-medium text-[var(--muted-strong)]">
        <span>任务日期</span>
        <input
          className="focus-ring min-h-10 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
          onChange={(event) => setSelectedDate(event.target.value)}
          type="date"
          value={selectedDate}
        />
      </label>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {adminJobActions.map((action) => {
          const Icon = action.icon;
          const primary = action.tone === "primary";
          const active = running && state.activeKind === action.kind;

          return (
            <button
              aria-label={action.label}
              className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius)] px-3.5 py-2 text-sm font-semibold shadow-[var(--shadow-subtle)] transition active:translate-y-px disabled:cursor-wait disabled:opacity-70 ${
                primary
                  ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]"
                  : "border border-[var(--line-soft)] bg-[var(--surface)] text-[var(--accent-strong)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              }`}
              disabled={running}
              key={action.kind}
              onClick={() => void runAction(action.kind)}
              type="button"
            >
              <Icon size={16} weight="bold" />
              {active ? action.runningLabel : action.label}
            </button>
          );
        })}
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
