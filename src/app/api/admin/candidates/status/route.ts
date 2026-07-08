import {
  candidateActionErrorResponse,
  updateAdminCandidateStatuses,
} from "@/server/admin/candidates";

export const dynamic = "force-dynamic";

async function requestJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new Error("request body must be valid JSON.");
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await requestJson(request);
    const result = await updateAdminCandidateStatuses(body);

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

    return candidateActionErrorResponse(error);
  }
}
