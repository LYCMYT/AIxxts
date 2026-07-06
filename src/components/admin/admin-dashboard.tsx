import {
  Database,
  ListChecks,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  UserGear,
  WarningCircle,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";
import type { AdminDashboardData } from "@/server/admin/queries";
import { DigestPublishButton } from "./digest-publish-button";
import { JobActionButtons } from "./job-action-buttons";
import { ManualCandidateForm } from "./manual-candidate-form";
import { SourceActionButtons } from "./source-action-buttons";
import { SourceEditor } from "./source-editor";

type BadgeTone = "success" | "danger" | "warning" | "muted" | "accent";

type StatusBadgeProps = {
  label: string;
  tone: BadgeTone;
};

const badgeToneClass: Record<BadgeTone, string> = {
  success: "border-transparent bg-[var(--success-soft)] text-[var(--success)]",
  danger: "border-transparent bg-[var(--danger-soft)] text-[var(--danger)]",
  warning: "border-transparent bg-[var(--warning-soft)] text-[var(--warning)]",
  muted: "border-[var(--line-soft)] bg-[var(--surface)] text-[var(--muted-strong)]",
  accent: "border-transparent bg-[var(--accent-soft)] text-[var(--accent-strong)]",
};

const sectionLinks = [
  { href: "#sources", label: "数据源" },
  { href: "#youtube", label: "YouTube 关键词" },
  { href: "#manual", label: "手动候选" },
  { href: "#jobs", label: "任务状态" },
  { href: "#users", label: "用户角色" },
];

const emptySummary: AdminDashboardData["summary"] = {
  enabledSources: 0,
  totalSources: 0,
  todayCandidates: 0,
  dailySchedule: "08:00",
  pendingErrors: 0,
};

const inputClass =
  "w-full rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--foreground)] transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]";

function currentDigestDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const date = `${value("year")}-${value("month")}-${value("day")}`;

  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[14px] border px-2.5 py-1 text-xs font-semibold leading-none ${badgeToneClass[tone]}`}
    >
      {label}
    </span>
  );
}

function SectionHeading({
  id,
  title,
  description,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  description: string;
  icon: typeof Database;
  children: React.ReactNode;
}) {
  return (
    <section
      className="scroll-mt-28 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line-soft)] bg-[var(--surface)] shadow-[var(--shadow-subtle)]"
      id={id}
    >
      <div className="flex flex-col gap-3 border-b border-[var(--line-soft)] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--line-soft)] bg-[var(--surface-soft)] text-[var(--accent-strong)]">
            <Icon size={18} weight="bold" />
          </span>
          <div className="grid min-w-0 gap-1">
            <h2 className="text-base font-semibold tracking-normal">{title}</h2>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function TableFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 max-w-[calc(100%+2rem)] overflow-x-auto px-4 sm:mx-0 sm:max-w-full sm:px-0">
      <div className="min-w-full overflow-hidden rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface)]">
        {children}
      </div>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap border-b border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3 text-left text-xs font-semibold text-[var(--muted-strong)]">
      {children}
    </th>
  );
}

function TableCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`border-b border-[var(--line-soft)] px-3.5 py-3.5 align-middle text-sm text-[var(--muted-strong)] ${className}`}>
      {children}
    </td>
  );
}

function EmptyTableRow({ children, colSpan }: { children: React.ReactNode; colSpan: number }) {
  return (
    <tr>
      <td
        className="border-b border-[var(--line-soft)] px-3.5 py-6 text-center text-sm text-[var(--muted)]"
        colSpan={colSpan}
      >
        {children}
      </td>
    </tr>
  );
}

function Field({
  label,
  children,
  helper,
}: {
  label: string;
  children: React.ReactNode;
  helper?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
      <span>{label}</span>
      {children}
      {helper ? <span className="text-xs font-normal text-[var(--muted)]">{helper}</span> : null}
    </label>
  );
}

type AdminDashboardProps = Partial<AdminDashboardData> & {
  digestDate?: string | null;
};

export function AdminDashboard({
  digestDate = currentDigestDate(),
  jobs = [],
  sources = [],
  summary = emptySummary,
  users = [],
}: AdminDashboardProps = {}) {
  return (
    <main className="min-h-[100dvh] bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
      <header className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid min-w-0 gap-2">
            <p className="text-sm font-medium text-[var(--accent-strong)]">管理后台</p>
            <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">MVP 维护控制台</h1>
            <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
              维护采集来源、关键词、手动候选、任务结果和成员权限。页面只展示数据库记录，暂无数据时显示空状态。
            </p>
          </div>

          <div className="grid min-w-0 gap-2 lg:min-w-[260px]">
            <JobActionButtons />
            <DigestPublishButton digestDate={digestDate} />
          </div>
        </div>

        <div className="grid gap-2 border-t border-[var(--line-soft)] pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3">
            <p className="text-xs text-[var(--muted)]">启用数据源</p>
            <p className="mt-1 text-lg font-semibold">
              {summary.enabledSources} / {summary.totalSources}
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3">
            <p className="text-xs text-[var(--muted)]">今日候选池</p>
            <p className="mt-1 text-lg font-semibold">{summary.todayCandidates} 条</p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3">
            <p className="text-xs text-[var(--muted)]">每日生成</p>
            <p className="mt-1 text-lg font-semibold">{summary.dailySchedule}</p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-3">
            <p className="text-xs text-[var(--muted)]">待处理错误</p>
            <p className="mt-1 text-lg font-semibold text-[var(--danger)]">
              {summary.pendingErrors} 条
            </p>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto border-t border-[var(--line-soft)] pt-4" aria-label="管理区块">
          {sectionLinks.map((item) => (
            <a
              className="focus-ring shrink-0 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-2 text-sm font-medium text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <SectionHeading
        description="维护 RSS、官方博客、HN、Reddit、YouTube 和 GitHub 等候选来源，控制抓取间隔和启用状态。"
        icon={Database}
        id="sources"
        title="数据源管理"
      >
        <SourceEditor sources={sources} />
        <TableFrame>
          <table className="min-w-[1040px] w-full border-collapse text-left">
            <thead>
              <tr>
                <TableHead>来源名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>RSS URL</TableHead>
                <TableHead>抓取间隔</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最近结果</TableHead>
                <TableHead>操作</TableHead>
              </tr>
            </thead>
            <tbody>
              {sources.length > 0 ? (
                sources.map((source) => (
                  <tr className="transition hover:bg-[var(--surface-soft)] last:[&_td]:border-b-0" key={source.id}>
                    <TableCell className="font-medium text-[var(--foreground)]">{source.name}</TableCell>
                    <TableCell>{source.type}</TableCell>
                    <TableCell className="max-w-[270px] truncate font-mono text-xs text-[var(--muted-strong)]">
                      {source.url}
                    </TableCell>
                    <TableCell>{source.interval}</TableCell>
                    <TableCell>{source.owner}</TableCell>
                    <TableCell>
                      <StatusBadge label={source.status.label} tone={source.status.tone} />
                    </TableCell>
                    <TableCell>{source.lastRun}</TableCell>
                    <TableCell>
                      <SourceActionButtons
                        canCollect={source.canCollect}
                        enabled={source.enabled}
                        sourceId={source.id}
                      />
                    </TableCell>
                  </tr>
                ))
              ) : (
                <EmptyTableRow colSpan={8}>暂无数据源记录。请先执行 pnpm seed:sources 或在后续管理功能中新增来源。</EmptyTableRow>
              )}
            </tbody>
          </table>
        </TableFrame>
      </SectionHeading>

      <SectionHeading
        description="管理 YouTube 搜索词、语言地区和单次最大结果数，供视频候选采集使用。"
        icon={YoutubeLogo}
        id="youtube"
        title="YouTube 关键词"
      >
        <TableFrame>
          <table className="min-w-[720px] w-full border-collapse text-left">
            <thead>
              <tr>
                <TableHead>关键词</TableHead>
                <TableHead>语言 / 地区</TableHead>
                <TableHead>最大结果数</TableHead>
                <TableHead>启用状态</TableHead>
                <TableHead>最近匹配</TableHead>
              </tr>
            </thead>
            <tbody>
              <EmptyTableRow colSpan={5}>
                暂无独立关键词表。当前 YouTube 采集词以数据源配置为准，后续再接入可编辑关键词管理。
              </EmptyTableRow>
            </tbody>
          </table>
        </TableFrame>
      </SectionHeading>

      <SectionHeading
        description="用于补充抖音、小红书或临时来源中的重要候选内容，提交后进入统一候选池。"
        icon={Plus}
        id="manual"
        title="手动候选录入"
      >
        <ManualCandidateForm />
      </SectionHeading>

      <SectionHeading
        description="跟踪最近采集、每日生成和提醒任务，优先暴露失败原因和可恢复状态。"
        icon={ListChecks}
        id="jobs"
        title="任务状态"
      >
        <TableFrame>
          <table className="min-w-[820px] w-full border-collapse text-left">
            <thead>
              <tr>
                <TableHead>任务</TableHead>
                <TableHead>结果</TableHead>
                <TableHead>完成时间</TableHead>
                <TableHead>产出</TableHead>
                <TableHead>错误摘要 / 说明</TableHead>
              </tr>
            </thead>
            <tbody>
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <tr className="transition hover:bg-[var(--surface-soft)] last:[&_td]:border-b-0" key={job.id}>
                    <TableCell className="font-medium text-[var(--foreground)]">{job.name}</TableCell>
                    <TableCell>
                      <StatusBadge label={job.result.label} tone={job.result.tone} />
                    </TableCell>
                    <TableCell>{job.finishedAt}</TableCell>
                    <TableCell>{job.output}</TableCell>
                    <TableCell className="min-w-[280px]">
                      <span className="inline-flex items-start gap-2">
                        {job.result.label === "失败" ? (
                          <WarningCircle
                            className="mt-0.5 shrink-0 text-[var(--danger)]"
                            size={16}
                            weight="bold"
                          />
                        ) : null}
                        <span>{job.summary}</span>
                      </span>
                    </TableCell>
                  </tr>
                ))
              ) : (
                <EmptyTableRow colSpan={5}>暂无任务运行记录。执行采集或每日精选后会写入 JobRun。</EmptyTableRow>
              )}
            </tbody>
          </table>
        </TableFrame>
      </SectionHeading>

      <SectionHeading
        description="管理内部成员的管理员和只读角色，停用后不允许访问内部页面。"
        icon={UserGear}
        id="users"
        title="用户角色管理"
      >
        <div className="mb-4 grid gap-4 rounded-[var(--radius)] border border-[var(--line-soft)] bg-[var(--surface-soft)] p-3 lg:grid-cols-[1fr_220px]">
          <Field label="搜索成员">
            <span className="relative">
              <MagnifyingGlass
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                size={16}
              />
              <input className={`${inputClass} pl-9`} defaultValue="" placeholder="邮箱或角色" type="search" />
            </span>
          </Field>
          <Field label="默认新成员角色">
            <select className={inputClass} defaultValue="readonly">
              <option value="readonly">只读成员</option>
              <option value="admin">管理员</option>
            </select>
          </Field>
        </div>

        <TableFrame>
          <table className="min-w-[760px] w-full border-collapse text-left">
            <thead>
              <tr>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>启用状态</TableHead>
                <TableHead>最近访问</TableHead>
                <TableHead>权限说明</TableHead>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr className="transition hover:bg-[var(--surface-soft)] last:[&_td]:border-b-0" key={user.id}>
                    <TableCell className="font-medium text-[var(--foreground)]">{user.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <ShieldCheck size={15} className="text-[var(--accent)]" weight="bold" />
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={user.status.label} tone={user.status.tone} />
                    </TableCell>
                    <TableCell>{user.lastActive}</TableCell>
                    <TableCell>
                      {user.role === "管理员" ? "可维护来源和任务" : "仅可查看每日精选和历史"}
                    </TableCell>
                  </tr>
                ))
              ) : (
                <EmptyTableRow colSpan={5}>暂无用户记录。当前开放预览已取消登录拦截。</EmptyTableRow>
              )}
            </tbody>
          </table>
        </TableFrame>
      </SectionHeading>
      </div>
    </main>
  );
}
