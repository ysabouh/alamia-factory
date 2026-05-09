import type { PaginatedResult } from "../../../common/pagination/pagination.types";
import type { Hall } from "@prisma/client";
import type { CreateHallDto } from "../dto/create-hall.dto";
import type { QueryHallDto } from "../dto/query-hall.dto";
import type { UpdateHallDto } from "../dto/update-hall.dto";

/** Hall persistence boundary (repository port). */
export interface IHallRepository {
  create(dto: CreateHallDto): Promise<Hall>;
  update(id: bigint, dto: UpdateHallDto): Promise<Hall>;
  delete(id: bigint): Promise<void>;
  findOne(id: bigint): Promise<Hall | null>;
  findManyPaged(query: QueryHallDto): Promise<PaginatedResult<Hall>>;
}

export const HALL_REPOSITORY = Symbol("HALL_REPOSITORY");
