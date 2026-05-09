import type { PaginatedResult } from "../../../common/pagination/pagination.types";
import type { SerializedEmployeeDetail, SerializedEmployeeSummary } from "../employee.serializer";
import type { CreateEmployeeDto } from "../dto/create-employee.dto";
import type { QueryEmployeeDto } from "../dto/query-employee.dto";
import type { UpdateEmployeeDto } from "../dto/update-employee.dto";

export interface IEmployeeRepository {
  create(dto: CreateEmployeeDto): Promise<SerializedEmployeeDetail>;
  update(id: bigint, dto: UpdateEmployeeDto): Promise<SerializedEmployeeDetail>;
  delete(id: bigint): Promise<void>;
  findOneDetailed(id: bigint): Promise<SerializedEmployeeDetail | null>;
  findManyPaged(
    query: QueryEmployeeDto
  ): Promise<PaginatedResult<SerializedEmployeeSummary | SerializedEmployeeDetail>>;
}

export const EMPLOYEE_REPOSITORY = Symbol("EMPLOYEE_REPOSITORY");
