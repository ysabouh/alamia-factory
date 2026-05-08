import { SmartInventoryCommandCenter } from "@/features/inventory/smart-inventory-command-center";
import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";

export default async function InventoryPage() {
  const dashboard = await api.liveDashboard().catch(() => fallbackDashboard);

  return <SmartInventoryCommandCenter dashboard={dashboard} />;
}
