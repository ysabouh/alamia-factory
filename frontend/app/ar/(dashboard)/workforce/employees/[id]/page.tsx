import { EmployeeRegistryProvider } from "@/features/workforce/employee-management/employee-registry-context";
import { EmployeeDetailRouteView } from "@/features/workforce/employee-management/employee-registry-route-views";
import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";
import { fetchWorkforceCatalogSsr } from "@/lib/api/fetch-workforce-catalog-ssr";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [dashboard, initialCatalog] = await Promise.all([
    api.liveDashboard().catch(() => fallbackDashboard),
    fetchWorkforceCatalogSsr()
  ]);

  return (
    <EmployeeRegistryProvider fallbackDashboard={dashboard} initialCatalog={initialCatalog}>
      <EmployeeDetailRouteView id={id} />
    </EmployeeRegistryProvider>
  );
}
