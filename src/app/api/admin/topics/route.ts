import { getAdminTopicRows, topicActionErrorResponse } from "@/server/admin/topics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const topics = await getAdminTopicRows();

    return Response.json({
      topics,
    });
  } catch (error) {
    return topicActionErrorResponse(error);
  }
}
