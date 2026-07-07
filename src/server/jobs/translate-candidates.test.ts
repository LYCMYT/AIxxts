import assert from "node:assert/strict";
import test from "node:test";
import { DigestStatus } from "@/generated/prisma/client";
import { buildCandidateTranslationCandidateWhere } from "./translate-candidates";

test("buildCandidateTranslationCandidateWhere requires missing translations unless force is enabled", () => {
  const normalWhere = buildCandidateTranslationCandidateWhere({
    digestDate: "2026-07-07",
    force: false,
    selectedOnly: true,
  });

  assert.deepEqual(normalWhere.OR, [
    { translatedTitle: null },
    { translatedSummary: null },
    { translatedAt: null },
  ]);
  assert.deepEqual(normalWhere.digestItems, {
    some: {
      digest: {
        digestDate: "2026-07-07",
        status: {
          in: [DigestStatus.DRAFT, DigestStatus.PUBLISHED],
        },
      },
    },
  });

  const forceWhere = buildCandidateTranslationCandidateWhere({
    digestDate: "2026-07-07",
    force: true,
    selectedOnly: true,
  });

  assert.equal("OR" in forceWhere, false);
  assert.deepEqual(forceWhere.digestItems, normalWhere.digestItems);
});
