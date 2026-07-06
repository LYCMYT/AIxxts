"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle, FloppyDisk, Plus, WarningCircle } from "@phosphor-icons/react";
import type { AdminSourceRow } from "@/server/admin/queries";

type SourceEditorProps = {
  sources: AdminSourceRow[];
};

type FormState = {
  config: string;
  enabled: boolean;
  fetchIntervalMinutes: string;
  name: string;
  sourceId: string;
  type: string;
  url: string;
};

type SaveState = {
  message: string;
  tone: "idle" | "running" | "success" | "error";
};

const sourceTypeOptions = [
  { label: "RSS", value: "RSS" },
  { label: "官方博客", value: "OFFICIAL_BLOG" },
  { label: "Hacker News", value: "HACKER_NEWS" },
  { label: "Reddit", value: "REDDIT" },
  { label: "YouTube", value: "YOUTUBE" },
];

const inputClass =
  "w-full rounded-[14px] border border-[var(--line-soft)] bg-white/85 px-3.5 py-2.5 text-sm text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]";

function newSourceState(): FormState {
  return {
    config: "",
    enabled: true,
    fetchIntervalMinutes: "60",
    name: "",
    sourceId: "",
    type: "RSS",
    url: "",
  };
}

function stateFromSource(source: AdminSourceRow): FormState {
  return {
    config: source.configText,
    enabled: source.enabled,
    fetchIntervalMinutes: String(source.fetchIntervalMinutes),
    name: source.name,
    sourceId: source.id,
    type: source.sourceType,
    url: source.rawUrl,
  };
}

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

function Field({
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

export function SourceEditor({ sources }: SourceEditorProps) {
  const router = useRouter();
  const editableSources = useMemo(() => sources.filter((source) => source.canCollect), [sources]);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<FormState>(newSourceState);
  const [state, setState] = useState<SaveState>({
    message: "可新增 RSS / YouTube / GitHub Atom 等真实来源，也可编辑已有自动采集来源。",
    tone: "idle",
  });
  const running = state.tone === "running";

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function startCreate() {
    setMode("create");
    setForm(newSourceState());
  }

  function startEdit() {
    const source = editableSources.find((item) => item.id === form.sourceId) ?? editableSources[0];

    setMode("edit");

    if (source) {
      setForm(stateFromSource(source));
    }
  }

  function selectSource(sourceId: string) {
    const source = editableSources.find((item) => item.id === sourceId);

    if (source) {
      setForm(stateFromSource(source));
    }
  }

  async function saveSource() {
    setState({
      message: mode === "create" ? "正在新增来源" : "正在保存来源",
      tone: "running",
    });

    try {
      const payload = {
        config: form.config.trim() ? form.config : null,
        enabled: form.enabled,
        fetchIntervalMinutes: Number(form.fetchIntervalMinutes),
        name: form.name,
        type: form.type,
        url: form.url,
      };
      const url =
        mode === "create"
          ? "/api/admin/sources"
          : `/api/admin/sources/${encodeURIComponent(form.sourceId)}`;

      await parseJsonResponse(
        await fetch(url, {
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          },
          method: mode === "create" ? "POST" : "PATCH",
        }),
      );
      setState({
        message: mode === "create" ? "来源已新增" : "来源已保存",
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : "来源保存失败",
        tone: "error",
      });
    }
  }

  return (
    <div className="mb-4 grid gap-4 rounded-[16px] border border-[var(--line-soft)] bg-white/60 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <CheckCircle size={16} className="text-[var(--success)]" weight="bold" />
          来源状态来自数据库，保存后会刷新下方列表。
        </div>
        <div className="flex rounded-[14px] border border-[var(--line-soft)] bg-white/80 p-1">
          <button
            className={`focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-[11px] px-3 text-xs font-semibold transition ${
              mode === "create"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--muted-strong)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
            }`}
            onClick={startCreate}
            type="button"
          >
            <Plus size={13} weight="bold" />
            新增
          </button>
          <button
            className={`focus-ring inline-flex min-h-8 items-center rounded-[11px] px-3 text-xs font-semibold transition ${
              mode === "edit"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--muted-strong)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
            }`}
            disabled={editableSources.length === 0}
            onClick={startEdit}
            type="button"
          >
            编辑
          </button>
        </div>
      </div>

      {mode === "edit" ? (
        <Field label="选择已有来源">
          <select
            className={inputClass}
            disabled={editableSources.length === 0}
            onChange={(event) => selectSource(event.target.value)}
            value={form.sourceId}
          >
            {editableSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[1fr_170px_150px_130px]">
        <Field label="来源名称">
          <input
            className={inputClass}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="例如 GitHub vLLM Releases"
            value={form.name}
          />
        </Field>
        <Field label="类型">
          <select
            className={inputClass}
            onChange={(event) => updateField("type", event.target.value)}
            value={form.type}
          >
            {sourceTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="间隔分钟">
          <input
            className={inputClass}
            min={1}
            max={1440}
            onChange={(event) => updateField("fetchIntervalMinutes", event.target.value)}
            type="number"
            value={form.fetchIntervalMinutes}
          />
        </Field>
        <Field label="启用">
          <select
            className={inputClass}
            onChange={(event) => updateField("enabled", event.target.value === "true")}
            value={String(form.enabled)}
          >
            <option value="true">启用</option>
            <option value="false">停用</option>
          </select>
        </Field>
      </div>

      <Field label="URL">
        <input
          className={inputClass}
          onChange={(event) => updateField("url", event.target.value)}
          placeholder="https://example.com/feed.xml"
          value={form.url}
        />
      </Field>

      <Field label="JSON config">
        <textarea
          className={`${inputClass} min-h-[104px] resize-y font-mono text-xs leading-5`}
          onChange={(event) => updateField("config", event.target.value)}
          placeholder='{"category":"github-release","owner":"owner/repo"}'
          value={form.config}
        />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[14px] bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,113,227,0.18)] transition hover:bg-[var(--accent-strong)] active:translate-y-px disabled:cursor-wait disabled:opacity-70"
          disabled={running || (mode === "edit" && !form.sourceId)}
          onClick={() => void saveSource()}
          type="button"
        >
          <FloppyDisk size={16} weight="bold" />
          {mode === "create" ? "新增来源" : "保存来源"}
        </button>
      </div>
    </div>
  );
}
