import { createServer, IncomingMessage, ServerResponse } from 'http';
import { createWhatsappClient } from './bootstrap';
import { Client } from 'whatsapp-web.js';

const WHATSAPP_HTTP_PORT = parseInt(process.env.WHATSAPP_HTTP_PORT || '3002', 10);
const WHATSAPP_TEST_PHONE = process.env.WHATSAPP_TEST_PHONE || '+5491137809999';

let client: Client | null = null;

/**
 * Normaliza el teléfono al formato requerido por WhatsApp (solo dígitos + @c.us)
 */
function formatPhoneToJid(phone: string): string {
  // Remover todo excepto dígitos
  const digits = phone.replace(/\D/g, '');
  return `${digits}@c.us`;
}

/**
 * Parsea el body de una request HTTP
 */
async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Handler para enviar mensajes de WhatsApp
 * POST /send { phone: string, message: string }
 */
async function handleSend(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await parseBody(req);
    const { phone, message } = body;

    if (!phone || !message) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'phone y message son requeridos' }));
      return;
    }

    if (!client) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Cliente de WhatsApp no inicializado' }));
      return;
    }

    const jid = formatPhoneToJid(phone);
    console.log(`[WhatsApp HTTP] Enviando mensaje a ${jid}`);

    await client.sendMessage(jid, message);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, to: jid }));
  } catch (error) {
    console.error('[WhatsApp HTTP] Error enviando mensaje:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error enviando mensaje' }));
  }
}

/**
 * Handler principal del servidor HTTP
 */
function requestHandler(req: IncomingMessage, res: ServerResponse): void {
  // CORS headers para permitir requests desde Next.js
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/send') {
    handleSend(req, res);
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', whatsappReady: !!client }));
    return;
  }

  // Test endpoint para enviar mensajes de asistencia manualmente
  if (req.method === 'POST' && req.url === '/test-attendance') {
    console.log(
      `[Test] Disparando envío de mensaje de asistencia manualmente al número de prueba ${WHATSAPP_TEST_PHONE}`,
    );
    // Solo enviamos al número de prueba para evitar spam.
    sendDailyAttendanceMessages([WHATSAPP_TEST_PHONE]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        message: `Envío de asistencia iniciado al número de prueba ${WHATSAPP_TEST_PHONE}`,
      }),
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}


/**
 * Envía mensaje de asistencia a todos los trabajadores con teléfono
 */
async function sendDailyAttendanceMessages(targetPhones?: string[]): Promise<void> {
  if (!client) {
    console.log('[Scheduler] Cliente de WhatsApp no disponible, saltando envío de asistencia');
    return;
  }

  try {
    const message = 'Buenos días! 🌅\n\nIndicar presencia marcando *P* para presente, *A* para ausente.';

    if (targetPhones?.length) {
      console.log(`[Scheduler] Enviando mensaje de asistencia a número(s) de prueba: ${targetPhones.join(', ')}`);
      for (const phone of targetPhones) {
        const jid = formatPhoneToJid(phone);
        try {
          await client.sendMessage(jid, message);
          console.log(`[Scheduler] Mensaje de prueba enviado a ${jid}`);
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`[Scheduler] Error enviando mensaje de prueba a ${jid}:`, error);
        }
      }
      console.log('[Scheduler] Envío de mensajes de prueba completado');
      return;
    }

    console.log('[Scheduler] Obteniendo trabajadores con teléfono...');

    const NEXTJS_API_URL = process.env.NEXTJS_API_URL || 'http://localhost:3000';
    const response = await fetch(`${NEXTJS_API_URL}/api/workers/attendance`);

    if (!response.ok) {
      console.error('[Scheduler] Error obteniendo trabajadores:', await response.text());
      return;
    }

    const data = await response.json();
    const workers = data.workers || [];

    console.log(`[Scheduler] Enviando mensaje de asistencia a ${workers.length} trabajadores`);

    for (const worker of workers) {
      if (!worker.phone) continue;
      const jid = formatPhoneToJid(worker.phone);
      try {
        await client.sendMessage(jid, message);
        console.log(`[Scheduler] Mensaje enviado a ${worker.full_name} (${jid})`);
        // Pequeña pausa para no sobrecargar
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[Scheduler] Error enviando a ${worker.full_name}:`, error);
      }
    }

    console.log('[Scheduler] Envío de mensajes de asistencia completado');

  } catch (error) {
    console.error('[Scheduler] Error en sendDailyAttendanceMessages:', error);
  }
}

/**
 * Inicia el scheduler para enviar mensajes de asistencia a las 7:30 AM
 */
function startAttendanceScheduler(): void {
  const ATTENDANCE_HOUR = 7;
  const ATTENDANCE_MINUTE = 30;

  let lastSentDate = '';

  console.log(`[Scheduler] Iniciado - Mensaje de asistencia programado para las ${ATTENDANCE_HOUR}:${ATTENDANCE_MINUTE.toString().padStart(2, '0')}`);

  // Verificar cada minuto
  setInterval(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const today = now.toISOString().split('T')[0];

    // Verificar si es la hora programada y no se ha enviado hoy
    if (currentHour === ATTENDANCE_HOUR && currentMinute === ATTENDANCE_MINUTE && lastSentDate !== today) {
      console.log(`[Scheduler] Es hora de enviar mensajes de asistencia (${today})`);
      lastSentDate = today;
      sendDailyAttendanceMessages();
    }
  }, 60000); // Cada minuto
}

/**
 * Inicializa el cliente de WhatsApp y el servidor HTTP
 */
async function main(): Promise<void> {
  try {
    console.log('[WhatsApp] Iniciando cliente...');
    client = await createWhatsappClient();
    console.log('[WhatsApp] Cliente listo');

    // Iniciar scheduler de asistencia
    startAttendanceScheduler();

    const server = createServer(requestHandler);
    server.listen(WHATSAPP_HTTP_PORT, () => {
      console.log(`[WhatsApp HTTP] Servidor escuchando en http://localhost:${WHATSAPP_HTTP_PORT}`);
      console.log(`[WhatsApp HTTP] POST /send { phone, message } para enviar mensajes`);
      console.log(`[WhatsApp HTTP] GET /health para verificar estado`);
    });
  } catch (error) {
    console.error('Error al iniciar el cliente de WhatsApp', error);
    process.exit(1);
  }
}

void main();
