export type WhatsappUserRole = 'ADMIN' | 'WORKER';

export interface WhatsappAdmin {
  phone: string; // E.164 formatted phone number
  role?: WhatsappUserRole;
}

export interface WhatsappConfig {
  clientId: string;
  dataPath?: string;
  adminPhones: string[];
  executablePath?: string;
  puppeteerArgs?: string[];
  headless?: boolean;
}

export interface ParsedTaskCommand {
  sector: string;
  fecha: string; // YYYY-MM-DD string
  peonNombre: string;
  peonPhone?: string;
  descripcion: string;
  comment?: string;
}
