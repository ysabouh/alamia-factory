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

export interface LiveDashboard {
  kpis: DashboardKpis;
  machines: MachineSnapshot[];
  productionTrend: ProductionTrendPoint[];
  alerts: Array<{
    id: number;
    severity: "info" | "warning" | "critical";
    message: string;
    createdAt: string;
  }>;
}
