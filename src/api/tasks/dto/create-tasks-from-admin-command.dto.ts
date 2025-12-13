import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateTasksFromAdminCommandDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  campoId!: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  sectorId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  workerIds!: string[];

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  description!: string;

  // ISO string for execution date; will be parsed to Date in service layer.
  @IsDateString()
  date!: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  createdByAdminId!: string;

  @Transform(({ value }) => value?.trim())
  @IsOptional()
  @IsString()
  comment?: string;
}
