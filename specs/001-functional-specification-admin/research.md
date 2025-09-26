# Phase 0 Research: Admin App

## Resolved Unknowns & Decisions

### Frontend framework (Vite SPA vs Next.js)

- Decision: Vite 5 + React 19 (SPA) with React Router
- Rationale: Lower complexity for internal admin app, faster builds/HMR, simpler mental model; no SSR/SEO needs; fewer framework-specific pitfalls
- Alternatives: Next.js rejected (unnecessary complexity for our use case; middleware/SSR not required)

### UI system

- Decision: Shadcn UI + Tailwind CSS
- Rationale: Consistent, accessible component library with Tailwind tokens; meets constitution UX gate
- Alternatives: MUI/Chakra rejected (heavier, less alignment with Tailwind stack preference)

### API architecture (NestJS REST + Typed client)

- Decision: NestJS TypeScript backend exposing REST endpoints validated with Zod; frontend consumes via generated typed client from OpenAPI
- Rationale: Strong modular backend; typed safety at the boundary without maintaining a BFF; fewer moving parts
- Alternatives: tRPC/BFF rejected (additional layer not justified)

### Database & ORM

- Decision: Supabase Postgres via Prisma ORM
- Rationale: Managed Postgres with Prisma developer velocity; compatible with Supabase Auth and Storage
- Alternatives: Direct Supabase SQL or Drizzle rejected (team familiarity, Prisma tooling preferred)

- ### Auth strategy

- Decision: Supabase Auth (email allowlist). Frontend performs route guard via REST call to `/auth/allowlist`; Backend verifies JWT via Supabase JWKS and checks allowlist table
- Rationale: Centralized auth, minimal custom logic; constitution security hygiene
- Alternatives: Custom auth rejected

### Storage & uploads

- Decision: Supabase Storage buckets `images` and `audio`; backend issues signed URLs; client uploads directly; metadata persisted in DB
- Rationale: Offload transfer, secure via signed URLs
- Alternatives: Direct multipart upload to backend rejected (inefficient)

### Voice analysis (Hume.ai)

- Decision: Synchronous trigger after audio upload; backend submits to Hume and polls until ready with timeout; store JSON attributes
- Rationale: No job queues per constraint; polling acceptable for admin tool; UI shows processing state
- Alternatives: Webhooks/queues rejected due to constraint

### Image analysis (OpenAI vision)

- Decision: Backend invokes OpenAI vision on uploaded images; store extracted attributes JSON
- Rationale: Centralize provider usage; cache results per media
- Alternatives: Client-side rejected (security)

### Template revisions (Google Docs/Drive)

- Decision: One Google Doc per template family; use Revisions API to list revisions; store `revisionId` and human label (date/name)
- Rationale: Single-file revision history as requested; strong provenance
- Alternatives: Copy-per-revision rejected

### Report generation (OpenAI LLM)

- Decision: Backend composes prompts with available variables (image/voice/self-observed/user2) and selected `revisionId`; store full output immutable with metadata
- Rationale: Meets immutability and provenance requirements
- Alternatives: Editable reports rejected

### Error handling

- Decision: Clear actionable messages; do not persist partial reports; log structured errors with Sentry
- Rationale: Spec and constitution alignment

### Testing strategy

- Decision: Contract tests from OpenAPI, unit tests for services, integration tests for flows, Playwright E2E for key scenarios
- Rationale: TDD gate and coverage thresholds

### Observability

- Decision: Sentry for frontend and backend; structured logs, breadcrumbs; basic metrics via Sentry Performance
- Rationale: Constitution performance/observability gate

### Performance budgets

- Decision: API p95 <200ms (intra-region); frontend CWV targets as per constitution; pagination/infinite scroll for lists
- Rationale: Meets gates; admin tool scale

### No job queues constraint

- Decision: Use synchronous processing/polling patterns and idempotent endpoints; prevent duplicate submissions client-side
- Rationale: Satisfy constraint while keeping UX acceptable

## Dependencies & Best Practices Notes

- Prisma with Supabase: use connection pooling (pgBouncer) and short transactions; constrain N+1 via `include`/`select`
- tRPC BFF: co-locate routers in Next app; create typed clients; keep logic thin (delegate to Nest REST)
- Nest modules: auth guard (Supabase JWT), media module (signed URLs), analysis module (Hume/OpenAI), reports module, templates module (Google APIs)
- Google APIs: use service account with domain-wide delegation where required; cache revision list; exponential backoff on 429/5xx
- Hume/OpenAI: set timeouts, retries with jitter; redact PII in logs
