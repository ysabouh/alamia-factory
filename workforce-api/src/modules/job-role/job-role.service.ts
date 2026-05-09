import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { PaginatedResult } from "../../common/pagination/pagination.types";
import type { JobRole } from "@prisma/client";
import type { CreateJobRoleDto } from "./dto/create-job-role.dto";
import type { JobRoleSortField, QueryJobRoleDto } from "./dto/query-job-role.dto";
import type { UpdateJobRoleDto } from "./dto/update-job-role.dto";
import type { IJobRoleRepository } from "./interfaces/job-role.repository.interface";
import { JOB_ROLE_REPOSITORY } from "./interfaces/job-role.repository.interface";

@Injectable()
export class JobRoleService {
  constructor(
    @Inject(JOB_ROLE_REPOSITORY) private readonly jobRoles: IJobRoleRepository
  ) {}

  create(dto: CreateJobRoleDto) {
    return this.jobRoles.create(dto).catch((e: Error) => this.mapUnique(e));
  }

  update(id: bigint, dto: UpdateJobRoleDto) {
    return this.jobRoles.update(id, dto).catch((e: Error) => this.mapUnique(e));
  }

  async remove(id: bigint) {
    await this.jobRoles.delete(id);
    return { deleted: true };
  }

  async findOne(id: bigint): Promise<JobRole> {
    const row = await this.jobRoles.findOne(id);
    if (row === null) throw new NotFoundException("Job role not found");
    return row;
  }

  findPaged(q: QueryJobRoleDto): Promise<PaginatedResult<JobRole>> {
    const sortBy = q.sortBy as JobRoleSortField | undefined;
    return this.jobRoles.findManyPaged({ ...q, sortBy: sortBy ?? "roleLevel" });
  }

  private mapUnique(e: Error): never {
    if ("code" in e && String((e as { code?: string }).code) === "P2002") {
      throw new ConflictException("Job role code already exists");
    }
    if ("code" in e && String((e as { code?: string }).code) === "P2003") {
      throw new ConflictException("Invalid foreign key relation");
    }
    throw e;
  }
}
