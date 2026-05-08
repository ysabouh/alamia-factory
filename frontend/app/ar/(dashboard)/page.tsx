import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";
import { DashboardShell } from "@/features/dashboard/dashboard-shell";

export default async function DashboardPage() {
  const dashboard = await api.liveDashboard().catch(() => fallbackDashboard);

  return <DashboardShell dashboard={dashboard} />;
}
