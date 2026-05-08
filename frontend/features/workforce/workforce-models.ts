export type Attendance = "present" | "late" | "absent" | "leave";

export interface OpsEmployee {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: string;
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
}
