import { Module } from "@nestjs/common";
import { EmployeeController } from "./employee.controller";
import { EmployeePrismaRepository } from "./employee.prisma-repository";
import { EmployeeService } from "./employee.service";
import { EMPLOYEE_REPOSITORY } from "./interfaces/employee.repository.interface";

@Module({
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    { provide: EMPLOYEE_REPOSITORY, useClass: EmployeePrismaRepository }
  ]
})
export class EmployeeModule {}
