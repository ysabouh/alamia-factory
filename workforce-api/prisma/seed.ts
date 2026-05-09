/**
 * Industrial workforce seed (MySQL): halls, departments, job roles, shifts, statuses, then EMP-WF-001…050.
 * Idempotent for reference tables; employees with prefix EMP-WF- are replaced each run.
 *
 *   npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

function utcTime(h: number, m: number): Date {
  return new Date(Date.UTC(1970, 0, 1, h, m, 0, 0));
}

function utcDate(y: number, mo: number, d: number): Date {
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0));
}

/** Deterministic pseudo-random in [0, 1) */
function jit(i: number, salt = 0): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;

  return x - Math.floor(x);
}

function dec(a: number, b: number, i: number, s: number): Decimal {
  const v = a + jit(i, s) * (b - a);

  return new Decimal(Math.round(v * 100) / 100);
}

/** Safe char-code salt when codes are shorter than the index asked for */
function cc(text: string, index: number): number {
  if (!text) return index + 71;
  const c = text.charCodeAt(Math.abs(index) % text.length);
  return Number.isFinite(c) ? c : 91;
}

/** KPI-style score bounded for Decimal(5,2) */
function scoreBand(base: number, i: number, salt: number, min: number, max: number): Decimal {
  const jitter = jit(i + salt + 331, cc(String(salt), i)) * 14 - jit(i + salt + 509, cc(String(salt + 31), i)) * 7;
  let v = base + jitter;
  v = Math.min(max, Math.max(min, v));
  return new Decimal(Math.round(v * 100) / 100);
}

const HALLS = [
  { code: "INJ-H1", name: "قاعة الحقن ١ / Injection Hall 1", type: "Injection", desc: "High-tonnage injection cells" },
  { code: "INJ-H2", name: "قاعة الحقن ٢ / Injection Hall 2", type: "Injection", desc: "Thin-wall & high-cavity tooling" },
  { code: "BLOW-H1", name: "قاعة النفخ / Blow molding", type: "Blow molding", desc: "1–5 L packaging lines" },
  { code: "PACK-H1", name: "التعبئة والتغليف / Packaging", type: "Packaging", desc: "Capping, labeling, palletizing" },
  { code: "MAIN-H1", name: "الصيانة والمرافق / Maintenance", type: "Maintenance", desc: "TPM, chillers, utilities" },
  { code: "WH-H1", name: "المستودعات / Warehousing", type: "Logistics", desc: "RM & FG handling" }
] as const;

const DEPTS: ReadonlyArray<{ code: string; hall: (typeof HALLS)[number]["code"]; name: string }> = [
  { code: "DEPT-INJ-A", hall: "INJ-H1", name: "تشغيل الحقن أ / Injection ops A" },
  { code: "DEPT-INJ-QA", hall: "INJ-H1", name: "جودة حقن / Injection QA lane" },
  { code: "DEPT-INJ-B", hall: "INJ-H2", name: "تشغيل الحقن ب / Injection ops B" },
  { code: "DEPT-BLOW", hall: "BLOW-H1", name: "تشغيل النفخ / Blow molding" },
  { code: "DEPT-PACK-A", hall: "PACK-H1", name: "خط تعبئة أ / Packing A" },
  { code: "DEPT-PACK-B", hall: "PACK-H1", name: "خط تعبئة ب / Packing B" },
  { code: "DEPT-QC-LAB", hall: "PACK-H1", name: "مختبر الجودة / QA lab" },
  { code: "DEPT-PLAN", hall: "PACK-H1", name: "تخطيط الإنتاج / Planning" },
  { code: "DEPT-MECH", hall: "MAIN-H1", name: "ميكانيك صناعي / Mechanical" },
  { code: "DEPT-ELEC", hall: "MAIN-H1", name: "كهرباء وأتمتة / Electrical" },
  { code: "DEPT-MOLD", hall: "MAIN-H1", name: "ورشة القوالب / Mold shop" },
  { code: "DEPT-HSE", hall: "MAIN-H1", name: "السلامة والموارد البشرية / HSE & HR" },
  { code: "DEPT-WH-R", hall: "WH-H1", name: "مستودع خام / RM" },
  { code: "DEPT-WH-F", hall: "WH-H1", name: "مستودع تام / FG" }
];

/** SAR monthly bands (industrial plastics corridor, realistic spread) */
const ROLES = [
  { code: "ROLE-FMR", name: "Factory director — مدير المصنع", lvl: 10, min: 26_800, max: 39_500 },
  { code: "ROLE-QMG", name: "QA manager — مدير الجودة", lvl: 9, min: 22_900, max: 33_600 },
  { code: "ROLE-LOG", name: "Logistics manager — مدير لوجستيات", lvl: 9, min: 22_400, max: 32_900 },
  { code: "ROLE-ENG", name: "Engineering manager — مدير هندسة", lvl: 9, min: 23_100, max: 34_200 },
  { code: "ROLE-PSU", name: "Production supervisor — مشرف إنتاج", lvl: 8, min: 18_050, max: 26_750 },
  { code: "ROLE-HSM", name: "HSE lead — مشرف سلامة", lvl: 8, min: 17_850, max: 25_950 },
  { code: "ROLE-TECH", name: "Senior technician — أمين مهندسية", lvl: 7, min: 15_900, max: 22_750 },
  { code: "ROLE-PLNR", name: "Planner — مخطط إنتاج", lvl: 7, min: 15_700, max: 22_900 },
  { code: "ROLE-HRD", name: "HR payroll — مختص موارد وأجور", lvl: 6, min: 14_050, max: 20_650 },
  { code: "ROLE-SET", name: "Mold setter — ضابط قوالب", lvl: 6, min: 14_750, max: 21_750 },
  { code: "ROLE-INJ", name: "Injection operator — مشغّل حقن", lvl: 5, min: 9_780, max: 14_820 },
  { code: "ROLE-BLW", name: "Blow operator — عامل نفخ", lvl: 5, min: 9_720, max: 14_780 },
  { code: "ROLE-PCK", name: "Packing operator — تعبئة", lvl: 4, min: 8_690, max: 12_640 },
  { code: "ROLE-MNT", name: "Maintenance mechanic — صيانة ميكانيك", lvl: 5, min: 10_880, max: 15_720 },
  { code: "ROLE-ELE", name: "Industrial electrician — كهربائي", lvl: 5, min: 11_020, max: 16_050 },
  { code: "ROLE-QIN", name: "Line QA inspector — مفتّش جودة", lvl: 5, min: 10_720, max: 15_580 },
  { code: "ROLE-LAB", name: "Lab QC tech — فني مخبر", lvl: 5, min: 10_680, max: 15_520 },
  { code: "ROLE-FLH", name: "Forklift / stacker driver — مستودعات", lvl: 4, min: 8_720, max: 12_680 },
  { code: "ROLE-MAT", name: "Material handler — نقل مواد", lvl: 4, min: 8_640, max: 12_580 },
  { code: "ROLE-MED", name: "Workplace medic aide — سلاسة/إسعاف", lvl: 4, min: 8_580, max: 12_450 }
] as const;

const SHIFTS = [
  { code: "SHIFT-DAY", label: "Day office — دوام صباحي إداري", sh: 8, sm: 0, eh: 16, em: 0 },
  { code: "SHIFT-QCX", label: "QC staggered — المختبر / أخذ عينات نهاري", sh: 7, sm: 30, eh: 15, em: 30 },
  { code: "SHIFT-MORN", label: "Prod morning shift — انتاج صباحي صناعي", sh: 6, sm: 45, eh: 14, em: 45 },
  { code: "SHIFT-EVE", label: "Afternoon-evening prod — انتاج مسائي صناعي", sh: 14, sm: 45, eh: 22, em: 45 },
  { code: "SHIFT-NGT", label: "Night coverage — مغطى ليلي مخفّض", sh: 22, sm: 30, eh: 6, em: 30 }
];

const STATUSES = [
  { code: "ACTIVE", name: "على رأس العمل — Active duty" },
  { code: "ON_LEAVE", name: "إجازة معتمدة — Approved absence" },
  { code: "PROBATION", name: "تقييم مهني ضمن الفترة — Probation window" },
  { code: "SUSP_REST", name: "تقييد مهام مؤقت — Restricted-duty suspension" }
] as const;

type EmpTpl = Readonly<{
  firstName: string;
  lastName: string;
  gender: string | null;
  dept: string;
  role: (typeof ROLES)[number]["code"];
  shift: (typeof SHIFTS)[number]["code"];
  hireY: number;
  status?: (typeof STATUSES)[number]["code"];
  notes?: string;
}>;

const CURATED_EMPLOYEES: EmpTpl[] = [
  { firstName: "Khalid Fahad", lastName: "الشمراني", gender: "ذكر", dept: "DEPT-HSE", role: "ROLE-FMR", shift: "SHIFT-DAY", hireY: 2016, notes: "Board KPI owner — OEE × TRIR" },
  { firstName: "Layla Hussein", lastName: "Al-Faraj", gender: "أنثى", dept: "DEPT-QC-LAB", role: "ROLE-QMG", shift: "SHIFT-QCX", hireY: 2017 },
  { firstName: "James Abdullah", lastName: "الحربي", gender: "ذكر", dept: "DEPT-MOLD", role: "ROLE-ENG", shift: "SHIFT-DAY", hireY: 2019 },
  { firstName: "Nora Waleed", lastName: "الديب", gender: "أنثى", dept: "DEPT-WH-R", role: "ROLE-LOG", shift: "SHIFT-EVE", hireY: 2018 },
  { firstName: "Omar", lastName: "Al-Anazi", gender: "ذكر", dept: "DEPT-INJ-A", role: "ROLE-PSU", shift: "SHIFT-QCX", hireY: 2019 },
  { firstName: "Sara Malik", lastName: "الشهري", gender: "أنثى", dept: "DEPT-BLOW", role: "ROLE-PSU", shift: "SHIFT-QCX", hireY: 2021 },
  { firstName: "Michael", lastName: "الزهراني", gender: "ذكر", dept: "DEPT-PACK-B", role: "ROLE-PSU", shift: "SHIFT-QCX", hireY: 2023 },
  { firstName: "Hani", lastName: "Al-Ruwais", gender: "ذكر", dept: "DEPT-ELEC", role: "ROLE-HSM", shift: "SHIFT-MORN", hireY: 2020, notes: "LOTO / IECEx bridge programs" },
  { firstName: "Muneera Jamal", lastName: "الحصيني", gender: "أنثى", dept: "DEPT-PLAN", role: "ROLE-PLNR", shift: "SHIFT-DAY", hireY: 2022 },
  { firstName: "Chris", lastName: "الجابر", gender: "ذكر", dept: "DEPT-HSE", role: "ROLE-HRD", shift: "SHIFT-DAY", hireY: 2023 },
  { firstName: "Tariq", lastName: "Al-Amri", gender: "ذكر", dept: "DEPT-MOLD", role: "ROLE-SET", shift: "SHIFT-MORN", hireY: 2018 },
  { firstName: "Dalal Adel", lastName: "السبيعي", gender: "أنثى", dept: "DEPT-QC-LAB", role: "ROLE-LAB", shift: "SHIFT-QCX", hireY: 2024 },
  { firstName: "Mishal", lastName: "الحربي", gender: "ذكر", dept: "DEPT-INJ-QA", role: "ROLE-QIN", shift: "SHIFT-NGT", hireY: 2021 },
  { firstName: "David", lastName: "الحازمي", gender: "ذكر", dept: "DEPT-MECH", role: "ROLE-MNT", shift: "SHIFT-NGT", hireY: 2019 },
  { firstName: "Najla Saud", lastName: "الدوسري", gender: "أنثى", dept: "DEPT-ELEC", role: "ROLE-ELE", shift: "SHIFT-NGT", hireY: 2023 },
  { firstName: "سلطان", lastName: "Al-Ajlan", gender: "ذكر", dept: "DEPT-MECH", role: "ROLE-TECH", shift: "SHIFT-QCX", hireY: 2019 },
  { firstName: "Ruba", lastName: "القرني", gender: "أنثى", dept: "DEPT-INJ-B", role: "ROLE-INJ", shift: "SHIFT-EVE", hireY: 2024 },
  { firstName: "Anas Waleed", lastName: "الحربي", gender: "ذكر", dept: "DEPT-PACK-A", role: "ROLE-PCK", shift: "SHIFT-MORN", hireY: 2023 },
  {
    firstName: "Walid Adel",
    lastName: "Al-Rashed",
    gender: "ذكر",
    dept: "DEPT-WH-R",
    role: "ROLE-FLH",
    shift: "SHIFT-MORN",
    hireY: 2025,
    status: "PROBATION"
  },
  { firstName: "Mariam Adel", lastName: "الفارسي", gender: "أنثى", dept: "DEPT-WH-F", role: "ROLE-MAT", shift: "SHIFT-EVE", hireY: 2022 },
  { firstName: "Lina Malik", lastName: "Al-Harthy", gender: "أنثى", dept: "DEPT-BLOW", role: "ROLE-BLW", shift: "SHIFT-NGT", hireY: 2024 },
  { firstName: "Rayan Malik", lastName: "Al-Harthy", gender: "ذكر", dept: "DEPT-PACK-B", role: "ROLE-HRD", shift: "SHIFT-DAY", hireY: 2025 }
];

const SYNTH_PAIR: ReadonlyArray<readonly [string, string, string]> = [
  ["أحمد", "Johnson", "ذكر"],
  ["هند عبدالله", "Al-Turki", "أنثى"],
  ["Simon", "الشمري", "ذكر"],
  ["Khuloud", "Al-Ghamdi", "أنثى"],
  ["Rakan Adel", "Al-Naim", "ذكر"],
  ["Youssef Malik", "Al-Hantoushi", "ذكر"],
  ["Tamara", "Al-Lihyani", "أنثى"],
  ["سعد عبدالله", "Al-Barakati", "ذكر"],
  ["Karen", "Al-Amoudi", "أنثى"],
  ["Ibrahim Malik", "Al-Rawaf", "ذكر"],
  ["Tom", "Al-Nasser", "ذكر"],
  ["Halah", "Al-Dabas", "أنثى"],
  ["Faisal", "Al-Lugmani", "ذكر"],
  ["Nadia", "Al-Dajani", "أنثى"],
  ["Helen", "Al-Deeb", "أنثى"]
];

function pickRoleForDept(deptCode: string, i: number): (typeof ROLES)[number]["code"] {
  if (deptCode.includes("WH-R") || deptCode.includes("WH-F"))
    return jit(i, deptCode.charCodeAt(4)) > 0.48 ? "ROLE-FLH" : "ROLE-MAT";
  if (deptCode.includes("PACK")) return "ROLE-PCK";
  if (deptCode.includes("BLOW")) return "ROLE-BLW";
  if (deptCode.endsWith("-QA")) return jit(i + 501, deptCode.charCodeAt(8)) > 0.5 ? "ROLE-QIN" : "ROLE-INJ";
  if (deptCode.includes("QC-LAB")) return jit(i, 903) > 0.62 ? "ROLE-LAB" : "ROLE-QIN";
  if (deptCode.includes("MECH")) return "ROLE-MNT";
  if (deptCode.includes("ELEC")) return "ROLE-ELE";
  if (deptCode.includes("MOLD")) return jit(i, 771) > 0.74 ? "ROLE-SET" : "ROLE-MNT";
  if (deptCode.includes("PLAN")) return jit(i + 12, deptCode.charCodeAt(9)) > 0.35 ? "ROLE-PLNR" : "ROLE-MED";
  if (deptCode.includes("HSE")) return jit(i + 33, deptCode.charCodeAt(9)) > 0.55 ? "ROLE-HRD" : "ROLE-MED";
  if (deptCode.includes("INJ"))
    return deptCode.endsWith("-B") ? (jit(i, 881) > 0.76 ? "ROLE-TECH" : "ROLE-INJ") : "ROLE-INJ";
  return "ROLE-INJ";
}

function buildFiftyEmployees(): EmpTpl[] {
  const rows: EmpTpl[] = [...CURATED_EMPLOYEES];
  while (rows.length < 50) {
    const n = rows.length;
    const d = DEPTS[n % DEPTS.length]!;
    const deptCode = d.code;
    rows.push({
      firstName: SYNTH_PAIR[(n + 11) % SYNTH_PAIR.length]![0],
      lastName: SYNTH_PAIR[(n + 3) % SYNTH_PAIR.length]![1],
      gender: SYNTH_PAIR[(n + 17) % SYNTH_PAIR.length]![2] ?? null,
      dept: deptCode,
      role: pickRoleForDept(deptCode, n),
      shift: SHIFTS[n % SHIFTS.length]!.code,
      hireY: Math.floor(2013 + jit(n + 700, cc(deptCode, 9)) * 13),
      status: jit(n + 800, cc(deptCode, 11)) > 0.94 ? "ON_LEAVE" : "ACTIVE",
      notes: jit(n, 991) > 0.935 ? `Shift cross-train (${deptCode})` : undefined
    });
  }
  return rows.slice(0, 50);
}

function emailSlug(empNo: string, i: number): string {
  return `wf.${empNo.toLowerCase()}.${i}.plant@plasticfactory.demo`;
}

function phone(i: number, alt: boolean): string {
  const pref = alt ? "+96656" : "+96653";
  const body = Math.floor(1000000 + jit(i + 400, Number(alt)) * 8999999);

  return pref + body;
}

async function main(): Promise<void> {
  console.log("▶ Workforce reference tables …");

  for (const es of STATUSES) {
    await prisma.employeeStatus.upsert({
      where: { code: es.code },
      create: { code: es.code, name: es.name },
      update: { name: es.name }
    });
  }

  const hallId = new Map<string, bigint>();
  for (const h of HALLS) {
    const row = await prisma.hall.upsert({
      where: { code: h.code },
      create: { code: h.code, name: h.name, hallType: h.type, description: h.desc, isActive: true },
      update: { name: h.name, hallType: h.type, description: h.desc }
    });

    hallId.set(h.code, row.id);
  }

  const deptId = new Map<string, bigint>();
  for (const d of DEPTS) {
    const row = await prisma.department.upsert({
      where: { code: d.code },
      create: {
        code: d.code,
        name: d.name,
        hallId: hallId.get(d.hall)!,
        isActive: true,
        description: `Hall spine ${d.hall}`
      },
      update: { name: d.name, hallId: hallId.get(d.hall)! }
    });

    deptId.set(d.code, row.id);
  }

  const roleId = new Map<string, bigint>();
  for (const jr of ROLES) {
    const row = await prisma.jobRole.upsert({
      where: { code: jr.code },
      create: {
        code: jr.code,
        name: jr.name,
        roleLevel: jr.lvl,
        description: `Level ${jr.lvl} — monthly SAR bracket ${jr.min.toLocaleString("en-US")}–${jr.max.toLocaleString("en-US")}`
      },
      update: {
        name: jr.name,
        roleLevel: jr.lvl,
        description: `Level ${jr.lvl} — monthly SAR bracket ${jr.min.toLocaleString("en-US")}–${jr.max.toLocaleString("en-US")}`
      }
    });

    roleId.set(jr.code, row.id);
  }

  const shiftId = new Map<string, bigint>();
  for (const sh of SHIFTS) {
    const row = await prisma.shift.upsert({
      where: { code: sh.code },
      create: {
        code: sh.code,
        name: sh.label,
        startTime: utcTime(sh.sh, sh.sm),
        endTime: utcTime(sh.eh, sh.em),
        isActive: true
      },
      update: {
        name: sh.label,
        startTime: utcTime(sh.sh, sh.sm),
        endTime: utcTime(sh.eh, sh.em),
        isActive: true
      }
    });

    shiftId.set(sh.code, row.id);
  }

  console.log("▶ Replacing cohort EMP-WF-* …");

  await prisma.employee.deleteMany({ where: { employeeNumber: { startsWith: "EMP-WF-" } } });

  const employees = buildFiftyEmployees();
  if (employees.length !== 50)
    throw new Error(`Seed invariant: expected 50 profiles, got ${employees.length}`);

  for (let i = 0; i < 50; i++) {
    const e = employees[i]!;
    const empNo = `EMP-WF-${String(i + 1).padStart(3, "0")}`;
    const role = ROLES.find((rItem) => rItem.code === e.role)!;
    const dept = DEPTS.find((dItem) => dItem.code === e.dept)!;
    const hall = dept.hall;
    const stCode = e.status ?? "ACTIVE";
    const statusRow = await prisma.employeeStatus.findUniqueOrThrow({ where: { code: stCode } });

    const sal = dec(role.min, role.max, i + role.lvl + 701, empNo.charCodeAt(6) || 71);
    const salNum = Number(sal.toString());
    const overtime = dec(salNum * 0.00075, Math.min(95, Math.max(salNum * 0.00465, salNum * 0.0032)), i + role.lvl, cc(dept.code, 5));

    let perfBase = 70.5 + jit(i + role.lvl * 4, cc(dept.code, 9)) * 26.5;
    if (role.lvl >= 9) {
      const bump = jit(i + 991, cc(dept.code, 13)) > 0.48 ? jit(i + 18, cc(dept.code, 21)) : 1 - jit(i + 21, cc(dept.code, 25));
      perfBase += bump * 16.5;
    }
    perfBase += (jit(i + 77, empNo.charCodeAt(8) || 55) - 0.52) * 9;

    const performanceScore = scoreBand(perfBase, i, dept.code.charCodeAt(1) ?? 71, 62.08, 98.94);
    const perfNum = Number(performanceScore.toString());
    const reliabilityScore = scoreBand(perfNum - jit(i + 17, cc(dept.code, 17)) * 7.5 + jit(i + 41, cc(dept.code, 19)) * 6.2, i, 813, 60.52, 97.94);
    const safetyScore = scoreBand(perfNum + jit(i + 23, cc(dept.code, 23)) * 10.25 - jit(i + 29, cc(dept.code, 27)) * 7.85, i, 905, 64.71, 99.41);

    const hireMo = Math.min(12, Math.max(1, Math.floor(1 + jit(i + 109, cc(dept.code, 7)) * 11.999)));
    const hireDay = Math.min(28, Math.max(1, Math.floor(1 + jit(i + 110, cc(dept.code, 41)) * 26.999)));
    const fn = e.firstName.trim().slice(0, 255);
    const ln = e.lastName.trim().slice(0, 255);
    await prisma.employee.create({
      data: {
        code: empNo,
        name: `${fn} ${ln}`.trim().slice(0, 255),
        jobTitle: null,
        legacyDepartmentLabel: null,
        employeeNumber: empNo,
        firstName: fn,
        lastName: ln,
        gender: e.gender,
        birthDate:
          jit(i, 661) > 0.038
            ? utcDate(
                Math.min(1998, Math.max(1967, Math.floor(1972 + jit(i + 812, cc(dept.code, 14)) * 27))),

                Math.min(12, Math.max(1, Math.floor(jit(i + 813, 5) * 11.999) + 1)),

                Math.min(28, Math.max(1, Math.floor(jit(i + 814, 6) * 26.999) + 1))
              )
            : undefined,
        phone: phone(i, false),
        emergencyPhone: phone(i, true),
        email: emailSlug(empNo, i),
        nationalId:
          jit(i + 91, cc(dept.code, 31)) > 0.08
            ? `1${String(Math.floor(1000000000 + jit(i + 902, cc(dept.code, 27)) * 8999999999)).slice(0, 14)}`.slice(0, 13)
            : undefined,
        address:
          jit(i + 733, cc(dept.code, 29)) > 0.85
            ? undefined
            : `${Math.floor(10 + jit(i + 801, cc(dept.code, 41)) * 220)} Jubail Corridor ind. parcel`,
        hireDate: utcDate(e.hireY, hireMo, hireDay),
        hallId: hallId.get(hall)!,
        departmentId: deptId.get(e.dept)!,
        jobRoleId: roleId.get(e.role)!,
        shiftId: shiftId.get(e.shift)!,
        employeeStatusId: statusRow.id,
        basicSalary: sal,
        overtimeHourRate: overtime,
        performanceScore,
        reliabilityScore,
        safetyScore,
        annualLeaveBalance: Math.min(
          30,

          Math.max(0, Math.round(13 + jit(i + 611, cc(dept.code, 57)) * 17 - jit(i + 621, cc(dept.code, 61)) * 11))
        ),
        notes: e.notes,
        isActive: true
      }
    });
  }

  const countOut = await prisma.employee.count({ where: { employeeNumber: { startsWith: "EMP-WF-" } } });

  console.log(`✔ Done — ${countOut} employees (EMP-WF-001 … EMP-WF-050)`);
}

main()
  .catch((error: unknown) => {
    console.error(error);

    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
