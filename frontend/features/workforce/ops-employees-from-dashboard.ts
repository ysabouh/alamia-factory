import type { LiveDashboard, MachineSnapshot, WorkforceRosterEntry } from "@/types/factory";

import type { Attendance, OpsEmployee } from "./workforce-models";

function seedFromStr(s: string, max: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % max;
}

function hallFromMachine(m: MachineSnapshot): string {
  if (m.type === "injection") return "قاعة الحقن";
  if (m.type === "blow_molding") return "قاعة النفخ";
  return "التغليف";
}

function coerceDepartmentSector(role: string, department: string, hall: string): string {
  const blob = `${role} ${department} ${hall}`;
  if (/جودة/u.test(blob)) return "الجودة";
  if (/مستودع|المستودعات|المخزون/u.test(blob)) return "المستودعات";
  if (/محاسب|تكلفة|مالي/u.test(blob)) return "المحاسبة";
  if (/صيانة|كهرباء|ميكانيك/u.test(blob)) return "الصيانة";
  if (/مسؤول موارد بشرية|موارد بشرية|مسؤول النظام|تقنية/u.test(blob)) return "إداري";
  return "الإنتاج";
}

function rosterRowToOps(row: WorkforceRosterEntry): OpsEmployee {
  const displayName =
    typeof row.fullName === "string" && row.fullName.trim() !== "" ? row.fullName.trim() : "موظف (بدون اسم)";
  const detail = [row.hall, row.department].filter((x) => x && String(x).trim() !== "").join(" · ");
  return {
    id: String(row.id),
    name: displayName,
    initials: row.initials,
    role: row.role || "—",
    department: coerceDepartmentSector(row.role, row.department, row.hall),
    departmentDetail: detail || undefined,
    hall: row.hall || "—",
    shift: row.shift || "—",
    attendance:
      row.attendance === "present" || row.attendance === "late" || row.attendance === "absent" || row.attendance === "leave"
        ? row.attendance
        : "present",
    performance: row.performance,
    reliability: row.reliability,
    productionEff: row.productionEff,
    bonusPoints: row.bonusPoints,
    violations: row.violations,
    machineCode: row.machineCode,
    avatarHue: row.avatarHue,
    photoUrl: row.avatarUrl ?? null,
    basicSalaryMonthly: row.basicSalary,
    annualLeaveDays: row.annualLeaveBalance
  };
}

function buildEmployees(dashboard: LiveDashboard): OpsEmployee[] {
  const machines = dashboard.machines ?? [];
  const kpis = dashboard.kpis ?? { wasteRate: 0 };
  const rows: OpsEmployee[] = [];
  const seen = new Set<string>();

  const push = (name: string, role: string, dept: string, m: MachineSnapshot | null, kind: "op" | "tech") => {
    if (!name || seen.has(name)) return;
    seen.add(name);
    const id = `e-${name}`;
    const effBase = kind === "op" ? 78 + seedFromStr(name, 18) : 72 + seedFromStr(name + "t", 20);
    const wasteAdj = kpis.wasteRate > 4 ? -4 : 2;
    rows.push({
      id,
      name,
      initials:
        name
          .split(/\s/)
          .map((x) => x[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || name.slice(0, 2),
      role,
      department: dept,
      hall: m ? hallFromMachine(m) : dept === "الصيانة" ? "جميع القاعات" : "إداري",
      shift: seedFromStr(name, 2) === 0 ? "صباحي" : seedFromStr(name, 2) === 1 ? "مسائي" : "ليلي",
      attendance: (["present", "present", "present", "late", "leave", "absent"] as Attendance[])[seedFromStr(name, 6)],
      performance: Math.min(99, effBase + seedFromStr(name + "p", 12)),
      reliability: Math.min(100, 80 + seedFromStr(name + "r", 18)),
      productionEff: Math.min(98, effBase + wasteAdj),
      bonusPoints: 200 + seedFromStr(name + "b", 400),
      violations: seedFromStr(name + "v", 4),
      machineCode: m && kind === "op" ? m.code : kind === "tech" && m ? m.code : null,
      avatarHue: seedFromStr(name, 360)
    });
  };

  machines.forEach((m) => {
    if (m.operator) push(m.operator, "مشغّل ماكينة", "الإنتاج", m, "op");
    if (m.technician) push(m.technician, "فني صيانة", "الصيانة", m, "tech");
  });

  const extra: Array<[string, string, string]> = [
    ["ليلى المالكي", "مشرفة جودة", "الجودة"],
    ["ناصر الزهراني", "أمين مستودع", "المستودعات"],
    ["هند الغامدي", "محاسبة تكاليف", "المحاسبة"],
    ["رامي العتيبي", "مخطط إنتاج", "الإنتاج"],
    ["منى الشهري", "مراقبة سلامة", "الإنتاج"],
    ["خالد باحميد", "مشغّل خط", "الإنتاج"]
  ];
  extra.forEach(([n, r, d]) => {
    const m = machines.length > 0 ? machines[seedFromStr(n, machines.length)] ?? null : null;
    push(n, r, d, m, "op");
  });

  return rows.sort((a, b) => b.performance - a.performance);
}

export function opsEmployeesFromDashboard(dashboard: LiveDashboard): OpsEmployee[] {
  const rows = dashboard.workforceRoster;
  if (rows && rows.length > 0) {
    return rows.map(rosterRowToOps).sort((a, b) => b.performance - a.performance);
  }
  return buildEmployees(dashboard);
}
