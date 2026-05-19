import type {
  ApiEmployeeDetailJson,
  WorkforceCatalogJson,
  WorkforceJobRoleJson,
  WorkforceRefJson,
  WorkforceShiftJson
} from "./workforce-api-types";
import type {
  AttendanceState,
  EmployeeEmploymentStatus,
  EmployeeFormInput,
  EmployeeGender,
  FullEmployeeEditInput,
  ManagedEmployee
} from "./model";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint") return String(v);
  return null;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function parseSystemUser(raw: unknown): ApiEmployeeDetailJson["systemUser"] {
  const o = asRecord(raw);
  if (!o) return null;
  const id = num(o.id, NaN);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    id,
    email: str(o.email) ?? "",
    name: str(o.name) ?? "",
    isActive: Boolean(o.isActive ?? o.is_active ?? true),
    roles: Array.isArray(o.roles) ? (o.roles as string[]) : [],
    permissions: Array.isArray(o.permissions) ? (o.permissions as string[]) : []
  };
}

function refFromJson(raw: unknown): WorkforceRefJson | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = str(o.id);
  const name = str(o.name);
  const code = str(o.code) ?? "";
  if (!id || !name) return null;
  return { id, name, code };
}

export function parseApiEmployeeDetail(raw: unknown): ApiEmployeeDetailJson | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = str(o.id);
  if (!id) return null;

  const hall = refFromJson(o.hall);
  const department = refFromJson(o.department);
  const jobRoleRaw = asRecord(o.jobRole);
  const jobRole: WorkforceJobRoleJson | null =
    jobRoleRaw && str(jobRoleRaw.id) && str(jobRoleRaw.name)
      ? {
          id: str(jobRoleRaw.id)!,
          name: str(jobRoleRaw.name)!,
          code: str(jobRoleRaw.code) ?? "",
          roleLevel: num(jobRoleRaw.roleLevel, 1)
        }
      : null;

  const shiftRaw = asRecord(o.shift);
  const shift: WorkforceShiftJson | null =
    shiftRaw && str(shiftRaw.id) && str(shiftRaw.name)
      ? {
          id: str(shiftRaw.id)!,
          name: str(shiftRaw.name)!,
          code: str(shiftRaw.code) ?? "",
          startTime: str(shiftRaw.startTime) ?? "",
          endTime: str(shiftRaw.endTime) ?? ""
        }
      : null;

  const status = refFromJson(o.status ?? o.employeeStatus);

  const currencyRaw = asRecord(o.currency);
  const currency =
    currencyRaw && str(currencyRaw.id) && str(currencyRaw.code)
      ? {
          id: str(currencyRaw.id)!,
          code: str(currencyRaw.code)!,
          name: str(currencyRaw.name) ?? str(currencyRaw.code)!,
          symbol: str(currencyRaw.symbol) ?? str(currencyRaw.code)!,
          usdExchangeRate: num(currencyRaw.usdExchangeRate, 1),
          isBase: Boolean(currencyRaw.isBase)
        }
      : null;

  const systemUser = parseSystemUser(o.systemUser);

  return {
    id,
    employeeNumber: str(o.employeeNumber) ?? "",
    firstName: str(o.firstName) ?? "",
    lastName: str(o.lastName) ?? "",
    fullName: str(o.fullName) ?? "",
    gender: str(o.gender),
    birthDate: str(o.birthDate),
    hireDate: str(o.hireDate) ?? "",
    phone: str(o.phone),
    emergencyPhone: str(o.emergencyPhone),
    email: str(o.email),
    nationalId: str(o.nationalId),
    address: str(o.address),
    hallId: str(o.hallId),
    departmentId: str(o.departmentId),
    jobRoleId: str(o.jobRoleId),
    shiftId: str(o.shiftId),
    employeeStatusId: str(o.employeeStatusId),
    basicSalary: num(o.basicSalary),
    currencyId: str(o.currencyId),
    currency,
    basicSalaryUsd: num(o.basicSalaryUsd, num(o.basicSalary)),
    performanceScore: num(o.performanceScore),
    reliabilityScore: num(o.reliabilityScore),
    safetyScore: num(o.safetyScore),
    annualLeaveBalance: Math.round(num(o.annualLeaveBalance)),
    profileImage: str(o.profileImage),
    notes: str(o.notes),
    isActive: Boolean(o.isActive),
    createdAt: str(o.createdAt) ?? "",
    updatedAt: str(o.updatedAt) ?? "",
    hall,
    department,
    jobRole,
    shift,
    status
  };
}

export function genderFromApi(g: string | null): EmployeeGender {
  if (!g) return "other";
  const x = g.toLowerCase();
  if (x === "male" || x === "m" || g.includes("ذكر")) return "male";
  if (x === "female" || x === "f" || g.includes("أنثى") || g.includes("انثى")) return "female";
  return "other";
}

export function genderToApi(g: EmployeeGender): string {
  if (g === "male") return "male";
  if (g === "female") return "female";
  return "other";
}

export function uiStatusFromApi(row: ApiEmployeeDetailJson): EmployeeEmploymentStatus {
  if (!row.isActive) return "terminated";
  const code = row.status?.code?.toUpperCase() ?? "";
  if (code === "SUSP_REST") return "suspended";
  if (code === "PROBATION") return "probation";
  return "active";
}

export function attendanceFromApi(row: ApiEmployeeDetailJson): AttendanceState {
  if (!row.isActive) return "absent";
  const code = row.status?.code?.toUpperCase() ?? "";
  if (code === "ON_LEAVE") return "leave";
  if (code === "LATE" || code === "TARDY") return "late";
  return "present";
}

export function statusIdByCodes(statuses: WorkforceRefJson[], codes: string[]): string | undefined {
  const want = new Set(codes.map((c) => c.toUpperCase()));
  return statuses.find((s) => want.has(s.code.toUpperCase()))?.id;
}

export function statusIdForUi(s: EmployeeEmploymentStatus, statuses: WorkforceRefJson[]): string | undefined {
  if (s === "active") return statusIdByCodes(statuses, ["ACTIVE"]);
  if (s === "probation") return statusIdByCodes(statuses, ["PROBATION"]);
  if (s === "suspended") return statusIdByCodes(statuses, ["SUSP_REST", "SUSPENDED"]);
  return statusIdByCodes(statuses, ["ACTIVE"]);
}

/** PATCH payload for bulk employment status (Laravel workforce API). */
export function patchForEmploymentStatus(
  status: EmployeeEmploymentStatus,
  statuses: WorkforceRefJson[]
): Record<string, unknown> | null {
  switch (status) {
    case "active": {
      const id = statusIdByCodes(statuses, ["ACTIVE"]);
      return id ? { statusId: id, isActive: true } : null;
    }
    case "probation": {
      const id = statusIdByCodes(statuses, ["PROBATION"]);
      return id ? { statusId: id, isActive: true } : null;
    }
    case "suspended": {
      const id = statusIdByCodes(statuses, ["SUSP_REST", "SUSPENDED"]);
      return id ? { statusId: id, isActive: true } : null;
    }
    case "terminated": {
      const id = statusIdByCodes(statuses, ["TERMINATED"]);
      if (id) return { statusId: id, isActive: false };
      return { isActive: false };
    }
    default:
      return null;
  }
}

/** PATCH payload for bulk attendance rollup (via employment status + isActive until attendance API). */
export function patchForAttendanceState(
  state: AttendanceState,
  statuses: WorkforceRefJson[]
): Record<string, unknown> | null {
  const activeId = statusIdByCodes(statuses, ["ACTIVE"]);
  const leaveId = statusIdByCodes(statuses, ["ON_LEAVE"]);
  const lateId = statusIdByCodes(statuses, ["LATE", "TARDY"]);

  switch (state) {
    case "present":
      return activeId ? { statusId: activeId, isActive: true } : null;
    case "late":
      if (lateId) return { statusId: lateId, isActive: true };
      return activeId ? { statusId: activeId, isActive: true } : null;
    case "leave":
      return leaveId ? { statusId: leaveId, isActive: true } : null;
    case "absent":
      return activeId ? { statusId: activeId, isActive: false } : { isActive: false };
    default:
      return null;
  }
}

export function managedEmployeeFromApi(row: ApiEmployeeDetailJson): ManagedEmployee {
  const birth = row.birthDate ?? "";
  const shiftLabel = row.shift?.name ?? "—";
  const fromHire = row.hireDate || new Date().toISOString().slice(0, 10);

  return {
    id: row.id,
    employeeNumber: row.employeeNumber,
    firstName: row.firstName,
    lastName: row.lastName,
    fullName: row.fullName,
    gender: genderFromApi(row.gender),
    birthDate: birth,
    phone: row.phone ?? "",
    emergencyPhone: row.emergencyPhone ?? "",
    email: row.email ?? "",
    nationalId: row.nationalId ?? "",
    address: row.address ?? "",
    department: row.department?.name ?? "—",
    hall: row.hall?.name ?? "—",
    role: row.jobRole?.name ?? "—",
    shift: shiftLabel,
    salary: row.basicSalary,
    currencyId: row.currencyId,
    currencyCode: row.currency?.code ?? "USD",
    currencySymbol: row.currency?.symbol ?? "$",
    salaryUsd: row.basicSalaryUsd,
    hireDate: row.hireDate || fromHire,
    photoUrl: row.profileImage?.trim() ? row.profileImage : null,
    notes: row.notes ?? "",
    status: uiStatusFromApi(row),
    performanceScore: Math.round(row.performanceScore),
    reliabilityScore: Math.round(row.reliabilityScore),
    productionEff: Math.round(row.safetyScore),
    attendanceStatus: attendanceFromApi(row),
    bonusPoints: Math.round(row.performanceScore * 3),
    violations: 0,
    annualLeaveBalance: row.annualLeaveBalance,
    assignedMachines: [],
    shiftHistory: [{ id: `h-${row.id}`, label: shiftLabel, from: fromHire, to: "مستمر" }],
    rewards: [],
    penalties: [],
    attendancePresentDays: 0,
    attendanceLateDays: 0,
    attendanceAbsentDays: 0,
    hallId: row.hallId,
    departmentId: row.departmentId,
    jobRoleId: row.jobRoleId,
    shiftId: row.shiftId,
    employeeStatusId: row.employeeStatusId,
    isActive: row.isActive,
    systemUser: row.systemUser ?? null
  };
}

export function defaultCurrencyId(catalog: WorkforceCatalogJson): string {
  const preferred = catalog.currencies.find((c) => c.code === "SYP") ?? catalog.currencies.find((c) => !c.isBase);
  return preferred?.id ?? catalog.currencies[0]?.id ?? "";
}

export function normalizeWorkforceCatalog(raw: {
  halls: Record<string, unknown>[];
  departments: Record<string, unknown>[];
  shifts: Record<string, unknown>[];
  jobRoles: Record<string, unknown>[];
  statuses: Record<string, unknown>[];
  currencies?: Record<string, unknown>[];
  baseCurrencyCode?: string;
}): WorkforceCatalogJson {
  const halls: WorkforceRefJson[] = raw.halls.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    code: String(r.code ?? "")
  }));
  const departments: WorkforceRefJson[] = raw.departments.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    code: String(r.code ?? "")
  }));
  const shifts: WorkforceShiftJson[] = raw.shifts.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    code: String(r.code ?? ""),
    startTime: String(r.startTime ?? ""),
    endTime: String(r.endTime ?? "")
  }));
  const jobRoles: WorkforceJobRoleJson[] = raw.jobRoles.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    code: String(r.code ?? ""),
    roleLevel: num(r.roleLevel, 1)
  }));
  const statuses: WorkforceRefJson[] = raw.statuses.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    code: String(r.code ?? "")
  }));
  const currencies = (raw.currencies ?? []).map((r) => ({
    id: String(r.id),
    code: String(r.code ?? ""),
    name: String(r.name ?? ""),
    symbol: String(r.symbol ?? ""),
    usdExchangeRate: num(r.usdExchangeRate, 1),
    isBase: Boolean(r.isBase)
  }));
  return {
    halls,
    departments,
    shifts,
    jobRoles,
    statuses,
    currencies,
    baseCurrencyCode: String(raw.baseCurrencyCode ?? "USD")
  };
}

export function createPayloadFromForm(
  data: EmployeeFormInput,
  catalog: WorkforceCatalogJson
): Record<string, unknown> {
  const activeId = statusIdForUi("active", catalog.statuses);
  return {
    ...(activeId ? { statusId: activeId } : {}),
    employeeNumber: data.employeeNumber.trim(),
    firstName: data.firstName,
    lastName: data.lastName,
    gender: genderToApi(data.gender),
    birthDate: data.birthDate,
    phone: data.phone,
    emergencyPhone: data.emergencyPhone,
    ...(data.email.trim() !== "" ? { email: data.email.trim() } : {}),
    nationalId: data.nationalId,
    address: data.address,
    hireDate: data.hireDate,
    ...(data.hallId?.trim() ? { hallId: data.hallId.trim() } : {}),
    ...(data.departmentId?.trim() ? { departmentId: data.departmentId.trim() } : {}),
    ...(data.jobRoleId?.trim() ? { jobRoleId: data.jobRoleId.trim() } : {}),
    ...(data.shiftId?.trim() ? { shiftId: data.shiftId.trim() } : {}),
    basicSalary: data.salary,
    currencyId: data.currencyId.trim(),
    profileImage: data.photoUrl?.trim() ? data.photoUrl.trim() : undefined,
    notes: data.notes?.trim() ? data.notes : undefined,
    isActive: true
  };
}

export function patchPayloadFromFullEdit(
  data: FullEmployeeEditInput,
  catalog: WorkforceCatalogJson
): Record<string, unknown> {
  const sid = statusIdForUi(data.status, catalog.statuses);
  const payload: Record<string, unknown> = {
    employeeNumber: data.employeeNumber.trim(),
    firstName: data.firstName,
    lastName: data.lastName,
    gender: genderToApi(data.gender),
    birthDate: data.birthDate,
    phone: data.phone,
    emergencyPhone: data.emergencyPhone,
    ...(data.email.trim() !== "" ? { email: data.email.trim() } : { email: null }),
    nationalId: data.nationalId,
    address: data.address,
    hireDate: data.hireDate,
    hallId: data.hallId?.trim() ?? "",
    departmentId: data.departmentId?.trim() ?? "",
    jobRoleId: data.jobRoleId?.trim() ?? "",
    shiftId: data.shiftId?.trim() ?? "",
    basicSalary: data.salary,
    currencyId: data.currencyId.trim(),
    performanceScore: data.performanceScore,
    reliabilityScore: data.reliabilityScore,
    safetyScore: data.productionEff,
    annualLeaveBalance: data.annualLeaveBalance,
    profileImage: data.photoUrl?.trim() ? data.photoUrl.trim() : undefined,
    notes: data.notes
  };

  if (data.status === "terminated") {
    payload.isActive = false;
    payload.statusId = "";
  } else {
    payload.isActive = true;
    if (sid) payload.statusId = sid;
  }

  return payload;
}

export function listQueryFromFilters(input: {
  page: number;
  pageSize: number;
  search?: string;
  departmentId?: string;
  shiftId?: string;
  jobRoleId?: string;
  statusFilter: "all" | EmployeeEmploymentStatus;
  sortBy: string;
  sortOrder: "asc" | "desc";
  statuses: WorkforceRefJson[];
}): Record<string, string | number | boolean> {
  const q: Record<string, string | number | boolean> = {
    page: input.page,
    pageSize: input.pageSize,
    sortOrder: input.sortOrder,
    sortBy: input.sortBy
  };
  if (input.search?.trim()) q.search = input.search.trim();
  if (input.departmentId && input.departmentId !== "all") q.departmentId = input.departmentId;
  if (input.shiftId && input.shiftId !== "all") q.shiftId = input.shiftId;
  if (input.jobRoleId && input.jobRoleId !== "all") q.jobRoleId = input.jobRoleId;

  if (input.statusFilter === "active") q.isActive = true;
  else if (input.statusFilter === "terminated") q.isActive = false;
  else if (input.statusFilter === "suspended") {
    const id = input.statuses.find((s) => s.code.toUpperCase() === "SUSPENDED")?.id;
    if (id) q.statusId = id;
  } else if (input.statusFilter === "probation") {
    const id = input.statuses.find((s) => s.code.toUpperCase() === "PROBATION")?.id;
    if (id) q.statusId = id;
  }

  return q;
}

/** مرجعيات فارغة عند تعطل تحميل الكتالوج — تكفي لتشغيل السجل واحتياط لوحة التحكم */
export const EMPTY_WORKFORCE_CATALOG: WorkforceCatalogJson = {
  halls: [],
  departments: [],
  shifts: [],
  jobRoles: [],
  statuses: [],
  currencies: [],
  baseCurrencyCode: "USD"
};

export type DashboardEmployeeSortKey =
  | "employeeNumber"
  | "fullName"
  | "role"
  | "department"
  | "hall"
  | "shift"
  | "status"
  | "performanceScore"
  | "attendanceStatus";

export function mapUiSortKeyToApi(
  key: keyof Pick<
    ManagedEmployee,
    | "employeeNumber"
    | "fullName"
    | "role"
    | "department"
    | "hall"
    | "shift"
    | "status"
    | "performanceScore"
    | "attendanceStatus"
  >
): string {
  const m: Record<string, string> = {
    employeeNumber: "employeeNumber",
    fullName: "firstName",
    performanceScore: "performanceScore",
    role: "createdAt",
    department: "createdAt",
    hall: "createdAt",
    shift: "createdAt",
    status: "createdAt",
    attendanceStatus: "createdAt"
  };
  return m[key] ?? "createdAt";
}

/** Client-side filter/sort for Laravel/dashboard fallback rows (بدون مفاتيح أجنبية من واجهة السجل). */
export function filterDashboardManagedEmployees(
  full: ManagedEmployee[],
  opts: {
    search?: string;
    departmentId?: string;
    shiftId?: string;
    jobRoleId?: string;
    statusFilter: "all" | EmployeeEmploymentStatus;
    sortKey: DashboardEmployeeSortKey;
    sortOrder: "asc" | "desc";
  },
  catalog: WorkforceCatalogJson
): ManagedEmployee[] {
  let out = [...full];
  const q = (opts.search ?? "").trim().toLowerCase();
  if (q) {
    out = out.filter((e) => `${e.fullName} ${e.employeeNumber} ${e.role}`.toLowerCase().includes(q));
  }
  if (opts.departmentId && opts.departmentId !== "all") {
    const label = catalog.departments.find((d) => d.id === opts.departmentId)?.name;
    if (label) out = out.filter((e) => e.department === label || e.department.includes(label));
  }
  if (opts.shiftId && opts.shiftId !== "all") {
    const label = catalog.shifts.find((s) => s.id === opts.shiftId)?.name;
    if (label) out = out.filter((e) => e.shift === label || e.shift.includes(label));
  }
  if (opts.jobRoleId && opts.jobRoleId !== "all") {
    const label = catalog.jobRoles.find((r) => r.id === opts.jobRoleId)?.name;
    if (label) out = out.filter((e) => e.role === label || e.role.includes(label));
  }
  if (opts.statusFilter !== "all") {
    out = out.filter((e) => e.status === opts.statusFilter);
  }

  const dir = opts.sortOrder === "asc" ? 1 : -1;
  const sk = opts.sortKey;
  out.sort((a, b) => {
    const va = a[sk];
    const vb = b[sk];
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
    return String(va ?? "").localeCompare(String(vb ?? ""), "ar") * dir;
  });
  return out;
}
