import { Module } from "@nestjs/common";
import { JobRoleController } from "./job-role.controller";
import { JobRolePrismaRepository } from "./job-role.prisma-repository";
import { JobRoleService } from "./job-role.service";
import { JOB_ROLE_REPOSITORY } from "./interfaces/job-role.repository.interface";

@Module({
  controllers: [JobRoleController],
  providers: [
    JobRoleService,
    { provide: JOB_ROLE_REPOSITORY, useClass: JobRolePrismaRepository }
  ]
})
export class JobRoleModule {}
