import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, Matches } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export const DEPARTMENT_SORT_FIELDS = ["createdAt", "code", "name"] as const;
export type DepartmentSortField = (typeof DEPARTMENT_SORT_FIELDS)[number];

export class QueryDepartmentDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: "8",
    description: "Restrict results to departments that belong to the provided hall FK"
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  hallId?: string;

  @IsOptional()
  @IsIn(DEPARTMENT_SORT_FIELDS as unknown as string[])
  sortBy?: DepartmentSortField = "createdAt";
}
