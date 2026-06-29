import type { LiveDashboard } from "@/types/factory";

import { opsEmployeesFromDashboard } from "../ops-employees-from-dashboard";
import type { ManagedEmployee } from "./model";

function splitName(full: string): { first: string; last: string } {
  const p = full.trim().split(/\s+/);
  if (p.length === 1) return { first: p[0], last: "—" };
  return { first: p[0], last: p.slice(1).join(" ") };
}

function syntheticHistory(shift: string): ManagedEmployee["shiftHistory"] {
  return [
    { id: "h1", label: shift, from: "2025-11-01", to: "مستمر" },
    { id: "h2", label: "صباحي", from: "2025-06-01", to: "2025-10-31" }
  ];
}

function syntheticRewards(): ManagedEmployee["rewards"] {
  return [
    { id: "r1", label: "مكافأة جودة", date: "2026-04-12", amount: 350 },
    { id: "r2", label: "حضور كامل — ربع سنوي", date: "2026-03-28", amount: 500 }
  ];
}

function syntheticPenalties(violations: number): ManagedEmployee["penalties"] {
  if (violations < 1) return [];
  return [{ id: "p1", label: "تنبيه سلامة", date: "2026-02-04", severity: "low" as const }];
}

export function managedFromOpsRow(e: ReturnType<typeof opsEmployeesFromDashboard>[number]): ManagedEmployee {
  const { first, last } = splitName(e.name);
  const machines = e.machineCode ? [e.machineCode] : [];

  return {
    id: e.id,
    employeeNumber: e.id.startsWith("e-") ? `TMP-${e.id.slice(2, 8).toUpperCase()}` : `EMP-${e.id}`,
    firstName: first,
    lastName: last,
    fullName: e.name,
    gender: "male",
    birthDate: "1992-01-15",
    phone: "0500000000",
    emergencyPhone: "0500000001",
    email: `${e.id.replace(/\W/g, "")}@myfactory.local`,
    nationalId: "1xxxxxxxx",
    address: "—",
    department: e.department,
    hall: e.hall,
    role: e.role,
    shift: e.shift,
    hallId: null,
    departmentId: null,
    reportsToId: null,
    managerName: null,
    jobRoleId: null,
    shiftId: null,
    employeeStatusId: null,
    isActive: true,
    salary: e.basicSalaryMonthly ?? 4200,
    currencyId: null,
    currencyCode: "SYP",
    currencySymbol: "ل.س",
    salaryUsd: (e.basicSalaryMonthly ?? 4200) / 13000,
    hireDate: "2023-04-01",
    photoUrl: e.photoUrl ?? null,
    notes: e.departmentDetail ?? "",
    status: e.violations > 2 ? "probation" : "active",
    performanceScore: e.performance,
    reliabilityScore: e.reliability,
    productionEff: e.productionEff,
    attendanceStatus: e.attendance,
    bonusPoints: e.bonusPoints,
    violations: e.violations,
    annualLeaveBalance: e.annualLeaveDays ?? 18,
    certifications: [],
    assignedMachines: machines,
    shiftHistory: syntheticHistory(e.shift),
    rewards: syntheticRewards(),
    penalties: syntheticPenalties(e.violations),
    attendancePresentDays: 20,
    attendanceLateDays: e.attendance === "late" ? 2 : 1,
    attendanceAbsentDays: e.attendance === "absent" ? 1 : 0,
    systemUser: null
  };
}

export function seedManagedFromDashboard(dashboard: LiveDashboard): ManagedEmployee[] {
  return opsEmployeesFromDashboard(dashboard).map(managedFromOpsRow);
}

export function mergeWithLiveRoster(stored: ManagedEmployee[], dashboard: LiveDashboard): ManagedEmployee[] {
  const fresh = seedManagedFromDashboard(dashboard);
  const freshIds = new Set(fresh.map((x) => x.id));
  const locals = stored.filter((s) => !freshIds.has(s.id));
  const mergedFresh = fresh.map((f) => {
    const old = stored.find((s) => s.id === f.id);
    if (!old) return f;
    return {
      ...f,
      notes: old.notes,
      photoUrl: old.photoUrl ?? f.photoUrl,
      salary: old.salary,
      status: old.status,
      rewards: old.rewards.length ? old.rewards : f.rewards,
      penalties: old.penalties.length ? old.penalties : f.penalties
    };
  });
  return [...mergedFresh, ...locals];
}
