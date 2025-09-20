import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard } from './supabase-jwt.guard';

@Controller('auth')
export class AuthController {
  @UseGuards(SupabaseJwtGuard)
  @Get('allowlist')
  allowlist() {
    return { email: 'placeholder@example.com', allowlisted: true };
  }
}
