import type { Shift } from "@prisma/client";
import { prismaDateToHHmm } from "../../common/utils/time.util";

export type ShiftResponse = Omit<Shift, "startTime" | "endTime"> & {
  startTime: string;
  endTime: string;
};

export function serializeShift(row: Shift): ShiftResponse {
  return {
    ...row,
    startTime: prismaDateToHHmm(row.startTime),
    endTime: prismaDateToHHmm(row.endTime)
  };
}
