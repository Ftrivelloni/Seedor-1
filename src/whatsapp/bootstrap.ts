import qrcode from 'qrcode-terminal';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';

import { whatsappConfig } from './whatsapp.config';

/**
 * Ejecutar con: `npm run start:whatsapp` (muestra el QR en consola).
 * Escanea el QR con el teléfono para vincular la sesión.
 */
export const createWhatsappClient = async (): Promise<Client> => {
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: whatsappConfig.clientId,
      dataPath: whatsappConfig.dataPath,
    }),
  });

  client.on('qr', (qr) => {
    console.log('QR recibido: escanéalo en WhatsApp para autenticar');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('WhatsApp client READY');
  });

  client.on('message', async (msg: Message) => {
    if (msg.body?.trim().toLowerCase() === 'ping') {
      await msg.reply('pong');
    }
  });

  console.log('Inicializando WhatsApp client...');
  await client.initialize();

  return client;
};
