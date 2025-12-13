import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';

import { CampoService } from '../api/campo/campo.service';
import { WorkersService } from '../api/workers/workers.service';
import { CreateTasksFromAdminCommandDto } from '../api/tasks/dto/create-tasks-from-admin-command.dto';
import { TasksService } from '../api/tasks/tasks.service';
import { TaskStatus } from '../api/tasks/task.entity';
import { ParsedTaskCommand } from './types';
import { WhatsappConfigService } from './whatsapp-config.service';
import { WhatsappService } from './whatsapp.service';

type ParseResult =
  | { ok: true; data: ParsedTaskCommand }
  | { ok: false; error: string };

type WorkerCommandResult =
  | { ok: true; taskId?: string; status: TaskStatus; comment?: string }
  | { ok: false; error: string };

@Injectable()
export class WhatsappBotService {
  private readonly logger = new Logger(WhatsappBotService.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly workersService: WorkersService,
    private readonly campoService: CampoService,
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
    private readonly configService: WhatsappConfigService,
  ) {}

  isAdminPhone(phone: string): boolean {
    return this.configService.isAdmin(phone);
  }

  async handleAdminMessage(fromJid: string, body: string, phone?: string): Promise<void> {
    const trimmed = body?.trim();
    if (!trimmed) {
      return;
    }

    // Mantener ping/pong como comando de debug rápido.
    if (trimmed.toLowerCase() === 'ping') {
      await this.whatsappService.sendText(fromJid, 'pong');
      return;
    }

    if (!this.isAdminPhone(phone ?? this.extractPhoneFromText(fromJid))) {
      this.logger.warn(`Mensaje admin rechazado: phone=${phone ?? 'unknown'} no está autorizado`);
      return;
    }

    if (!trimmed.toLowerCase().startsWith('/tarea')) {
      // Ignore other admin messages for now.
      return;
    }

    this.logger.log(
      `Comando admin detectado: phone=${phone ?? 'unknown'} type=/tarea`,
    );

    const parsed = this.parseTaskCommand(trimmed);
    if (!parsed.ok) {
      await this.whatsappService.sendText(fromJid, parsed.error);
      return;
    }

    const { sector, fecha, peonNombre, peonPhone, descripcion, comment } = parsed.data;
    const worker = await this.workersService.findByNameOrPhone(peonNombre, peonPhone);
    if (!worker) {
      await this.whatsappService.sendText(
        fromJid,
        `❌ No encontré al peón "${peonNombre}". Verifica el nombre o agrega teléfono.`,
      );
      return;
    }

    const sectorEntity = await this.campoService.findSectorByName(worker.tenantId, sector);
    if (!sectorEntity) {
      await this.whatsappService.sendText(
        fromJid,
        `❌ No encontré el sector "${sector}". Verifica el nombre.`,
      );
      return;
    }

    const dto: CreateTasksFromAdminCommandDto = {
      tenantId: worker.tenantId || sectorEntity.tenantId,
      campoId: sectorEntity.campoId,
      sectorId: sectorEntity.id,
      workerIds: [worker.id],
      description: descripcion,
      date: fecha,
      createdByAdminId: phone ? `admin:${this.normalizePhone(phone)}` : 'admin:unknown',
      comment,
    };

    const tasks = await this.tasksService.createTasksFromAdminCommand(dto);
    const confirmation = `✅ Se creó la tarea para ${worker.fullName} el ${fecha} en el sector ${sector}.`;
    await this.whatsappService.sendText(fromJid, confirmation);

    const workerPhone = worker.phone ? this.normalizePhone(worker.phone) : null;
    if (workerPhone) {
      const workerJid = this.formatPhoneToJid(workerPhone);
      const workerMessage = `👋 Nueva tarea para ${fecha}: ${descripcion} (Sector: ${sector})`;
      await this.whatsappService.sendText(workerJid, workerMessage);
    } else {
      await this.whatsappService.sendText(
        fromJid,
        'ℹ️ Nota: no se envió mensaje al peón porque no tiene teléfono registrado.',
      );
    }

    if (tasks.length === 0) {
      this.logger.warn('createTasksFromAdminCommand devolvió 0 tareas (stub).');
    }
  }

  async handleWorkerMessage(fromJid: string, body: string, phone?: string): Promise<void> {
    const trimmed = body?.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === 'ping') {
      await this.whatsappService.sendText(fromJid, 'pong');
      return;
    }

    const workerPhone = phone || this.extractPhoneFromText(fromJid);
    const worker = workerPhone
      ? await this.workersService.findByPhone(workerPhone)
      : null;

    if (!worker) {
      await this.whatsappService.sendText(
        fromJid,
        '❌ No pudimos identificar tu usuario. Contacta a un administrador.',
      );
      return;
    }

    const parsed = this.parseWorkerCommand(trimmed);
    if (!parsed.ok) {
      await this.whatsappService.sendText(fromJid, parsed.error);
      return;
    }

    this.logger.log(
      `Comando worker recibido: workerId=${worker.id} status=${parsed.ok ? parsed.status : 'invalid'} taskId=${parsed.taskId ?? 'auto'}`,
    );

    const today = new Date();
    let taskId = parsed.taskId;

    if (!taskId) {
      const pending = await this.tasksService.getPendingTasksForWorker(worker.id, today);
      if (!pending.length) {
        await this.whatsappService.sendText(
          fromJid,
          'ℹ️ No encontré tareas pendientes para hoy.',
        );
        return;
      }
      // Por simplicidad: tomar la última tarea pendiente del día.
      taskId = pending[pending.length - 1].id;
    }

    try {
      const updated = await this.tasksService.markTaskStatusFromWorker({
        taskId,
        workerId: worker.id,
        status: parsed.status,
        comment: parsed.comment,
      });

      if (parsed.status === 'COMPLETED') {
        await this.whatsappService.sendText(
          fromJid,
          `✅ Registrado, tarea #${updated.id} COMPLETA. ¡Gracias!`,
        );
      } else {
      const commentText = parsed.comment
        ? ` Comentario guardado: "${parsed.comment}".`
        : '';
      await this.whatsappService.sendText(
        fromJid,
          `❌ Registrado, tarea #${updated.id} INCOMPLETA.${commentText}`,
        );
      }
    } catch (error) {
      this.logger.error('Error al actualizar tarea desde worker', error as Error);
      await this.whatsappService.sendText(
        fromJid,
        '❌ No se pudo actualizar la tarea. Intenta de nuevo o contacta a un admin.',
      );
    }
  }

  private parseTaskCommand(body: string): ParseResult {
    const usage = [
      'Formato esperado:',
      '/tarea',
      'sector: poda',
      'fecha: YYYY-MM-DD',
      'peon: Nombre del peón (opcional +telefono)',
      'desc: Descripción de la tarea',
    ].join('\n');

    const lines = body
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const data: Partial<ParsedTaskCommand> = {};
    for (const line of lines) {
      if (line.toLowerCase().startsWith('/tarea')) {
        continue;
      }

      const [rawKey, ...rest] = line.split(':');
      if (!rawKey || rest.length === 0) {
        continue;
      }

      const key = rawKey.trim().toLowerCase();
      const value = rest.join(':').trim();

      if (key.startsWith('sector')) {
        data.sector = value;
      } else if (key === 'fecha' || key === 'date') {
        data.fecha = value;
      } else if (['peon', 'peón', 'worker'].includes(key)) {
        data.peonNombre = value;
        const phone = this.extractPhoneFromText(value);
        if (phone) {
          data.peonPhone = phone;
        }
      } else if (key.startsWith('desc')) {
        data.descripcion = value;
      } else if (key.startsWith('coment')) {
        data.comment = value;
      } else if (key.startsWith('tel')) {
        data.peonPhone = this.normalizePhone(value);
      }
    }

    if (!data.sector || !data.fecha || !data.peonNombre || !data.descripcion) {
      return {
        ok: false,
        error: `❌ Faltan datos obligatorios.\n${usage}`,
      };
    }

    return {
      ok: true,
      data: {
        sector: data.sector.trim(),
        fecha: data.fecha.trim(),
        peonNombre: data.peonNombre.trim(),
        peonPhone: data.peonPhone ? this.normalizePhone(data.peonPhone) : undefined,
        descripcion: data.descripcion.trim(),
        comment: data.comment?.trim(),
      },
    };
  }

  private parseWorkerCommand(body: string): WorkerCommandResult {
    const usage =
      'Usa "1" para COMPLETAR o "2 <comentario opcional>" para marcar INCOMPLETA.\n' +
      'También puedes enviar "#<id> 1" o "#<id> 2 <comentario>".';

    const trimmed = body.trim();
    // Formato con taskId: "#1234 1 ..." o "1234 1 ..."
    const idStatusMatch = trimmed.match(/^#?(\S+)\s+(1|2)\b\s*(.*)$/);
    if (idStatusMatch) {
      const [, taskId, code, rest] = idStatusMatch;
      const status: TaskStatus = code === '1' ? 'COMPLETED' : 'INCOMPLETE';
        const comment = rest?.trim() || undefined;
        return { ok: true, taskId, status, comment };
    }

    // Formato sin taskId: "1" o "2 comentario"
    const simpleMatch = trimmed.match(/^(1|2)\b\s*(.*)$/);
    if (simpleMatch) {
      const [, code, rest] = simpleMatch;
      const status: TaskStatus = code === '1' ? 'COMPLETED' : 'INCOMPLETE';
      const comment = rest?.trim() || undefined;
      return { ok: true, status, comment };
    }

    return { ok: false, error: `Formato no reconocido.\n${usage}` };
  }

  private extractPhoneFromText(value: string): string | undefined {
    const match = value.match(/\+?\d{6,}/);
    if (!match) return undefined;
    return this.normalizePhone(match[0]);
  }

  private normalizePhone(phone: string): string {
    return this.configService.normalizePhone(phone);
  }

  private formatPhoneToJid(phone: string): string {
    const digits = this.normalizePhone(phone);
    return `${digits}@c.us`;
  }
}
