import {
  createAdminSource,
  sourceActionErrorResponse,
} from "@/server/admin/source-actions";
import { getAdminSources } from "@/server/admin/queries";

export const dynamic = "force-dynamic";

async function requestJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new Error("request body must be valid JSON.");
  }
}

export async function GET() {
  const data = await getAdminSources();

  return Response.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await requestJson(request);
    const result = await createAdminSource(body);

    return Response.json(result, {
      status: 201,
    });
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
