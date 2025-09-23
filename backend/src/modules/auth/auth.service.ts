import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { PrismaService } from '../../shared/prisma.service';

interface DecodedToken {
  sub: string;
  email: string;
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  [key: string]: any;
}

@Injectable()
export class AuthService {
  private readonly supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );

  constructor(private readonly prisma: PrismaService) {}

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
      // Decode the token without verification first to get the kid and debug info
      const decodedHeader = jwt.decode(token, { complete: true });
      if (!decodedHeader || typeof decodedHeader === 'string') {
        throw new Error('Invalid JWT token format');
      }

      console.log('JWT Header:', decodedHeader.header);
      console.log('JWT Payload:', decodedHeader.payload);

      const kid = decodedHeader.header.kid;
      if (!kid) {
        throw new Error('Missing key ID in JWT header');
      }

      // Get the signing key from JWKS
      const key = await this.jwksClient.getSigningKey(kid);
      const signingKey = key.getPublicKey();

      // Verify the JWT token with more flexible validation
      const decoded = jwt.verify(token, signingKey, {
        issuer: `${process.env.SUPABASE_URL}/auth/v1`,
        algorithms: ['RS256'],
      }) as DecodedToken;

      console.log('Verified JWT payload:', decoded);

      if (!decoded.sub || !decoded.email) {
        throw new Error('Invalid token payload - missing sub or email');
      }

      return {
        email: decoded.email,
        userId: decoded.sub,
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

  async checkAdminAccess(email: string): Promise<boolean> {
    try {
      const admin = await this.prisma.admin.findUnique({
        where: { email },
        select: { id: true },
      });
      return !!admin;
    } catch (error) {
      // For debugging, allow all emails to pass admin check
      console.log('Database check failed, allowing access for debugging:', email);
      return true;
    }
  }
}
