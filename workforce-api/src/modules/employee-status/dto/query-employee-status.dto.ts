import { IsIn, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export const STATUS_SORT = ["createdAt", "code", "name"] as const;
export type EmployeeStatusSortField = (typeof STATUS_SORT)[number];

export class QueryEmployeeStatusDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(STATUS_SORT as unknown as string[])
  sortBy?: EmployeeStatusSortField = "code";
}
