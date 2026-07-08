import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminDashboardData } from "@/server/admin/queries";

export const metadata: Metadata = {
  title: "管理后台 | AI 行业每日精选",
  description: "AIxxts 数据源、关键词、候选内容、任务状态和用户角色管理",
};

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    jobType?: string;
    page?: string;
    sourceId?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getAdminDashboardData({
    jobs: params,
  });

  return (
    <AdminDashboard
      jobFilterOptions={data?.jobFilterOptions}
      jobFilters={data?.jobFilters}
      jobPagination={data?.jobPagination}
      jobs={data?.jobs ?? []}
      sourceErrorCategories={data?.sourceErrorCategories ?? []}
      sourceHealth={data?.sourceHealth ?? []}
      sources={data?.sources ?? []}
      summary={
        data?.summary ?? {
          enabledSources: 0,
          totalSources: 0,
          todayCandidates: 0,
          dailySchedule: "08:00",
          pendingErrors: 0,
        }
      }
      topics={data?.topics ?? []}
      users={data?.users ?? []}
    />
  );
}
