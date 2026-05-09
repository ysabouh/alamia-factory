import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class ParseBigIntPipe implements PipeTransform<string | undefined, bigint> {
  transform(value: string | undefined): bigint {
    if (typeof value !== "string" || value.trim() === "" || !/^\d+$/.test(value)) {
      throw new BadRequestException("Invalid identifier");
    }
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException("Invalid identifier");
    }
  }
}
