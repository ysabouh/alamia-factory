import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiWorkforceMutationErrors, ApiWorkforcePagedList } from "../../common/swagger/workforce-swagger.decorators";
import { ParseBigIntPipe } from "../../common/pipes/parse-big-int.pipe";
import { CreateJobRoleDto } from "./dto/create-job-role.dto";
import { QueryJobRoleDto } from "./dto/query-job-role.dto";
import { UpdateJobRoleDto } from "./dto/update-job-role.dto";
import { JobRoleService } from "./job-role.service";

const JOB_ROLE_FILTERS = "`sortBy` ∈ createdAt | code | name | roleLevel (defaults to ordering by ladder).";

@ApiTags("Workforce — Job roles")
@Controller("workforce/job-roles")
export class JobRoleController {
  constructor(private readonly jobRoles: JobRoleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: "Job role row with SAR-aligned ladder metadata" })
  @ApiWorkforceMutationErrors()
  create(@Body() dto: CreateJobRoleDto) {
    return this.jobRoles.create(dto);
  }

  @Get()
  @ApiWorkforcePagedList("job_roles", JOB_ROLE_FILTERS)
  list(@Query() q: QueryJobRoleDto) {
    return this.jobRoles.findPaged(q);
  }

  @Get(":id")
  @ApiParam({ name: "id", example: "5" })
  @ApiOkResponse({ description: "Job role lookup" })
  @ApiWorkforceMutationErrors("Job role id not found")
  one(@Param("id", ParseBigIntPipe) id: bigint) {
    return this.jobRoles.findOne(id);
  }

  @Patch(":id")
  @ApiParam({ name: "id", example: "5" })
  @ApiOkResponse({ description: "Patched ladder / naming metadata" })
  @ApiWorkforceMutationErrors("Job role id not found")
  update(@Param("id", ParseBigIntPipe) id: bigint, @Body() dto: UpdateJobRoleDto) {
    return this.jobRoles.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  @ApiWorkforceMutationErrors("Job role id not found")
  remove(@Param("id", ParseBigIntPipe) id: bigint) {
    return this.jobRoles.remove(id);
  }
}
