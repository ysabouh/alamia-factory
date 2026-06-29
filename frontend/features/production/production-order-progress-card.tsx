"use client";

import type { ComponentType, ReactNode } from "react";
import { Target, TrendingUp, PackageCheck, PackageMinus } from "lucide-react";

import type { WorkOrderStatus } from "@/lib/api/production-client";
import { workOrderStatusUi } from "@/features/production/production-order-status-ui";
import { cn } from "@/lib/utils";

type Props = {
  produced: number;
  planned: number;
  status: WorkOrderStatus;
  scrapQuantity?: number;
  className?: string;
};

export function productionProgressPercent(produced: number, planned: number) {
  return Math.round((produced / Math.max(1, planned)) * 100);
}

function progressTone(status: WorkOrderStatus) {
  const tones: Record<WorkOrderStatus, string> = {
    draft: "#64748b",
    running: "#10b981",
    paused: "#f59e0b",
    completed: "#0ea5e9",
    cancelled: "#ef4444"
  };
  return tones[status];
}

function ProgressRing({
  percent,
  stroke,
  size = 80
}: {
  percent: number;
  stroke: string;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcPercent = Math.max(0, Math.min(100, percent));
  const offset = circumference - (arcPercent / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(148,163,184,0.2)"
          strokeWidth="7"
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={stroke}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold tabular-nums leading-none">{percent.toLocaleString("ar")}%</span>
        <span className="mt-0.5 text-[9px] text-muted-foreground">إنجاز</span>
      </div>
    </div>
  );
}

export function ProductionOrderProgressCard({
  produced,
  planned,
  status,
  scrapQuantity = 0,
  className
}: Props) {
  const pct = productionProgressPercent(produced, planned);
  const remaining = Math.max(0, planned - produced);
  const overTarget = produced > planned;
  const stroke = overTarget ? "#f59e0b" : progressTone(status);
  const ui = workOrderStatusUi[status];

  return (
    <CardShell className={className}>
      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-slate-100/80 p-3 sm:col-span-2 lg:col-span-1">
          <ProgressRing percent={pct} stroke={stroke} />
          <StatBox
            icon={Target}
            label="الكمية المخططة"
            value={planned.toLocaleString("ar")}
            accent="text-slate-600"
            inline
          />
        </div>
        <StatBox
          icon={PackageCheck}
          label="الكمية المنجزة"
          value={produced.toLocaleString("ar")}
          accent={overTarget ? "text-amber-600" : "text-emerald-600"}
          bg="bg-emerald-50"
        />
        <StatBox
          icon={TrendingUp}
          label="المتبقي"
          value={overTarget ? "٠" : remaining.toLocaleString("ar")}
          accent="text-sky-600"
          bg="bg-sky-50"
          hint={overTarget ? `تجاوز بـ ${(produced - planned).toLocaleString("ar")}` : undefined}
        />
        {scrapQuantity > 0 ? (
          <StatBox
            icon={PackageMinus}
            label="الخردة"
            value={scrapQuantity.toLocaleString("ar")}
            accent="text-amber-600"
            bg="bg-amber-50"
          />
        ) : null}
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>نسبة الإنجاز</span>
          <span className={cn("font-medium tabular-nums", overTarget && "text-amber-700")}>
            {produced.toLocaleString("ar")} / {planned.toLocaleString("ar")} قطعة ({pct.toLocaleString("ar")}%)
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted/50 shadow-inner">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              overTarget ? "bg-amber-500" : ui.progressClass
            )}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>
    </CardShell>
  );
}

function CardShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-orange-200/50 bg-gradient-to-l from-orange-50/90 via-white to-amber-50/50 p-5 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  accent,
  bg,
  inline,
  hint
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
  bg?: string;
  inline?: boolean;
  hint?: string;
}) {
  return (
    <div className={cn(!inline && "rounded-xl border border-border/40 p-3", bg)}>
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5", accent)} />
        {label}
      </div>
      <p className={cn("text-xl font-bold tabular-nums", accent)}>{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-amber-600">{hint}</p> : null}
    </div>
  );
}
