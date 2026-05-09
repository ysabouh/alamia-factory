import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Shift } from "@prisma/client";
import { buildPaginatedMeta, prismaSkipTake } from "../../common/pagination/pagination.types";
import type { PaginatedResult } from "../../common/pagination/pagination.types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { hhmmToPrismaDate } from "../../common/utils/time.util";
import type { CreateShiftDto } from "./dto/create-shift.dto";
import type { QueryShiftDto } from "./dto/query-shift.dto";
import type { UpdateShiftDto } from "./dto/update-shift.dto";
import type { IShiftRepository } from "./interfaces/shift.repository.interface";

const SORT = ["createdAt", "code", "name"] as const;

@Injectable()
export class ShiftPrismaRepository implements IShiftRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateShiftDto) {
    return this.prisma.shift.create({
      data: {
        name: dto.name,
        code: dto.code.trim(),
        startTime: hhmmToPrismaDate(dto.startTime),
        endTime: hhmmToPrismaDate(dto.endTime)
      }
    });
  }

  async update(id: bigint, dto: UpdateShiftDto) {
    await this.ensureExists(id);
    const data: Prisma.ShiftUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.code !== undefined) data.code = dto.code.trim();
    if (dto.startTime !== undefined) data.startTime = hhmmToPrismaDate(dto.startTime);
    if (dto.endTime !== undefined) data.endTime = hhmmToPrismaDate(dto.endTime);

    return this.prisma.shift.update({ where: { id }, data });
  }

  async delete(id: bigint) {
    await this.ensureExists(id);
    await this.prisma.shift.delete({ where: { id } });
  }

  async findOne(id: bigint) {
    return this.prisma.shift.findUnique({ where: { id } });
  }

  async findManyPaged(query: QueryShiftDto): Promise<PaginatedResult<Shift>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = prismaSkipTake(page, pageSize);
    const where: Prisma.ShiftWhereInput = {};

    if (query.search !== undefined && query.search.trim() !== "") {
      const s = query.search.trim();
      where.OR = [{ name: { contains: s } }, { code: { contains: s } }];
    }

    const rq = query.sortBy ?? "createdAt";
    const sortKey = SORT.includes(rq as typeof SORT[number]) ? rq : "createdAt";
    const orderBy = { [sortKey]: query.sortOrder ?? "desc" } as Prisma.ShiftOrderByWithRelationInput;

    const [data, total] = await Promise.all([
      this.prisma.shift.findMany({ where, skip, take, orderBy }),
      this.prisma.shift.count({ where })
    ]);

    return { data, meta: buildPaginatedMeta(page, pageSize, total) };
  }

  private async ensureExists(id: bigint) {
    const x = await this.prisma.shift.findUnique({ where: { id }, select: { id: true } });
    if (x === null) throw new NotFoundException("Shift not found");
  }
}
