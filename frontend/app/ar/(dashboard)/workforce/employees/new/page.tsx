import { EmployeeRegistryProvider } from "@/features/workforce/employee-management/employee-registry-context";
import { ManagedEmployeeCreateForm } from "@/features/workforce/employee-management/managed-employee-form";
import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";
import { fetchWorkforceCatalogSsr } from "@/lib/api/fetch-workforce-catalog-ssr";

export default async function NewEmployeePage() {
  const [dashboard, initialCatalog] = await Promise.all([
    api.liveDashboard().catch(() => fallbackDashboard),
    fetchWorkforceCatalogSsr()
  ]);

  return (
    <EmployeeRegistryProvider fallbackDashboard={dashboard} initialCatalog={initialCatalog}>
      <ManagedEmployeeCreateForm />
    </EmployeeRegistryProvider>
  );
}
