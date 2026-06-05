import type { MachineStatus } from "@/types/factory";
import { cn } from "@/lib/utils";
import { getMachineStateVisual, normalizeMachineStatus } from "@/components/factory/machine-state";

const colors: Record<MachineStatus, string> = {
  running: "bg-factory-running",
  stopped: "bg-factory-idle",
  maintenance: "bg-factory-maintenance",
  breakdown: "bg-factory-down"
};

export function StatusBeacon({ status }: { status: MachineStatus | string }) {
  const normalized = normalizeMachineStatus(status);
  const visual = getMachineStateVisual(normalized);

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", visual.panelClass)}>
      <span className={cn("h-2.5 w-2.5 rounded-full", colors[normalized], visual.animationClass)} />
      {visual.label}
    </span>
  );
}
