import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import type { PaginatedResult } from "../../common/pagination/pagination.types";
import type { SerializedEmployeeDetail, SerializedEmployeeSummary } from "./employee.serializer";
import type { CreateEmployeeDto } from "./dto/create-employee.dto";
import type { EmployeeSortField, QueryEmployeeDto } from "./dto/query-employee.dto";
import type { UpdateEmployeeDto } from "./dto/update-employee.dto";
import type { IEmployeeRepository } from "./interfaces/employee.repository.interface";
import { EMPLOYEE_REPOSITORY } from "./interfaces/employee.repository.interface";

@Injectable()
export class EmployeeService {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employees: IEmployeeRepository
  ) {}

  async create(dto: CreateEmployeeDto): Promise<SerializedEmployeeDetail> {
    return this.employees.create(dto).catch((e: Error) => this.mapPrismaConflict(e));
  }

  async update(id: bigint, dto: UpdateEmployeeDto): Promise<SerializedEmployeeDetail> {
    return this.employees.update(id, dto).catch((e: Error) => this.mapPrismaConflict(e));
  }

  async remove(id: bigint): Promise<{ deleted: boolean }> {
    await this.employees.delete(id).catch((e: Error) => this.mapPrismaFk(e));

    return { deleted: true };
  }

  async findOne(id: bigint): Promise<SerializedEmployeeDetail> {
    const row = await this.employees.findOneDetailed(id);

    if (row === null) throw new NotFoundException("Employee not found");

    return row;
  }

  findPaged(
    q: QueryEmployeeDto
  ): Promise<PaginatedResult<SerializedEmployeeSummary | SerializedEmployeeDetail>> {
    const sortBy = q.sortBy as EmployeeSortField | undefined;

    return this.employees.findManyPaged({
      ...q,
      sortBy: sortBy ?? "createdAt"
    });
  }

  private mapPrismaConflict(e: Error): never {
    const code =
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      typeof (e as { code?: string }).code === "string"
        ? (e as { code?: string }).code
        : null;

    if (code === "P2002") {
      throw new ConflictException("Unique constraint violation (employee number / email)");
    }
    if (code === "P2003") {
      throw new ConflictException("Referenced entity does not exist");
    }

    throw e;
  }

  private mapPrismaFk(e: Error): never {
    const code =
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      typeof (e as { code?: string }).code === "string"
        ? (e as { code?: string }).code
        : null;

    if (code === "P2003") {
      throw new ConflictException("Employee cannot be deleted (still referenced)");
    }

    throw e;
  }
}
