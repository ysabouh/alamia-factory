import * as XLSX from "xlsx";

import { formatAttendanceDayLabel, formatWorkHours } from "@/features/workforce/attendance/utils/format";
import type {
  AttendanceStatus,
  EmployeeAttendanceReportDayJson,
  EmployeeAttendanceReportJson
} from "@/lib/api/workforce-attendance-client";

const attendanceStatusLabel: Record<AttendanceStatus, string> = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  leave: "إجازة",
  paid_leave: "إجازة مدفوعة",
  unpaid_leave: "إجازة غير مدفوعة",
  holiday: "عطلة",
  weekend: "عطلة أسبوعية",
  remote: "عن بُعد",
  mission: "مهمة"
};

const overtimeStatusLabel: Record<string, string> = {
  pending: "قيد الانتظار",
  approved: "معتمد",
  rejected: "مرفوض",
  completed: "مكتمل"
};

function formatHours(h: number): string {
  return Number.isFinite(h) ? h.toFixed(2) : "0.00";
}

function dayToRow(day: EmployeeAttendanceReportDayJson): (string | number)[] {
  const att = day.attendance;
  const ot = day.overtime;

  return [
    day.date,
    formatAttendanceDayLabel(day.date),
    att?.checkIn ?? "",
    att?.checkOut ?? "",
    att ? formatWorkHours(att.workedHours) : "",
    att?.dutyStatusLabel ?? "",
    att?.attendanceStatus ? attendanceStatusLabel[att.attendanceStatus] : "",
    ot ? `${ot.startTime} — ${ot.endTime}` : "",
    ot ? overtimeStatusLabel[ot.status] ?? ot.status : "",
    ot?.multiplierLabel ?? "",
    ot ? formatHours(ot.durationHours) : "",
    ot ? formatHours(ot.weightedHours) : ""
  ];
}

export function exportEmployeeAttendanceReportToExcel(
  report: EmployeeAttendanceReportJson,
  days: EmployeeAttendanceReportDayJson[]
): void {
  const tableHeaders = [
    "التاريخ",
    "اليوم",
    "دخول",
    "خروج",
    "ساعات الدوام",
    "حالة الدوام",
    "حالة الحضور",
    "الإضافي (من — إلى)",
    "حالة الإضافي",
    "معامل الإضافي",
    "ساعات الإضافي",
    "إضافي موزون"
  ];

  const meta: (string | number)[][] = [
    ["تقرير دوام الموظف"],
    ["رقم الموظف", report.employee.employeeNumber],
    ["الاسم", report.employee.fullName],
    ["القسم", report.employee.department],
    ["من تاريخ", report.from],
    ["إلى تاريخ", report.to],
    ["أيام بسجل حضور", report.summary.daysWithAttendance],
    ["أيام بإضافي", report.summary.daysWithOvertime],
    ["إجمالي ساعات الدوام", report.summary.totalWorkedHours],
    ["إجمالي إضافي موزون (س)", report.summary.totalOvertimeWeightedHours],
    []
  ];

  const chronological = [...days].reverse();
  const sheetData: (string | number)[][] = [...meta, tableHeaders, ...chronological.map(dayToRow)];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws["!cols"] = [
    { wch: 12 },
    { wch: 26 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "تقرير الدوام");

  const safeNumber = report.employee.employeeNumber.replace(/[^\w-]+/g, "_") || "employee";
  XLSX.writeFile(wb, `attendance-report-${safeNumber}-${report.from}-${report.to}.xlsx`);
}
