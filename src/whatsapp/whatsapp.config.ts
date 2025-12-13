import { WhatsappConfig } from './types';

const toPhoneList = (value?: string | null): string[] =>
  value
    ?.split(',')
    .map((phone) => phone.trim())
    .filter(Boolean) ?? [];

// Centralized configuration so it can later be injected or extended.
export const whatsappConfig: WhatsappConfig = {
  clientId: process.env.WHATSAPP_CLIENT_ID || 'seedor-bot',
  // Use LocalAuth dataPath to persist sessions to disk or a Docker volume.
  dataPath:
    process.env.WHATSAPP_SESSION_PATH ||
    process.env.WHATSAPP_DATA_PATH ||
    'whatsapp-sessions',
  // Example: WHATSAPP_ADMIN_PHONES="+598111111,+598222222"
  adminPhones: toPhoneList(process.env.WHATSAPP_ADMIN_PHONES),
};
