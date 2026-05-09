import { EmployeeRegistryProvider } from "@/features/workforce/employee-management/employee-registry-context";
import { EmployeeEditRouteView } from "@/features/workforce/employee-management/employee-registry-route-views";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <EmployeeRegistryProvider>
      <EmployeeEditRouteView id={id} />
    </EmployeeRegistryProvider>
  );
}
