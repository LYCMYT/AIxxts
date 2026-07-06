import { COLLECTABLE_SOURCE_TYPES } from "@/server/collectors/types";

type PrismaClientLike = Awaited<typeof import("@/server/db/prisma")>["prisma"];

type BadgeTone = "success" | "danger" | "warning" | "muted" | "accent";

export type AdminSourceRow = {
  canCollect: boolean;
  enabled: boolean;
  id: string;
  name: string;
  type: string;
  url: string;
  interval: string;
  owner: string;
  status: {
    label: string;
    tone: BadgeTone;
  };
  lastRun: string;
};

export type AdminJobRow = {
  id: string;
  name: string;
  result: {
    label: string;
    tone: BadgeTone;
  };
  finishedAt: string;
  output: string;
  summary: string;
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
  summary: {
    enabledSources: number;
    totalSources: number;
    todayCandidates: number;
    dailySchedule: string;
    pendingErrors: number;
  };
  sources: AdminSourceRow[];
  jobs: AdminJobRow[];
  users: AdminUserRow[];
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
};

type RawCountRow = {
  count: number | bigint;
};

const APP_TIME_ZONE = "America/New_York";

const sourceTypeLabels: Record<string, string> = {
  RSS: "RSS",
  OFFICIAL_BLOG: "官方博客",
  HACKER_NEWS: "Hacker News",
  REDDIT: "Reddit",
  YOUTUBE: "YouTube",
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

function configString(value: unknown, keys: string[], fallback: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const record = value as Record<string, unknown>;

  for (const key of keys) {
    const item = record[key];

    if (typeof item === "string" && item.trim()) {
      return item;
    }
  }

  return fallback;
}

function mapSource(source: RawSourceRow, latestJob: RawJobRunRow | null): AdminSourceRow {
  const failed = Boolean(source.lastError ?? latestJob?.errorMessage);
  const running = latestJob?.status === "RUNNING";
  const enabled = rawBoolean(source.enabled);

  return {
    canCollect: canCollectSourceType(source.type),
    enabled,
    id: source.id,
    name: source.name,
    type: sourceTypeLabel(source.type),
    url: source.url ?? "未配置",
    interval: enabled ? `${rawNumber(source.fetchIntervalMinutes)} 分钟` : "停用",
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

function mapJob(job: RawJobRunRow): AdminJobRow {
  const sourceName = job.sourceName ? `，${job.sourceName}` : "";

  return {
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

export async function getAdminDashboardData(): Promise<AdminDashboardData | null> {
  const prisma = await getPrisma();

  if (!prisma) {
    return null;
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [sources, jobs, users, todayCandidates, pendingErrorRows] = await Promise.all([
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
          "JobRun"."errorMessage"
        FROM "JobRun"
        LEFT JOIN "Source" ON "Source"."id" = "JobRun"."sourceId"
        ORDER BY "JobRun"."startedAt" DESC
        LIMIT 10
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
    ]);
    const latestJobsBySource = new Map<string, RawJobRunRow>();

    for (const job of jobs) {
      if (job.sourceId && !latestJobsBySource.has(job.sourceId)) {
        latestJobsBySource.set(job.sourceId, job);
      }
    }

    return {
      summary: {
        enabledSources: sources.filter((source) => rawBoolean(source.enabled)).length,
        totalSources: sources.length,
        todayCandidates,
        dailySchedule: "08:00",
        pendingErrors: rawNumber(pendingErrorRows[0]?.count ?? 0),
      },
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

export async function getAdminJobs() {
  const data = await getAdminDashboardData();

  return {
    summary: data?.summary ?? null,
    jobs: data?.jobs ?? [],
  };
}
