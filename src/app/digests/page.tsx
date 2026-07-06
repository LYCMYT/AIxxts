import { HistoryPage } from "@/components/history/history-page";
import { getDigestArchive } from "@/server/digests/queries";

export const dynamic = "force-dynamic";

export default async function DigestsPage() {
  const archive = await getDigestArchive();

  return (
    <HistoryPage
      digests={archive.digests.length > 0 ? archive.digests : undefined}
      jobRuns={archive.jobRuns}
    />
  );
}
