import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import qrcode from 'qrcode-terminal';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';

import { WhatsappBotService } from './whatsapp-bot.service';
import { WhatsappConfigService } from './whatsapp-config.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Client | null = null;
  private isReady = false;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(forwardRef(() => WhatsappBotService))
    private readonly botService: WhatsappBotService,
    private readonly configService: WhatsappConfigService,
  ) {}

  async init(): Promise<void> {
    if (this.client) {
      return;
    }

    this.isReady = false;
    this.logger.log(
      `Inicializando cliente de WhatsApp (LocalAuth, dataPath=${this.configService.dataPath ?? 'default'})`,
    );
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: this.configService.clientId,
        dataPath: this.configService.dataPath,
      }),
    });

    this.bindClientEvents(client);
    this.client = client;

    try {
      await client.initialize();
    } catch (error) {
      this.client = null;
      this.isReady = false;
      throw error;
    }
  }

  async sendText(to: string, message: string): Promise<void> {
    if (!this.client) {
      this.logger.warn('sendText llamado antes de inicializar el cliente');
      return;
    }

    if (!this.isReady) {
      // Futuro: se puede encolar o rechazar mensajes mientras reconecta.
      this.logger.warn('Cliente WhatsApp no está READY; intentando enviar de todos modos');
    }

    await this.client.sendMessage(to, message);
  }

  private bindClientEvents(client: Client): void {
    // QR para vincular la sesión en consola (más adelante se podrá exponer por HTTP o UI).
    client.on('qr', (qr) => {
      this.logger.log('QR de WhatsApp recibido; escanéalo para autenticar');
      qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
      this.isReady = true;
      this.reconnectAttempts = 0;
      this.logger.log('WhatsApp listo');
    });

    client.on('message', async (msg: Message) => {
      try {
        await this.handleIncomingMessage(msg);
      } catch (error) {
        this.logger.error(
          'Error al manejar mensaje entrante',
          (error as Error)?.stack ?? String(error),
        );
      }
    });

    client.on('auth_failure', (message) => {
      this.isReady = false;
      this.client = null;
      this.logger.error(`Fallo de autenticación en WhatsApp: ${message}`);
      this.scheduleReconnect('auth_failure');
    });

    client.on('disconnected', (reason) => {
      this.isReady = false;
      this.client = null;
      this.logger.warn(`WhatsApp desconectado: ${reason}`);
      this.scheduleReconnect('disconnected');
    });

    client.on('authenticated', () => {
      this.logger.log('Sesión de WhatsApp autenticada (recuperada desde disco)');
    });

    client.on('change_state', (state) => {
      this.logger.log(`Estado de WhatsApp cambiado a: ${state}`);
    });
  }

  // Punto de entrada para lógica de negocio entrante (fase 4/5).
  private async handleIncomingMessage(msg: Message): Promise<void> {
    const text = msg.body?.trim().toLowerCase();
    if (text === 'ping') {
      await msg.reply('pong');
      return;
    }

    const phone = this.extractPhone(msg.from);
    const isAdmin = phone ? this.configService.isAdmin(phone) : false;

    this.logger.log(
      `Mensaje entrante: from=${phone ?? 'unknown'} role=${isAdmin ? 'admin' : 'worker/other'}`,
    );

    if (isAdmin) {
      await this.botService.handleAdminMessage(msg.from, msg.body, phone ?? undefined);
      return;
    }

    await this.botService.handleWorkerMessage(msg.from, msg.body, phone ?? undefined);
  }

  private extractPhone(from: string): string | null {
    if (!from) return null;
    const digits = from.replace(/\D/g, '');
    return digits || null;
  }

  private normalizePhone(phone: string): string {
    return this.configService.normalizePhone(phone);
  }

  private scheduleReconnect(reason: string): void {
    if (this.reconnectTimer) return; // already scheduled

    const attempt = this.reconnectAttempts + 1;
    const backoffMs = Math.min(30000, 5000 * attempt); // linear-ish backoff with cap
    this.logger.warn(
      `Programando reintento de conexión (#${attempt}) en ${backoffMs}ms por ${reason}`,
    );

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      this.reconnectAttempts = attempt;
      try {
        await this.init();
        this.reconnectAttempts = 0;
        this.logger.log('Reconexión de WhatsApp exitosa');
      } catch (error) {
        this.logger.error(
          `Fallo el reintento de conexión (#${attempt})`,
          (error as Error)?.stack ?? String(error),
        );
        this.scheduleReconnect('retry_failed');
      }
    }, backoffMs);
  }
}
