import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateEmployeeStatusDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code!: string;
}
