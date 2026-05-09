import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiWorkforceMutationErrors, ApiWorkforcePagedList } from "../../common/swagger/workforce-swagger.decorators";
import { ParseBigIntPipe } from "../../common/pipes/parse-big-int.pipe";
import { CreateShiftDto } from "./dto/create-shift.dto";
import { QueryShiftDto } from "./dto/query-shift.dto";
import { UpdateShiftDto } from "./dto/update-shift.dto";
import { ShiftService } from "./shift.service";

const SHIFT_FILTERS =
  "`sortBy` ∈ createdAt | code | name. Stored times map to Laravel `starts_at` / `ends_at` columns; serializer surfaces `HH:mm`.";

@ApiTags("Workforce — Shifts")
@Controller("workforce/shifts")
export class ShiftController {
  constructor(private readonly shifts: ShiftService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: "Shift persisted with canonical `SHIFT-*` codes" })
  @ApiWorkforceMutationErrors()
  create(@Body() dto: CreateShiftDto) {
    return this.shifts.create(dto);
  }

  @Get()
  @ApiWorkforcePagedList("shifts", SHIFT_FILTERS)
  list(@Query() query: QueryShiftDto) {
    return this.shifts.findPaged(query);
  }

  @Get(":id")
  @ApiParam({ name: "id", example: "3" })
  @ApiOkResponse({ description: "Shift row with textual start/end clocks" })
  @ApiWorkforceMutationErrors("Shift id not found")
  one(@Param("id", ParseBigIntPipe) id: bigint) {
    return this.shifts.findOne(id);
  }

  @Patch(":id")
  @ApiParam({ name: "id", example: "3" })
  @ApiOkResponse({ description: "Patched clocks / labels" })
  @ApiWorkforceMutationErrors("Shift id not found")
  update(@Param("id", ParseBigIntPipe) id: bigint, @Body() dto: UpdateShiftDto) {
    return this.shifts.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  @ApiWorkforceMutationErrors("Shift id not found")
  remove(@Param("id", ParseBigIntPipe) id: bigint) {
    return this.shifts.remove(id);
  }
}
