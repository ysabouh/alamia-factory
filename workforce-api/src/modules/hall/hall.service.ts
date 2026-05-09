import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { IHallRepository } from "./interfaces/hall.repository.interface";
import { HALL_REPOSITORY } from "./interfaces/hall.repository.interface";
import type { CreateHallDto } from "./dto/create-hall.dto";
import type { QueryHallDto } from "./dto/query-hall.dto";
import type { UpdateHallDto } from "./dto/update-hall.dto";
import type { PaginatedResult } from "../../common/pagination/pagination.types";
import type { Hall } from "@prisma/client";
import type { HallSortField } from "./dto/query-hall.dto";

@Injectable()
export class HallService {
  constructor(@Inject(HALL_REPOSITORY) private readonly halls: IHallRepository) {}

  create(dto: CreateHallDto) {
    return this.halls.create(dto).catch((e: Error) => this.mapUnique(e));
  }

  async update(id: bigint, dto: UpdateHallDto): Promise<Hall> {
    return this.halls.update(id, dto).catch((e: Error) => this.mapUnique(e));
  }

  async remove(id: bigint): Promise<{ deleted: boolean }> {
    await this.halls.delete(id);
    return { deleted: true };
  }

  async findOne(id: bigint): Promise<Hall> {
    const row = await this.halls.findOne(id);
    if (row === null) throw new NotFoundException("Hall not found");
    return row;
  }

  findPaged(query: QueryHallDto): Promise<PaginatedResult<Hall>> {
    const sortBy =
      typeof query.sortBy === "string" ? (query.sortBy as HallSortField) : "createdAt";

    return this.halls.findManyPaged({ ...query, sortBy });
  }

  private mapUnique(e: Error): never {
    if ("code" in e && String((e as { code?: string }).code) === "P2002") {
      throw new ConflictException("Hall code already exists");
    }
    throw e;
  }
}
