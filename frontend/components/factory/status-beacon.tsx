import type { MachineStatus } from "@/types/factory";
import { cn } from "@/lib/utils";
import { getMachineStateVisual } from "@/components/factory/machine-state";

const labels: Record<MachineStatus, string> = {
  running: "تعمل",
  idle: "متوقفة مؤقتاً",
  maintenance: "صيانة",
  down: "عطل"
};

const colors: Record<MachineStatus, string> = {
  running: "bg-factory-running",
  idle: "bg-factory-idle",
  maintenance: "bg-factory-maintenance",
  down: "bg-factory-down"
};

export function StatusBeacon({ status }: { status: MachineStatus }) {
  const visual = getMachineStateVisual(status);

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", visual.panelClass)}>
      <span className={cn("h-2.5 w-2.5 rounded-full", colors[status], visual.animationClass)} />
      {visual.label || labels[status]}
    </span>
  );
}
