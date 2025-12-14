import qrcode from 'qrcode-terminal';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';

import { whatsappConfig } from './whatsapp.config';

const NEXTJS_API_URL = process.env.NEXTJS_API_URL || 'http://localhost:3000';

/**
 * Extrae el teléfono del JID de WhatsApp
 */
function extractPhone(from: string): string {
  return from.replace(/\D/g, '');
}

/**
 * Maneja respuestas de trabajadores (1 = completado, 2 = incompleto)
 */
async function handleWorkerResponse(msg: Message, status: 'completada' | 'incompleta', comment?: string): Promise<void> {
  const phone = extractPhone(msg.from);

  try {
    console.log(`[WhatsApp] Respuesta del trabajador: phone=${phone} status=${status}`);

    const response = await fetch(`${NEXTJS_API_URL}/api/tasks/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        status,
        comment
      })
    });

    const data = await response.json();
    console.log(`[WhatsApp] Respuesta de API:`, JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('[WhatsApp] Error actualizando tarea:', JSON.stringify(data, null, 2));
      await msg.reply(`❌ No se pudo actualizar la tarea: ${data.error || 'Error desconocido'}`);
      return;
    }


    if (status === 'completada') {
      await msg.reply(`✅ ¡Tarea completada! Gracias por tu trabajo.`);
    } else {
      const commentText = comment ? ` Comentario guardado: "${comment}".` : '';
      await msg.reply(`❌ Tarea marcada como incompleta.${commentText}`);
    }

    console.log(`[WhatsApp] Tarea ${data.task.id} actualizada para ${data.worker.name}`);

  } catch (error) {
    console.error('[WhatsApp] Error en handleWorkerResponse:', error);
    await msg.reply('❌ Error de conexión. Intenta de nuevo más tarde.');
  }
}

/**
 * Maneja respuestas de asistencia (P = presente, A = ausente)
 */
async function handleAttendanceResponse(msg: Message, status: 'PRE' | 'AUS'): Promise<void> {
  const phone = extractPhone(msg.from);

  try {
    console.log(`[WhatsApp] Respuesta de asistencia: phone=${phone} status=${status}`);

    const response = await fetch(`${NEXTJS_API_URL}/api/workers/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, status })
    });

    const data = await response.json();
    console.log(`[WhatsApp] Respuesta de API asistencia:`, JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('[WhatsApp] Error registrando asistencia:', JSON.stringify(data, null, 2));
      await msg.reply(`❌ No se pudo registrar tu asistencia: ${data.error || 'Error desconocido'}`);
      return;
    }

    const statusText = status === 'PRE' ? 'PRESENTE ✅' : 'AUSENTE ❌';
    await msg.reply(`Asistencia registrada: ${statusText}. ¡Gracias!`);

    console.log(`[WhatsApp] Asistencia registrada: ${data.worker.name} -> ${status}`);

  } catch (error) {
    console.error('[WhatsApp] Error en handleAttendanceResponse:', error);
    await msg.reply('❌ Error de conexión. Intenta de nuevo más tarde.');
  }
}

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
    const body = msg.body?.trim();

    if (!body) return;

    // Comando de prueba
    if (body.toLowerCase() === 'ping') {
      await msg.reply('pong');
      return;
    }

    // Respuesta del trabajador: "1" = tarea completada
    if (body === '1') {
      await handleWorkerResponse(msg, 'completada');
      return;
    }

    // Respuesta del trabajador: "2" o "2 <comentario>" = tarea incompleta
    if (body.startsWith('2')) {
      const comment = body.length > 1 ? body.substring(1).trim() : undefined;
      await handleWorkerResponse(msg, 'incompleta', comment);
      return;
    }

    // Respuesta de asistencia: "P" = presente
    if (body.toUpperCase() === 'P') {
      await handleAttendanceResponse(msg, 'PRE');
      return;
    }

    // Respuesta de asistencia: "A" = ausente
    if (body.toUpperCase() === 'A') {
      await handleAttendanceResponse(msg, 'AUS');
      return;
    }
  });


  console.log('Inicializando WhatsApp client...');
  await client.initialize();

  return client;
};
