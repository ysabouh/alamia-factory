import { Module } from "@nestjs/common";
import { ShiftController } from "./shift.controller";
import { ShiftPrismaRepository } from "./shift.prisma-repository";
import { ShiftService } from "./shift.service";
import { SHIFT_REPOSITORY } from "./interfaces/shift.repository.interface";

@Module({
  controllers: [ShiftController],
  providers: [
    ShiftService,
    { provide: SHIFT_REPOSITORY, useClass: ShiftPrismaRepository }
  ]
})
export class ShiftModule {}
