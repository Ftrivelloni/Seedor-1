import { Injectable, Logger } from '@nestjs/common';

export interface Sector {
  id: string;
  name: string;
  tenantId: string;
  campoId: string;
}

@Injectable()
export class CampoService {
  private readonly logger = new Logger(CampoService.name);

  // Fase 4/5: reemplazar por consulta real a la tabla de sectores/campos.
  async findSectorByName(
    tenantId: string,
    sectorName: string,
  ): Promise<Sector | null> {
    this.logger.log('findSectorByName invoked (stub)');
    const trimmed = sectorName.trim();
    if (!trimmed) {
      return null;
    }

    // Stub synthetic sector to keep the bot flow alive; replace with DB lookup later.
    return {
      id: `sector-${trimmed.toLowerCase().replace(/\s+/g, '-')}`,
      name: trimmed,
      tenantId,
      campoId: 'campo-placeholder',
    };
  }
}
