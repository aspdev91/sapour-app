import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { TemplatesModule } from '../templates/templates.module';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TemplatesModule, AuthModule, MediaModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
