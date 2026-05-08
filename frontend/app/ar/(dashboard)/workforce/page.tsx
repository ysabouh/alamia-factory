import { WorkforceFinancialOperationsCenter } from "@/features/workforce/workforce-financial-operations-center";
import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";

export default async function WorkforceFinancePage() {
  const dashboard = await api.liveDashboard().catch(() => fallbackDashboard);

  return <WorkforceFinancialOperationsCenter dashboard={dashboard} />;
}
