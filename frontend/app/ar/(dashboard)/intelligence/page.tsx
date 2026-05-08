import { FactoryIntelligenceCenter } from "@/features/analytics/factory-intelligence-center";
import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";

export default async function FactoryIntelligencePage() {
  const dashboard = await api.liveDashboard().catch(() => fallbackDashboard);

  return <FactoryIntelligenceCenter dashboard={dashboard} />;
}
