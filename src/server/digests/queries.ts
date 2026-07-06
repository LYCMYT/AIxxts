type PrismaClientLike = Awaited<typeof import("@/server/db/prisma")>["prisma"];

export type DigestSourceType =
  | "RSS"
  | "Blog"
  | "HN"
  | "Reddit"
  | "YouTube"
  | "GitHub"
  | "X"
  | "Douyin"
  | "Xiaohongshu"
  | "Manual";

export type HomeDigestItem = {
  id: string;
  rank: number;
  title: string;
  source: string;
  sourceType: DigestSourceType;
  publishedAt: string;
  signals: string;
  interpretation: string;
  url: string;
};

export type HomeDigestData = {
  dateLabel: string;
  generatedAt: string;
  taskStatus: string;
  candidateCount: number;
  selectedCount: number;
  lastSuccessDate: string;
  items: HomeDigestItem[];
};

export const homeDigestPreviewStatuses = ["PUBLISHED", "DRAFT"] as const;

type HomeDigestPreviewStatus = (typeof homeDigestPreviewStatuses)[number];

export type DigestStatusView = "success" | "running" | "failed" | "empty";

export type DigestItemPreviewData = {
  id: string;
  rank: number;
  title: string;
  source: string;
  sourceType: DigestSourceType;
  publishedAt: string;
  interpretation: string;
  signals: string;
  originalUrl: string;
};

export type DailyDigestData = {
  date: string;
  weekday: string;
  generatedAt: string;
  duration: string;
  status: DigestStatusView;
  statusLabel: string;
  selectedCount: number;
  candidateCount: number;
  failedCount: number;
  summary: string;
  error?: string;
  items: DigestItemPreviewData[];
};

export type DigestJobSummary = {
  id: string;
  name: string;
  status: DigestStatusView;
  statusLabel: string;
  finishedAt: string;
  output: string;
  summary: string;
};

export type DigestArchiveData = {
  digests: DailyDigestData[];
  jobRuns: DigestJobSummary[];
};

export type ItemDetailData = {
  id: string;
  title: string;
  source: string;
  sourceType: string;
  sourceUrl: string;
  originalUrl: string;
  publishedAt: string;
  collectedAt: string;
  digestDate: string;
  digestRank: number;
  author: string;
  originalSummary: string;
  selectionReason: string;
  aiInterpretation: string;
  llmSignals: string[];
  interactions: {
    label: string;
    value: string;
    note: string;
  }[];
  duplicateSources: {
    name: string;
    type: string;
    publishedAt: string;
    note: string;
    url: string;
  }[];
  supplementalSources: {
    name: string;
    type: string;
    publishedAt: string;
    note: string;
    url: string;
  }[];
  rawStatus: "ready" | "failed";
  rawStatusNote: string;
};

type RawJobRunRow = {
  id: string;
  jobType: string;
  status: string;
  finishedAt: Date | string | null;
  scannedCount: number | bigint;
  createdCount: number | bigint;
  skippedCount: number | bigint;
  errorMessage: string | null;
  sourceName: string | null;
};

const APP_TIME_ZONE = "America/New_York";

const sourceTypeMap: Record<string, DigestSourceType> = {
  RSS: "RSS",
  OFFICIAL_BLOG: "Blog",
  HACKER_NEWS: "HN",
  REDDIT: "Reddit",
  YOUTUBE: "YouTube",
  GITHUB: "GitHub",
  X: "X",
  DOUYIN: "Douyin",
  XIAOHONGSHU: "Xiaohongshu",
  MANUAL: "Manual",
};

async function getPrisma(): Promise<PrismaClientLike | null> {
  try {
    const prismaModule = await import("@/server/db/prisma");
    return prismaModule.prisma;
  } catch {
    return null;
  }
}

function dateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "1970",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    day: parts.find((part) => part.type === "day")?.value ?? "01",
  };
}

function todayDateKey() {
  const parts = dateParts(new Date());
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}

function formatWeekday(dateKey: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
  }).format(new Date(`${dateKey}T12:00:00.000Z`));
}

function formatTime(date: Date | null | undefined) {
  if (!date) {
    return "未生成";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
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

function formatDuration(startedAt: Date | null | undefined, finishedAt: Date | null | undefined) {
  if (!startedAt || !finishedAt) {
    return "无";
  }

  const seconds = Math.max(0, Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  if (minutes === 0) {
    return `${rest} 秒`;
  }

  return `${minutes} 分 ${rest} 秒`;
}

function rawNumber(value: number | bigint) {
  return typeof value === "bigint" ? Number(value) : value;
}

function mapSourceType(type: string | null | undefined): DigestSourceType {
  return type ? sourceTypeMap[type] ?? "RSS" : "RSS";
}

function statusView(status: string): DigestStatusView {
  if (status === "PUBLISHED" || status === "SUCCESS") {
    return "success";
  }

  if (status === "FAILED") {
    return "failed";
  }

  if (status === "RUNNING") {
    return "running";
  }

  return "empty";
}

function statusLabel(status: DigestStatusView) {
  const labels: Record<DigestStatusView, string> = {
    success: "生成成功",
    running: "生成中",
    failed: "生成失败",
    empty: "暂无日报",
  };

  return labels[status];
}

export function getHomeDigestTaskStatus(status: HomeDigestPreviewStatus) {
  const labels: Record<HomeDigestPreviewStatus, string> = {
    PUBLISHED: "已发布",
    DRAFT: "草稿预览",
  };

  return labels[status];
}

function jsonToRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readableValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function compactText(value: unknown, maxLength = 140) {
  const text = readableValue(value).replace(/\s+/g, " ").trim();

  if (!text) {
    return "";
  }

  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}...`;
}

function recordSignalParts(record: Record<string, unknown>) {
  const parts = [
    typeof record.impactReason === "string" && record.impactReason.trim()
      ? `影响力：${compactText(record.impactReason)}`
      : "",
    typeof record.heatReason === "string" && record.heatReason.trim()
      ? `热度：${compactText(record.heatReason)}`
      : "",
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts;
  }

  const engagementParts = [
    typeof record.stars === "number" ? `${record.stars} stars` : "",
    typeof record.forks === "number" ? `${record.forks} forks` : "",
    typeof record.releaseDownloads === "number" ? `${record.releaseDownloads} downloads` : "",
  ].filter(Boolean);

  if (engagementParts.length > 0) {
    return [`GitHub 热度：${engagementParts.join("，")}`];
  }

  return [];
}

function signalsText(value: unknown, fallback = "暂无结构化信号") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const text = value.map(readableValue).filter(Boolean).join("，");
    return text || fallback;
  }

  const record = jsonToRecord(value);
  if (!record) {
    return fallback;
  }

  const preferredParts = recordSignalParts(record);
  if (preferredParts.length > 0) {
    return preferredParts.join("；");
  }

  const text = Object.entries(record)
    .filter(([key]) => !["method", "model", "sourceType", "publishedAt"].includes(key))
    .map(([key, item]) => `${key}: ${compactText(item, 80)}`)
    .filter(Boolean)
    .join("，");

  return text || fallback;
}

function signalTags(value: unknown) {
  if (!value) {
    return ["暂无结构化信号"];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    const tags = value.map(readableValue).filter(Boolean);
    return tags.length > 0 ? tags : ["暂无结构化信号"];
  }

  const record = jsonToRecord(value);
  if (!record) {
    return ["暂无结构化信号"];
  }

  const preferredParts = recordSignalParts(record);
  if (preferredParts.length > 0) {
    return preferredParts;
  }

  const tags = Object.entries(record)
    .filter(([key]) => !["method", "model", "sourceType", "publishedAt"].includes(key))
    .map(([key, item]) => `${key}: ${compactText(item, 80)}`)
    .filter(Boolean);

  return tags.length > 0 ? tags : ["暂无结构化信号"];
}

function digestItemToPreview(item: {
  rank: number;
  titleSnapshot: string;
  sourceSnapshot: string;
  urlSnapshot: string;
  interpretation: string;
  signals: unknown;
  candidate: {
    id: string;
    publishedAt: Date;
    source: {
      type: string;
    };
  };
}): DigestItemPreviewData {
  return {
    id: item.candidate.id,
    rank: item.rank,
    title: item.titleSnapshot,
    source: item.sourceSnapshot,
    sourceType: mapSourceType(item.candidate.source.type),
    publishedAt: formatDateTime(item.candidate.publishedAt),
    interpretation: item.interpretation,
    signals: signalsText(item.signals),
    originalUrl: item.urlSnapshot,
  };
}

export function digestItemToHome(item: {
  rank: number;
  titleSnapshot: string;
  sourceSnapshot: string;
  urlSnapshot: string;
  interpretation: string;
  signals: unknown;
  candidate: {
    id: string;
    publishedAt: Date;
    source: {
      type: string;
    };
  };
}): HomeDigestItem {
  return {
    id: item.candidate.id,
    rank: item.rank,
    title: item.titleSnapshot,
    source: item.sourceSnapshot,
    sourceType: mapSourceType(item.candidate.source.type),
    publishedAt: formatTime(item.candidate.publishedAt),
    signals: signalsText(item.signals),
    interpretation: item.interpretation,
    url: item.urlSnapshot,
  };
}

function digestToView(digest: {
  digestDate: string;
  status: string;
  title: string;
  summary: string | null;
  generatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    rank: number;
    titleSnapshot: string;
    sourceSnapshot: string;
    urlSnapshot: string;
    interpretation: string;
    signals: unknown;
    candidate: {
      id: string;
      publishedAt: Date;
      source: {
        type: string;
      };
    };
  }>;
}): DailyDigestData {
  const viewStatus = statusView(digest.status);

  return {
    date: digest.digestDate,
    weekday: formatWeekday(digest.digestDate),
    generatedAt: formatTime(digest.generatedAt ?? digest.updatedAt),
    duration: formatDuration(digest.createdAt, digest.generatedAt ?? digest.updatedAt),
    status: viewStatus,
    statusLabel: statusLabel(viewStatus),
    selectedCount: digest.items.length,
    candidateCount: digest.items.length,
    failedCount: viewStatus === "failed" ? 1 : 0,
    summary: digest.summary ?? digest.title,
    error: viewStatus === "failed" ? digest.summary ?? "日报生成失败，请查看任务日志。" : undefined,
    items: digest.items.map(digestItemToPreview),
  };
}

function jobToSummary(job: {
  id: string;
  jobType: string;
  status: string;
  finishedAt: Date | null;
  scannedCount: number;
  createdCount: number;
  skippedCount: number;
  errorMessage: string | null;
  source: {
    name: string;
  } | null;
}): DigestJobSummary {
  const viewStatus = statusView(job.status);
  const sourceName = job.source ? `，${job.source.name}` : "";

  return {
    id: job.id,
    name: `${job.jobType}${sourceName}`,
    status: viewStatus,
    statusLabel: statusLabel(viewStatus),
    finishedAt: viewStatus === "running" ? "进行中" : formatDateTime(job.finishedAt),
    output: `${job.createdCount} 条新增，${job.scannedCount} 条扫描，${job.skippedCount} 条跳过`,
    summary: job.errorMessage ?? "任务已写入运行摘要。",
  };
}

function rawJobToSummary(job: RawJobRunRow): DigestJobSummary {
  return jobToSummary({
    id: job.id,
    jobType: job.jobType,
    status: job.status,
    finishedAt: typeof job.finishedAt === "string" ? new Date(job.finishedAt) : job.finishedAt,
    scannedCount: rawNumber(job.scannedCount),
    createdCount: rawNumber(job.createdCount),
    skippedCount: rawNumber(job.skippedCount),
    errorMessage: job.errorMessage,
    source: job.sourceName
      ? {
          name: job.sourceName,
        }
      : null,
  });
}

export async function getTodayPublishedDigestHome(): Promise<HomeDigestData | null> {
  const prisma = await getPrisma();

  if (!prisma) {
    return null;
  }

  try {
    const today = todayDateKey();
    const digests = await prisma.dailyDigest.findMany({
      where: {
        digestDate: today,
        status: {
          in: [...homeDigestPreviewStatuses],
        },
      },
      include: {
        items: {
          orderBy: {
            rank: "asc",
          },
          include: {
            candidate: {
              include: {
                source: true,
              },
            },
          },
        },
      },
    });
    const digest = homeDigestPreviewStatuses
      .map((status) => digests.find((item) => item.status === status))
      .find((item) => item !== undefined);

    if (!digest) {
      return null;
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [candidateCount, latestSuccess] = await Promise.all([
      prisma.candidateItem.count({
        where: {
          publishedAt: {
            gte: since,
          },
        },
      }),
      prisma.dailyDigest.findFirst({
        where: {
          status: "PUBLISHED",
        },
        orderBy: {
          digestDate: "desc",
        },
      }),
    ]);

    return {
      dateLabel: formatDateLabel(digest.digestDate),
      generatedAt: formatTime(digest.generatedAt ?? digest.updatedAt),
      taskStatus: getHomeDigestTaskStatus(digest.status as HomeDigestPreviewStatus),
      candidateCount,
      selectedCount: digest.items.length,
      lastSuccessDate: latestSuccess ? formatDateLabel(latestSuccess.digestDate) : "暂无成功日报",
      items: digest.items.map(digestItemToHome),
    };
  } catch {
    return null;
  }
}

export async function getDigestArchive(): Promise<DigestArchiveData> {
  const empty: DigestArchiveData = {
    digests: [],
    jobRuns: [],
  };
  const prisma = await getPrisma();

  if (!prisma) {
    return empty;
  }

  try {
    const [digests, jobRuns] = await Promise.all([
      prisma.dailyDigest.findMany({
        orderBy: {
          digestDate: "desc",
        },
        take: 10,
        include: {
          items: {
            orderBy: {
              rank: "asc",
            },
            include: {
              candidate: {
                include: {
                  source: true,
                },
              },
            },
          },
        },
      }),
      prisma.$queryRaw<RawJobRunRow[]>`
        SELECT
          "JobRun"."id",
          "JobRun"."jobType",
          "JobRun"."status",
          "JobRun"."finishedAt",
          "JobRun"."scannedCount",
          "JobRun"."createdCount",
          "JobRun"."skippedCount",
          "JobRun"."errorMessage",
          "Source"."name" AS "sourceName"
        FROM "JobRun"
        LEFT JOIN "Source" ON "Source"."id" = "JobRun"."sourceId"
        ORDER BY "JobRun"."startedAt" DESC
        LIMIT 8
      `,
    ]);

    return {
      digests: digests.map(digestToView),
      jobRuns: jobRuns.map(rawJobToSummary),
    };
  } catch {
    return empty;
  }
}

export async function getDigestByDate(date: string): Promise<DailyDigestData | null> {
  const prisma = await getPrisma();

  if (!prisma) {
    return null;
  }

  try {
    const digest = await prisma.dailyDigest.findUnique({
      where: {
        digestDate: date,
      },
      include: {
        items: {
          orderBy: {
            rank: "asc",
          },
          include: {
            candidate: {
              include: {
                source: true,
              },
            },
          },
        },
      },
    });

    return digest ? digestToView(digest) : null;
  } catch {
    return null;
  }
}

function relatedSourceFromCandidate(candidate: {
  title: string;
  canonicalUrl: string;
  publishedAt: Date;
  summary: string | null;
  source: {
    name: string;
    type: string;
  };
}) {
  return {
    name: candidate.source.name,
    type: mapSourceType(candidate.source.type),
    publishedAt: formatDateTime(candidate.publishedAt),
    note: candidate.summary ?? candidate.title,
    url: candidate.canonicalUrl,
  };
}

export async function getItemDetailById(id: string): Promise<ItemDetailData | null> {
  const prisma = await getPrisma();

  if (!prisma) {
    return null;
  }

  try {
    const item = await prisma.candidateItem.findFirst({
      where: {
        OR: [
          {
            id,
          },
          {
            digestItems: {
              some: {
                id,
              },
            },
          },
        ],
      },
      include: {
        source: true,
        duplicateOf: {
          include: {
            source: true,
          },
        },
        duplicates: {
          include: {
            source: true,
          },
        },
        digestItems: {
          orderBy: {
            rank: "asc",
          },
          include: {
            digest: true,
          },
        },
      },
    });

    if (!item) {
      return null;
    }

    const publishedDigestItem =
      item.digestItems.find((digestItem) => digestItem.digest.status === "PUBLISHED") ??
      item.digestItems[0] ??
      null;
    const rawEngagement = jsonToRecord(item.rawEngagement);
    const digestSignals = publishedDigestItem ? signalTags(publishedDigestItem.signals) : [];
    const duplicateSources = [
      ...(item.duplicateOf ? [relatedSourceFromCandidate(item.duplicateOf)] : []),
      ...item.duplicates.map(relatedSourceFromCandidate),
    ];

    return {
      id: item.id,
      title: item.title,
      source: item.source.name,
      sourceType: mapSourceType(item.source.type),
      sourceUrl: item.source.url ?? item.canonicalUrl,
      originalUrl: item.canonicalUrl,
      publishedAt: formatDateTime(item.publishedAt),
      collectedAt: formatDateTime(item.collectedAt),
      digestDate: publishedDigestItem?.digest.digestDate ?? "未入选日报",
      digestRank: publishedDigestItem?.rank ?? 0,
      author: item.author ?? "未记录作者",
      originalSummary: item.summary ?? item.contentText ?? "暂无原文摘要。",
      selectionReason:
        publishedDigestItem?.interpretation ?? item.summary ?? "该候选内容尚未进入已发布日报。",
      aiInterpretation:
        publishedDigestItem?.interpretation ?? item.summary ?? "当前条目暂无日报解读。",
      llmSignals: digestSignals.length > 0 ? digestSignals : ["暂无日报信号"],
      interactions: [
        {
          label: "热度分",
          value: item.hotScore === null ? "未评分" : item.hotScore.toFixed(1),
          note: "来自候选内容评分",
        },
        {
          label: "影响力分",
          value: item.influenceScore === null ? "未评分" : item.influenceScore.toFixed(1),
          note: "来自来源和传播判断",
        },
        {
          label: "日报分",
          value:
            publishedDigestItem?.score === null || publishedDigestItem?.score === undefined
              ? "未评分"
              : publishedDigestItem.score.toFixed(1),
          note: "来自日报条目排序",
        },
        {
          label: "重复来源",
          value: String(duplicateSources.length),
          note: rawEngagement ? signalsText(rawEngagement, "已记录互动数据") : "数据库关系统计",
        },
      ],
      duplicateSources,
      supplementalSources: [],
      rawStatus: item.contentText || item.summary || item.rawPayload ? "ready" : "failed",
      rawStatusNote:
        item.contentText || item.summary || item.rawPayload
          ? "原文摘要、正文或原始载荷已写入数据库。"
          : "数据库中暂未写入原文正文或原始载荷。",
    };
  } catch {
    return null;
  }
}
