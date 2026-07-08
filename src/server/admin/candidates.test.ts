import assert from "node:assert/strict";
import test from "node:test";
import { DigestStatus } from "@/generated/prisma/client";
import {
  buildAdminCandidateWhere,
  normalizeAdminCandidateFilters,
} from "./queries";

test("normalizeAdminCandidateFilters reads candidate-prefixed filters", () => {
  assert.deepEqual(
    normalizeAdminCandidateFilters({
      candidatePage: "2",
      candidateQ: " agent ",
      candidateSelected: "selected",
      candidateSourceId: "source-1",
      candidateTopic: " AI Agent ",
    }),
    {
      page: 2,
      pageSize: 10,
      q: "agent",
      selected: "selected",
      sourceId: "source-1",
      topic: "AI Agent",
    },
  );
});

test("normalizeAdminCandidateFilters drops invalid candidate filters", () => {
  assert.deepEqual(
    normalizeAdminCandidateFilters({
      candidatePage: "0",
      candidateQ: "x".repeat(101),
      candidateSelected: "archived",
    }),
    {
      page: 1,
      pageSize: 10,
      q: "",
      selected: "",
      sourceId: "",
      topic: "",
    },
  );
});

test("buildAdminCandidateWhere filters by text, source, topic, and selected digest status", () => {
  assert.deepEqual(
    buildAdminCandidateWhere({
      page: 1,
      pageSize: 10,
      q: "agent",
      selected: "selected",
      sourceId: "source-1",
      topic: "AI Agent",
    }),
    {
      AND: [
        {
          OR: [
            { title: { contains: "agent" } },
            { summary: { contains: "agent" } },
            { translatedTitle: { contains: "agent" } },
            { translatedSummary: { contains: "agent" } },
          ],
        },
        { sourceId: "source-1" },
        {
          topicTags: {
            some: {
              topic: {
                label: "AI Agent",
              },
            },
          },
        },
        {
          digestItems: {
            some: {
              digest: {
                status: {
                  in: [DigestStatus.DRAFT, DigestStatus.PUBLISHED],
                },
              },
            },
          },
        },
      ],
    },
  );
});

test("buildAdminCandidateWhere can isolate candidates not selected into active digests", () => {
  assert.deepEqual(
    buildAdminCandidateWhere({
      page: 1,
      pageSize: 10,
      q: "",
      selected: "unselected",
      sourceId: "",
      topic: "",
    }),
    {
      digestItems: {
        none: {
          digest: {
            status: {
              in: [DigestStatus.DRAFT, DigestStatus.PUBLISHED],
            },
          },
        },
      },
    },
  );
});
