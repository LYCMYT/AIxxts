"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowClockwise, CheckCircle, Power, WarningCircle } from "@phosphor-icons/react";

type SourceActionButtonsProps = {
  canCollect: boolean;
  enabled: boolean;
  sourceId: string;
};

type ActionState = {
  message: string;
  tone: "idle" | "running" | "success" | "error";
};

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

function summarizeCollectResult(result: unknown) {
  if (!result || typeof result !== "object") {
    return "来源已重跑";
  }

  const record = result as Record<string, unknown>;

  if (
    typeof record.scannedCount === "number" ||
    typeof record.createdCount === "number" ||
    typeof record.skippedCount === "number"
  ) {
    return `扫描 ${record.scannedCount ?? 0} 条，新增 ${record.createdCount ?? 0} 条`;
  }

  return "来源已重跑";
}

export function SourceActionButtons({
  canCollect,
  enabled,
  sourceId,
}: SourceActionButtonsProps) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({
    message: "",
    tone: "idle",
  });
  const running = state.tone === "running";

  async function updateEnabled(nextEnabled: boolean) {
    setState({
      message: nextEnabled ? "正在启用来源" : "正在停用来源",
      tone: "running",
    });

    try {
      await parseJsonResponse(
        await fetch(`/api/admin/sources/${encodeURIComponent(sourceId)}`, {
          body: JSON.stringify({
            enabled: nextEnabled,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        }),
      );
      setState({
        message: nextEnabled ? "来源已启用" : "来源已停用",
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : "来源状态更新失败",
        tone: "error",
      });
    }
  }

  async function collectOneSource() {
    setState({
      message: "正在重跑该来源",
      tone: "running",
    });

    try {
      const result = await parseJsonResponse(
        await fetch(`/api/admin/sources/${encodeURIComponent(sourceId)}/collect`, {
          method: "POST",
        }),
      );

      setState({
        message: summarizeCollectResult(result),
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : "来源重跑失败",
        tone: "error",
      });
    }
  }

  return (
    <div className="grid min-w-[180px] gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          aria-label={enabled ? "停用来源" : "启用来源"}
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)] active:translate-y-px disabled:cursor-wait disabled:opacity-70"
          disabled={running}
          onClick={() => void updateEnabled(!enabled)}
          type="button"
        >
          <Power size={14} weight="bold" />
          {enabled ? "停用" : "启用"}
        </button>
        <button
          aria-label="重跑该来源"
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          disabled={running || !enabled || !canCollect}
          onClick={() => void collectOneSource()}
          title={canCollect ? undefined : "该来源类型暂不支持自动采集"}
          type="button"
        >
          <ArrowClockwise size={14} weight="bold" />
          重跑
        </button>
      </div>
      {state.message ? (
        <p
          aria-live="polite"
          className={`flex items-start gap-1.5 text-xs leading-5 ${
            state.tone === "error"
              ? "text-[var(--danger)]"
              : state.tone === "success"
                ? "text-[var(--success)]"
                : "text-[var(--muted)]"
          }`}
        >
          {state.tone === "error" ? (
            <WarningCircle className="mt-0.5 shrink-0" size={13} weight="bold" />
          ) : state.tone === "success" ? (
            <CheckCircle className="mt-0.5 shrink-0" size={13} weight="bold" />
          ) : null}
          <span>{state.message}</span>
        </p>
      ) : null}
    </div>
  );
}
