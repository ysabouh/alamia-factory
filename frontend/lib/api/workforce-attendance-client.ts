import type { PaginatedMeta } from "@/features/workforce/employee-management/workforce-api-types";

import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { authFetchHeaders } from "@/lib/auth/factory-auth-api";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "leave"
  | "paid_leave"
  | "unpaid_leave"
  | "holiday"
  | "weekend"
  | "remote"
  | "mission";

export type AttendanceRecordJson = {
  id: string;
  employeeId: string;
  employeeNumber: string;
  fullName: string;
  department: string;
  shift: string;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  workedMinutes: number;
  overtimeMinutes: number;
  fridayOvertimeMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  attendanceStatus: AttendanceStatus;
  hourlyRate: number;
  overtimeHourlyRate: number;
  fridayHourlyRate: number;
  regularPay: number;
  overtimePay: number;
  fridayOvertimePay: number;
  totalPay: number;
  approvedAt: string | null;
  approvedBySupervisorId: string | null;
  notes: string | null;
};

export type DailyAttendanceRowJson = {
  employeeId: string;
  employeeNumber: string;
  fullName: string;
  department: string;
  employmentStatusCode: string | null;
  recordId: string | null;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  attendanceStatus: AttendanceStatus | null;
  isAbsent: boolean;
  isLeave?: boolean;
  leaveType?: "paid" | "unpaid" | null;
  workedMinutes: number;
  workedHours: number;
  dutyStatus?: "present" | "absent" | "late" | "paid_leave" | "unpaid_leave";
  dutyStatusLabel?: string;
};

export type DailyAttendanceAction =
  | "present"
  | "absent"
  | "recalculate"
  | "paid_leave"
  | "unpaid_leave";

export type DailyAttendanceDefaultsJson = {
  checkIn: string;
  checkOut: string;
  overtimeFrom: string;
  overtimeTo: string;
  dailyWorkMinutes?: number;
  dailyWorkHours?: number;
};

export type DailyAttendancePayloadJson = {
  defaults: DailyAttendanceDefaultsJson;
  rows: DailyAttendanceRowJson[];
  statistics: AttendanceDashboardJson;
};

export type EmployeeAttendanceReportDayJson = {
  date: string;
  attendance: {
    recordId: string;
    checkIn: string | null;
    checkOut: string | null;
    overtimeFrom: string | null;
    attendanceStatus: AttendanceStatus;
    workedMinutes: number;
    workedHours: number;
    overtimeMinutes: number;
    fridayOvertimeMinutes: number;
    dutyStatus: "present" | "absent" | "late" | "paid_leave" | "unpaid_leave";
    dutyStatusLabel: string;
  } | null;
  overtime: {
    id: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    weightedHours: number;
    rateMultiplier: number;
    multiplierLabel: string;
    status: OvertimeRequestJson["status"];
    assignmentReason: string | null;
  } | null;
};

export type EmployeeAttendanceReportJson = {
  employee: {
    id: string;
    employeeNumber: string;
    fullName: string;
    department: string;
  };
  from: string;
  to: string;
  days: EmployeeAttendanceReportDayJson[];
  summary: {
    dayCount: number;
    daysWithAttendance: number;
    daysWithOvertime: number;
    totalWorkedMinutes: number;
    totalWorkedHours: number;
    totalOvertimeDurationHours: number;
    totalOvertimeWeightedHours: number;
  };
};

export type AttendanceDashboardJson = {
  date: string;
  totalEmployees: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  paidLeave: number;
  unpaidLeave: number;
  payrollCostToday: number;
  totalWorkedHours: number;
  byStatus: Record<string, number>;
};

export type OvertimeStatusLogJson = {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string;
  actorName: string | null;
  assignmentReason: string | null;
  rejectionReason: string | null;
  note: string | null;
  changes: Record<string, unknown> | null;
  createdAt: string | null;
};

export type OvertimePolicyJson = {
  weekdayMultiplier: number;
  fridayMultiplier: number;
  weekdayLabel: string;
  fridayLabel: string;
};

export type OvertimeRequestJson = {
  id: string;
  employeeId: string;
  employeeNumber: string;
  fullName: string;
  supervisorId: string | null;
  overtimeDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  weightedHours: number;
  rateMultiplier: number;
  multiplierLabel: string;
  approvedHours: number;
  reason: string | null;
  assignmentReason: string | null;
  status: "pending" | "approved" | "rejected" | "completed";
  isActive: boolean;
  deletedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  updatedAt: string | null;
  updatedByName: string | null;
  statusLogs: OvertimeStatusLogJson[];
};

export type PayrollPreviewPeriodJson = {
  periodStart: string;
  periodEnd: string;
};

export type PayrollHourlyRateMetaJson = {
  workDaysPerWeek: number;
  dailyWorkHours: number;
  dailyWorkMinutes: number;
  checkIn: string;
  checkOut: string;
  weekdayOvertimeMultiplier: number;
  fridayOvertimeMultiplier: number;
};

export type PayrollPreviewJson = {
  year: number;
  month: number;
  periodStart: string;
  periodEnd: string;
  periods: PayrollPreviewPeriodJson[];
  hourlyRateMeta?: PayrollHourlyRateMetaJson;
  items: Array<{
    employeeId: number;
    employeeNumber: string;
    fullName: string;
    basicSalary: number;
    hourlyRate: number;
    daysPresent: number;
    daysAbsent: number;
    daysPaidLeave: number;
    daysUnpaidLeave: number;
    lastRecordLeaveHint: string | null;
    basicWorkHours: number;
    weekdayOvertimeRawHours: number;
    fridayOvertimeRawHours: number;
    weekdayOvertimeWeightedHours: number;
    fridayOvertimeWeightedHours: number;
    totalBillableHours: number;
    proratedBasicSalary: number;
    actualPay: number;
    netPay: number;
    deduction: number;
    regularPay: number;
    overtimePay: number;
    fridayOvertimePay: number;
    totalPay: number;
    snapshot: unknown;
  }>;
  totals: {
    regularPay: number;
    overtimePay: number;
    fridayOvertimePay: number;
    actualPay: number;
    totalPay: number;
  };
};

export type PayrollJson = {
  id: string;
  year: number;
  month: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  totalRegularPay: number;
  totalOvertimePay: number;
  totalFridayOvertimePay: number;
  totalAmount: number;
  generatedAt: string | null;
  items: Array<{
    id: string;
    employeeId: string;
    employeeNumber: string;
    fullName: string;
    daysPresent: number;
    daysAbsent: number;
    totalWorkedMinutes: number;
    totalOvertimeMinutes: number;
    totalFridayOvertimeMinutes: number;
    regularPay: number;
    overtimePay: number;
    fridayOvertimePay: number;
    totalPay: number;
    snapshotJson: unknown;
  }>;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getLaravelApiBaseUrl()}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authFetchHeaders(),
      ...init?.headers
    },
    cache: "no-store"
  });
  const text = await response.text();
  if (!response.ok) {
    let msg = `${response.status}`;
    try {
      const j = JSON.parse(text) as { message?: string; errors?: Record<string, string[]> };
      if (j.errors) {
        const parts = Object.entries(j.errors).flatMap(([k, v]) => v.map((e) => `${k}: ${e}`));
        if (parts.length) msg = parts.join(" — ");
      } else if (j.message) {
        msg = j.message;
      }
    } catch {
      if (text) msg = text.slice(0, 200);
    }
    throw new Error(msg);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    u.set(k, String(v));
  }
  const q = u.toString();
  return q ? `?${q}` : "";
}

export const workforceAttendanceApi = {
  dashboard: (date: string) =>
    requestJson<{ data: AttendanceDashboardJson }>(
      `/workforce/attendance/dashboard${buildQuery({ date })}`
    ).then((r) => r.data),

  dailyRoster: (params: {
    date: string;
    search?: string;
    departmentId?: string;
    shiftId?: string;
  }) =>
    requestJson<{ data: DailyAttendancePayloadJson }>(
      `/workforce/attendance/daily${buildQuery(params)}`
    ).then((r) => r.data),

  listRecords: (params: {
    date: string;
    page?: number;
    pageSize?: number;
    search?: string;
    departmentId?: string;
    shiftId?: string;
    status?: string;
  }) =>
    requestJson<{ data: AttendanceRecordJson[]; meta: PaginatedMeta }>(
      `/workforce/attendance/records${buildQuery(params)}`
    ),

  checkIn: (employeeId: string) =>
    requestJson<{ data: AttendanceRecordJson }>("/workforce/attendance/check-in", {
      method: "POST",
      body: JSON.stringify({ employeeId })
    }).then((r) => r.data),

  checkOut: (employeeId: string) =>
    requestJson<{ data: AttendanceRecordJson }>("/workforce/attendance/check-out", {
      method: "POST",
      body: JSON.stringify({ employeeId })
    }).then((r) => r.data),

  manualEntry: (body: {
    employeeId: string;
    attendanceDate: string;
    action?: DailyAttendanceAction;
    checkIn?: string;
    checkOut?: string;
    overtimeFrom?: string;
    attendanceStatus?: AttendanceStatus;
    notes?: string;
  }) =>
    requestJson<{ data: AttendanceRecordJson }>("/workforce/attendance/records", {
      method: "POST",
      body: JSON.stringify(body)
    }).then((r) => r.data),

  approveRecord: (recordId: string) =>
    requestJson<{ data: AttendanceRecordJson }>(`/workforce/attendance/records/${recordId}/approve`, {
      method: "POST",
      body: JSON.stringify({})
    }).then((r) => r.data),

  listOvertime: (params?: {
    status?: string;
    recordScope?: "active" | "inactive" | "all";
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) =>
    requestJson<{
      data: OvertimeRequestJson[];
      meta: PaginatedMeta & { overtimePolicy?: OvertimePolicyJson };
    }>(`/workforce/overtime/requests${buildQuery(params ?? {})}`),

  updateOvertime: (
    id: string,
    body: {
      startTime: string;
      endTime: string;
      reason?: string | null;
      assignmentReason?: string | null;
    }
  ) =>
    requestJson<{ data: OvertimeRequestJson }>(`/workforce/overtime/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }).then((r) => r.data),

  createOvertime: (body: {
    employeeId: string;
    overtimeDate: string;
    startTime: string;
    endTime: string;
    reason?: string;
    assignmentReason?: string;
  }) =>
    requestJson<{ data: OvertimeRequestJson }>("/workforce/overtime/requests", {
      method: "POST",
      body: JSON.stringify(body)
    }).then((r) => r.data),

  approveOvertime: (id: string, approvedHours?: number) =>
    requestJson<{ data: OvertimeRequestJson }>(`/workforce/overtime/requests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(approvedHours != null ? { approvedHours } : {})
    }).then((r) => r.data),

  rejectOvertime: (id: string, rejectionReason: string) =>
    requestJson<{ data: OvertimeRequestJson }>(`/workforce/overtime/requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejectionReason })
    }).then((r) => r.data),

  completeOvertime: (id: string) =>
    requestJson<{ data: OvertimeRequestJson }>(`/workforce/overtime/requests/${id}/complete`, {
      method: "POST",
      body: JSON.stringify({})
    }).then((r) => r.data),

  deleteOvertime: (id: string) =>
    requestJson<{ deleted: boolean }>(`/workforce/overtime/requests/${id}`, {
      method: "DELETE"
    }),

  payrollPreview: (
    year: number,
    month: number,
    period?: { periodStart: string; periodEnd: string }
  ) =>
    requestJson<{ data: PayrollPreviewJson }>("/workforce/payrolls/preview", {
      method: "POST",
      body: JSON.stringify({
        year,
        month,
        ...(period ? { periodStart: period.periodStart, periodEnd: period.periodEnd } : {})
      })
    }).then((r) => r.data),

  payrollGenerate: (year: number, month: number) =>
    requestJson<{ data: PayrollJson }>("/workforce/payrolls/generate", {
      method: "POST",
      body: JSON.stringify({ year, month })
    }).then((r) => r.data),

  listPayrolls: () => requestJson<{ data: PayrollJson[] }>("/workforce/payrolls").then((r) => r.data),

  employeeAttendanceReport: (employeeId: string, from: string, to: string) =>
    requestJson<{ data: EmployeeAttendanceReportJson }>(
      `/workforce/attendance/employees/${employeeId}/report${buildQuery({ from, to })}`
    ).then((r) => r.data)
};
