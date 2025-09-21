import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { ValidationPipe } from './shared/validation.pipe';
import { SentryInterceptor } from './shared/sentry.interceptor';
import { LoggerService } from './shared/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // Get LoggerService instance from the app context
  const loggerService = app.get(LoggerService);
  app.useGlobalInterceptors(new SentryInterceptor(loggerService));

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
}

bootstrap();
