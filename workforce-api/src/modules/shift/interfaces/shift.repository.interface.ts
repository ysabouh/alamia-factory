import type { PaginatedResult } from "../../../common/pagination/pagination.types";
import type { Shift } from "@prisma/client";
import type { CreateShiftDto } from "../dto/create-shift.dto";
import type { QueryShiftDto } from "../dto/query-shift.dto";
import type { UpdateShiftDto } from "../dto/update-shift.dto";

export interface IShiftRepository {
  create(dto: CreateShiftDto): Promise<Shift>;
  update(id: bigint, dto: UpdateShiftDto): Promise<Shift>;
  delete(id: bigint): Promise<void>;
  findOne(id: bigint): Promise<Shift | null>;
  findManyPaged(query: QueryShiftDto): Promise<PaginatedResult<Shift>>;
}

export const SHIFT_REPOSITORY = Symbol("SHIFT_REPOSITORY");
