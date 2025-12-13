import { Logger, Module, OnModuleInit } from '@nestjs/common';

import { CampoModule } from '../api/campo/campo.module';
import { TasksModule } from '../api/tasks/tasks.module';
import { WorkersModule } from '../api/workers/workers.module';
import { WhatsappConfigService } from './whatsapp-config.service';
import { WhatsappBotService } from './whatsapp-bot.service';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [TasksModule, WorkersModule, CampoModule],
  providers: [WhatsappService, WhatsappBotService, WhatsappConfigService],
  exports: [WhatsappService, WhatsappBotService, WhatsappConfigService],
})
export class WhatsappModule implements OnModuleInit {
  private readonly logger = new Logger(WhatsappModule.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.whatsappService.init();
    } catch (error) {
      // No bloqueamos el resto de módulos: solo registramos el fallo.
      this.logger.error(
        'No se pudo inicializar WhatsApp en el arranque',
        (error as Error)?.stack ?? String(error),
      );
    }
  }
}
