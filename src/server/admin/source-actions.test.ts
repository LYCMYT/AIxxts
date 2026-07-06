import assert from "node:assert/strict";
import test from "node:test";

import {
  AdminSourceActionError,
  collectAdminSource,
  createAdminSource,
  saveAdminSource,
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
    createSource: async () => "new-source-1",
    findCollectableSource: async () => baseSource,
    saveSource: async () => true,
    setEnabled: async () => true,
    ...overrides,
  };
}

const validSaveBody = {
  config: {
    category: "github-release",
    owner: "owner/repo",
  },
  enabled: true,
  fetchIntervalMinutes: 120,
  name: "GitHub Release Feed",
  type: "RSS",
  url: "https://github.com/owner/repo/releases.atom",
};

test("createAdminSource validates and creates a collectable source", async () => {
  let savedName: string | null = null;
  const result = await createAdminSource(
    validSaveBody,
    deps({
      createSource: async (input) => {
        savedName = input.name;
        assert.equal(input.type, "RSS");
        assert.equal(input.fetchIntervalMinutes, 120);
        assert.deepEqual(input.config, {
          category: "github-release",
          owner: "owner/repo",
        });

        return "created-source";
      },
    }),
  );

  assert.equal(savedName, "GitHub Release Feed");
  assert.deepEqual(result, {
    sourceId: "created-source",
  });
});

test("createAdminSource rejects unsupported source types", async () => {
  await assert.rejects(
    () =>
      createAdminSource(
        {
          ...validSaveBody,
          type: "X",
        },
        deps(),
      ),
    {
      message: "type must be a supported collectable source type.",
      status: 400,
    },
  );
});

test("createAdminSource rejects invalid config JSON", async () => {
  await assert.rejects(
    () =>
      createAdminSource(
        {
          ...validSaveBody,
          config: "{",
        },
        deps(),
      ),
    {
      message: "config must be valid JSON.",
      status: 400,
    },
  );
});

test("saveAdminSource updates an existing source", async () => {
  let savedSourceId: string | null = null;
  const result = await saveAdminSource(
    "source-1",
    {
      ...validSaveBody,
      config: "{\"topic\":\"AI\"}",
    },
    deps({
      saveSource: async (sourceId, input) => {
        savedSourceId = sourceId;
        assert.deepEqual(input.config, {
          topic: "AI",
        });

        return true;
      },
    }),
  );

  assert.equal(savedSourceId, "source-1");
  assert.deepEqual(result, {
    sourceId: "source-1",
  });
});

test("saveAdminSource reports missing sources", async () => {
  await assert.rejects(
    () =>
      saveAdminSource(
        "missing",
        validSaveBody,
        deps({
          saveSource: async () => false,
        }),
      ),
    {
      message: "source not found.",
      status: 404,
    },
  );
});

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
