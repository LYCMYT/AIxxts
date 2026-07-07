import { HistoryPage } from "@/components/history/history-page";
import { getDigestArchive } from "@/server/digests/queries";

export const dynamic = "force-dynamic";

export default async function DigestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    topic?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const archive = await getDigestArchive(params);

  return (
    <HistoryPage
      digests={archive.digests.length > 0 ? archive.digests : undefined}
      filters={archive.filters}
      jobRuns={archive.jobRuns}
    />
  );
}
