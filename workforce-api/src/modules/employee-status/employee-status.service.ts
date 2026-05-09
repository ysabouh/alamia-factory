import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { PaginatedResult } from "../../common/pagination/pagination.types";
import type { EmployeeStatus } from "@prisma/client";
import type { CreateEmployeeStatusDto } from "./dto/create-employee-status.dto";
import type { EmployeeStatusSortField, QueryEmployeeStatusDto } from "./dto/query-employee-status.dto";
import type { UpdateEmployeeStatusDto } from "./dto/update-employee-status.dto";
import type { IEmployeeStatusRepository } from "./interfaces/employee-status.repository.interface";
import { EMPLOYEE_STATUS_REPOSITORY } from "./interfaces/employee-status.repository.interface";

@Injectable()
export class EmployeeStatusService {
  constructor(
    @Inject(EMPLOYEE_STATUS_REPOSITORY)
    private readonly statuses: IEmployeeStatusRepository
  ) {}

  create(dto: CreateEmployeeStatusDto) {
    return this.statuses.create(dto).catch((e: Error) => this.mapUnique(e));
  }

  update(id: bigint, dto: UpdateEmployeeStatusDto) {
    return this.statuses.update(id, dto).catch((e: Error) => this.mapUnique(e));
  }

  async remove(id: bigint) {
    await this.statuses.delete(id);
    return { deleted: true };
  }

  async findOne(id: bigint): Promise<EmployeeStatus> {
    const row = await this.statuses.findOne(id);
    if (row === null) throw new NotFoundException("Employee status not found");
    return row;
  }

  findPaged(q: QueryEmployeeStatusDto): Promise<PaginatedResult<EmployeeStatus>> {
    const sortBy = q.sortBy as EmployeeStatusSortField | undefined;
    return this.statuses.findManyPaged({ ...q, sortBy: sortBy ?? "code" });
  }

  private mapUnique(e: Error): never {
    if ("code" in e && String((e as { code?: string }).code) === "P2002") {
      throw new ConflictException("Status code already exists");
    }
    throw e;
  }
}
