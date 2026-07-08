import { topicActionErrorResponse, updateAdminCandidateTopics } from "@/server/admin/topics";

export const dynamic = "force-dynamic";

async function requestJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new Error("request body must be valid JSON.");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [{ id }, body] = await Promise.all([params, requestJson(request)]);
    const result = await updateAdminCandidateTopics(id, body);

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

    return topicActionErrorResponse(error);
  }
}
