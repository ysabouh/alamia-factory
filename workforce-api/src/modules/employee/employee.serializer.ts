import type { Decimal } from "@prisma/client/runtime/library";
import type { Department, Employee, EmployeeStatus, Hall, JobRole, Shift } from "@prisma/client";
import { prismaDecimalNumber } from "../../common/utils/decimal.util";
import { prismaDateToHHmm } from "../../common/utils/time.util";

type RefMini = { id: bigint; name: string; code: string };

export type SerializedEmployeeSummary = {
  id: bigint;
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
  hallId: bigint | null;
  departmentId: bigint | null;
  jobRoleId: bigint | null;
  shiftId: bigint | null;
  employeeStatusId: bigint | null;
  basicSalary: number;
  overtimeHourRate: number;
  performanceScore: number;
  reliabilityScore: number;
  safetyScore: number;
  annualLeaveBalance: number;
  profileImage: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SerializedEmployeeDetail = SerializedEmployeeSummary & {
  hall: RefMini | null;
  department: RefMini | null;
  jobRole: (RefMini & { roleLevel: number }) | null;
  shift: (RefMini & { startTime: string; endTime: string }) | null;
  status: RefMini | null;
};

export function prismaDecimalOrZero(d: Decimal | null | undefined): number {
  const n = prismaDecimalNumber(d);
  return n === null ? 0 : n;
}

function isoDateOnly(d: Date | null): string | null {
  if (d === null) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

export function serializeEmployeeSummary(e: Employee): SerializedEmployeeSummary {
  const firstName = e.firstName ?? "";
  const lastName = e.lastName ?? "";
  const fullFromParts = `${firstName} ${lastName}`.trim();

  return {
    id: e.id,
    employeeNumber: e.employeeNumber ?? e.code,
    firstName,
    lastName,
    fullName: fullFromParts !== "" ? fullFromParts : e.name,
    gender: e.gender,
    birthDate: isoDateOnly(e.birthDate),
    hireDate: e.hireDate !== null ? isoDateOnly(e.hireDate)! : "",
    phone: e.phone,
    emergencyPhone: e.emergencyPhone,
    email: e.email,
    nationalId: e.nationalId,
    address: e.address,
    hallId: e.hallId,
    departmentId: e.departmentId,
    jobRoleId: e.jobRoleId,
    shiftId: e.shiftId,
    employeeStatusId: e.employeeStatusId,
    basicSalary: prismaDecimalOrZero(e.basicSalary),
    overtimeHourRate: prismaDecimalOrZero(e.overtimeHourRate),
    performanceScore: prismaDecimalOrZero(e.performanceScore),
    reliabilityScore: prismaDecimalOrZero(e.reliabilityScore),
    safetyScore: prismaDecimalOrZero(e.safetyScore),
    annualLeaveBalance: e.annualLeaveBalance,
    profileImage: e.profileImage,
    notes: e.notes,
    isActive: e.isActive,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt
  };
}

export function serializeEmployeeDetail(
  e: Employee & {
    hall: Hall | null;
    department: Department | null;
    jobRole: JobRole | null;
    shift: Shift | null;
    employeeStatus: EmployeeStatus | null;
  }
): SerializedEmployeeDetail {
  return {
    ...serializeEmployeeSummary(e),
    hall: e.hall ? { id: e.hall.id, name: e.hall.name, code: e.hall.code } : null,
    department: e.department
      ? { id: e.department.id, name: e.department.name, code: e.department.code }
      : null,
    jobRole: e.jobRole
      ? {
          id: e.jobRole.id,
          name: e.jobRole.name,
          code: e.jobRole.code,
          roleLevel: e.jobRole.roleLevel
        }
      : null,
    shift: e.shift
      ? {
          id: e.shift.id,
          name: e.shift.name,
          code: e.shift.code ?? "",
          startTime: prismaDateToHHmm(e.shift.startTime),
          endTime: prismaDateToHHmm(e.shift.endTime)
        }
      : null,
    status: e.employeeStatus
      ? { id: e.employeeStatus.id, name: e.employeeStatus.name, code: e.employeeStatus.code }
      : null
  };
}
