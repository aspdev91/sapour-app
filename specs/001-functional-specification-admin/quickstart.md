# Quickstart: Sapour Admin App

## Prerequisites

- Node.js 20.x, pnpm or npm
- Docker Desktop
- Supabase project (Postgres + Storage + Auth)
- Google Cloud project with Docs/Drive APIs enabled and service account
- Hume.ai API key
- OpenAI API key
- Sentry DSNs (frontend/backend)

## Environment

Create `.env` files:

Frontend (`frontend/.env`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SENTRY_DSN=...
VITE_BACKEND_BASE_URL=http://localhost:3001
```

Backend (`backend/.env`):

```
DATABASE_URL=postgresql://user:pass@host:5432/db
SUPABASE_JWT_JWKS_URL=https://<project>.supabase.co/auth/v1/certs
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET_IMAGES=images
SUPABASE_STORAGE_BUCKET_AUDIO=audio
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=...
GOOGLE_TEMPLATES_DOC_IDS_JSON={"first_impression":"<docId>","my_type":"<docId>","romance_compatibility":"<docId>","friendship_compatibility":"<docId>"}
HUME_API_KEY=...
OPENAI_API_KEY=...
SENTRY_DSN=...
PORT=3001
```

## Run with Docker

```
docker compose up --build
```

Frontend: http://localhost:3000 Backend: http://localhost:3001

## Development

```
pnpm -w install
pnpm --filter frontend dev & pnpm --filter backend dev & wait
```

## Generate & Validate

1. Sign in with allowlisted email
2. Create a user and upload media
3. Trigger analysis for audio (Hume) or rely on automatic image analysis
4. Select a template revision and generate a report
5. View the immutable report with provenance

## Testing

```
pnpm -w test
pnpm -w test:e2e
```
