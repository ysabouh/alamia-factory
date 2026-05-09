import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { buildPaginatedMeta, prismaSkipTake } from "../../common/pagination/pagination.types";
import type { PaginatedResult } from "../../common/pagination/pagination.types";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { Department } from "@prisma/client";
import type { CreateDepartmentDto } from "./dto/create-department.dto";
import type { QueryDepartmentDto } from "./dto/query-department.dto";
import type { UpdateDepartmentDto } from "./dto/update-department.dto";
import type { IDepartmentRepository } from "./interfaces/department.repository.interface";

const SORT_FIELDS = ["createdAt", "code", "name"] as const;

@Injectable()
export class DepartmentPrismaRepository implements IDepartmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: {
        hallId:
          dto.hallId !== undefined && dto.hallId !== "" ? BigInt(dto.hallId) : null,
        name: dto.name,
        code: dto.code.trim(),
        description: dto.description ?? null,
        isActive: dto.isActive ?? true
      }
    });
  }

  async update(id: bigint, dto: UpdateDepartmentDto) {
    await this.ensureExists(id);
    return this.prisma.department.update({
      where: { id },
      data: this.buildUpdatePayload(dto)
    });
  }

  async delete(id: bigint): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.department.delete({ where: { id } });
  }

  async findOne(id: bigint) {
    return this.prisma.department.findUnique({ where: { id } });
  }

  async findManyPaged(query: QueryDepartmentDto): Promise<PaginatedResult<Department>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = prismaSkipTake(page, pageSize);
    const where: Prisma.DepartmentWhereInput = {};

    if (query.hallId !== undefined && query.hallId !== "") {
      where.hallId = BigInt(query.hallId);
    }
    if (query.search !== undefined && query.search.trim() !== "") {
      const s = query.search.trim();
      where.OR = [{ name: { contains: s } }, { code: { contains: s } }];
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const rq = query.sortBy ?? "createdAt";
    const sortKey = SORT_FIELDS.includes(rq as typeof SORT_FIELDS[number]) ? rq : "createdAt";
    const orderBy: Prisma.DepartmentOrderByWithRelationInput = {
      [sortKey]: query.sortOrder ?? "desc"
    } as Prisma.DepartmentOrderByWithRelationInput;

    const [data, total] = await Promise.all([
      this.prisma.department.findMany({ where, skip, take, orderBy }),
      this.prisma.department.count({ where })
    ]);

    return { data, meta: buildPaginatedMeta(page, pageSize, total) };
  }

  private buildUpdatePayload(dto: UpdateDepartmentDto): Prisma.DepartmentUpdateInput {
    const data: Prisma.DepartmentUpdateInput = {};
    if (dto.hallId !== undefined) {
      data.hall =
        dto.hallId === ""
          ? { disconnect: true }
          : {
              connect: { id: BigInt(dto.hallId) }
            };
    }
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.code !== undefined) data.code = dto.code.trim();
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return data;
  }

  private async ensureExists(id: bigint): Promise<void> {
    const x = await this.prisma.department.findUnique({ where: { id }, select: { id: true } });
    if (x === null) {
      throw new NotFoundException("Department not found");
    }
  }
}
