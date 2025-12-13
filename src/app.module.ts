import { Module } from '@nestjs/common';

import { TasksModule } from './api/tasks/tasks.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule, TasksModule],
})
export class AppModule {}
