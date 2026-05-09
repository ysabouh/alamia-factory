import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiWorkforceMutationErrors, ApiWorkforcePagedList } from "../../common/swagger/workforce-swagger.decorators";
import { ParseBigIntPipe } from "../../common/pipes/parse-big-int.pipe";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { QueryDepartmentDto } from "./dto/query-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { DepartmentService } from "./department.service";

const DEPT_FILTERS =
  "`hallId` narrows to departments on a hall (decimal string). `sortBy` ∈ createdAt | code | name.";

@ApiTags("Workforce — Departments")
@Controller("workforce/departments")
export class DepartmentController {
  constructor(private readonly departments: DepartmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: "Department persisted" })
  @ApiWorkforceMutationErrors()
  create(@Body() dto: CreateDepartmentDto) {
    return this.departments.create(dto);
  }

  @Get()
  @ApiWorkforcePagedList("departments", DEPT_FILTERS)
  list(@Query() query: QueryDepartmentDto) {
    return this.departments.findPaged(query);
  }

  @Get(":id")
  @ApiParam({ name: "id", example: "22" })
  @ApiOkResponse({ description: "Department row incl. nullable hall linkage" })
  @ApiWorkforceMutationErrors("Department id not found")
  one(@Param("id", ParseBigIntPipe) id: bigint) {
    return this.departments.findOne(id);
  }

  @Patch(":id")
  @ApiParam({ name: "id", example: "22" })
  @ApiOkResponse({ description: "Patched department" })
  @ApiWorkforceMutationErrors("Department id not found")
  update(@Param("id", ParseBigIntPipe) id: bigint, @Body() dto: UpdateDepartmentDto) {
    return this.departments.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  @ApiWorkforceMutationErrors("Department id not found")
  remove(@Param("id", ParseBigIntPipe) id: bigint) {
    return this.departments.remove(id);
  }
}
