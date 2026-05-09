import type { PaginatedResult } from "../../../common/pagination/pagination.types";
import type { JobRole } from "@prisma/client";
import type { CreateJobRoleDto } from "../dto/create-job-role.dto";
import type { QueryJobRoleDto } from "../dto/query-job-role.dto";
import type { UpdateJobRoleDto } from "../dto/update-job-role.dto";

export interface IJobRoleRepository {
  create(dto: CreateJobRoleDto): Promise<JobRole>;
  update(id: bigint, dto: UpdateJobRoleDto): Promise<JobRole>;
  delete(id: bigint): Promise<void>;
  findOne(id: bigint): Promise<JobRole | null>;
  findManyPaged(query: QueryJobRoleDto): Promise<PaginatedResult<JobRole>>;
}

export const JOB_ROLE_REPOSITORY = Symbol("JOB_ROLE_REPOSITORY");
