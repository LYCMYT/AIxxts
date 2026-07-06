import assert from "node:assert/strict";
import test from "node:test";

import {
  AdminSourceActionError,
  collectAdminSource,
  sourceActionErrorResponse,
  updateAdminSourceEnabled,
} from "./source-actions";
import type { SourceActionDeps } from "./source-actions";

const baseSource = {
  id: "source-1",
  name: "RSS Source",
  type: "RSS",
  url: "https://example.com/feed.xml",
  config: null,
  enabled: true,
  fetchIntervalMinutes: 60,
  lastFetchedAt: null,
  lastError: null,
} as const;

function deps(overrides: Partial<SourceActionDeps> = {}): SourceActionDeps {
  return {
    collectOneSource: async (source) => ({
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.type,
      status: "SUCCESS",
      scannedCount: 1,
      createdCount: 1,
      skippedCount: 0,
    }),
    findCollectableSource: async () => baseSource,
    setEnabled: async () => true,
    ...overrides,
  };
}

test("updateAdminSourceEnabled rejects non-boolean enabled values", async () => {
  await assert.rejects(() => updateAdminSourceEnabled("source-1", "true", deps()), {
    message: "enabled must be a boolean.",
    status: 400,
  });
});

test("updateAdminSourceEnabled rejects blank source ids", async () => {
  await assert.rejects(() => updateAdminSourceEnabled(" ", true, deps()), {
    message: "source id is required.",
    status: 400,
  });
});

test("updateAdminSourceEnabled returns source id and enabled state", async () => {
  let saved: { sourceId: string; enabled: boolean } | null = null;
  const result = await updateAdminSourceEnabled(
    "source-1",
    false,
    deps({
      setEnabled: async (sourceId, enabled) => {
        saved = { sourceId, enabled };
        return true;
      },
    }),
  );

  assert.deepEqual(saved, {
    enabled: false,
    sourceId: "source-1",
  });
  assert.deepEqual(result, {
    enabled: false,
    sourceId: "source-1",
  });
});

test("updateAdminSourceEnabled reports missing sources", async () => {
  await assert.rejects(
    () =>
      updateAdminSourceEnabled(
        "missing",
        true,
        deps({
          setEnabled: async () => false,
        }),
      ),
    {
      message: "source not found.",
      status: 404,
    },
  );
});

test("collectAdminSource rejects disabled sources", async () => {
  await assert.rejects(
    () =>
      collectAdminSource(
        "source-1",
        deps({
          findCollectableSource: async () => ({
            ...baseSource,
            enabled: false,
          }),
        }),
      ),
    {
      message: "source is disabled.",
      status: 409,
    },
  );
});

test("collectAdminSource reports missing collectable sources", async () => {
  await assert.rejects(
    () =>
      collectAdminSource(
        "missing",
        deps({
          findCollectableSource: async () => null,
        }),
      ),
    {
      message: "collectable source not found.",
      status: 404,
    },
  );
});

test("collectAdminSource accepts numeric enabled values from SQLite rows", async () => {
  const result = await collectAdminSource(
    "source-1",
    deps({
      findCollectableSource: async () => ({
        ...baseSource,
        enabled: 1,
      }),
    }),
  );

  assert.equal(result.status, "SUCCESS");
});

test("collectAdminSource rejects numeric disabled values from SQLite rows", async () => {
  await assert.rejects(
    () =>
      collectAdminSource(
        "source-1",
        deps({
          findCollectableSource: async () => ({
            ...baseSource,
            enabled: 0,
          }),
        }),
      ),
    {
      message: "source is disabled.",
      status: 409,
    },
  );
});

test("collectAdminSource runs a single source", async () => {
  let collectedSourceId: string | null = null;
  const result = await collectAdminSource(
    "source-1",
    deps({
      collectOneSource: async (source) => {
        collectedSourceId = source.id;

        return {
          sourceId: source.id,
          sourceName: source.name,
          sourceType: source.type,
          status: "SUCCESS",
          scannedCount: 3,
          createdCount: 2,
          skippedCount: 1,
        };
      },
    }),
  );

  assert.equal(collectedSourceId, "source-1");
  assert.equal(result.status, "SUCCESS");
  assert.equal(result.scannedCount, 3);
});

test("sourceActionErrorResponse maps action errors to their status", async () => {
  const response = sourceActionErrorResponse(new AdminSourceActionError("bad input", 400));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(body, {
    error: "bad input",
  });
});

test("sourceActionErrorResponse maps unknown errors to 500", async () => {
  const response = sourceActionErrorResponse(new Error("unexpected"));
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.deepEqual(body, {
    error: "unexpected",
  });
});
