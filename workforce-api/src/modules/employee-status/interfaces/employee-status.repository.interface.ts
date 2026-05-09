import type { PaginatedResult } from "../../../common/pagination/pagination.types";
import type { EmployeeStatus } from "@prisma/client";
import type { CreateEmployeeStatusDto } from "../dto/create-employee-status.dto";
import type { QueryEmployeeStatusDto } from "../dto/query-employee-status.dto";
import type { UpdateEmployeeStatusDto } from "../dto/update-employee-status.dto";

export interface IEmployeeStatusRepository {
  create(dto: CreateEmployeeStatusDto): Promise<EmployeeStatus>;
  update(id: bigint, dto: UpdateEmployeeStatusDto): Promise<EmployeeStatus>;
  delete(id: bigint): Promise<void>;
  findOne(id: bigint): Promise<EmployeeStatus | null>;
  findManyPaged(query: QueryEmployeeStatusDto): Promise<PaginatedResult<EmployeeStatus>>;
}

export const EMPLOYEE_STATUS_REPOSITORY = Symbol("EMPLOYEE_STATUS_REPOSITORY");
