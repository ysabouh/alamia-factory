"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Ban,
  CalendarOff,
  CheckCircle2,
  Clock,
  RotateCcw,
  UserCheck,
  UserX,
  XCircle
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { AttendanceState, EmployeeEmploymentStatus } from "./model";

export type RegistryIconTone = "success" | "warning" | "danger" | "info" | "brand" | "neutral";

const toneClass: Record<RegistryIconTone, string> = {
  success: "border-atlas-success/40 bg-atlas-success/10 text-atlas-success hover:bg-atlas-success/20",
  warning: "border-atlas-warning/40 bg-atlas-warning/10 text-atlas-warning hover:bg-atlas-warning/20",
  danger: "border-atlas-danger/40 bg-atlas-danger/10 text-atlas-danger hover:bg-atlas-danger/20",
  info: "border-atlas-info/40 bg-atlas-info/10 text-atlas-info hover:bg-atlas-info/20",
  brand: "border-atlas-brand/40 bg-atlas-brand/10 text-atlas-brand hover:bg-atlas-brand/20",
  neutral: "border-atlas-rule bg-atlas-canvas text-atlas-muted hover:bg-atlas-canvas/80"
};

const highlightClass =
  "border-atlas-brand/50 bg-atlas-brand/15 text-atlas-brand ring-1 ring-atlas-brand/25 hover:bg-atlas-brand/25";

export function RegistryIconButton({
  icon: Icon,
  label,
  tone,
  highlight,
  disabled,
  onClick
}: {
  icon: LucideIcon;
  label: string;
  tone: RegistryIconTone;
  highlight?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex min-w-[4.25rem] flex-col items-center gap-1 rounded-sm border px-2.5 py-2 text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        highlight ? highlightClass : toneClass[tone]
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

export function EmploymentStatusIcon({
  status,
  className
}: {
  status: EmployeeEmploymentStatus;
  className?: string;
}) {
  const cnIcon = cn("h-3.5 w-3.5 shrink-0", className);
  if (status === "active") return <CheckCircle2 className={cnIcon} aria-hidden />;
  if (status === "probation") return <AlertTriangle className={cnIcon} aria-hidden />;
  if (status === "suspended") return <Ban className={cnIcon} aria-hidden />;
  return <UserX className={cnIcon} aria-hidden />;
}

export function AttendanceStatusIcon({ state, className }: { state: AttendanceState; className?: string }) {
  const cnIcon = cn("h-3.5 w-3.5 shrink-0", className);
  if (state === "present") return <UserCheck className={cnIcon} aria-hidden />;
  if (state === "late") return <Clock className={cnIcon} aria-hidden />;
  if (state === "absent") return <XCircle className={cnIcon} aria-hidden />;
  return <CalendarOff className={cnIcon} aria-hidden />;
}

export { RotateCcw };
