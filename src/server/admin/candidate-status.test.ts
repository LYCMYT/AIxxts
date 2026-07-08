import assert from "node:assert/strict";
import test from "node:test";
import { CandidateStatus } from "@/generated/prisma/client";
import {
  normalizeAdminCandidateStatusActionInput,
  updateAdminCandidateStatuses,
} from "./candidates";

test("normalizeAdminCandidateStatusActionInput trims and deduplicates candidate ids", () => {
  assert.deepEqual(
    normalizeAdminCandidateStatusActionInput({
      action: "archive",
      candidateIds: [" candidate-1 ", "candidate-1", "candidate-2"],
    }),
    {
      action: "archive",
      candidateIds: ["candidate-1", "candidate-2"],
      status: CandidateStatus.ARCHIVED,
    },
  );
});

test("normalizeAdminCandidateStatusActionInput rejects invalid status actions", () => {
  assert.throws(
    () =>
      normalizeAdminCandidateStatusActionInput({
        action: "delete",
        candidateIds: ["candidate-1"],
      }),
    /action must be archive, reject, or restore/,
  );
});

test("updateAdminCandidateStatuses writes the mapped candidate status", async () => {
  const calls: Array<{
    candidateIds: string[];
    status: CandidateStatus;
  }> = [];

  const result = await updateAdminCandidateStatuses(
    {
      action: "reject",
      candidateIds: ["candidate-1", "candidate-2"],
    },
    {
      updateCandidateStatuses: async (candidateIds, status) => {
        calls.push({ candidateIds, status });

        return 2;
      },
    },
  );

  assert.deepEqual(calls, [
    {
      candidateIds: ["candidate-1", "candidate-2"],
      status: CandidateStatus.REJECTED,
    },
  ]);
  assert.deepEqual(result, {
    action: "reject",
    requestedCount: 2,
    status: CandidateStatus.REJECTED,
    updatedCount: 2,
  });
});
