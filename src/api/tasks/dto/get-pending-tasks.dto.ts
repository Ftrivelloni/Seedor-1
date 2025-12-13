import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class GetPendingTasksDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  workerId!: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
