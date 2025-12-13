import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CreateTasksFromAdminCommandDto } from './dto/create-tasks-from-admin-command.dto';
import { GetPendingTasksDto } from './dto/get-pending-tasks.dto';
import { MarkTaskStatusFromWorkerDto } from './dto/mark-task-status-from-worker.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // Endpoint mínimo de lectura para probar la integración con el bot.
  @Get('pending')
  getPendingTasks(@Query() query: GetPendingTasksDto) {
    return this.tasksService.getPendingTasks(query);
  }

  // Esqueleto para crear tareas desde comandos de admin (se completará en Fase 4/5).
  @Post('admin')
  createFromAdminCommand(@Body() body: CreateTasksFromAdminCommandDto) {
    return this.tasksService.createTasksFromAdminCommand(body);
  }

  // Esqueleto para que un peón marque estado vía bot.
  @Patch(':id/status')
  markStatus(
    @Param('id') taskId: string,
    @Body() body: MarkTaskStatusFromWorkerDto,
  ) {
    return this.tasksService.markTaskStatusFromWorker({ ...body, taskId });
  }
}
