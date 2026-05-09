import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsOptional, IsString, Matches } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export const EMPLOYEE_SORT = [
  "createdAt",
  "updatedAt",
  "employeeNumber",
  "hireDate",
  "firstName",
  "lastName",
  "basicSalary",
  "performanceScore"
] as const;
export type EmployeeSortField = (typeof EMPLOYEE_SORT)[number];

const FK = /^(\d+)?$/;

export class QueryEmployeeDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: "5",
    description: "`hall_id` filter — `/workforce/halls/{id}` style decimal string"

  })
  @IsOptional()
  @IsString()
  @Matches(FK)
  hallId?: string;

  @ApiPropertyOptional({
    example: "12",
    description: "`department_id` FK filter"
  })
  @IsOptional()
  @IsString()
  @Matches(FK)
  departmentId?: string;

  @ApiPropertyOptional({ example: "3", description: "`job_role_id` FK filter" })
  @IsOptional()
  @IsString()
  @Matches(FK)
  jobRoleId?: string;

  @ApiPropertyOptional({ example: "2", description: "`shift_id` FK filter" })
  @IsOptional()
  @IsString()
  @Matches(FK)
  shiftId?: string;

  @ApiPropertyOptional({ example: "1", description: "`employment_status_id` FK filter (`status_id` column)" })
  @IsOptional()
  @IsString()
  @Matches(FK)
  statusId?: string;

  @ApiPropertyOptional({
    description:
      "**Example compound query:** `/workforce/employees?page=2&pageSize=10&departmentId=4&shiftId=1&sortBy=basicSalary&sortOrder=asc&withRelations=true`",
    example: true
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === true || value === "true" || value === "1")
  @IsBoolean()
  withRelations?: boolean;

  @ApiPropertyOptional({
    enum: EMPLOYEE_SORT,

    example: "createdAt"

  })
  @IsOptional()
  @IsIn(EMPLOYEE_SORT as unknown as string[])
  sortBy?: EmployeeSortField = "createdAt";
}
