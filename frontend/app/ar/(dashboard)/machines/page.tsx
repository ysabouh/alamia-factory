import { MachinesFloorPage } from "@/features/machines/machines-floor-page";
import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";

export default async function MachinesRoutePage() {
  const dashboard = await api.liveDashboard().catch(() => fallbackDashboard);

  return <MachinesFloorPage dashboard={dashboard} />;
}
