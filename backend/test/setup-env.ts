process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';
process.env.SUPABASE_JWT_JWKS_URL =
  process.env.SUPABASE_JWT_JWKS_URL || 'http://localhost:54321/auth/v1/jwks';

// Use SQLite for testing (integration tests need real database but simpler setup)
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
process.env.DIRECT_URL = process.env.DIRECT_URL || 'file:./test.db';

// Additional test environment variables
process.env.SUPABASE_STORAGE_BUCKET_IMAGES = process.env.SUPABASE_STORAGE_BUCKET_IMAGES || 'images';
process.env.SUPABASE_STORAGE_BUCKET_AUDIO = process.env.SUPABASE_STORAGE_BUCKET_AUDIO || 'audio';
process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 =
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 || 'test';
process.env.GOOGLE_TEMPLATES_DOC_IDS_JSON = process.env.GOOGLE_TEMPLATES_DOC_IDS_JSON || '{}';
process.env.HUME_API_KEY = process.env.HUME_API_KEY || 'test-hume-key';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key';
process.env.SENTRY_DSN = process.env.SENTRY_DSN || 'test-sentry-dsn';
process.env.PORT = process.env.PORT || '3001';
