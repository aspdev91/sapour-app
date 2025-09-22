import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { SupabaseJwtGuard } from './supabase-jwt.guard';

@Controller('auth')
export class AuthController {
  @UseGuards(SupabaseJwtGuard)
  @Get('me')
  me(@Request() req: any) {
    // The guard has already verified the token and set req.user
    return {
      email: req.user.email,
      userId: req.user.userId,
    };
  }
}
