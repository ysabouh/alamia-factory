import { IsIn, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export const SHIFT_SORT = ["createdAt", "code", "name"] as const;
export type ShiftSortField = (typeof SHIFT_SORT)[number];

export class QueryShiftDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(SHIFT_SORT as unknown as string[])
  sortBy?: ShiftSortField = "createdAt";
}
