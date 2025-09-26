/**
 * Validates that all required environment variables are set.
 * Throws an error if any required environment variable is missing or empty.
 */
export function validateEnvironmentVariables(): void {
  const requiredEnvVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'SUPABASE_JWT_JWKS_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY',
    'SUPABASE_STORAGE_BUCKET_IMAGES',
    'SUPABASE_STORAGE_BUCKET_AUDIO',
    'HUME_API_KEY',
    'OPENAI_API_KEY',
    'SENTRY_DSN',
    'PORT',
  ];

  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value || value.trim() === '') {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(`Missing or empty required environment variables: ${missingVars.join(', ')}`);
  }
}
