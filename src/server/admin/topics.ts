import { prisma } from "@/server/db/prisma";

const APP_TIME_ZONE = "America/New_York";

export type AdminTopicRow = {
  candidateCount: number;
  createdAt: string;
  id: string;
  label: string;
  slug: string;
};

export type AdminTopicRecord = {
  id: string;
  label: string;
  slug: string;
};

export type AdminCandidateTopicRecord = {
  candidateId: string;
  confidence: number | null;
  createdAt: Date;
  source: string;
  topicId: string;
};

export type AdminTopicActionDeps = {
  createCandidateTopic: (link: AdminCandidateTopicRecord) => Promise<void>;
  deleteCandidateTopic: (candidateId: string, topicId: string) => Promise<void>;
  deleteTopic: (topicId: string) => Promise<void>;
  findCandidateTopic: (
    candidateId: string,
    topicId: string,
  ) => Promise<AdminCandidateTopicRecord | null>;
  findTopicById: (topicId: string) => Promise<AdminTopicRecord | null>;
  listCandidateTopics: (topicId: string) => Promise<AdminCandidateTopicRecord[]>;
};

export type MergeTopicsResult = {
  deletedTopicLabel: string;
  movedCount: number;
  skippedDuplicateCount: number;
  sourceTopicId: string;
  targetTopicId: string;
  targetTopicLabel: string;
};

const defaultDeps: AdminTopicActionDeps = {
  createCandidateTopic: async (link) => {
    await prisma.candidateTopic.create({
      data: {
        candidateId: link.candidateId,
        confidence: link.confidence,
        createdAt: link.createdAt,
        source: link.source,
        topicId: link.topicId,
      },
    });
  },
  deleteCandidateTopic: async (candidateId, topicId) => {
    await prisma.candidateTopic.delete({
      where: {
        candidateId_topicId: {
          candidateId,
          topicId,
        },
      },
    });
  },
  deleteTopic: async (topicId) => {
    await prisma.topicTag.delete({
      where: {
        id: topicId,
      },
    });
  },
  findCandidateTopic: async (candidateId, topicId) =>
    await prisma.candidateTopic.findUnique({
      where: {
        candidateId_topicId: {
          candidateId,
          topicId,
        },
      },
    }),
  findTopicById: async (topicId) =>
    await prisma.topicTag.findUnique({
      select: {
        id: true,
        label: true,
        slug: true,
      },
      where: {
        id: topicId,
      },
    }),
  listCandidateTopics: async (topicId) =>
    await prisma.candidateTopic.findMany({
      where: {
        topicId,
      },
    }),
};

export class AdminTopicActionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminTopicActionError";
  }
}

export async function getAdminTopicRows(): Promise<AdminTopicRow[]> {
  const topics = await prisma.topicTag.findMany({
    include: {
      _count: {
        select: {
          candidates: true,
        },
      },
    },
    orderBy: {
      label: "asc",
    },
  });

  return topics
    .map((topic) => ({
      candidateCount: topic._count.candidates,
      createdAt: formatDateTime(topic.createdAt),
      id: topic.id,
      label: topic.label,
      slug: topic.slug,
    }))
    .sort((left, right) => right.candidateCount - left.candidateCount || left.label.localeCompare(right.label));
}

export function normalizeMergeTopicsInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminTopicActionError("request body must be a JSON object.", 400);
  }

  const body = value as Record<string, unknown>;
  const sourceTopicId = stringId(body, "sourceTopicId");
  const targetTopicId = stringId(body, "targetTopicId");

  if (sourceTopicId === targetTopicId) {
    throw new AdminTopicActionError("sourceTopicId and targetTopicId must be different.", 400);
  }

  return {
    sourceTopicId,
    targetTopicId,
  };
}

export async function mergeAdminTopics(
  value: unknown,
  deps: AdminTopicActionDeps = defaultDeps,
): Promise<MergeTopicsResult> {
  const input = normalizeMergeTopicsInput(value);
  const [sourceTopic, targetTopic] = await Promise.all([
    deps.findTopicById(input.sourceTopicId),
    deps.findTopicById(input.targetTopicId),
  ]);

  if (!sourceTopic) {
    throw new AdminTopicActionError("source topic not found.", 404);
  }

  if (!targetTopic) {
    throw new AdminTopicActionError("target topic not found.", 404);
  }

  const links = await deps.listCandidateTopics(sourceTopic.id);
  let movedCount = 0;
  let skippedDuplicateCount = 0;

  for (const link of links) {
    const existingTargetLink = await deps.findCandidateTopic(link.candidateId, targetTopic.id);

    if (existingTargetLink) {
      skippedDuplicateCount += 1;
      await deps.deleteCandidateTopic(link.candidateId, sourceTopic.id);
      continue;
    }

    await deps.createCandidateTopic({
      ...link,
      topicId: targetTopic.id,
    });
    await deps.deleteCandidateTopic(link.candidateId, sourceTopic.id);
    movedCount += 1;
  }

  await deps.deleteTopic(sourceTopic.id);

  return {
    deletedTopicLabel: sourceTopic.label,
    movedCount,
    skippedDuplicateCount,
    sourceTopicId: sourceTopic.id,
    targetTopicId: targetTopic.id,
    targetTopicLabel: targetTopic.label,
  };
}

export function topicActionErrorResponse(error: unknown) {
  if (error instanceof AdminTopicActionError) {
    return Response.json(
      {
        error: error.message,
      },
      {
        status: error.status,
      },
    );
  }

  return Response.json(
    {
      error: error instanceof Error ? error.message : String(error),
    },
    {
      status: 500,
    },
  );
}

function stringId(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new AdminTopicActionError(`${key} is required.`, 400);
  }

  return value.trim();
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
