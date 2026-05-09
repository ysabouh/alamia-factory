import { WorkforceCrewBoard } from "@/features/workforce/workforce-crew-board";
import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";

export default async function WorkforceCrewPage() {
  const dashboard = await api.liveDashboard().catch(() => fallbackDashboard);

  return <WorkforceCrewBoard dashboard={dashboard} />;
}
