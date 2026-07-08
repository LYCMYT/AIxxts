import { CandidateStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

const MAX_CANDIDATE_STATUS_BATCH_SIZE = 50;

export type AdminCandidateStatusAction = "archive" | "reject" | "restore";

export type AdminCandidateStatusInput = {
  action: AdminCandidateStatusAction;
  candidateIds: string[];
  status: CandidateStatus;
};

export type AdminCandidateStatusUpdateDeps = {
  updateCandidateStatuses: (
    candidateIds: string[],
    status: CandidateStatus,
  ) => Promise<number>;
};

export type AdminCandidateStatusUpdateResult = {
  action: AdminCandidateStatusAction;
  requestedCount: number;
  status: CandidateStatus;
  updatedCount: number;
};

const candidateStatusByAction: Record<AdminCandidateStatusAction, CandidateStatus> = {
  archive: CandidateStatus.ARCHIVED,
  reject: CandidateStatus.REJECTED,
  restore: CandidateStatus.NEW,
};

const defaultCandidateStatusUpdateDeps: AdminCandidateStatusUpdateDeps = {
  updateCandidateStatuses: async (candidateIds, status) => {
    const result = await prisma.candidateItem.updateMany({
      data: {
        status,
      },
      where: {
        id: {
          in: candidateIds,
        },
      },
    });

    return result.count;
  },
};

export class AdminCandidateActionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminCandidateActionError";
  }
}

function stringArray(value: unknown, fieldName: string) {
  if (!Array.isArray(value)) {
    throw new AdminCandidateActionError(`${fieldName} must be an array.`, 400);
  }

  if (value.some((item) => typeof item !== "string")) {
    throw new AdminCandidateActionError(`${fieldName} must contain only strings.`, 400);
  }

  return value.map((item) => item.trim()).filter(Boolean);
}

export function normalizeAdminCandidateStatusActionInput(
  value: unknown,
): AdminCandidateStatusInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminCandidateActionError("request body must be a JSON object.", 400);
  }

  const body = value as Record<string, unknown>;
  const action = body.action;

  if (
    action !== "archive" &&
    action !== "reject" &&
    action !== "restore"
  ) {
    throw new AdminCandidateActionError(
      "action must be archive, reject, or restore.",
      400,
    );
  }

  const candidateIds = Array.from(new Set(stringArray(body.candidateIds, "candidateIds")));

  if (candidateIds.length === 0) {
    throw new AdminCandidateActionError("candidateIds must include at least one id.", 400);
  }

  if (candidateIds.length > MAX_CANDIDATE_STATUS_BATCH_SIZE) {
    throw new AdminCandidateActionError(
      `candidateIds cannot contain more than ${MAX_CANDIDATE_STATUS_BATCH_SIZE} ids.`,
      400,
    );
  }

  return {
    action,
    candidateIds,
    status: candidateStatusByAction[action],
  };
}

export async function updateAdminCandidateStatuses(
  value: unknown,
  deps: AdminCandidateStatusUpdateDeps = defaultCandidateStatusUpdateDeps,
): Promise<AdminCandidateStatusUpdateResult> {
  const input = normalizeAdminCandidateStatusActionInput(value);
  const updatedCount = await deps.updateCandidateStatuses(input.candidateIds, input.status);

  return {
    action: input.action,
    requestedCount: input.candidateIds.length,
    status: input.status,
    updatedCount,
  };
}

export function candidateActionErrorResponse(error: unknown) {
  if (error instanceof AdminCandidateActionError) {
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
      error: error instanceof Error ? error.message : "candidate action failed.",
    },
    {
      status: 500,
    },
  );
}
