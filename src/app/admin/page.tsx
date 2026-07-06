import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminDashboardData } from "@/server/admin/queries";

export const metadata: Metadata = {
  title: "管理后台 | AI 行业每日精选",
  description: "AIxxts 数据源、关键词、候选内容、任务状态和用户角色管理",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getAdminDashboardData();

  if (!data) {
    return <AdminDashboard />;
  }

  return (
    <AdminDashboard
      jobs={data.jobs.length > 0 ? data.jobs : undefined}
      sources={data.sources.length > 0 ? data.sources : undefined}
      summary={data.summary}
      users={data.users.length > 0 ? data.users : undefined}
    />
  );
}
