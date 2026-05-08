import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";
import { ProductionOrdersCommandCenter } from "@/features/production/production-orders-command-center";

export default async function ProductionOrdersPage() {
  const dashboard = await api.liveDashboard().catch(() => fallbackDashboard);

  return <ProductionOrdersCommandCenter dashboard={dashboard} />;
}
