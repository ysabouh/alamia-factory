import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

export class CreateEmployeeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  employeeNumber!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyPhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationalId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsDateString()
  hireDate!: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\d+)?$/)
  hallId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\d+)?$/)
  departmentId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\d+)?$/)
  jobRoleId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\d+)?$/)
  shiftId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\d+)?$/)
  statusId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basicSalary?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  overtimeHourRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999.99)
  performanceScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999.99)
  reliabilityScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999.99)
  safetyScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  annualLeaveBalance?: number;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
