import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { SupabaseJwtGuard } from './supabase-jwt.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(SupabaseJwtGuard)
  @Get('allowlist')
  allowlist(@Request() req: any) {
    // The guard has already verified the token and set req.user
    return {
      email: req.user.email,
      allowlisted: req.user.allowlisted,
    };
  }
}
