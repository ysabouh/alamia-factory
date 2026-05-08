import { notFound } from "next/navigation";

import { MachinePassportPage } from "@/features/machines/machine-passport-page";
import { api } from "@/lib/api/client";
import { fallbackDashboard } from "@/lib/api/dashboard-fallback";

export default async function MachinePassportRoute({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;
  const machineId = Number(resolved.id);
  const dashboard = await api.liveDashboard().catch(() => fallbackDashboard);
  const machine = dashboard.machines.find((m) => m.id === machineId);

  if (!machine) {
    notFound();
  }

  return <MachinePassportPage machine={machine} />;
}
