import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateJobRoleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  roleLevel?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
