import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseJwtGuard } from './supabase-jwt.guard';

@Module({
  providers: [AuthService, SupabaseJwtGuard],
  exports: [AuthService, SupabaseJwtGuard],
})
export class AuthModule {}
