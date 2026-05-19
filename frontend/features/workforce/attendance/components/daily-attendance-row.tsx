"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Calculator, CalendarCheck, CalendarX, UserCheck, UserX } from "lucide-react";

import { WfmInput, WfmTableCell, WfmTableRow } from "@/components/workforce/atlas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DailyDutyStatusBadge,
  type DailyDutyStatusCode
} from "@/features/workforce/attendance/components/daily-duty-status-badge";
import { formatWorkHours } from "@/features/workforce/attendance/utils/format";
import type { DailyAttendanceDefaultsJson, DailyAttendanceRowJson } from "@/lib/api/workforce-attendance-client";

type TimeFields = { checkIn: string; checkOut: string };

function AttendanceActionButton({
  icon: Icon,
  label,
  hint,
  className,
  disabled,
  onClick
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const tooltipText = hint ?? label;

  return (
    <div className="group/action relative inline-flex" title={tooltipText}>
      <Button
        type="button"
        size="sm"
        variant="atlasOutline"
        className={cn("h-8 w-8 shrink-0 rounded-sm p-0", className)}
        disabled={disabled}
        aria-label={label}
        onClick={onClick}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </Button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-sm border border-atlas-rule bg-atlas-ink px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-md transition-opacity duration-150 group-hover/action:opacity-100 group-focus-within/action:opacity-100"
      >
        {label}
        <span
          className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-atlas-ink"
          aria-hidden
        />
      </span>
    </div>
  );
}

function initialTimes(row: DailyAttendanceRowJson, defaults: DailyAttendanceDefaultsJson): TimeFields {
  const locked = row.isAbsent || row.isLeave;
  return {
    checkIn: locked ? defaults.checkIn : (row.checkIn ?? defaults.checkIn),
    checkOut: locked ? defaults.checkOut : (row.checkOut ?? defaults.checkOut)
  };
}

function deriveDutyStatusFallback(
  row: DailyAttendanceRowJson,
  defaults: DailyAttendanceDefaultsJson
): { code: DailyDutyStatusCode; label: string } {
  if (row.isAbsent) return { code: "absent", label: "غياب" };
  if (row.attendanceStatus === "paid_leave" || row.leaveType === "paid") {
    return { code: "paid_leave", label: "مدفوعة" };
  }
  if (row.attendanceStatus === "unpaid_leave" || row.leaveType === "unpaid") {
    return { code: "unpaid_leave", label: "غير مدفوعة" };
  }
  if (
    row.attendanceStatus === "present" ||
    row.attendanceStatus === "remote" ||
    row.attendanceStatus === "mission"
  ) {
    return { code: "present", label: "حضور" };
  }
  const fullMinutes = defaults.dailyWorkMinutes ?? 480;
  if (
    row.attendanceStatus === "late" ||
    (row.workedMinutes > 0 && row.workedMinutes < fullMinutes)
  ) {
    return { code: "late", label: "متأخر" };
  }
  return { code: "present", label: "حضور" };
}

function workHoursLabel(row: DailyAttendanceRowJson): string {
  if (row.isAbsent || row.leaveType === "unpaid" || row.attendanceStatus === "unpaid_leave") {
    return "0.00";
  }
  return formatWorkHours(row.workedHours);
}

export function DailyAttendanceRow({
  serialNumber,
  row,
  defaults,
  canEdit,
  busy,
  onMarkPresent,
  onMarkAbsent,
  onPaidLeave,
  onUnpaidLeave,
  onRecalculate
}: {
  serialNumber: number;
  row: DailyAttendanceRowJson;
  defaults: DailyAttendanceDefaultsJson;
  canEdit: boolean;
  busy: boolean;
  onMarkPresent: (employeeId: string, times: TimeFields) => Promise<void>;
  onMarkAbsent: (employeeId: string) => Promise<void>;
  onPaidLeave: (employeeId: string) => Promise<void>;
  onUnpaidLeave: (employeeId: string) => Promise<void>;
  onRecalculate: (employeeId: string, times: TimeFields) => Promise<void>;
}) {
  const [times, setTimes] = useState<TimeFields>(() => initialTimes(row, defaults));

  useEffect(() => {
    setTimes(initialTimes(row, defaults));
  }, [row, defaults]);

  const absent = row.isAbsent;
  const onLeave = Boolean(row.isLeave);
  const timesLocked = absent || onLeave;
  const isPaidLeave = row.leaveType === "paid" || row.attendanceStatus === "paid_leave";
  const isUnpaidLeave = row.leaveType === "unpaid" || row.attendanceStatus === "unpaid_leave";

  return (
    <WfmTableRow
      className={cn(
        absent && "bg-atlas-canvas/40",
        onLeave && !absent && "bg-atlas-info/5"
      )}
      data-absent={absent ? "true" : undefined}
      data-leave={onLeave ? "true" : undefined}
    >
      <WfmTableCell className="w-10 text-center font-mono text-xs tabular-nums text-atlas-muted">
        {serialNumber}
      </WfmTableCell>
      <WfmTableCell className="font-mono text-xs text-atlas-ink">{row.employeeNumber || "—"}</WfmTableCell>
      <WfmTableCell className="font-medium text-atlas-ink">{row.fullName}</WfmTableCell>
      <WfmTableCell className="min-w-[7.5rem]">
        <WfmInput
          type="time"
          className="h-8 font-mono text-xs"
          value={timesLocked ? "" : times.checkIn}
          disabled={!canEdit || busy || timesLocked}
          onChange={(e) => setTimes((t) => ({ ...t, checkIn: e.target.value }))}
        />
      </WfmTableCell>
      <WfmTableCell className="min-w-[7.5rem]">
        <WfmInput
          type="time"
          className="h-8 font-mono text-xs"
          value={timesLocked ? "" : times.checkOut}
          disabled={!canEdit || busy || timesLocked}
          onChange={(e) => setTimes((t) => ({ ...t, checkOut: e.target.value }))}
        />
      </WfmTableCell>
      <WfmTableCell className="min-w-[5rem] text-center font-mono text-sm font-semibold tabular-nums text-atlas-brand">
        {workHoursLabel(row)}
      </WfmTableCell>
      <WfmTableCell className="min-w-[6.5rem] text-center">
        <DailyDutyStatusBadge
          code={row.dutyStatus ?? deriveDutyStatusFallback(row, defaults).code}
          label={row.dutyStatusLabel ?? deriveDutyStatusFallback(row, defaults).label}
        />
      </WfmTableCell>
      <WfmTableCell>
        {canEdit ? (
          <div className="flex flex-wrap items-center gap-1">
            <AttendanceActionButton
              icon={UserCheck}
              label="حضور"
              hint="تسجيل حضور كامل لهذا اليوم (ساعات الدوام من الإعدادات)"
              className="border-atlas-success bg-atlas-success text-white hover:border-atlas-success hover:bg-atlas-success/90"
              disabled={busy}
              onClick={() => void onMarkPresent(row.employeeId, times)}
            />
            <AttendanceActionButton
              icon={UserX}
              label="غائب"
              hint="تسجيل غياب وتصفير ساعات الدوام"
              className="border-atlas-danger bg-atlas-danger text-white hover:border-atlas-danger hover:bg-atlas-danger/90"
              disabled={busy || absent}
              onClick={() => void onMarkAbsent(row.employeeId)}
            />
            <AttendanceActionButton
              icon={CalendarCheck}
              label="إجازة مدفوعة"
              hint="ساعات دوام يوم كامل حسب الإعدادات"
              className="border-teal-600 bg-teal-600 text-white hover:border-teal-600 hover:bg-teal-600/90"
              disabled={busy || isPaidLeave}
              onClick={() => void onPaidLeave(row.employeeId)}
            />
            <AttendanceActionButton
              icon={CalendarX}
              label="إجازة غير مدفوعة"
              hint="تسجيل إجازة بدون ساعات أو أجر"
              className="border-amber-600 bg-amber-600 text-white hover:border-amber-600 hover:bg-amber-600/90"
              disabled={busy || isUnpaidLeave}
              onClick={() => void onUnpaidLeave(row.employeeId)}
            />
            <AttendanceActionButton
              icon={Calculator}
              label="إعادة حساب"
              hint="إعادة حساب الساعات دون تغيير الأوقات المحفوظة"
              className="border-atlas-info bg-atlas-info text-white hover:border-atlas-info hover:bg-atlas-info/90"
              disabled={busy || timesLocked}
              onClick={() => void onRecalculate(row.employeeId, times)}
            />
          </div>
        ) : (
          <span className="text-xs text-atlas-muted">
            {absent ? "غائب" : isPaidLeave ? "إجازة مدفوعة" : isUnpaidLeave ? "إجازة غير مدفوعة" : "مسجّل"}
          </span>
        )}
      </WfmTableCell>
    </WfmTableRow>
  );
}