import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { PaginatedResult } from "../../common/pagination/pagination.types";
import { prismaSkipTake, buildPaginatedMeta } from "../../common/pagination/pagination.types";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { CreateHallDto } from "./dto/create-hall.dto";
import type { QueryHallDto } from "./dto/query-hall.dto";
import type { UpdateHallDto } from "./dto/update-hall.dto";
import type { IHallRepository } from "./interfaces/hall.repository.interface";

const DEFAULT_SORT: keyof Prisma.HallOrderByWithRelationInput = "createdAt";

@Injectable()
export class HallPrismaRepository implements IHallRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHallDto) {
    return this.prisma.hall.create({
      data: {
        name: dto.name,
        code: dto.code.trim(),
        hallType: dto.hallType ?? null,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true
      }
    });
  }

  async update(id: bigint, dto: UpdateHallDto) {
    await this.ensureExists(id);
    const data = this.buildUpdatePayload(dto);

    return this.prisma.hall.update({
      where: { id },
      data
    });
  }

  async delete(id: bigint) {
    await this.ensureExists(id);
    await this.prisma.hall.delete({ where: { id } });
  }

  async findOne(id: bigint) {
    return this.prisma.hall.findUnique({ where: { id } });
  }

  async findManyPaged(query: QueryHallDto): Promise<PaginatedResult<import("@prisma/client").Hall>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = prismaSkipTake(page, pageSize);
    const where: Prisma.HallWhereInput = {};

    if (query.search !== undefined && query.search.trim() !== "") {
      const s = query.search.trim();
      where.OR = [{ name: { contains: s } }, { code: { contains: s } }, { hallType: { contains: s } }];
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const requested = query.sortBy ?? DEFAULT_SORT;
    const allowed = new Set<string>(["createdAt", "code", "name", "hallType"]);
    const sortKey = allowed.has(String(requested)) ? String(requested) : DEFAULT_SORT;
    const orderBy: Prisma.HallOrderByWithRelationInput = {
      [sortKey]: query.sortOrder ?? "desc"
    } as Prisma.HallOrderByWithRelationInput;

    const [rows, total] = await Promise.all([
      this.prisma.hall.findMany({ where, skip, take, orderBy }),
      this.prisma.hall.count({ where })
    ]);

    return { data: rows, meta: buildPaginatedMeta(page, pageSize, total) };
  }

  private async ensureExists(id: bigint): Promise<void> {
    const x = await this.prisma.hall.findUnique({
      where: { id },
      select: { id: true }
    });
    if (x === null) {
      throw new NotFoundException("Hall not found");
    }
  }

  private buildUpdatePayload(dto: UpdateHallDto): Prisma.HallUpdateInput {
    const payload: Prisma.HallUpdateInput = {};
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.code !== undefined) payload.code = dto.code.trim();
    if (dto.hallType !== undefined) payload.hallType = dto.hallType ?? null;
    if (dto.description !== undefined) payload.description = dto.description ?? null;
    if (dto.isActive !== undefined) payload.isActive = dto.isActive;
    return payload;
  }
}
