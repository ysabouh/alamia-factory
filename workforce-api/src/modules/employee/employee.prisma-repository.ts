import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { buildPaginatedMeta, prismaSkipTake } from "../../common/pagination/pagination.types";
import type { PaginatedResult } from "../../common/pagination/pagination.types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { serializeEmployeeDetail, serializeEmployeeSummary } from "./employee.serializer";
import type { SerializedEmployeeDetail, SerializedEmployeeSummary } from "./employee.serializer";
import type { CreateEmployeeDto } from "./dto/create-employee.dto";
import type { QueryEmployeeDto } from "./dto/query-employee.dto";
import type { UpdateEmployeeDto } from "./dto/update-employee.dto";
import type { IEmployeeRepository } from "./interfaces/employee.repository.interface";

const INCLUDE_GRAPH = {
  hall: true,
  department: true,
  jobRole: true,
  shift: true,
  employeeStatus: true
} as const satisfies Prisma.EmployeeInclude;

type EmployeeWithGraph = Prisma.EmployeeGetPayload<{ include: typeof INCLUDE_GRAPH }>;

const SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "employeeNumber",
  "hireDate",
  "firstName",
  "lastName",
  "basicSalary",
  "performanceScore"
] as const;

@Injectable()
export class EmployeePrismaRepository implements IEmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto): Promise<SerializedEmployeeDetail> {
    const created = await this.prisma.employee.create({
      data: this.buildCreateInput(dto)
    });

    const row = await this.findOneDetailedRaw(created.id);

    return row!;
  }

  async update(id: bigint, dto: UpdateEmployeeDto): Promise<SerializedEmployeeDetail> {
    await this.ensureExists(id);
    await this.prisma.employee.update({
      where: { id },
      data: this.buildUpdateInput(dto)
    });

    const row = await this.findOneDetailedRaw(id);

    return row!;
  }

  async delete(id: bigint) {
    await this.ensureExists(id);
    await this.prisma.employee.delete({ where: { id } });
  }

  async findOneDetailed(id: bigint): Promise<SerializedEmployeeDetail | null> {
    const row = await this.findOneDetailedRaw(id);

    return row ?? null;
  }

  async findManyPaged(
    query: QueryEmployeeDto
  ): Promise<PaginatedResult<SerializedEmployeeSummary | SerializedEmployeeDetail>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = prismaSkipTake(page, pageSize);
    const where: Prisma.EmployeeWhereInput = this.buildFilters(query);

    const rq = query.sortBy ?? "createdAt";
    const sortKey = SORT_FIELDS.includes(rq as typeof SORT_FIELDS[number]) ? rq : "createdAt";
    const orderBy = {
      [sortKey]: query.sortOrder ?? "desc"
    } as Prisma.EmployeeOrderByWithRelationInput;

    if (query.withRelations === true) {
      const [rows, total] = await Promise.all([
        this.prisma.employee.findMany({
          where,
          skip,
          take,
          orderBy,
          include: INCLUDE_GRAPH
        }),
        this.prisma.employee.count({ where })
      ]);

      const data = (rows as EmployeeWithGraph[]).map((r) => serializeEmployeeDetail(r));

      return { data, meta: buildPaginatedMeta(page, pageSize, total) };
    }

    const [rows, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy
      }),
      this.prisma.employee.count({ where })
    ]);

    return {
      data: rows.map((e) => serializeEmployeeSummary(e)),
      meta: buildPaginatedMeta(page, pageSize, total)
    };
  }

  private buildFilters(query: QueryEmployeeDto): Prisma.EmployeeWhereInput {
    const where: Prisma.EmployeeWhereInput = {};

    if (query.search !== undefined && query.search.trim() !== "") {
      const s = query.search.trim();
      where.OR = [
        { employeeNumber: { contains: s } },
        { firstName: { contains: s } },
        { lastName: { contains: s } },
        { email: { contains: s } },
        { name: { contains: s } },
        { code: { contains: s } }
      ];
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.hallId !== undefined && query.hallId !== "") {
      where.hallId = BigInt(query.hallId);
    }
    if (query.departmentId !== undefined && query.departmentId !== "") {
      where.departmentId = BigInt(query.departmentId);
    }
    if (query.jobRoleId !== undefined && query.jobRoleId !== "") {
      where.jobRoleId = BigInt(query.jobRoleId);
    }
    if (query.shiftId !== undefined && query.shiftId !== "") {
      where.shiftId = BigInt(query.shiftId);
    }
    if (query.statusId !== undefined && query.statusId !== "") {
      where.employeeStatusId = BigInt(query.statusId);
    }

    return where;
  }

  private async findOneDetailedRaw(id: bigint): Promise<SerializedEmployeeDetail | undefined> {
    const row = await this.prisma.employee.findUnique({
      where: { id },
      include: INCLUDE_GRAPH
    });

    if (row === null) return undefined;

    return serializeEmployeeDetail(row as EmployeeWithGraph);
  }

  private buildCreateInput(dto: CreateEmployeeDto): Prisma.EmployeeCreateInput {
    const trimmedNo = dto.employeeNumber.trim();
    return {
      code: trimmedNo,
      name: `${dto.firstName} ${dto.lastName}`.trim(),
      employeeNumber: trimmedNo,
      firstName: dto.firstName,
      lastName: dto.lastName,
      gender: dto.gender ?? null,
      birthDate:
        dto.birthDate !== undefined ? new Date(`${dto.birthDate}T00:00:00.000Z`) : null,
      phone: dto.phone ?? null,
      emergencyPhone: dto.emergencyPhone ?? null,
      email: dto.email ?? null,
      nationalId: dto.nationalId ?? null,
      address: dto.address ?? null,
      hireDate: new Date(`${dto.hireDate}T00:00:00.000Z`),
      hall: this.connectIfPresent(dto.hallId),
      department: this.connectIfPresent(dto.departmentId),
      jobRole: this.connectIfPresent(dto.jobRoleId),
      shift: this.connectIfPresent(dto.shiftId),
      employeeStatus: this.connectIfPresent(dto.statusId),
      basicSalary: new Decimal(dto.basicSalary ?? 0),
      overtimeHourRate: new Decimal(dto.overtimeHourRate ?? 0),
      performanceScore: new Decimal(dto.performanceScore ?? 0),
      reliabilityScore: new Decimal(dto.reliabilityScore ?? 0),
      safetyScore: new Decimal(dto.safetyScore ?? 0),
      annualLeaveBalance: dto.annualLeaveBalance ?? 0,
      profileImage: dto.profileImage ?? null,
      notes: dto.notes ?? null,
      isActive: dto.isActive ?? true
    };
  }

  private buildUpdateInput(dto: UpdateEmployeeDto): Prisma.EmployeeUpdateInput {
    const data: Prisma.EmployeeUpdateInput = {};

    if (dto.employeeNumber !== undefined) data.employeeNumber = dto.employeeNumber.trim();
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.gender !== undefined) data.gender = dto.gender ?? null;
    if (dto.birthDate !== undefined) {
      data.birthDate = new Date(`${dto.birthDate}T00:00:00.000Z`);
    }
    if (dto.phone !== undefined) data.phone = dto.phone ?? null;
    if (dto.emergencyPhone !== undefined) data.emergencyPhone = dto.emergencyPhone ?? null;
    if (dto.email !== undefined) data.email = dto.email ?? null;
    if (dto.nationalId !== undefined) data.nationalId = dto.nationalId ?? null;
    if (dto.address !== undefined) data.address = dto.address ?? null;
    if (dto.hireDate !== undefined)
      data.hireDate = new Date(`${dto.hireDate}T00:00:00.000Z`);
    if (dto.hallId !== undefined) data.hall = this.relConnect(dto.hallId);
    if (dto.departmentId !== undefined) data.department = this.relConnect(dto.departmentId);
    if (dto.jobRoleId !== undefined) data.jobRole = this.relConnect(dto.jobRoleId);
    if (dto.shiftId !== undefined) data.shift = this.relConnect(dto.shiftId);
    if (dto.statusId !== undefined) data.employeeStatus = this.relConnect(dto.statusId);
    if (dto.basicSalary !== undefined)
      data.basicSalary = new Decimal(dto.basicSalary ?? 0);
    if (dto.overtimeHourRate !== undefined)
      data.overtimeHourRate = new Decimal(dto.overtimeHourRate ?? 0);
    if (dto.performanceScore !== undefined)
      data.performanceScore = new Decimal(dto.performanceScore ?? 0);
    if (dto.reliabilityScore !== undefined)
      data.reliabilityScore = new Decimal(dto.reliabilityScore ?? 0);
    if (dto.safetyScore !== undefined)
      data.safetyScore = new Decimal(dto.safetyScore ?? 0);
    if (dto.annualLeaveBalance !== undefined)
      data.annualLeaveBalance = dto.annualLeaveBalance;
    if (dto.profileImage !== undefined) data.profileImage = dto.profileImage ?? null;
    if (dto.notes !== undefined) data.notes = dto.notes ?? null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return data;
  }

  private connectIfPresent(
    id?: string
  ):
    | { connect: { id: bigint } }
    | undefined {
    const t = typeof id === "string" ? id.trim() : "";

    if (id === undefined || t === "") return undefined;

    return { connect: { id: BigInt(t) } };
  }

  private relConnect(
    raw: string
  ):
    | { connect: { id: bigint } }
    | { disconnect: true }
    | undefined {
    const s = raw.trim();
    if (s === "") {
      return { disconnect: true };
    }

    return { connect: { id: BigInt(s) } };
  }

  private async ensureExists(id: bigint) {
    const x = await this.prisma.employee.findUnique({
      where: { id },
      select: { id: true }
    });

    if (x === null) throw new NotFoundException("Employee not found");
  }
}
