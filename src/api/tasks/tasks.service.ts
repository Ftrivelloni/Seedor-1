import { Injectable, Logger } from '@nestjs/common';

import { CreateTasksFromAdminCommandDto } from './dto/create-tasks-from-admin-command.dto';
import { GetPendingTasksDto } from './dto/get-pending-tasks.dto';
import { MarkTaskStatusFromWorkerDto } from './dto/mark-task-status-from-worker.dto';
import { Task } from './task.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private tasks: Task[] = [];

  // Fase 4/5: aquí se inyectará el repositorio (Supabase/DB) para persistir tareas.

  async createTasksFromAdminCommand(
    input: CreateTasksFromAdminCommandDto,
  ): Promise<Task[]> {
    this.logger.log('createTasksFromAdminCommand invoked (stub)');
    const now = new Date();
    const created = input.workerIds.map((workerId, idx) => {
      const task: Task = {
        id: `task-${Date.now()}-${idx}`,
        tenantId: input.tenantId,
        campoId: input.campoId,
        sectorId: input.sectorId,
        workerId,
        description: input.description,
        date: new Date(input.date),
        status: 'PENDING',
        comment: input.comment,
        createdByAdminId: input.createdByAdminId,
        createdAt: now,
        updatedAt: now,
      };
      return task;
    });

    // Guardar en memoria (stub) hasta conectar con persistencia real.
    this.tasks.push(...created);
    this.logger.log(
      `Tasks creadas: ids=[${created.map((t) => t.id).join(', ')}] sector=${input.sectorId} workerIds=${input.workerIds.join(',')}`,
    );
    // Hook para métricas externas (Fase futura): emitir evento/metric.
    return created;
  }

  async markTaskStatusFromWorker(
    input: MarkTaskStatusFromWorkerDto,
  ): Promise<Task> {
    if (!input.taskId) {
      throw new Error('taskId es requerido para actualizar una tarea');
    }

    const task = this.tasks.find(
      (t) => t.id === input.taskId && t.workerId === input.workerId,
    );

    if (!task) {
      throw new Error('Tarea no encontrada para este trabajador');
    }

    task.status = input.status;
    task.comment = input.comment;
    task.updatedAt = new Date();
    this.logger.log(
      `Task status actualizado: id=${task.id} worker=${task.workerId} status=${task.status} comment=${task.comment ?? 'none'}`,
    );
    // Hook futuro: enviar métrica a Prometheus / bus de eventos.
    return task;
  }

  async getPendingTasksForWorker(
    workerId: string,
    date?: Date,
  ): Promise<Task[]> {
    const pending = this.tasks.filter(
      (t) => t.workerId === workerId && t.status === 'PENDING',
    );

    if (!date) return pending;

    return pending.filter((task) => this.isSameDay(task.date, date));
  }

  async getPendingTasks(input: GetPendingTasksDto): Promise<Task[]> {
    const date = input.date ? new Date(input.date) : undefined;
    return this.getPendingTasksForWorker(input.workerId, date);
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
