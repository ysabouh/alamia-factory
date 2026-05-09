import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { PaginatedMeta } from "../../common/pagination/pagination.types";
import type { PaginatedResult } from "../../common/pagination/pagination.types";
import type { Shift } from "@prisma/client";
import type { CreateShiftDto } from "./dto/create-shift.dto";
import type { QueryShiftDto } from "./dto/query-shift.dto";
import type { ShiftSortField } from "./dto/query-shift.dto";
import type { UpdateShiftDto } from "./dto/update-shift.dto";
import type { IShiftRepository } from "./interfaces/shift.repository.interface";
import { SHIFT_REPOSITORY } from "./interfaces/shift.repository.interface";
import { serializeShift } from "./shift.serializer";
import type { ShiftResponse } from "./shift.serializer";

@Injectable()
export class ShiftService {
  constructor(@Inject(SHIFT_REPOSITORY) private readonly shifts: IShiftRepository) {}

  async create(dto: CreateShiftDto): Promise<ShiftResponse> {
    const row = await this.shifts.create(dto).catch((e: Error) => this.mapUnique(e));

    return serializeShift(row);
  }

  async update(id: bigint, dto: UpdateShiftDto): Promise<ShiftResponse> {
    const row = await this.shifts.update(id, dto).catch((e: Error) => this.mapUnique(e));

    return serializeShift(row);
  }

  async remove(id: bigint) {
    await this.shifts.delete(id);

    return { deleted: true };
  }

  async findOne(id: bigint): Promise<ShiftResponse> {
    const row = await this.shifts.findOne(id);
    if (row === null) throw new NotFoundException("Shift not found");

    return serializeShift(row);
  }

  async findPaged(q: QueryShiftDto): Promise<{ data: ShiftResponse[]; meta: PaginatedMeta }> {
    const sortBy = q.sortBy as ShiftSortField | undefined;
    const page: PaginatedResult<Shift> = await this.shifts.findManyPaged({
      ...q,
      sortBy: sortBy ?? "createdAt"
    });

    return {
      data: page.data.map(serializeShift),
      meta: page.meta
    };
  }

  private mapUnique(e: Error): never {
    if ("code" in e && String((e as { code?: string }).code) === "P2002") {
      throw new ConflictException("Shift code already exists");
    }
    if ("code" in e && String((e as { code?: string }).code) === "P2003") {
      throw new ConflictException("Referenced entity does not exist");
    }
    throw e;
  }
}
