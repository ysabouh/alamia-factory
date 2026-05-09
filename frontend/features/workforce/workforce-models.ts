export type Attendance = "present" | "late" | "absent" | "leave";

export interface OpsEmployee {
  id: string;
  name: string;
  initials: string;
  role: string;
  /** Coarse grouping used for KPI filters (aligned with dashboard department chips). */
  department: string;
  /** Finer organizational context (hall · department row) when available from ERP. */
  departmentDetail?: string;
  hall: string;
  shift: string;
  attendance: Attendance;
  performance: number;
  reliability: number;
  productionEff: number;
  bonusPoints: number;
  violations: number;
  machineCode: string | null;
  avatarHue: number;
  /** Profile photo when provided by HR / roster API */
  photoUrl?: string | null;
  /** Monthly base salary when sourced from ERP roster. */
  basicSalaryMonthly?: number;
  /** Annual entitlement snapshot from HR foundation. */
  annualLeaveDays?: number;
}
