import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { JobRole } from "@prisma/client";
import { buildPaginatedMeta, prismaSkipTake } from "../../common/pagination/pagination.types";
import type { PaginatedResult } from "../../common/pagination/pagination.types";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { CreateJobRoleDto } from "./dto/create-job-role.dto";
import type { QueryJobRoleDto } from "./dto/query-job-role.dto";
import type { UpdateJobRoleDto } from "./dto/update-job-role.dto";
import type { IJobRoleRepository } from "./interfaces/job-role.repository.interface";

const SORT = ["createdAt", "code", "name", "roleLevel"] as const;

@Injectable()
export class JobRolePrismaRepository implements IJobRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateJobRoleDto) {
    return this.prisma.jobRole.create({
      data: {
        name: dto.name,
        code: dto.code.trim(),
        roleLevel: dto.roleLevel ?? 1,
        description: dto.description ?? null
      }
    });
  }

  async update(id: bigint, dto: UpdateJobRoleDto) {
    await this.ensureExists(id);
    const data: Prisma.JobRoleUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.code !== undefined) data.code = dto.code.trim();
    if (dto.roleLevel !== undefined) data.roleLevel = dto.roleLevel;
    if (dto.description !== undefined) data.description = dto.description ?? null;

    return this.prisma.jobRole.update({ where: { id }, data });
  }

  async delete(id: bigint) {
    await this.ensureExists(id);
    await this.prisma.jobRole.delete({ where: { id } });
  }

  async findOne(id: bigint) {
    return this.prisma.jobRole.findUnique({ where: { id } });
  }

  async findManyPaged(query: QueryJobRoleDto): Promise<PaginatedResult<JobRole>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = prismaSkipTake(page, pageSize);
    const where: Prisma.JobRoleWhereInput = {};

    if (query.search !== undefined && query.search.trim() !== "") {
      const s = query.search.trim();
      where.OR = [{ name: { contains: s } }, { code: { contains: s } }, { description: { contains: s } }];
    }

    const rq = query.sortBy ?? "roleLevel";
    const sortKey = SORT.includes(rq as typeof SORT[number]) ? rq : "roleLevel";

    const orderBy: Prisma.JobRoleOrderByWithRelationInput = {
      [sortKey]: query.sortOrder ?? "desc"
    } as Prisma.JobRoleOrderByWithRelationInput;

    const [data, total] = await Promise.all([
      this.prisma.jobRole.findMany({ where, skip, take, orderBy }),
      this.prisma.jobRole.count({ where })
    ]);

    return { data, meta: buildPaginatedMeta(page, pageSize, total) };
  }

  private async ensureExists(id: bigint) {
    const x = await this.prisma.jobRole.findUnique({
      where: { id },
      select: { id: true }
    });
    if (x === null) throw new NotFoundException("Job role not found");
  }
}
