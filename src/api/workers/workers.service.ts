import { Injectable, Logger } from '@nestjs/common';

export interface Worker {
  id: string;
  tenantId: string;
  fullName: string;
  phone?: string | null;
}

@Injectable()
export class WorkersService {
  private readonly logger = new Logger(WorkersService.name);

  // Fase 4/5: reemplazar con consulta real a BD/Supabase.
  async findByNameOrPhone(
    name?: string,
    phone?: string,
  ): Promise<Worker | null> {
    this.logger.log('findByNameOrPhone invoked (stub)');
    if (!name && !phone) {
      return null;
    }

    const normalizedPhone = phone ? this.normalizePhone(phone) : undefined;
    // Stub: create a synthetic worker to keep the flow functional until data access is wired.
    const idSource = normalizedPhone || name || 'worker';

    return {
      id: `worker-${idSource}`,
      tenantId: 'tenant-placeholder',
      fullName: name || 'Peón sin nombre',
      phone: normalizedPhone ? `+${normalizedPhone}` : null,
    };
  }

  async findByPhone(phone: string): Promise<Worker | null> {
    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) return null;
    return this.findByNameOrPhone(undefined, normalizedPhone);
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }
}
