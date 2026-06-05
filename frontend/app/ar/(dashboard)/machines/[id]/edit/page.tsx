import { MachineFormWorkspace } from "@/features/machines/management/machine-form-workspace";

export default async function EditMachinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MachineFormWorkspace machineId={id} />;
}
