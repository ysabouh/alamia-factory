import { EmployeeRegistryProvider } from "@/features/workforce/employee-management/employee-registry-context";
import { EmployeeListWorkspace } from "@/features/workforce/employee-management/employee-list-workspace";
import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";
import { fetchWorkforceCatalogSsr } from "@/lib/api/fetch-workforce-catalog-ssr";
import { fetchWorkforceEmployeesListSsr } from "@/lib/api/fetch-workforce-employees-ssr";

export default async function WorkforceEmployeesPage() {
  const [dashboard, initialCatalog, initialEmployeeList] = await Promise.all([
    api.liveDashboard().catch(() => fallbackDashboard),
    fetchWorkforceCatalogSsr(),
    fetchWorkforceEmployeesListSsr()
  ]);

  return (
    <EmployeeRegistryProvider
      fallbackDashboard={dashboard}
      initialCatalog={initialCatalog}
      initialEmployeeList={initialEmployeeList}
    >
      <EmployeeListWorkspace />
    </EmployeeRegistryProvider>
  );
}
