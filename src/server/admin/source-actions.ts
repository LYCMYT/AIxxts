import {
  findCollectableSourceById,
  setSourceEnabled,
} from "@/server/collectors/source-store";
import type { SourceCollectResult, SourceRow } from "@/server/collectors/types";
import { collectSource } from "@/server/jobs/collect";

export type SourceActionDeps = {
  collectOneSource: (source: SourceRow) => Promise<SourceCollectResult>;
  findCollectableSource: (sourceId: string) => Promise<SourceRow | null>;
  setEnabled: (sourceId: string, enabled: boolean) => Promise<boolean>;
};

const defaultDeps: SourceActionDeps = {
  collectOneSource: collectSource,
  findCollectableSource: findCollectableSourceById,
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
