import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiWorkforceMutationErrors, ApiWorkforcePagedList } from "../../common/swagger/workforce-swagger.decorators";
import { ParseBigIntPipe } from "../../common/pipes/parse-big-int.pipe";
import { CreateHallDto } from "./dto/create-hall.dto";
import { QueryHallDto } from "./dto/query-hall.dto";
import { UpdateHallDto } from "./dto/update-hall.dto";
import { HallService } from "./hall.service";

const HALL_FILTERS =
  "`sortBy` whitelist: createdAt • code • name • hallType. Shares `search` across name/code/hall_type.";

@ApiTags("Workforce — Halls")
@Controller("workforce/halls")
export class HallController {
  constructor(private readonly halls: HallService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: "Hall row" })
  @ApiWorkforceMutationErrors()
  create(@Body() dto: CreateHallDto) {
    return this.halls.create(dto);
  }

  @Get()
  @ApiWorkforcePagedList("halls", HALL_FILTERS)
  list(@Query() q: QueryHallDto) {
    return this.halls.findPaged(q);
  }

  @Get(":id")
  @ApiParam({ name: "id", example: "10" })
  @ApiOkResponse({ description: "Hall row JSON" })
  @ApiWorkforceMutationErrors("Hall id not found")
  one(@Param("id", ParseBigIntPipe) id: bigint) {
    return this.halls.findOne(id);
  }

  @Patch(":id")
  @ApiParam({ name: "id", example: "10" })
  @ApiOkResponse({ description: "Updated hall row" })
  @ApiWorkforceMutationErrors("Hall id not found")
  update(@Param("id", ParseBigIntPipe) id: bigint, @Body() dto: UpdateHallDto) {
    return this.halls.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  @ApiWorkforceMutationErrors("Hall id not found")
  remove(@Param("id", ParseBigIntPipe) id: bigint) {
    return this.halls.remove(id);
  }
}
