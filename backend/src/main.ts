import 'reflect-metadata';
import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { ValidationPipe } from './shared/validation.pipe';
import { SentryInterceptor } from './shared/sentry.interceptor';
import { LoggerService } from './shared/logger.service';
import { validateEnvironmentVariables } from './shared/env-validation';

// Load environment variables from .env file
config();

// Validate that all required environment variables are set
validateEnvironmentVariables();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // Enable CORS with configurable origins
  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Get LoggerService instance from the app context
  const loggerService = app.get(LoggerService);
  app.useGlobalInterceptors(new SentryInterceptor(loggerService));

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
}

bootstrap();
