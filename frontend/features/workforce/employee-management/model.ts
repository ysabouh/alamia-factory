import { z } from "zod";

export type EmployeeEmploymentStatus = "active" | "suspended" | "probation" | "terminated";
export type EmployeeGender = "male" | "female" | "other";

export interface ShiftHistoryEntry {
  id: string;
  label: string;
  from: string;
  to: string;
}

export interface RewardEntry {
  id: string;
  label: string;
  date: string;
  amount: number;
}

export interface PenaltyEntry {
  id: string;
  label: string;
  date: string;
  severity: "low" | "medium" | "high";
}

export type AttendanceState = "present" | "late" | "absent" | "leave";

export interface ManagedEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: EmployeeGender;
  birthDate: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  nationalId: string;
  address: string;
  /** Display labels (from API relations) */
  department: string;
  hall: string;
  role: string;
  shift: string;
  /** Workforce API FK ids (decimal string) */
  hallId: string | null;
  departmentId: string | null;
  jobRoleId: string | null;
  shiftId: string | null;
  employeeStatusId: string | null;
  isActive: boolean;
  salary: number;
  /** سعر الساعة الإضافية — أيام عادية */
  overtimeRate: number;
  /** سعر الساعة الإضافية — يوم الجمعة */
  overtimeFridayRate: number;
  hireDate: string;
  photoUrl: string | null;
  notes: string;
  status: EmployeeEmploymentStatus;
  performanceScore: number;
  reliabilityScore: number;
  productionEff: number;
  attendanceStatus: AttendanceState;
  bonusPoints: number;
  violations: number;
  annualLeaveBalance: number;
  assignedMachines: string[];
  shiftHistory: ShiftHistoryEntry[];
  rewards: RewardEntry[];
  penalties: PenaltyEntry[];
  /** Attendance rollup for detail panel (synthetic until attendance API exists) */
  attendancePresentDays: number;
  attendanceLateDays: number;
  attendanceAbsentDays: number;
  /** حساب دخول النظام المرتبط بالموظف (إن وُجد) */
  systemUser: {
    id: number;
    email: string;
    name: string;
    isActive: boolean;
    roles: string[];
    permissions: string[];
  } | null;
}

export const DEPARTMENTS = ["الإنتاج", "الصيانة", "الجودة", "المستودعات", "المحاسبة", "إداري"] as const;
export const HALLS = ["قاعة الحقن", "قاعة النفخ", "التغليف", "جميع القاعات", "إداري"] as const;
export const SHIFTS = ["صباحي", "مسائي", "ليلي"] as const;
export const ROLES = [
  "مشغّل ماكينة",
  "فني صيانة",
  "مشرف جودة",
  "أمين مستودع",
  "محاسبة تكاليف",
  "مخطط إنتاج",
  "مراقبة سلامة",
  "مشرف إنتاج",
  "موارد بشرية"
] as const;

export const employeeFormSchema = z.object({
  employeeNumber: z.string().min(1, "مطلوب"),
  firstName: z.string().min(1, "مطلوب"),
  lastName: z.string().min(1, "مطلوب"),
  gender: z.enum(["male", "female", "other"]),
  birthDate: z.string().min(1, "مطلوب"),
  phone: z.string().min(6, "رقم غير صالح"),
  emergencyPhone: z.string().min(6, "رقم غير صالح"),
  email: z.string().refine((s) => {
    const t = s.trim();
    return t === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
  }, "بريد غير صالح"),
  nationalId: z.string().min(4, "مطلوب"),
  address: z.string().min(2, "مطلوب"),
  hallId: z.string().default(""),
  departmentId: z.string().default(""),
  jobRoleId: z.string().default(""),
  shiftId: z.string().default(""),
  salary: z.coerce.number().min(0),
  overtimeRate: z.coerce.number().min(0),
  overtimeFridayRate: z.coerce.number().min(0),
  hireDate: z.string().min(1, "مطلوب"),
  photoUrl: z.string().max(4_000_000).default(""),
  notes: z.string().default("")
});

export const employeeEditExtensionSchema = z.object({
  status: z.enum(["active", "suspended", "probation", "terminated"]),
  performanceScore: z.coerce.number().min(0).max(100),
  reliabilityScore: z.coerce.number().min(0).max(100),
  productionEff: z.coerce.number().min(0).max(100),
  annualLeaveBalance: z.coerce.number().min(0)
});

export const fullEmployeeEditSchema = employeeFormSchema.merge(employeeEditExtensionSchema);

export type EmployeeFormInput = z.infer<typeof employeeFormSchema>;
export type FullEmployeeEditInput = z.infer<typeof fullEmployeeEditSchema>;
