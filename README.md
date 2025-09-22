# Sapour Admin App

An internal admin web application for uploading user media (images/audio), performing AI analyses, fetching Google Docs template revisions, and generating immutable personality and compatibility reports with clear provenance.

## Features

- **User Management**: Create and manage user profiles with consent tracking
- **Media Upload**: Secure file uploads with signed URLs (Supabase Storage)
- **AI Analysis**: Automated analysis using Hume.ai (voice) and OpenAI Vision (images)
- **Template Management**: Google Docs integration for report templates with revision tracking
- **Report Generation**: Immutable reports with full provenance and AI-powered content
- **Admin Authentication**: Supabase Auth with allowlist-based access control
- **Modern UI**: React + Tailwind + Shadcn UI with accessibility features

## Tech Stack

- **Frontend**: React 19, Vite 5, Tailwind CSS, Shadcn UI, React Router
- **Backend**: NestJS, TypeScript, Prisma, Supabase (Postgres + Storage + Auth)
- **AI Services**: OpenAI GPT-4 Vision, Hume.ai Prosody API
- **External APIs**: Google Docs/Drive API
- **Infrastructure**: Docker, Sentry (monitoring), structured logging
- **Testing**: Jest, Playwright, accessibility checks

## Prerequisites

- Node.js 20.x or later
- pnpm package manager
- Docker Desktop
- Supabase project (Postgres + Storage + Auth)
- Google Cloud project with Docs/Drive APIs
- OpenAI API key
- Hume.ai API key
- Sentry DSNs (optional, for production)

## Quick Start

See [`specs/001-functional-specification-admin/quickstart.md`](specs/001-functional-specification-admin/quickstart.md) for detailed setup instructions.

### Development Setup

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Or run with Docker
docker compose up --build
```

Frontend: http://localhost:3000
Backend: http://localhost:3001

### Environment Variables

Copy the environment files from the quickstart guide:

- `frontend/.env.local`
- `backend/.env`

## Development

### Available Scripts

```bash
# Install dependencies
pnpm install

# Development servers
pnpm dev                    # Start both frontend and backend
pnpm --filter frontend dev  # Frontend only
pnpm --filter backend dev   # Backend only

# Testing
pnpm test                   # Run all tests
pnpm --filter backend test:contracts    # API contract tests
pnpm --filter backend test:integration  # Backend integration tests
pnpm --filter frontend test:e2e         # E2E tests

# Quality checks
pnpm lint                   # ESLint
pnpm typecheck              # TypeScript checks
pnpm build                  # Production build

# Database
pnpm --filter backend prisma:migrate    # Run migrations
pnpm --filter backend prisma:studio     # Open Prisma Studio
```

### Project Structure

```
sapour-app/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── shared/         # Shared utilities
│   │   └── main.ts
│   ├── prisma/             # Database schema
│   └── test/               # Tests
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── routes/         # Page components
│   │   ├── lib/            # Utilities and API client
│   └── tests/              # E2E tests
├── specs/                  # Feature specifications
└── docker-compose.yml      # Development environment
```

## API Documentation

### Authentication

All API endpoints require Bearer token authentication. The frontend automatically handles token management.

### Key Endpoints

- `GET /health` - Health check
- `GET /auth/allowlist` - Check admin allowlist status
- `GET/POST /users` - User management
- `POST /media/signed-url` - Create upload URLs
- `POST /media/{id}/analysis` - Trigger AI analysis
- `GET /templates/{type}/revisions` - Get template revisions
- `GET/POST /reports` - Report generation and retrieval

See [`specs/001-functional-specification-admin/contracts/openapi.yaml`](specs/001-functional-specification-admin/contracts/openapi.yaml) for complete API specification.

## Testing

### Test Coverage

- **Contract Tests**: Validate API schemas and responses
- **Integration Tests**: End-to-end service interactions
- **Unit Tests**: Individual service method testing
- **E2E Tests**: Full user journey testing with Playwright
- **Accessibility**: WCAG 2.1 AA compliance checks

### Running Tests

```bash
# All tests
pnpm test

# Specific test types
pnpm --filter backend test:contracts
pnpm --filter backend test:integration
pnpm --filter frontend test:e2e

# With coverage
pnpm test -- --coverage
```

## Deployment

### Docker Production Build

```bash
# Build for production
docker compose -f docker-compose.prod.yml up --build
```

### Environment Requirements

- All environment variables from quickstart must be configured
- Supabase project must be set up with proper permissions
- External API keys must be valid and have sufficient quotas

## Architecture Decisions

See [`specs/001-functional-specification-admin/plan.md`](specs/001-functional-specification-admin/plan.md) for technical architecture and design decisions.

## Contributing

1. Follow the established patterns in the codebase
2. Write tests for new features
3. Ensure all tests pass and linting is clean
4. Update documentation as needed

## License

Internal use only - not for public distribution.
