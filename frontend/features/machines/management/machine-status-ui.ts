import type { MachineRegistryStatus } from "@/lib/api/machines-client";
import type { MachineStatus } from "@/types/factory";

export const machineStatusLabels: Record<MachineRegistryStatus, string> = {
  running: "تشغيل",
  stopped: "متوقف",
  maintenance: "صيانة",
  breakdown: "عطل"
};

export function normalizeDashboardStatus(status: string): MachineStatus {
  if (status === "idle") return "stopped";
  if (status === "down") return "breakdown";
  return status as MachineStatus;
}
