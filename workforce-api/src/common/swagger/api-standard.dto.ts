import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/** Pagination meta returned beside `data` for every list route. */
export class PaginationMetaDto {
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) pageSize!: number;
  @ApiProperty({ example: 142 }) total!: number;
  @ApiProperty({ example: 8 }) totalPages!: number;
}

/** Mirrors `GlobalHttpExceptionFilter` payloads. */

export class ApiFailureResponseDto {
  @ApiProperty({ example: false }) success!: false;
  @ApiProperty({ example: 400 }) statusCode!: number;
  @ApiProperty({ example: "2026-05-09T12:00:00.000Z" }) timestamp!: string;
  @ApiProperty({ example: "/api/v1/workforce/employees" }) path!: string;
  @ApiProperty({ example: "Validation failed" }) message!: string;
  @ApiProperty({ example: "Bad Request" }) error!: string;
  @ApiPropertyOptional({
    example: ["employeeNumber must be longer than or equal to 1 characters"]
  })
  validationErrors?: string[];
}
