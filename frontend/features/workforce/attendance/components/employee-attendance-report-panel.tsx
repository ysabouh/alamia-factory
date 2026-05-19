"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";

import {
  WfmField,
  WfmInput,
  WfmTable,
  WfmTableBody,
  WfmTableCell,
  WfmTableHead,
  WfmTableHeader,
  WfmTableRow,
  WfmStatusBadge
} from "@/components/workforce/atlas";
import { Button } from "@/components/ui/button";
import { OvertimeEmployeePicker } from "@/features/workforce/attendance/components/overtime-employee-picker";
import {
  DailyDutyStatusBadge,
  type DailyDutyStatusCode
} from "@/features/workforce/attendance/components/daily-duty-status-badge";
import { AttendanceStatusBadge } from "@/features/workforce/attendance/components/attendance-status-badge";
import { formatAttendanceDayLabel, formatWorkHours } from "@/features/workforce/attendance/utils/format";
import { exportEmployeeAttendanceReportToExcel } from "@/features/workforce/attendance/utils/export-attendance-report-xlsx";
import { workforceApi } from "@/lib/api/workforce-client";
import {
  workforceAttendanceApi,
  type AttendanceStatus,
  type EmployeeAttendanceReportJson,
  type OvertimeRequestJson
} from "@/lib/api/workforce-attendance-client";
const inputClass = "h-10 text-sm";

const overtimeStatusLabel: Record<OvertimeRequestJson["status"], string> = {
  pending: "قيد الانتظار",
  approved: "معتمد",
  rejected: "مرفوض",
  completed: "مكتمل"
};

function defaultFromDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatHours(h: number): string {
  return Number.isFinite(h) ? h.toFixed(2) : "0.00";
}

export function EmployeeAttendanceReportPanel() {
  const [employees, setEmployees] = useState<Array<{ id: string; label: string }>>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(todayIso);
  const [onlyActiveDays, setOnlyActiveDays] = useState(true);
  const [report, setReport] = useState<EmployeeAttendanceReportJson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await workforceApi.listEmployees({ page: 1, pageSize: 500, isActive: true });
      setEmployees(
        (res.data as Array<{ id?: string; fullName?: string; employeeNumber?: string }>)
          .map((e) => ({
            id: String(e.id ?? ""),
            label: `${e.employeeNumber ?? ""} — ${e.fullName ?? ""}`
          }))
          .filter((o) => o.id)
      );
    })();
  }, []);

  const load = useCallback(async () => {
    if (!employeeId) {
      setError("اختر الموظف أولاً");
      return;
    }
    if (fromDate > toDate) {
      setError("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await workforceAttendanceApi.employeeAttendanceReport(employeeId, fromDate, toDate);
      setReport(data);
    } catch (e) {
      setReport(null);
      setError(e instanceof Error ? e.message : "فشل تحميل التقرير");
    } finally {
      setLoading(false);
    }
  }, [employeeId, fromDate, toDate]);

  const visibleDays = useMemo(() => {
    if (!report) return [];
    if (!onlyActiveDays) return [...report.days].reverse();
    return report.days.filter((d) => d.attendance || d.overtime).reverse();
  }, [report, onlyActiveDays]);

  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-atlas-info/35 bg-atlas-info/10 px-4 py-3 text-sm text-atlas-ink" role="note">
        <p className="font-semibold">تقرير دوام الموظف</p>
        <p className="mt-1 text-atlas-muted">
          اختر الموظف وفترة زمنية لعرض الحضور والإضافي لكل يوم. الحد الأقصى للفترة 92 يوماً.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-sm border border-atlas-rule bg-atlas-canvas/50 p-4">
        <WfmField label="الموظف" className="min-w-[14rem] flex-1">
          <OvertimeEmployeePicker
            employees={employees}
            excludedIds={new Set()}
            value={employeeId}
            inputClassName={inputClass}
            onChange={setEmployeeId}
          />
        </WfmField>
        <WfmField label="من تاريخ" className="min-w-[10rem]">
          <WfmInput type="date" className={inputClass} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </WfmField>
        <WfmField label="إلى تاريخ" className="min-w-[10rem]">
          <WfmInput type="date" className={inputClass} value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </WfmField>
        <label className="flex items-center gap-2 pb-2 text-xs text-atlas-muted">
          <input
            type="checkbox"
            className="rounded border-atlas-rule"
            checked={onlyActiveDays}
            onChange={(e) => setOnlyActiveDays(e.target.checked)}
          />
          إظهار الأيام التي فيها حضور أو إضافي فقط
        </label>
        <Button
          type="button"
          variant="atlas"
          className="rounded-sm gap-2"
          disabled={loading}
          onClick={() => void load()}
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden />
          عرض التقرير
        </Button>
      </div>

      {error ? (
        <div className="rounded-sm border border-atlas-danger/30 bg-atlas-danger/10 px-4 py-3 text-sm text-atlas-danger">
          {error}
        </div>
      ) : null}

      {report ? (
        <>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {[
              { label: "أيام بسجل حضور", value: report.summary.daysWithAttendance },
              { label: "أيام بإضافي", value: report.summary.daysWithOvertime },
              { label: "إجمالي ساعات الدوام", value: formatHours(report.summary.totalWorkedHours) },
              { label: "إضافي موزون (س)", value: formatHours(report.summary.totalOvertimeWeightedHours) }
            ].map((k) => (
              <div key={k.label} className="rounded-sm border border-atlas-rule bg-atlas-paper p-4 shadow-atlasCard">
                <p className="font-mono text-2xl font-bold tabular-nums text-atlas-ink">{k.value}</p>
                <p className="text-[11px] text-atlas-muted">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-atlas-muted">
              <span className="font-medium text-atlas-ink">{report.employee.fullName}</span>
              <span className="font-mono text-atlas-brand"> ({report.employee.employeeNumber})</span>
              {" — "}
              {report.employee.department}
              {" · "}
              {formatAttendanceDayLabel(report.from)} — {formatAttendanceDayLabel(report.to)}
              {" · "}
              {visibleDays.length} يوم معروض
            </p>
            <Button
              type="button"
              variant="atlasOutline"
              className="rounded-sm gap-2"
              disabled={visibleDays.length === 0}
              onClick={() => exportEmployeeAttendanceReportToExcel(report, visibleDays)}
            >
              <Download className="h-4 w-4" aria-hidden />
              تصدير Excel
            </Button>
          </div>

          <WfmTable>
            <WfmTableHeader>
              <WfmTableRow>
                <WfmTableHead className="text-center">اليوم</WfmTableHead>
                <WfmTableHead className="text-center">دخول</WfmTableHead>
                <WfmTableHead className="text-center">خروج</WfmTableHead>
                <WfmTableHead className="text-center">ساعات الدوام</WfmTableHead>
                <WfmTableHead className="text-center">حالة الدوام</WfmTableHead>
                <WfmTableHead className="text-center">حالة الحضور</WfmTableHead>
                <WfmTableHead className="text-center">الإضافي</WfmTableHead>
                <WfmTableHead className="text-center">ساعات الإضافي</WfmTableHead>
                <WfmTableHead className="text-center">موزون</WfmTableHead>
              </WfmTableRow>
            </WfmTableHeader>
            <WfmTableBody>
              {loading ? (
                <WfmTableRow>
                  <WfmTableCell colSpan={9} className="py-8 text-center text-atlas-muted">
                    جاري التحميل…
                  </WfmTableCell>
                </WfmTableRow>
              ) : visibleDays.length === 0 ? (
                <WfmTableRow>
                  <WfmTableCell colSpan={9} className="py-8 text-center text-atlas-muted">
                    لا توجد بيانات في هذه الفترة.
                  </WfmTableCell>
                </WfmTableRow>
              ) : (
                visibleDays.map((day) => (
                  <WfmTableRow key={day.date}>
                    <WfmTableCell className="text-center text-xs">
                      <p className="font-medium text-atlas-ink">{formatAttendanceDayLabel(day.date)}</p>
                      <p className="font-mono text-[10px] text-atlas-muted">{day.date}</p>
                    </WfmTableCell>
                    <WfmTableCell className="text-center font-mono text-sm tabular-nums">
                      {day.attendance?.checkIn ?? "—"}
                    </WfmTableCell>
                    <WfmTableCell className="text-center font-mono text-sm tabular-nums">
                      {day.attendance?.checkOut ?? "—"}
                    </WfmTableCell>
                    <WfmTableCell className="text-center font-mono text-sm font-semibold tabular-nums text-atlas-brand">
                      {day.attendance ? formatWorkHours(day.attendance.workedHours) : "—"}
                    </WfmTableCell>
                    <WfmTableCell className="text-center">
                      {day.attendance ? (
                        <DailyDutyStatusBadge
                          code={day.attendance.dutyStatus as DailyDutyStatusCode}
                          label={day.attendance.dutyStatusLabel}
                        />
                      ) : (
                        <span className="text-atlas-muted">—</span>
                      )}
                    </WfmTableCell>
                    <WfmTableCell className="text-center">
                      {day.attendance?.attendanceStatus ? (
                        <AttendanceStatusBadge status={day.attendance.attendanceStatus as AttendanceStatus} />
                      ) : (
                        <span className="text-atlas-muted">—</span>
                      )}
                    </WfmTableCell>
                    <WfmTableCell className="text-center text-xs">
                      {day.overtime ? (
                        <div className="space-y-1">
                          <p className="font-mono tabular-nums">
                            {day.overtime.startTime} — {day.overtime.endTime}
                          </p>
                          <WfmStatusBadge
                            tone={
                              day.overtime.status === "approved" || day.overtime.status === "completed"
                                ? "active"
                                : day.overtime.status === "rejected"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {overtimeStatusLabel[day.overtime.status]}
                          </WfmStatusBadge>
                          <p className="text-[10px] text-atlas-muted">{day.overtime.multiplierLabel}</p>
                        </div>
                      ) : (
                        <span className="text-atlas-muted">—</span>
                      )}
                    </WfmTableCell>
                    <WfmTableCell className="text-center font-mono text-sm tabular-nums">
                      {day.overtime ? formatHours(day.overtime.durationHours) : "—"}
                    </WfmTableCell>
                    <WfmTableCell className="text-center font-mono text-sm font-semibold tabular-nums text-atlas-brand">
                      {day.overtime ? formatHours(day.overtime.weightedHours) : "—"}
                    </WfmTableCell>
                  </WfmTableRow>
                ))
              )}
            </WfmTableBody>
          </WfmTable>
        </>
      ) : null}
    </div>
  );
}
