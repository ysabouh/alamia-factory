import { IsIn, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export const JOB_ROLE_SORT = ["createdAt", "code", "name", "roleLevel"] as const;
export type JobRoleSortField = (typeof JOB_ROLE_SORT)[number];

export class QueryJobRoleDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(JOB_ROLE_SORT as unknown as string[])
  sortBy?: JobRoleSortField = "roleLevel";
}
