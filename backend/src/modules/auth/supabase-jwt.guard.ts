import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoggerService } from '../../shared/logger.service';

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'];

    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = auth.slice('Bearer '.length);

    console.log('token', token);

    try {
      // Verify JWT token
      const user = await this.authService.verifyToken(token);

      // Add user info to request for use in controllers
      req.user = user;

      // Update logging context with user info
      LoggerService.setContext({
        userId: user.userId,
        userEmail: user.email,
      });

      return true;
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Authentication failed',
      );
    }
  }
}
