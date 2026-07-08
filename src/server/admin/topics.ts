import { prisma } from "@/server/db/prisma";
import { normalizeTopicTags, topicSlug } from "@/server/ranking/topics";

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

export type AdminCandidateTopicEditDeps = {
  deleteCandidateTopic: (candidateId: string, topicId: string) => Promise<void>;
  findCandidateById: (candidateId: string) => Promise<{ id: string } | null>;
  listCandidateTopicsByCandidate: (candidateId: string) => Promise<AdminCandidateTopicRecord[]>;
  upsertCandidateTopic: (link: AdminCandidateTopicRecord) => Promise<void>;
  upsertTopicByLabel: (label: string) => Promise<AdminTopicRecord>;
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

const defaultCandidateTopicEditDeps: AdminCandidateTopicEditDeps = {
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
  findCandidateById: async (candidateId) =>
    await prisma.candidateItem.findUnique({
      select: {
        id: true,
      },
      where: {
        id: candidateId,
      },
    }),
  listCandidateTopicsByCandidate: async (candidateId) =>
    await prisma.candidateTopic.findMany({
      where: {
        candidateId,
      },
    }),
  upsertCandidateTopic: async (link) => {
    await prisma.candidateTopic.upsert({
      where: {
        candidateId_topicId: {
          candidateId: link.candidateId,
          topicId: link.topicId,
        },
      },
      create: {
        candidateId: link.candidateId,
        confidence: link.confidence,
        source: link.source,
        topicId: link.topicId,
      },
      update: {
        confidence: link.confidence,
        source: link.source,
      },
    });
  },
  upsertTopicByLabel: async (label) =>
    await prisma.topicTag.upsert({
      where: {
        slug: topicSlug(label),
      },
      create: {
        label,
        slug: topicSlug(label),
      },
      update: {
        label,
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

export function normalizeCandidateTopicLabelsInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminTopicActionError("request body must be a JSON object.", 400);
  }

  const topicLabels = (value as Record<string, unknown>).topicLabels;

  if (!Array.isArray(topicLabels)) {
    throw new AdminTopicActionError("topicLabels must be an array.", 400);
  }

  if (topicLabels.some((label) => typeof label !== "string")) {
    throw new AdminTopicActionError("topicLabels must contain only strings.", 400);
  }

  return normalizeTopicTags(topicLabels);
}

export async function updateAdminCandidateTopics(
  candidateIdValue: string | null | undefined,
  value: unknown,
  deps: AdminCandidateTopicEditDeps = defaultCandidateTopicEditDeps,
) {
  const candidateId = candidateIdValue?.trim();

  if (!candidateId) {
    throw new AdminTopicActionError("candidate id is required.", 400);
  }

  const topicLabels = normalizeCandidateTopicLabelsInput(value);
  const candidate = await deps.findCandidateById(candidateId);

  if (!candidate) {
    throw new AdminTopicActionError("candidate not found.", 404);
  }

  const [existingLinks, desiredTopics] = await Promise.all([
    deps.listCandidateTopicsByCandidate(candidate.id),
    Promise.all(topicLabels.map((label) => deps.upsertTopicByLabel(label))),
  ]);
  const desiredTopicIds = new Set(desiredTopics.map((topic) => topic.id));

  for (const topic of desiredTopics) {
    await deps.upsertCandidateTopic({
      candidateId: candidate.id,
      confidence: null,
      createdAt: new Date(),
      source: "manual",
      topicId: topic.id,
    });
  }

  for (const link of existingLinks) {
    if (!desiredTopicIds.has(link.topicId)) {
      await deps.deleteCandidateTopic(candidate.id, link.topicId);
    }
  }

  return {
    candidateId: candidate.id,
    topicLabels,
    updatedCount: desiredTopics.length,
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
