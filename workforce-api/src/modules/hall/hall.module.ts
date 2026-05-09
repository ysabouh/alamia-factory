import { Module } from "@nestjs/common";
import { HallController } from "./hall.controller";
import { HallPrismaRepository } from "./hall.prisma-repository";
import { HallService } from "./hall.service";
import { HALL_REPOSITORY } from "./interfaces/hall.repository.interface";

@Module({
  controllers: [HallController],
  providers: [
    HallService,
    { provide: HALL_REPOSITORY, useClass: HallPrismaRepository }
  ]
})
export class HallModule {}
