import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiWorkforceMutationErrors, ApiWorkforcePagedList } from "../../common/swagger/workforce-swagger.decorators";
import { ParseBigIntPipe } from "../../common/pipes/parse-big-int.pipe";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { QueryEmployeeDto } from "./dto/query-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { EmployeeService } from "./employee.service";

const EMPLOYEE_LIST_FILTERS =
  "`hallId`, `departmentId`, `jobRoleId`, `shiftId`, `statusId` (decimal FK strings). " +
  "`withRelations=true` attaches summarized hall/dept/role/shift/status objects per employee.";

@ApiTags("Workforce — Employees")
@Controller("workforce/employees")
export class EmployeeController {
  constructor(private readonly employees: EmployeeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create roster row",
    description: "Validates CreateEmployeeDto, mirrors Laravel `employees` columns (including `code` / `name`)."
  })
  @ApiCreatedResponse({ description: "Serialized employee incl. FK summaries when persisted" })
  @ApiWorkforceMutationErrors()
  create(@Body() dto: CreateEmployeeDto) {
    return this.employees.create(dto);
  }

  @Get()
  @ApiWorkforcePagedList("employees", EMPLOYEE_LIST_FILTERS)
  list(@Query() query: QueryEmployeeDto) {
    return this.employees.findPaged(query);
  }

  @Get(":id")
  @ApiParam({
    name: "id",
    example: "124",
    description: "Primary key as decimal string (JSON responses stringify bigint)."
  })
  @ApiOkResponse({ description: "Employee detail payload" })
  @ApiWorkforceMutationErrors("Employee id not found")
  one(@Param("id", ParseBigIntPipe) id: bigint) {
    return this.employees.findOne(id);
  }

  @Patch(":id")
  @ApiParam({ name: "id", example: "124" })
  @ApiOkResponse({ description: "Employee after partial patch" })
  @ApiWorkforceMutationErrors("Employee id not found")
  update(@Param("id", ParseBigIntPipe) id: bigint, @Body() dto: UpdateEmployeeDto) {
    return this.employees.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: "id", example: "124" })
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  @ApiWorkforceMutationErrors("Employee id not found")
  remove(@Param("id", ParseBigIntPipe) id: bigint) {
    return this.employees.remove(id);
  }
}
