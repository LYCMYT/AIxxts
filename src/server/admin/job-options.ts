export type AdminJobOptions = {
  digestDate?: string;
  limit?: number;
  selectedOnly?: boolean;
  force?: boolean;
};

export class AdminJobRequestError extends Error {
  status = 400;
}

export async function readAdminJobOptions(request: Request): Promise<AdminJobOptions> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return {};
  }

  const body = await request.json().catch(() => {
    throw new AdminJobRequestError("request body must be valid JSON.");
  });

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }

  return parseAdminJobOptions(body as Record<string, unknown>);
}

export function parseAdminJobOptions(body: Record<string, unknown>): AdminJobOptions {
  const options: AdminJobOptions = {};

  if (body.digestDate !== undefined) {
    if (typeof body.digestDate !== "string" || !isValidDigestDate(body.digestDate.trim())) {
      throw new AdminJobRequestError("digestDate must be a valid YYYY-MM-DD date.");
    }

    options.digestDate = body.digestDate.trim();
  }

  if (body.limit !== undefined) {
    if (typeof body.limit !== "number" || !Number.isFinite(body.limit) || body.limit <= 0) {
      throw new AdminJobRequestError("limit must be a positive number.");
    }

    options.limit = Math.floor(body.limit);
  }

  if (body.selectedOnly !== undefined) {
    if (typeof body.selectedOnly !== "boolean") {
      throw new AdminJobRequestError("selectedOnly must be a boolean.");
    }

    options.selectedOnly = body.selectedOnly;
  }

  if (body.force !== undefined) {
    if (typeof body.force !== "boolean") {
      throw new AdminJobRequestError("force must be a boolean.");
    }

    options.force = body.force;
  }

  return options;
}

export function jobErrorResponse(error: unknown) {
  if (error instanceof AdminJobRequestError) {
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

function isValidDigestDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}
