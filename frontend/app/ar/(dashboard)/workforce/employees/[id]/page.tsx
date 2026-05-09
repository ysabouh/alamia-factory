import { EmployeeRegistryProvider } from "@/features/workforce/employee-management/employee-registry-context";
import { EmployeeDetailRouteView } from "@/features/workforce/employee-management/employee-registry-route-views";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <EmployeeRegistryProvider>
      <EmployeeDetailRouteView id={id} />
    </EmployeeRegistryProvider>
  );
}
