import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { PaginatedResult } from "../../common/pagination/pagination.types";
import type { Department } from "@prisma/client";
import type { CreateDepartmentDto } from "./dto/create-department.dto";
import type { QueryDepartmentDto } from "./dto/query-department.dto";
import type { UpdateDepartmentDto } from "./dto/update-department.dto";
import type { DepartmentSortField } from "./dto/query-department.dto";
import type { IDepartmentRepository } from "./interfaces/department.repository.interface";
import { DEPARTMENT_REPOSITORY } from "./interfaces/department.repository.interface";

@Injectable()
export class DepartmentService {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY) private readonly departments: IDepartmentRepository
  ) {}

  create(dto: CreateDepartmentDto) {
    return this.departments.create(dto).catch((e: Error) => this.mapUnique(e));
  }

  async update(id: bigint, dto: UpdateDepartmentDto) {
    return this.departments.update(id, dto).catch((e: Error) => this.mapUnique(e));
  }

  async remove(id: bigint) {
    await this.departments.delete(id);
    return { deleted: true };
  }

  async findOne(id: bigint): Promise<Department> {
    const row = await this.departments.findOne(id);
    if (row === null) throw new NotFoundException("Department not found");
    return row;
  }

  findPaged(query: QueryDepartmentDto): Promise<PaginatedResult<Department>> {
    const sortBy = query.sortBy as DepartmentSortField | undefined;
    return this.departments.findManyPaged({
      ...query,
      sortBy: sortBy ?? "createdAt"
    });
  }

  private mapUnique(e: Error): never {
    if ("code" in e && String((e as { code?: string }).code) === "P2002") {
      throw new ConflictException("Department code already exists");
    }
    if ("code" in e && String((e as { code?: string }).code) === "P2003") {
      throw new ConflictException("Referenced hall does not exist");
    }
    throw e;
  }
}
