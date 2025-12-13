import { Injectable } from '@nestjs/common';

import { whatsappConfig } from './whatsapp.config';

@Injectable()
export class WhatsappConfigService {
  readonly clientId = whatsappConfig.clientId;
  readonly dataPath = whatsappConfig.dataPath;
  private readonly adminPhones = new Set(
    whatsappConfig.adminPhones.map((p) => this.normalizePhone(p)),
  );

  isAdmin(phone: string | null | undefined): boolean {
    if (!phone) return false;
    return this.adminPhones.has(this.normalizePhone(phone));
  }

  normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }
}
