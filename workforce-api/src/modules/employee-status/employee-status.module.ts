import { Module } from "@nestjs/common";
import { EmployeeStatusController } from "./employee-status.controller";
import { EmployeeStatusPrismaRepository } from "./employee-status.prisma-repository";
import { EmployeeStatusService } from "./employee-status.service";
import { EMPLOYEE_STATUS_REPOSITORY } from "./interfaces/employee-status.repository.interface";

@Module({
  controllers: [EmployeeStatusController],
  providers: [
    EmployeeStatusService,
    { provide: EMPLOYEE_STATUS_REPOSITORY, useClass: EmployeeStatusPrismaRepository }
  ]
})
export class EmployeeStatusModule {}
