import {
  createSourceRecord,
  findCollectableSourceById,
  setSourceEnabled,
  updateSourceRecord,
} from "@/server/collectors/source-store";
import {
  COLLECTABLE_SOURCE_TYPES,
  type CollectableSourceType,
  type SourceCollectResult,
  type SourceRow,
} from "@/server/collectors/types";
import { collectSource } from "@/server/jobs/collect";

export type SourceActionDeps = {
  collectOneSource: (source: SourceRow) => Promise<SourceCollectResult>;
  createSource: (input: AdminSourceSaveRecord) => Promise<string>;
  findCollectableSource: (sourceId: string) => Promise<SourceRow | null>;
  saveSource: (sourceId: string, input: AdminSourceSaveRecord) => Promise<boolean>;
  setEnabled: (sourceId: string, enabled: boolean) => Promise<boolean>;
};

export type AdminSourceSaveRecord = {
  config: unknown | null;
  enabled: boolean;
  fetchIntervalMinutes: number;
  name: string;
  type: CollectableSourceType;
  url: string | null;
};

const defaultDeps: SourceActionDeps = {
  collectOneSource: collectSource,
  createSource: createSourceRecord,
  findCollectableSource: findCollectableSourceById,
  saveSource: updateSourceRecord,
  setEnabled: setSourceEnabled,
};

export class AdminSourceActionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminSourceActionError";
  }
}

function rawBoolean(value: boolean | number) {
  return typeof value === "boolean" ? value : value !== 0;
}

function sourceIdValue(sourceId: string | null | undefined) {
  const value = sourceId?.trim();

  if (!value) {
    throw new AdminSourceActionError("source id is required.", 400);
  }

  return value;
}

function objectBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminSourceActionError("request body must be a JSON object.", 400);
  }

  return value as Record<string, unknown>;
}

function stringField(body: Record<string, unknown>, key: string, label: string) {
  const value = body[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new AdminSourceActionError(`${label} is required.`, 400);
  }

  return value.trim();
}

function optionalConfig(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new AdminSourceActionError("config must be a JSON object.", 400);
      }

      return parsed;
    } catch (error) {
      if (error instanceof AdminSourceActionError) {
        throw error;
      }

      throw new AdminSourceActionError("config must be valid JSON.", 400);
    }
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new AdminSourceActionError("config must be a JSON object.", 400);
  }

  return value;
}

function sourceTypeValue(value: unknown) {
  if (
    typeof value === "string" &&
    COLLECTABLE_SOURCE_TYPES.includes(value as CollectableSourceType)
  ) {
    return value as CollectableSourceType;
  }

  throw new AdminSourceActionError("type must be a supported collectable source type.", 400);
}

function sourceUrlValue(body: Record<string, unknown>, type: CollectableSourceType) {
  const value = body.url;
  const url = typeof value === "string" ? value.trim() : "";

  if (url) {
    return url;
  }

  if (type === "GITHUB" || type === "YOUTUBE") {
    return null;
  }

  throw new AdminSourceActionError("url is required.", 400);
}

function intervalValue(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 1 || numberValue > 1440) {
    throw new AdminSourceActionError("fetchIntervalMinutes must be an integer from 1 to 1440.", 400);
  }

  return numberValue;
}

function enabledValue(value: unknown) {
  if (value === undefined) {
    return true;
  }

  if (typeof value !== "boolean") {
    throw new AdminSourceActionError("enabled must be a boolean.", 400);
  }

  return value;
}

function saveRecordFromBody(bodyValue: unknown): AdminSourceSaveRecord {
  const body = objectBody(bodyValue);
  const name = stringField(body, "name", "name");
  const type = sourceTypeValue(body.type);
  const url = sourceUrlValue(body, type);

  return {
    config: optionalConfig(body.config),
    enabled: enabledValue(body.enabled),
    fetchIntervalMinutes: intervalValue(body.fetchIntervalMinutes ?? 60),
    name,
    type,
    url,
  };
}

export function isEnabledOnlyPatch(bodyValue: unknown) {
  if (!bodyValue || typeof bodyValue !== "object" || Array.isArray(bodyValue)) {
    return false;
  }

  const keys = Object.keys(bodyValue);

  return keys.length === 1 && keys[0] === "enabled";
}

export async function createAdminSource(bodyValue: unknown, deps: SourceActionDeps = defaultDeps) {
  const input = saveRecordFromBody(bodyValue);
  const sourceId = await deps.createSource(input);

  return {
    sourceId,
  };
}

export async function saveAdminSource(
  sourceId: string | null | undefined,
  bodyValue: unknown,
  deps: SourceActionDeps = defaultDeps,
) {
  const id = sourceIdValue(sourceId);
  const input = saveRecordFromBody(bodyValue);
  const updated = await deps.saveSource(id, input);

  if (!updated) {
    throw new AdminSourceActionError("source not found.", 404);
  }

  return {
    sourceId: id,
  };
}

export async function updateAdminSourceEnabled(
  sourceId: string | null | undefined,
  enabled: unknown,
  deps: SourceActionDeps = defaultDeps,
) {
  const id = sourceIdValue(sourceId);

  if (typeof enabled !== "boolean") {
    throw new AdminSourceActionError("enabled must be a boolean.", 400);
  }

  const updated = await deps.setEnabled(id, enabled);

  if (!updated) {
    throw new AdminSourceActionError("source not found.", 404);
  }

  return {
    enabled,
    sourceId: id,
  };
}

export async function collectAdminSource(
  sourceId: string | null | undefined,
  deps: SourceActionDeps = defaultDeps,
) {
  const id = sourceIdValue(sourceId);
  const source = await deps.findCollectableSource(id);

  if (!source) {
    throw new AdminSourceActionError("collectable source not found.", 404);
  }

  if (!rawBoolean(source.enabled)) {
    throw new AdminSourceActionError("source is disabled.", 409);
  }

  return deps.collectOneSource(source);
}

export function sourceActionErrorResponse(error: unknown) {
  if (error instanceof AdminSourceActionError) {
    return Response.json(
      {
        error: error.message,
      },
      {
        status: error.status,
      },
    );
  }

  const message = error instanceof Error ? error.message : String(error);

  return Response.json(
    {
      error: message,
    },
    {
      status: 500,
    },
  );
}
