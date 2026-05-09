import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiWorkforceMutationErrors, ApiWorkforcePagedList } from "../../common/swagger/workforce-swagger.decorators";
import { ParseBigIntPipe } from "../../common/pipes/parse-big-int.pipe";
import { CreateEmployeeStatusDto } from "./dto/create-employee-status.dto";
import { QueryEmployeeStatusDto } from "./dto/query-employee-status.dto";
import { UpdateEmployeeStatusDto } from "./dto/update-employee-status.dto";
import { EmployeeStatusService } from "./employee-status.service";

const STATUS_FILTERS =
  "`sortBy` ∈ createdAt | code | name — maps ORM model `EmployeeStatus` to Laravel `employment_statuses` rows.";

@ApiTags("Workforce — Employee statuses")
@Controller("workforce/employee-statuses")
export class EmployeeStatusController {
  constructor(private readonly statuses: EmployeeStatusService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: "Lifecycle status persisted" })
  @ApiWorkforceMutationErrors()
  create(@Body() dto: CreateEmployeeStatusDto) {
    return this.statuses.create(dto);
  }

  @Get()
  @ApiWorkforcePagedList("employment statuses", STATUS_FILTERS)
  list(@Query() q: QueryEmployeeStatusDto) {
    return this.statuses.findPaged(q);
  }

  @Get(":id")
  @ApiParam({ name: "id", example: "1" })
  @ApiOkResponse({ description: "Status row" })
  @ApiWorkforceMutationErrors("Status id not found")
  one(@Param("id", ParseBigIntPipe) id: bigint) {
    return this.statuses.findOne(id);
  }

  @Patch(":id")
  @ApiParam({ name: "id", example: "1" })
  @ApiOkResponse({ description: "Patched status labeling" })
  @ApiWorkforceMutationErrors("Status id not found")
  update(@Param("id", ParseBigIntPipe) id: bigint, @Body() dto: UpdateEmployeeStatusDto) {
    return this.statuses.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  @ApiWorkforceMutationErrors("Status id not found")
  remove(@Param("id", ParseBigIntPipe) id: bigint) {
    return this.statuses.remove(id);
  }
}
