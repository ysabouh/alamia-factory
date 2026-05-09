import { IsIn, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export const HALL_SORT_FIELDS = ["createdAt", "code", "name", "hallType"] as const;
export type HallSortField = (typeof HALL_SORT_FIELDS)[number];

export class QueryHallDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(HALL_SORT_FIELDS as unknown as string[])
  sortBy?: HallSortField = "createdAt";
}
