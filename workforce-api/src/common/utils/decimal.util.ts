import type { Decimal } from "@prisma/client/runtime/library";

export function prismaDecimalNumber(d: Decimal | null | undefined): number | null {
  if (d === null || d === undefined) {
    return null;
  }

  return Number.parseFloat(d.toString());
}
