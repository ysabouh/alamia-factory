export type MachineStatus = "running" | "idle" | "maintenance" | "down";

export interface MachineSnapshot {
  id: number;
  code: string;
  name: string;
  type: "injection" | "blow_molding" | "line";
  status: MachineStatus;
  currentMold: string | null;
  operator: string | null;
  technician: string | null;
  producedPiecesToday: number;
  producedWeightKgToday: number;
  wasteKgToday: number;
  downtimeMinutesToday: number;
  activeAlert: string | null;
}

export interface DashboardKpis {
  producedPiecesToday: number;
  producedWeightKgToday: number;
  wasteRate: number;
  machineUtilization: number;
  openMaintenanceTickets: number;
  lowStockItems: number;
}

export interface ProductionTrendPoint {
  label: string;
  produced: number;
  waste: number;
}

export type WorkforceAttendance = "present" | "late" | "absent" | "leave";

/** Live roster emitted by Laravel when caller has workforce.view permission. */
export interface WorkforceRosterEntry {
  id: number;
  employeeNumber: string;
  employeeCode: string;
  fullName: string;
  initials: string;
  role: string;
  department: string;
  hall: string;
  shift: string;
  shiftCode?: string | null;
  attendance: WorkforceAttendance;
  employmentStatusCode?: string | null;
  employmentStatusLabel?: string | null;
  performance: number;
  reliability: number;
  productionEff: number;
  safetyScore: number;
  bonusPoints: number;
  violations: number;
  machineCode: string | null;
  avatarHue: number;
  /** Optional profile image URL from HR */
  avatarUrl?: string | null;
  basicSalary: number;
  annualLeaveBalance: number;
}

export interface LiveDashboard {
  kpis: DashboardKpis;
  machines: MachineSnapshot[];
  productionTrend: ProductionTrendPoint[];
  /** Populated server-side after auth; falls back client-side synthesis when missing. */
  workforceRoster?: WorkforceRosterEntry[];
  alerts: Array<{
    id: number;
    severity: "info" | "warning" | "critical";
    message: string;
    createdAt: string;
  }>;
}
