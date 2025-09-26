import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseJwtGuard } from './supabase-jwt.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseJwtGuard],
  exports: [AuthService, SupabaseJwtGuard],
})
export class AuthModule {}
