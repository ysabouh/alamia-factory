import { LiveFactoryMonitoringCenter } from "@/features/monitoring/live-factory-monitoring-center";
import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";

export default async function LiveFactoryMonitoringPage() {
  const dashboard = await api.liveDashboard().catch(() => fallbackDashboard);

  return <LiveFactoryMonitoringCenter dashboard={dashboard} />;
}
