import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private readonly supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );

  async getJwksUrl(): Promise<string> {
    const url = process.env.SUPABASE_JWT_JWKS_URL;
    if (!url) throw new Error('SUPABASE_JWT_JWKS_URL not configured');
    return url;
  }
}
