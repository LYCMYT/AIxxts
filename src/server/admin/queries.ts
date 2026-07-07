import { COLLECTABLE_SOURCE_TYPES } from "@/server/collectors/types";
import { classifyRequestError } from "@/server/collectors/request-diagnostics";

type PrismaClientLike = Awaited<typeof import("@/server/db/prisma")>["prisma"];

type BadgeTone = "success" | "danger" | "warning" | "muted" | "accent";

export type AdminSourceRow = {
  canCollect: boolean;
  configText: string;
  enabled: boolean;
  fetchIntervalMinutes: number;
  id: string;
  name: string;
  sourceType: string;
  type: string;
  rawUrl: string;
  url: string;
  interval: string;
  owner: string;
  status: {
    label: string;
    tone: BadgeTone;
  };
  lastRun: string;
};

export type AdminSourceHealthRow = {
  consecutiveFailures: number;
  errorCategory: string;
  id: string;
  lastError: string;
  latestFailure: string;
  latestSuccess: string;
  name: string;
  status: {
    label: string;
    tone: BadgeTone;
  };
};

export type AdminSourceErrorCategoryRow = {
  category: string;
  count: number;
};

export type AdminSourceHealthInput = {
  enabled: boolean;
  jobs: Array<{
    errorMessage: string | null;
    finishedAt: Date | string | null;
    startedAt: Date | string;
    status: string;
  }>;
  lastError: string | null;
  sourceId: string;
  sourceName: string;
};

export type AdminJobRow = {
  details: AdminJobDetailRow[];
  id: string;
  name: string;
  result: {
    label: string;
    tone: BadgeTone;
  };
  finishedAt: string;
  output: string;
  rawMetadataText: string | null;
  summary: string;
};

export type AdminJobDetailRow = {
  label: string;
  value: string;
};

export type AdminUserRow = {
  id: string;
  email: string;
  role: string;
  status: {
    label: string;
    tone: BadgeTone;
  };
  lastActive: string;
};

export type AdminDashboardData = {
  jobFilterOptions: {
    jobTypes: string[];
    sources: Array<{
      id: string;
      name: string;
    }>;
    statuses: Array<{
      label: string;
      value: string;
    }>;
  };
  jobFilters: AdminJobFilters;
  jobPagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  summary: {
    enabledSources: number;
    totalSources: number;
    todayCandidates: number;
    dailySchedule: string;
    pendingErrors: number;
  };
  sources: AdminSourceRow[];
  sourceErrorCategories: AdminSourceErrorCategoryRow[];
  sourceHealth: AdminSourceHealthRow[];
  jobs: AdminJobRow[];
  users: AdminUserRow[];
};

export type AdminJobFilterInput = {
  jobType?: unknown;
  page?: unknown;
  sourceId?: unknown;
  status?: unknown;
};

export type AdminJobFilters = {
  jobType: string;
  page: number;
  pageSize: number;
  sourceId: string;
  status: string;
};

type RawSourceRow = {
  id: string;
  name: string;
  type: string;
  url: string | null;
  config: unknown;
  enabled: boolean | number;
  fetchIntervalMinutes: number | bigint;
  lastFetchedAt: Date | string | null;
  lastError: string | null;
};

type RawJobRunRow = {
  id: string;
  jobType: string;
  sourceId: string | null;
  sourceName: string | null;
  status: string;
  startedAt: Date | string;
  finishedAt: Date | string | null;
  scannedCount: number | bigint;
  createdCount: number | bigint;
  skippedCount: number | bigint;
  errorMessage: string | null;
  metadata: unknown;
};

type RawCountRow = {
  count: number | bigint;
};

type RawOptionRow = {
  value: string | null;
};

const APP_TIME_ZONE = "America/New_York";
const JOB_PAGE_SIZE = 10;
const MAX_FILTER_LENGTH = 100;
const VALID_JOB_STATUSES = ["RUNNING", "SUCCESS", "FAILED", "SKIPPED"] as const;

const sourceTypeLabels: Record<string, string> = {
  RSS: "RSS",
  OFFICIAL_BLOG: "官方博客",
  HACKER_NEWS: "Hacker News",
  REDDIT: "Reddit",
  YOUTUBE: "YouTube",
  GITHUB: "GitHub",
  X: "X",
  DOUYIN: "抖音",
  XIAOHONGSHU: "小红书",
  MANUAL: "手动录入",
};

async function getPrisma(): Promise<PrismaClientLike | null> {
  try {
    const prismaModule = await import("@/server/db/prisma");
    return prismaModule.prisma;
  } catch {
    return null;
  }
}

function formatDateTime(date: Date | string | null | undefined) {
  if (!date) {
    return "未记录";
  }

  const dateValue = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(dateValue.getTime())) {
    return "未记录";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(dateValue);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")} ${value("hour")}:${value(
    "minute",
  )}`;
}

function formatTime(date: Date | string | null | undefined) {
  if (!date) {
    return "未记录";
  }

  const dateValue = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(dateValue.getTime())) {
    return "未记录";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dateValue);
}

function rawNumber(value: number | bigint) {
  return typeof value === "bigint" ? Number(value) : value;
}

function rawBoolean(value: boolean | number) {
  return typeof value === "boolean" ? value : value !== 0;
}

function sourceTypeLabel(type: string) {
  return sourceTypeLabels[type] ?? type;
}

function canCollectSourceType(type: string) {
  return COLLECTABLE_SOURCE_TYPES.includes(
    type as (typeof COLLECTABLE_SOURCE_TYPES)[number],
  );
}

function jobTone(status: string): BadgeTone {
  if (status === "SUCCESS") {
    return "success";
  }

  if (status === "FAILED") {
    return "danger";
  }

  if (status === "RUNNING") {
    return "accent";
  }

  return "muted";
}

function jobLabel(status: string) {
  const labels: Record<string, string> = {
    SUCCESS: "成功",
    FAILED: "失败",
    RUNNING: "运行中",
    SKIPPED: "跳过",
  };

  return labels[status] ?? status;
}

function firstFilterValue(value: unknown) {
  if (Array.isArray(value)) {
    return firstFilterValue(value[0]);
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function shortFilterValue(value: unknown) {
  const trimmed = firstFilterValue(value);

  return trimmed.length <= MAX_FILTER_LENGTH ? trimmed : "";
}

function parseJobPage(value: unknown) {
  const numeric = Number(firstFilterValue(value));

  if (!Number.isFinite(numeric)) {
    return 1;
  }

  return Math.max(1, Math.floor(numeric));
}

export function normalizeAdminJobFilters(input: AdminJobFilterInput = {}): AdminJobFilters {
  const status = shortFilterValue(input.status).toUpperCase();

  return {
    jobType: shortFilterValue(input.jobType),
    page: parseJobPage(input.page),
    pageSize: JOB_PAGE_SIZE,
    sourceId: shortFilterValue(input.sourceId),
    status: VALID_JOB_STATUSES.includes(status as (typeof VALID_JOB_STATUSES)[number])
      ? status
      : "",
  };
}

function jobStatusOptions() {
  return VALID_JOB_STATUSES.map((status) => ({
    label: jobLabel(status),
    value: status,
  }));
}

function buildJobWhere(filters: AdminJobFilters) {
  const clauses = ['"JobRun"."id" IS NOT NULL'];
  const args: Array<string> = [];

  if (filters.status) {
    clauses.push('"JobRun"."status" = ?');
    args.push(filters.status);
  }

  if (filters.jobType) {
    clauses.push('"JobRun"."jobType" = ?');
    args.push(filters.jobType);
  }

  if (filters.sourceId) {
    clauses.push('"JobRun"."sourceId" = ?');
    args.push(filters.sourceId);
  }

  return {
    args,
    sql: `WHERE ${clauses.join(" AND ")}`,
  };
}

function configString(value: unknown, keys: string[], fallback: string) {
  const config = normalizedConfig(value);

  if (!config) {
    return fallback;
  }

  for (const key of keys) {
    const item = config[key];

    if (typeof item === "string" && item.trim()) {
      return item;
    }
  }

  return fallback;
}

function normalizedConfig(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;

      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  return typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function configText(value: unknown) {
  const config = normalizedConfig(value);

  return config ? JSON.stringify(config, null, 2) : "";
}

function metadataNumber(config: Record<string, unknown> | null, key: string) {
  const value = config?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function metadataString(config: Record<string, unknown> | null, key: string) {
  const value = config?.[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function metadataStringList(config: Record<string, unknown> | null, key: string) {
  const value = config?.[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
}

export function mapJobMetadataDetails(value: unknown): AdminJobDetailRow[] {
  const metadata = normalizedConfig(value);

  if (!metadata) {
    return [];
  }

  const details: AdminJobDetailRow[] = [];
  const method = metadataString(metadata, "method");
  const feedTitle = metadataString(metadata, "feedTitle");
  const rssAttemptCount = metadataNumber(metadata, "rssAttemptCount");
  const rssLastError = metadataString(metadata, "rssLastError");
  const rssLastErrorCategory = metadataString(metadata, "rssLastErrorCategory");
  const rawItemCount = metadataNumber(metadata, "rawItemCount");
  const filteredItemCount = metadataNumber(metadata, "filteredItemCount");
  const matchedItemCount = metadataNumber(metadata, "matchedItemCount");
  const keywords = metadataStringList(metadata, "keywords");
  const articleExtraction = normalizedConfig(metadata.articleExtraction);

  if (method) {
    details.push({ label: "采集方式", value: method });
  }

  if (feedTitle) {
    details.push({ label: "Feed 标题", value: feedTitle });
  }

  if (rssAttemptCount !== null) {
    details.push({ label: "RSS 尝试", value: `${rssAttemptCount} 次` });
  }

  if (rssLastError) {
    details.push({ label: "上次 RSS 错误", value: rssLastError });
  }

  if (rssLastErrorCategory) {
    details.push({ label: "上次 RSS 错误归类", value: rssLastErrorCategory });
  }

  if (matchedItemCount !== null && filteredItemCount !== null && rawItemCount !== null) {
    details.push({
      label: "匹配结果",
      value: `${matchedItemCount} / ${filteredItemCount} / ${rawItemCount}`,
    });
  }

  if (keywords.length > 0) {
    details.push({ label: "关键词", value: keywords.join(", ") });
  }

  if (articleExtraction) {
    const attempted = metadataNumber(articleExtraction, "attemptedCount") ?? 0;
    const enriched = metadataNumber(articleExtraction, "enrichedCount") ?? 0;
    const failed = metadataNumber(articleExtraction, "failedCount") ?? 0;

    details.push({
      label: "正文抓取",
      value: `尝试 ${attempted}，成功 ${enriched}，失败 ${failed}`,
    });
  }

  return details;
}

export function formatJobMetadataText(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return trimmed;
    }
  }

  return JSON.stringify(value, null, 2);
}

function mapSource(source: RawSourceRow, latestJob: RawJobRunRow | null): AdminSourceRow {
  const failed = Boolean(source.lastError ?? latestJob?.errorMessage);
  const running = latestJob?.status === "RUNNING";
  const enabled = rawBoolean(source.enabled);
  const fetchIntervalMinutes = rawNumber(source.fetchIntervalMinutes);
  const rawUrl = source.url ?? "";

  return {
    canCollect: canCollectSourceType(source.type),
    configText: configText(source.config),
    enabled,
    fetchIntervalMinutes,
    id: source.id,
    name: source.name,
    sourceType: source.type,
    type: sourceTypeLabel(source.type),
    rawUrl,
    url: rawUrl || "未配置",
    interval: enabled ? `${fetchIntervalMinutes} 分钟` : "停用",
    owner: configString(source.config, ["owner", "category", "topic"], "未配置"),
    status: {
      label: enabled ? (running ? "运行中" : failed ? "有错误" : "启用") : "停用",
      tone: enabled ? (running ? "accent" : failed ? "warning" : "success") : "muted",
    },
    lastRun: latestJob
      ? `${formatTime(latestJob.finishedAt ?? latestJob.startedAt)} ${jobLabel(latestJob.status)}`
      : source.lastFetchedAt
        ? `${formatTime(source.lastFetchedAt)} 已抓取`
        : "暂无记录",
  };
}

function dateTimeMillis(date: Date | string | null | undefined) {
  if (!date) {
    return 0;
  }

  const dateValue = typeof date === "string" ? new Date(date) : date;
  const timestamp = dateValue.getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function jobRunTime(job: AdminSourceHealthInput["jobs"][number]) {
  return job.finishedAt ?? job.startedAt;
}

export function mapSourceHealth(input: AdminSourceHealthInput): AdminSourceHealthRow {
  const jobs = [...input.jobs].sort(
    (left, right) => dateTimeMillis(right.startedAt) - dateTimeMillis(left.startedAt),
  );
  const latestJob = jobs[0] ?? null;
  const latestSuccess = jobs.find((job) => job.status === "SUCCESS") ?? null;
  const latestFailure = jobs.find((job) => job.status === "FAILED") ?? null;
  const sourceError = input.lastError?.trim() ?? "";
  const lastError = latestFailure?.errorMessage?.trim() || sourceError;
  let consecutiveFailures = 0;

  for (const job of jobs) {
    if (job.status !== "FAILED") {
      break;
    }

    consecutiveFailures += 1;
  }

  const status =
    !input.enabled
      ? ({ label: "停用", tone: "muted" } as const)
      : latestJob?.status === "RUNNING"
        ? ({ label: "运行中", tone: "accent" } as const)
        : consecutiveFailures >= 3
          ? ({ label: "连续失败", tone: "danger" } as const)
          : consecutiveFailures > 0 || sourceError
            ? ({ label: "需处理", tone: "warning" } as const)
            : latestSuccess
              ? ({ label: "正常", tone: "success" } as const)
              : ({ label: "暂无运行", tone: "muted" } as const);

  return {
    consecutiveFailures,
    errorCategory: classifyRequestError(lastError),
    id: input.sourceId,
    lastError: lastError || "暂无错误",
    latestFailure: latestFailure ? formatDateTime(jobRunTime(latestFailure)) : sourceError ? "未记录" : "暂无失败",
    latestSuccess: latestSuccess ? formatDateTime(jobRunTime(latestSuccess)) : "暂无成功",
    name: input.sourceName,
    status,
  };
}

export function summarizeSourceErrorCategories(
  rows: AdminSourceHealthRow[],
): AdminSourceErrorCategoryRow[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (row.errorCategory === "暂无错误") {
      continue;
    }

    counts.set(row.errorCategory, (counts.get(row.errorCategory) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category));
}

function mapJob(job: RawJobRunRow): AdminJobRow {
  const sourceName = job.sourceName ? `，${job.sourceName}` : "";

  return {
    details: mapJobMetadataDetails(job.metadata),
    id: job.id,
    name: `${job.jobType}${sourceName}`,
    result: {
      label: jobLabel(job.status),
      tone: jobTone(job.status),
    },
    finishedAt: job.status === "RUNNING" ? "进行中" : formatDateTime(job.finishedAt),
    output: `${rawNumber(job.createdCount)} 条新增，${rawNumber(
      job.scannedCount,
    )} 条扫描，${rawNumber(job.skippedCount)} 条跳过`,
    rawMetadataText: formatJobMetadataText(job.metadata),
    summary: job.errorMessage ?? "任务已写入运行记录。",
  };
}

function mapUser(user: {
  id: string;
  email: string;
  role: string;
  updatedAt: Date;
  createdAt: Date;
}): AdminUserRow {
  return {
    id: user.id,
    email: user.email,
    role: user.role === "ADMIN" ? "管理员" : "只读成员",
    status: {
      label: "启用",
      tone: "success",
    },
    lastActive: formatDateTime(user.updatedAt ?? user.createdAt),
  };
}

export async function getAdminDashboardData(
  options: { jobs?: AdminJobFilterInput } = {},
): Promise<AdminDashboardData | null> {
  const prisma = await getPrisma();

  if (!prisma) {
    return null;
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const jobFilters = normalizeAdminJobFilters(options.jobs);
    const jobWhere = buildJobWhere(jobFilters);
    const jobOffset = (jobFilters.page - 1) * jobFilters.pageSize;
    const [
      sources,
      jobs,
      latestJobs,
      jobTypes,
      users,
      todayCandidates,
      pendingErrorRows,
      filteredJobCountRows,
    ] = await Promise.all([
      prisma.$queryRaw<RawSourceRow[]>`
        SELECT
          "id",
          "name",
          "type",
          "url",
          "config",
          "enabled",
          "fetchIntervalMinutes",
          "lastFetchedAt",
          "lastError"
        FROM "Source"
        ORDER BY "name" ASC
      `,
      prisma.$queryRawUnsafe<RawJobRunRow[]>(
        `
        SELECT
          "JobRun"."id",
          "JobRun"."jobType",
          "JobRun"."sourceId",
          "Source"."name" AS "sourceName",
          "JobRun"."status",
          "JobRun"."startedAt",
          "JobRun"."finishedAt",
          "JobRun"."scannedCount",
          "JobRun"."createdCount",
          "JobRun"."skippedCount",
          "JobRun"."errorMessage",
          "JobRun"."metadata"
        FROM "JobRun"
        LEFT JOIN "Source" ON "Source"."id" = "JobRun"."sourceId"
        ${jobWhere.sql}
        ORDER BY "JobRun"."startedAt" DESC
        LIMIT ? OFFSET ?
        `,
        ...jobWhere.args,
        jobFilters.pageSize,
        jobOffset,
      ),
      prisma.$queryRaw<RawJobRunRow[]>`
        SELECT
          "JobRun"."id",
          "JobRun"."jobType",
          "JobRun"."sourceId",
          "Source"."name" AS "sourceName",
          "JobRun"."status",
          "JobRun"."startedAt",
          "JobRun"."finishedAt",
          "JobRun"."scannedCount",
          "JobRun"."createdCount",
          "JobRun"."skippedCount",
          "JobRun"."errorMessage",
          "JobRun"."metadata"
        FROM "JobRun"
        LEFT JOIN "Source" ON "Source"."id" = "JobRun"."sourceId"
        WHERE "JobRun"."sourceId" IS NOT NULL
        ORDER BY "JobRun"."startedAt" DESC
        LIMIT 500
      `,
      prisma.$queryRaw<RawOptionRow[]>`
        SELECT DISTINCT "jobType" AS "value"
        FROM "JobRun"
        ORDER BY "jobType" ASC
      `,
      prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      }),
      prisma.candidateItem.count({
        where: {
          collectedAt: {
            gte: since,
          },
        },
      }),
      prisma.$queryRaw<RawCountRow[]>`
        SELECT COUNT(*) AS "count"
        FROM "JobRun"
        WHERE "status" = 'FAILED'
      `,
      prisma.$queryRawUnsafe<RawCountRow[]>(
        `
        SELECT COUNT(*) AS "count"
        FROM "JobRun"
        ${jobWhere.sql}
        `,
        ...jobWhere.args,
      ),
    ]);
    const latestJobsBySource = new Map<string, RawJobRunRow>();
    const healthJobsBySource = new Map<string, RawJobRunRow[]>();
    const totalJobCount = rawNumber(filteredJobCountRows[0]?.count ?? 0);
    const totalJobPages = Math.max(1, Math.ceil(totalJobCount / jobFilters.pageSize));

    for (const job of latestJobs) {
      if (!job.sourceId) {
        continue;
      }

      if (!latestJobsBySource.has(job.sourceId)) {
        latestJobsBySource.set(job.sourceId, job);
      }

      const healthJobs = healthJobsBySource.get(job.sourceId) ?? [];
      healthJobs.push(job);
      healthJobsBySource.set(job.sourceId, healthJobs);
    }

    const sourceHealth = sources.map((source) =>
      mapSourceHealth({
        enabled: rawBoolean(source.enabled),
        jobs: healthJobsBySource.get(source.id) ?? [],
        lastError: source.lastError,
        sourceId: source.id,
        sourceName: source.name,
      }),
    );

    return {
      jobFilterOptions: {
        jobTypes: jobTypes
          .map((item) => item.value)
          .filter((value): value is string => typeof value === "string" && Boolean(value)),
        sources: sources.map((source) => ({
          id: source.id,
          name: source.name,
        })),
        statuses: jobStatusOptions(),
      },
      jobFilters,
      jobPagination: {
        hasNextPage: jobFilters.page < totalJobPages,
        hasPreviousPage: jobFilters.page > 1,
        page: jobFilters.page,
        pageSize: jobFilters.pageSize,
        totalCount: totalJobCount,
        totalPages: totalJobPages,
      },
      summary: {
        enabledSources: sources.filter((source) => rawBoolean(source.enabled)).length,
        totalSources: sources.length,
        todayCandidates,
        dailySchedule: "08:00",
        pendingErrors: rawNumber(pendingErrorRows[0]?.count ?? 0),
      },
      sourceErrorCategories: summarizeSourceErrorCategories(sourceHealth),
      sourceHealth,
      sources: sources.map((source) => mapSource(source, latestJobsBySource.get(source.id) ?? null)),
      jobs: jobs.map(mapJob),
      users: users.map(mapUser),
    };
  } catch {
    return null;
  }
}

export async function getAdminSources() {
  const data = await getAdminDashboardData();

  return {
    summary: data?.summary ?? null,
    sources: data?.sources ?? [],
  };
}

export async function getAdminJobs(options: { jobs?: AdminJobFilterInput } = {}) {
  const data = await getAdminDashboardData(options);

  return {
    filters: data?.jobFilters ?? normalizeAdminJobFilters(),
    options: data?.jobFilterOptions ?? {
      jobTypes: [],
      sources: [],
      statuses: jobStatusOptions(),
    },
    pagination: data?.jobPagination ?? {
      hasNextPage: false,
      hasPreviousPage: false,
      page: 1,
      pageSize: JOB_PAGE_SIZE,
      totalCount: 0,
      totalPages: 1,
    },
    summary: data?.summary ?? null,
    jobs: data?.jobs ?? [],
  };
}
