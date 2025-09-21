import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

@Injectable()
export class AuthService {
  private readonly supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );

  private readonly prisma = new PrismaClient();

  private readonly jwksClient = new JwksClient({
    jwksUri: process.env.SUPABASE_JWT_JWKS_URL || '',
    rateLimit: true,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 600000, // 10 minutes
  });

  async verifyJwtAndGetUser(token: string): Promise<{ email: string; userId: string }> {
    try {
      // Decode JWT header to get key ID
      const decodedHeader = jwt.decode(token, { complete: true });
      if (!decodedHeader || !decodedHeader.header.kid) {
        throw new Error('Invalid token header');
      }

      // Get signing key from JWKS
      const key = await this.jwksClient.getSigningKey(decodedHeader.header.kid);
      const signingKey = key.getPublicKey();

      // Verify JWT
      const decodedToken = jwt.verify(token, signingKey) as any;

      if (!decodedToken.email || !decodedToken.sub) {
        throw new Error('Invalid token payload');
      }

      return {
        email: decodedToken.email,
        userId: decodedToken.sub,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid JWT token');
    }
  }

  async checkAllowlist(email: string): Promise<{ email: string; allowlisted: boolean }> {
    try {
      const admin = await this.prisma.admin.findUnique({
        where: { email },
        select: { email: true, allowlisted: true, id: true },
      });

      if (!admin) {
        // Create admin record if it doesn't exist (but not allowlisted by default)
        const newAdmin = await this.prisma.admin.create({
          data: {
            email,
            allowlisted: false,
          },
          select: { email: true, allowlisted: true },
        });
        return newAdmin;
      }

      // Update last active timestamp
      await this.prisma.admin.update({
        where: { email },
        data: { lastActiveAt: new Date() },
      });

      return {
        email: admin.email,
        allowlisted: admin.allowlisted,
      };
        } catch (error) {
            throw new Error(`Failed to check allowlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyTokenAndCheckAllowlist(token: string): Promise<{
    email: string;
    userId: string;
    allowlisted: boolean;
  }> {
    const user = await this.verifyJwtAndGetUser(token);
    const allowlistStatus = await this.checkAllowlist(user.email);

    if (!allowlistStatus.allowlisted) {
      throw new UnauthorizedException('User not in allowlist');
    }

    return {
      email: user.email,
      userId: user.userId,
      allowlisted: allowlistStatus.allowlisted,
    };
  }
}
