import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { EmployeeStatus } from "@prisma/client";
import { buildPaginatedMeta, prismaSkipTake } from "../../common/pagination/pagination.types";
import type { PaginatedResult } from "../../common/pagination/pagination.types";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { CreateEmployeeStatusDto } from "./dto/create-employee-status.dto";
import type { QueryEmployeeStatusDto } from "./dto/query-employee-status.dto";
import type { UpdateEmployeeStatusDto } from "./dto/update-employee-status.dto";
import type { IEmployeeStatusRepository } from "./interfaces/employee-status.repository.interface";

const SORT = ["createdAt", "code", "name"] as const;

@Injectable()
export class EmployeeStatusPrismaRepository implements IEmployeeStatusRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeStatusDto) {
    return this.prisma.employeeStatus.create({
      data: {
        name: dto.name,
        code: dto.code.trim()
      }
    });
  }

  async update(id: bigint, dto: UpdateEmployeeStatusDto) {
    await this.ensureExists(id);
    const data: Prisma.EmployeeStatusUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.code !== undefined) data.code = dto.code.trim();

    return this.prisma.employeeStatus.update({ where: { id }, data });
  }

  async delete(id: bigint) {
    await this.ensureExists(id);
    await this.prisma.employeeStatus.delete({ where: { id } });
  }

  async findOne(id: bigint) {
    return this.prisma.employeeStatus.findUnique({ where: { id } });
  }

  async findManyPaged(
    query: QueryEmployeeStatusDto
  ): Promise<PaginatedResult<EmployeeStatus>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = prismaSkipTake(page, pageSize);
    const where: Prisma.EmployeeStatusWhereInput = {};

    if (query.search !== undefined && query.search.trim() !== "") {
      const s = query.search.trim();
      where.OR = [{ name: { contains: s } }, { code: { contains: s } }];
    }

    const rq = query.sortBy ?? "code";
    const sortKey = SORT.includes(rq as typeof SORT[number]) ? rq : "code";
    const orderBy = { [sortKey]: query.sortOrder ?? "asc" } as Prisma.EmployeeStatusOrderByWithRelationInput;

    const [data, total] = await Promise.all([
      this.prisma.employeeStatus.findMany({ where, skip, take, orderBy }),
      this.prisma.employeeStatus.count({ where })
    ]);

    return { data, meta: buildPaginatedMeta(page, pageSize, total) };
  }

  private async ensureExists(id: bigint) {
    const row = await this.prisma.employeeStatus.findUnique({
      where: { id },
      select: { id: true }
    });
    if (row === null) throw new NotFoundException("Employee status not found");
  }
}
