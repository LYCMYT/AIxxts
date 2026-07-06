export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    service: "ai-industry-intel",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
