import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./common/prisma/prisma.module";
import { DepartmentModule } from "./modules/department/department.module";
import { EmployeeModule } from "./modules/employee/employee.module";
import { EmployeeStatusModule } from "./modules/employee-status/employee-status.module";
import { HallModule } from "./modules/hall/hall.module";
import { JobRoleModule } from "./modules/job-role/job-role.module";
import { ShiftModule } from "./modules/shift/shift.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HallModule,
    DepartmentModule,
    JobRoleModule,
    ShiftModule,
    EmployeeStatusModule,
    EmployeeModule
  ]
})
export class AppModule {}
