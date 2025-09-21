import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { LoggerModule } from '../../shared/logger.module';
import { RequestIdMiddleware } from '../../shared/request-id.middleware';
import { AuthModule } from '../auth/auth.module';
import { AuthController } from '../auth/auth.controller';
import { UsersController } from '../users/users.controller';
import { MediaController } from '../media/media.controller';
import { TemplatesController } from '../templates/templates.controller';
import { ReportsController } from '../reports/reports.controller';

@Module({
  controllers: [
    AppController,
    AuthController,
    UsersController,
    MediaController,
    TemplatesController,
    ReportsController,
  ],
  imports: [AuthModule],
})
export class AppModule {}
