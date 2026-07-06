import {
  sourceActionErrorResponse,
  updateAdminSourceEnabled,
} from "@/server/admin/source-actions";

type SourceRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function requestJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new Error("request body must be valid JSON.");
  }
}

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: SourceRouteContext) {
  try {
    const [{ id }, body] = await Promise.all([context.params, requestJson(request)]);
    const enabled =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>).enabled
        : undefined;
    const result = await updateAdminSourceEnabled(id, enabled);

    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "request body must be valid JSON.") {
      return Response.json(
        {
          error: error.message,
        },
        {
          status: 400,
        },
      );
    }

    return sourceActionErrorResponse(error);
  }
}
