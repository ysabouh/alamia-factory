import {
  CheckCircle2,
  CircleDashed,
  PauseCircle,
  PlayCircle,
  XCircle,
  type LucideIcon
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { WorkOrderStatus } from "@/lib/api/production-client";
import { cn } from "@/lib/utils";

export const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  draft: "مسودة",
  running: "تشغيل",
  paused: "متوقف",
  completed: "مكتمل",
  cancelled: "ملغى"
};

type StatusUi = {
  variant: "secondary" | "success" | "warning" | "info" | "destructive";
  icon: LucideIcon;
  iconClass: string;
  rowClass: string;
  accentClass: string;
  progressClass: string;
};

export const workOrderStatusUi: Record<WorkOrderStatus, StatusUi> = {
  draft: {
    variant: "secondary",
    icon: CircleDashed,
    iconClass: "text-slate-500",
    rowClass: "bg-slate-50/60 hover:bg-slate-50",
    accentClass: "border-s-slate-300",
    progressClass: "bg-slate-400"
  },
  running: {
    variant: "success",
    icon: PlayCircle,
    iconClass: "text-emerald-600",
    rowClass: "bg-emerald-50/50 hover:bg-emerald-50/80",
    accentClass: "border-s-emerald-500",
    progressClass: "bg-emerald-500"
  },
  paused: {
    variant: "warning",
    icon: PauseCircle,
    iconClass: "text-amber-600",
    rowClass: "bg-amber-50/50 hover:bg-amber-50/80",
    accentClass: "border-s-amber-500",
    progressClass: "bg-amber-500"
  },
  completed: {
    variant: "info",
    icon: CheckCircle2,
    iconClass: "text-sky-600",
    rowClass: "bg-sky-50/40 hover:bg-sky-50/70",
    accentClass: "border-s-sky-500",
    progressClass: "bg-sky-500"
  },
  cancelled: {
    variant: "destructive",
    icon: XCircle,
    iconClass: "text-red-600",
    rowClass: "bg-red-50/40 hover:bg-red-50/70",
    accentClass: "border-s-red-400",
    progressClass: "bg-red-400"
  }
};

export function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  const ui = workOrderStatusUi[status];
  const Icon = ui.icon;
  return (
    <Badge variant={ui.variant} className="gap-1.5 px-2.5 py-1">
      <Icon className={cn("h-3.5 w-3.5", ui.iconClass)} />
      {workOrderStatusLabels[status]}
    </Badge>
  );
}

export function WorkOrderProgressBar({
  produced,
  planned,
  status
}: {
  produced: number;
  planned: number;
  status: WorkOrderStatus;
}) {
  const pct = Math.min(100, Math.round((produced / Math.max(1, planned)) * 100));
  const ui = workOrderStatusUi[status];
  return (
    <div className="min-w-[7rem] space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium tabular-nums">
          {produced.toLocaleString("ar")} / {planned.toLocaleString("ar")}
        </span>
        <span className="text-muted-foreground tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn("h-full rounded-full transition-all", ui.progressClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function canEditWorkOrder(status: WorkOrderStatus) {
  return status !== "completed";
}
