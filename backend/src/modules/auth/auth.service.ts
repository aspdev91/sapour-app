import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, JWTPayload, decodeProtectedHeader, decodeJwt } from 'jose';
import { PrismaService } from '../../shared/prisma.service';

interface DecodedToken extends JWTPayload {
  sub: string;
  email?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private get projectJwks() {
    // Create fresh JWK set each time to avoid caching issues
    return createRemoteJWKSet(new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));
  }

  async verifyToken(token: string): Promise<{ email: string; userId: string }> {
    try {
      const header = decodeProtectedHeader(token);

      // Fetch and log the JWKS
      const jwksUrl = `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
      const jwksResponse = await fetch(jwksUrl);
      const jwks = await jwksResponse.json();

      const { payload } = await jwtVerify(token, this.projectJwks);
      const decoded = payload as DecodedToken;

      if (!decoded.sub) {
        throw new Error('Invalid token payload - missing sub');
      }

      return {
        email: decoded.email || '',
        userId: decoded.sub,
      };
    } catch (error) {
      console.error('JWT verification error:', error);
      throw new UnauthorizedException('Invalid JWT token');
    }
  }

  async checkAdminAccess(email: string): Promise<boolean> {
    console.log('Checking admin access for email:', email);
    const admin = await this.prisma.admin.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!admin;
  }
}
