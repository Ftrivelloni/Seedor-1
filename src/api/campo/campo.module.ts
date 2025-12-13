import { Module } from '@nestjs/common';

import { CampoService } from './campo.service';

@Module({
  providers: [CampoService],
  exports: [CampoService],
})
export class CampoModule {}
