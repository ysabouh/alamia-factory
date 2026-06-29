export type PaginatedMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type WorkforceRefJson = {
  id: string;
  name: string;
  code: string;
};

export type WorkforceJobRoleJson = WorkforceRefJson & { roleLevel: number };

export type WorkforceShiftJson = WorkforceRefJson & { startTime: string; endTime: string };

export type WorkforceCurrencyJson = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  usdExchangeRate: number;
  isBase: boolean;
};

/** Employee row من واجهة Laravel (معرّفات كنصوص للتوافق مع الواجهة). */
export type ApiEmployeeDetailJson = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string | null;
  birthDate: string | null;
  hireDate: string;
  phone: string | null;
  emergencyPhone: string | null;
  email: string | null;
  nationalId: string | null;
  address: string | null;
  hallId: string | null;
  departmentId: string | null;
  orgPositionId?: string | null;
  orgPositionName?: string | null;
  orgPosition?: { id: string; name: string; code: string } | null;
  reportsToId: string | null;
  managerName: string | null;
  jobRoleId: string | null;
  shiftId: string | null;
  employeeStatusId: string | null;
  basicSalary: number;
  currencyId: string | null;
  currency: WorkforceCurrencyJson | null;
  basicSalaryUsd: number;
  performanceScore: number;
  reliabilityScore: number;
  safetyScore: number;
  annualLeaveBalance: number;
  profileImage: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hall: WorkforceRefJson | null;
  department: WorkforceRefJson | null;
  jobRole: WorkforceJobRoleJson | null;
  shift: WorkforceShiftJson | null;
  status: WorkforceRefJson | null;
  certifications?: {
    id: string;
    name: string;
    issuer?: string | null;
    issuedAt?: string | null;
    expiresAt?: string | null;
    certificateNumber?: string | null;
  }[];
  systemUser?: {
    id: number;
    email: string;
    name: string;
    isActive: boolean;
    roles: string[];
    permissions: string[];
  } | null;
};

export type WorkforceCatalogJson = {
  halls: WorkforceRefJson[];
  departments: WorkforceRefJson[];
  shifts: WorkforceShiftJson[];
  jobRoles: WorkforceJobRoleJson[];
  statuses: WorkforceRefJson[];
  currencies: WorkforceCurrencyJson[];
  baseCurrencyCode: string;
};
