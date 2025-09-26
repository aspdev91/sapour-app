import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { LoggerModule } from '../../shared/logger.module';
import { RequestIdMiddleware } from '../../shared/request-id.middleware';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MediaModule } from '../media/media.module';
import { TemplatesModule } from '../templates/templates.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  controllers: [AppController],
  imports: [
    LoggerModule,
    SharedModule,
    AuthModule,
    UsersModule,
    MediaModule,
    TemplatesModule,
    ReportsModule,
  ],
})
export class AppModule {}
