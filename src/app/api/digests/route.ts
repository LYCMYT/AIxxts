import { getDigestArchive } from "@/server/digests/queries";

export const dynamic = "force-dynamic";

export function digestArchiveFiltersFromRequest(request: Request) {
  const url = new URL(request.url);

  return {
    q: url.searchParams.get("q") ?? "",
    status: url.searchParams.get("status") ?? "",
    topic: url.searchParams.get("topic") ?? "",
  };
}

export async function GET(request: Request) {
  const data = await getDigestArchive(digestArchiveFiltersFromRequest(request));

  return Response.json(data);
}
