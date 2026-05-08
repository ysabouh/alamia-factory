import { FleetOperationsCenter } from "@/features/fleet/fleet-operations-center";
import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";

export default async function FleetOperationsPage() {
  const dashboard = await api.liveDashboard().catch(() => fallbackDashboard);

  return <FleetOperationsCenter dashboard={dashboard} />;
}
