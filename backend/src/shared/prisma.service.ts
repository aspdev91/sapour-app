import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.log(
        '⚠️ Database connection failed, skipping for debugging:',
        error instanceof Error ? error.message : String(error),
      );
      // Don't throw error to allow app to start without database
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
