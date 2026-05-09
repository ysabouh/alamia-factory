import { EmployeeRegistryProvider } from "@/features/workforce/employee-management/employee-registry-context";
import { EmployeeListWorkspace } from "@/features/workforce/employee-management/employee-list-workspace";
import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";

export default async function WorkforceEmployeesPage() {
  const dashboard = await api.liveDashboard().catch(() => fallbackDashboard);

  return (
    <EmployeeRegistryProvider fallbackDashboard={dashboard}>
      <EmployeeListWorkspace />
    </EmployeeRegistryProvider>
  );
}
