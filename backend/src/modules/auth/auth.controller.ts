import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { decodeJwt } from 'jose';
import { SupabaseJwtGuard } from './supabase-jwt.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(SupabaseJwtGuard)
  @Get('me')
  async me(@Request() req: any) {
    // The guard has already verified the token and set req.user
    const hasAccess = await this.authService.checkAdminAccess(req.user.email);
    return {
      email: req.user.email,
      userId: req.user.userId,
      hasAccess,
    };
  }

  @UseGuards(SupabaseJwtGuard)
  @Get('allowlist')
  async allowlist(@Request() req: any) {
    // The guard has already verified the token and set req.user
    const hasAccess = await this.authService.checkAdminAccess(req.user.email);
    return {
      allowlisted: hasAccess,
    };
  }
}
