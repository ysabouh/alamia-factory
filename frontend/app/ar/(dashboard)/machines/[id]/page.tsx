import { redirect } from "next/navigation";

import { MachineDetailWorkspace } from "@/features/machines/management/machine-detail-workspace";

const RESERVED = new Set(["registry", "new", "edit"]);

export default async function MachineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (RESERVED.has(id)) {
    redirect(id === "new" ? "/ar/machines/new" : `/ar/machines/${id}`);
  }

  if (!/^\d+$/.test(id)) {
    redirect("/ar/machines/registry");
  }

  return <MachineDetailWorkspace machineId={id} />;
}
