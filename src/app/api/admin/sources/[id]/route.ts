import {
  isEnabledOnlyPatch,
  saveAdminSource,
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
    const result = isEnabledOnlyPatch(body)
      ? await updateAdminSourceEnabled(id, (body as { enabled: unknown }).enabled)
      : await saveAdminSource(id, body);

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
