"use client";

import { cn } from "@/lib/utils";

export type DailyDutyStatusCode = "present" | "absent" | "late" | "paid_leave" | "unpaid_leave";

const toneClass: Record<DailyDutyStatusCode, string> = {
  present: "border-atlas-success bg-atlas-success/15 text-atlas-success",
  absent: "border-atlas-danger bg-atlas-danger/15 text-atlas-danger",
  late: "border-atlas-warning bg-atlas-warning/15 text-atlas-warning",
  paid_leave: "border-teal-600 bg-teal-600/15 text-teal-700 dark:text-teal-400",
  unpaid_leave: "border-amber-600 bg-amber-600/15 text-amber-700 dark:text-amber-400"
};

export function DailyDutyStatusBadge({
  code,
  label
}: {
  code: DailyDutyStatusCode;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[4.5rem] items-center justify-center rounded-sm border px-2 py-1 text-[11px] font-semibold",
        toneClass[code]
      )}
    >
      {label}
    </span>
  );
}
