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

/** Employee row as returned by Nest + `BigInt.prototype.toJSON` (ids are strings). */
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
  jobRoleId: string | null;
  shiftId: string | null;
  employeeStatusId: string | null;
  basicSalary: number;
  overtimeHourRate: number;
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
};

export type WorkforceCatalogJson = {
  halls: WorkforceRefJson[];
  departments: WorkforceRefJson[];
  shifts: WorkforceShiftJson[];
  jobRoles: WorkforceJobRoleJson[];
  statuses: WorkforceRefJson[];
};
