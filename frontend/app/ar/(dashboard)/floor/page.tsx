import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";
import { FactoryFloorPage } from "@/features/floor/factory-floor-page";

export default async function FloorPage() {
  const dashboard = await api.liveDashboard().catch(() => fallbackDashboard);

  return <FactoryFloorPage dashboard={dashboard} />;
}
