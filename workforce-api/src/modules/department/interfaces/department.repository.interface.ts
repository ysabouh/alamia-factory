import type { PaginatedResult } from "../../../common/pagination/pagination.types";
import type { Department } from "@prisma/client";
import type { CreateDepartmentDto } from "../dto/create-department.dto";
import type { QueryDepartmentDto } from "../dto/query-department.dto";
import type { UpdateDepartmentDto } from "../dto/update-department.dto";

export interface IDepartmentRepository {
  create(dto: CreateDepartmentDto): Promise<Department>;
  update(id: bigint, dto: UpdateDepartmentDto): Promise<Department>;
  delete(id: bigint): Promise<void>;
  findOne(id: bigint): Promise<Department | null>;
  findManyPaged(query: QueryDepartmentDto): Promise<PaginatedResult<Department>>;
}

export const DEPARTMENT_REPOSITORY = Symbol("DEPARTMENT_REPOSITORY");
