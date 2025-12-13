import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { TaskStatus } from '../task.entity';

const STATUS_VALUES: TaskStatus[] = ['PENDING', 'COMPLETED', 'INCOMPLETE'];

export class MarkTaskStatusFromWorkerDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  taskId?: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  workerId!: string;

  @IsIn(STATUS_VALUES)
  status!: TaskStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}
