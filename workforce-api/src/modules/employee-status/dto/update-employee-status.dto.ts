import { PartialType } from "@nestjs/mapped-types";
import { CreateEmployeeStatusDto } from "./create-employee-status.dto";

export class UpdateEmployeeStatusDto extends PartialType(CreateEmployeeStatusDto) {}
