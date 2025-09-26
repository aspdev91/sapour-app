import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [AuthModule, SharedModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
