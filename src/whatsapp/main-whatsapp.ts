import { createServer, IncomingMessage, ServerResponse } from 'http';
import { createWhatsappClient } from './bootstrap';
import { Client } from 'whatsapp-web.js';

const WHATSAPP_HTTP_PORT = parseInt(process.env.WHATSAPP_HTTP_PORT || '3002', 10);

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

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

/**
 * Inicializa el cliente de WhatsApp y el servidor HTTP
 */
async function main(): Promise<void> {
  try {
    console.log('[WhatsApp] Iniciando cliente...');
    client = await createWhatsappClient();
    console.log('[WhatsApp] Cliente listo');

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
