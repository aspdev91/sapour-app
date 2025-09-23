import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
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

  // Debug endpoint - remove in production
  @Post('debug-token')
  async debugToken(@Request() req: any) {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      return { error: 'Missing bearer token' };
    }

    const token = auth.slice('Bearer '.length);

    try {
      const decoded = jwt.decode(token, { complete: true });
      return {
        header: decoded?.header,
        payload: decoded?.payload,
        validFormat: true,
      };
    } catch (error) {
      return {
        error: 'Failed to decode token',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
