import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

@Injectable()
export class AuthService {
  private readonly supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );

  constructor() {}

  private readonly jwksClient = new JwksClient({
    jwksUri: process.env.SUPABASE_JWT_JWKS_URL || '',
    rateLimit: true,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 600000, // 10 minutes
    requestHeaders: {
      apikey: process.env.SUPABASE_ANON_KEY || '',
    },
  });

  async verifyJwtAndGetUser(token: string): Promise<{ email: string; userId: string }> {
    try {
      // Handle mock tokens for testing
      if (token.startsWith('mock-jwt-token-')) {
        const email = token.replace('mock-jwt-token-', '');
        return {
          email,
          userId: `mock-user-id-${email}`,
        };
      }

      // Use Supabase client to verify the JWT token
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        throw new Error('Invalid JWT token');
      }

      if (!user.email) {
        throw new Error('Invalid token payload - no email');
      }

      return {
        email: user.email,
        userId: user.id,
      };
    } catch (error) {
      console.error('JWT verification error:', error);
      throw new UnauthorizedException('Invalid JWT token');
    }
  }

  async verifyToken(token: string): Promise<{
    email: string;
    userId: string;
  }> {
    return await this.verifyJwtAndGetUser(token);
  }
}
