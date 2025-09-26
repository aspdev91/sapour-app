import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.log(
        'Database connection failed, skipping for debugging:',
        error instanceof Error ? error.message : String(error),
      );
      // Don't throw error to allow app to start without database
    }
  }
}
