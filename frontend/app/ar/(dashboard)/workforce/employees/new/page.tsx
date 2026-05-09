import { EmployeeRegistryProvider } from "@/features/workforce/employee-management/employee-registry-context";
import { ManagedEmployeeCreateForm } from "@/features/workforce/employee-management/managed-employee-form";

export default function NewEmployeePage() {
  return (
    <EmployeeRegistryProvider>
      <ManagedEmployeeCreateForm />
    </EmployeeRegistryProvider>
  );
}
