import { Module } from "@nestjs/common";
import { DepartmentController } from "./department.controller";
import { DepartmentPrismaRepository } from "./department.prisma-repository";
import { DepartmentService } from "./department.service";
import { DEPARTMENT_REPOSITORY } from "./interfaces/department.repository.interface";

@Module({
  controllers: [DepartmentController],
  providers: [
    DepartmentService,
    { provide: DEPARTMENT_REPOSITORY, useClass: DepartmentPrismaRepository }
  ]
})
export class DepartmentModule {}
