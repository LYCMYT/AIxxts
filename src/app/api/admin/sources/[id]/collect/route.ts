import {
  collectAdminSource,
  sourceActionErrorResponse,
} from "@/server/admin/source-actions";

type SourceCollectRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: SourceCollectRouteContext) {
  try {
    const { id } = await context.params;
    const result = await collectAdminSource(id);

    return Response.json(result);
  } catch (error) {
    return sourceActionErrorResponse(error);
  }
}
