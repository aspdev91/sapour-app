# Tasks: Admin App for First Impressions & Compatibility Reports

Feature directory: `/Users/mt/Documents/GitHub/sapour-app/specs/001-functional-specification-admin`

Legend: `[P]` means can be executed in parallel when dependencies are met. Tasks that touch the same file must run sequentially (no `[P]`).

## T000. Monorepo workspace and CI scaffolding [X]

- Create monorepo root files:
  - `/Users/mt/Documents/GitHub/sapour-app/package.json` (workspaces, scripts: lint, typecheck, test, build)
  - `/Users/mt/Documents/GitHub/sapour-app/pnpm-workspace.yaml`
  - `/Users/mt/Documents/GitHub/sapour-app/.editorconfig`, `.gitignore`, `.dockerignore`, `.nvmrc`, `.npmrc`
  - ESLint/Prettier configs at repo root shared by packages
  - `/Users/mt/Documents/GitHub/sapour-app/docker-compose.yml` (frontend 3000, backend 3001, network)
- Add CI (GitHub Actions) to run lint, type-check, unit/e2e tests, coverage, and block on failures: `.github/workflows/ci.yml`.
- Commands:
  - `pnpm -w install`
  - `pnpm -w lint && pnpm -w typecheck && pnpm -w test`
- Dependencies: none

## T001. Backend scaffold: NestJS application [X]

- Create backend workspace:
  - `/Users/mt/Documents/GitHub/sapour-app/backend/package.json` (NestJS, Prisma, Zod, Sentry, Supabase, Google, OpenAI, Hume deps)
  - `/Users/mt/Documents/GitHub/sapour-app/backend/Dockerfile`
  - `/Users/mt/Documents/GitHub/sapour-app/backend/src/` with modules: `auth`, `users`, `media`, `templates`, `reports`, and `app` (health)
  - `/Users/mt/Documents/GitHub/sapour-app/backend/prisma/schema.prisma`
  - `/Users/mt/Documents/GitHub/sapour-app/backend/test/` with Jest config
- Wire up Nest main bootstrap, global validation (Zod), and Sentry interceptor.
- Commands: `pnpm --filter backend dev`, `pnpm --filter backend test`
- Dependencies: T000

## T002. Frontend scaffold: Next.js 15 (App Router)

- Create frontend workspace:
  - `/Users/mt/Documents/GitHub/sapour-app/frontend/package.json` (Next.js 15, React 19, Tailwind, Shadcn, tRPC, Sentry)
  - `/Users/mt/Documents/GitHub/sapour-app/frontend/Dockerfile`
  - `/Users/mt/Documents/GitHub/sapour-app/frontend/tailwind.config.ts`, `postcss.config.js`, `src/app/layout.tsx`, `src/app/page.tsx`
  - Configure Shadcn UI and Tailwind tokens
  - Add tRPC BFF in Next app that proxies to backend
- Add middleware to enforce Supabase Auth allowlist.
- Dependencies: T000

## T003. Environment and secrets wiring

- Create env files per quickstart:
  - `/Users/mt/Documents/GitHub/sapour-app/frontend/.env.local`
  - `/Users/mt/Documents/GitHub/sapour-app/backend/.env`
- Ensure variables from `quickstart.md` are declared and read where needed.
- Dependencies: T001, T002

---

## Test tasks (author before implementation)

## T010. Contract tests from OpenAPI [P]

- Source contracts: `/Users/mt/Documents/GitHub/sapour-app/specs/001-functional-specification-admin/contracts/openapi.yaml`
- Generate one test file per path under `/Users/mt/Documents/GitHub/sapour-app/backend/test/contracts/` validating:
  - Request/response schemas, required fields, status codes per operation
  - Security (bearerAuth) where applicable
- Provide test runner command in repo scripts: `pnpm --filter backend test:contracts`
- Dependencies: T001

## T011. Integration test: allowlisted admin can sign in [P]

- Add Playwright test at `/Users/mt/Documents/GitHub/sapour-app/frontend/tests/e2e/auth-allowlist.spec.ts` covering sign-in and allowlist gating.
- Mock Supabase Auth in CI.
- Dependencies: T002

## T012. Integration test: create user and upload media [P]

- Add Playwright + backend integration test covering user creation and signed URL upload path.
- Files:
  - `/Users/mt/Documents/GitHub/sapour-app/frontend/tests/e2e/create-user-upload-media.spec.ts`
  - `/Users/mt/Documents/GitHub/sapour-app/backend/test/integration/media-upload.spec.ts`
- Dependencies: T001, T002

## T013. Integration test: trigger analysis for audio/image [P]

- Backend integration test for `/media/{mediaId}/analysis` with provider-specific behavior (Hume/OpenAI) using mocks.
- File: `/Users/mt/Documents/GitHub/sapour-app/backend/test/integration/media-analysis.spec.ts`
- Dependencies: T001

## T014. Integration test: list template revisions and select [P]

- Backend integration test for `/templates/{templateType}/revisions` with Google APIs mocked.
- File: `/Users/mt/Documents/GitHub/sapour-app/backend/test/integration/templates-revisions.spec.ts`
- Dependencies: T001

## T015. Integration test: generate and view immutable report [P]

- Backend test for `/reports` and `/reports/{reportId}` + frontend E2E for read-only viewer with provenance.
- Files:
  - `/Users/mt/Documents/GitHub/sapour-app/backend/test/integration/reports-generate.spec.ts`
  - `/Users/mt/Documents/GitHub/sapour-app/frontend/tests/e2e/report-viewer.spec.ts`
- Dependencies: T001, T002

---

## Core tasks: data models (Prisma) — sequential (same file)

All tasks below modify: `/Users/mt/Documents/GitHub/sapour-app/backend/prisma/schema.prisma` (run `pnpm --filter backend prisma:migrate` after each).

## T020. Define Prisma model: Admin

- Add `Admin` model with fields from `data-model.md` (id, email unique, allowlisted, timestamps).
- Generate migration and apply to local DB.
- Dependencies: T001

## T021. Define Prisma model: User

- Add `User` model with fields and FK to `Admin` for `createdByAdminId`.
- Index `(createdAt desc)`.
- Dependencies: T020

## T022. Define Prisma model: Media

- Add `Media` model with enums `type`, `status`; FK to `User`.
- Index `(userId, createdAt desc)`.
- Dependencies: T021

## T023. Define Prisma model: Template

- Add `Template` with unique `templateType` enum and external document identifiers.
- Dependencies: T022

## T024. Define Prisma model: Report

- Add `Report` with immutable constraint (no updates), enums, FKs to `User`.
- Index `(primaryUserId, createdAt desc)`.
- Dependencies: T023

---

## Core tasks: backend services (can be parallel across different modules)

## T030. Auth service and Supabase JWT guard

- Files:
  - `/Users/mt/Documents/GitHub/sapour-app/backend/src/auth/auth.module.ts`
  - `/Users/mt/Documents/GitHub/sapour-app/backend/src/auth/auth.service.ts`
  - `/Users/mt/Documents/GitHub/sapour-app/backend/src/auth/supabase-jwt.guard.ts`
- Implement JWKS verification and allowlist check against `Admin` table.
- Dependencies: T020

## T031. Users service [P]

- `/Users/mt/Documents/GitHub/sapour-app/backend/src/users/users.service.ts`
- Implement list (paginated, newest first), create (consent true), get by id (include media, reports).
- Dependencies: T021

## T032. Media service [P]

- `/Users/mt/Documents/GitHub/sapour-app/backend/src/media/media.service.ts`
- Implement signed upload URL generation (Supabase Storage) and analysis trigger orchestration (Hume/OpenAI) with polling.
- Dependencies: T022

## T033. Templates service [P]

- `/Users/mt/Documents/GitHub/sapour-app/backend/src/templates/templates.service.ts`
- Implement Google Docs/Drive revisions listing with caching and backoff.
- Dependencies: T023

## T034. Reports service [P]

- `/Users/mt/Documents/GitHub/sapour-app/backend/src/reports/reports.service.ts`
- Compose prompts, call OpenAI, persist immutable report with provenance.
- Dependencies: T024

---

## Core tasks: backend endpoints (parallel across modules, sequential within module files)

## T040. Health endpoint

- `/Users/mt/Documents/GitHub/sapour-app/backend/src/app/app.controller.ts` GET `/health` returning 200.
- Dependencies: T001

## T041. Auth allowlist endpoint

- `/Users/mt/Documents/GitHub/sapour-app/backend/src/auth/auth.controller.ts` GET `/auth/allowlist` using guard and service.
- Dependencies: T030

## T042. Users endpoints (same controller file — sequential)

- `/Users/mt/Documents/GitHub/sapour-app/backend/src/users/users.controller.ts`
- Implement:
  - GET `/users` (cursor, limit) — depends T031
  - POST `/users` — depends T031
  - GET `/users/{userId}` — depends T031
- Dependencies: T031

## T043. Media endpoints (same controller file — sequential)

- `/Users/mt/Documents/GitHub/sapour-app/backend/src/media/media.controller.ts`
- Implement:
  - POST `/media/signed-url` — depends T032
  - POST `/media/{mediaId}/analysis` — depends T032
- Dependencies: T032

## T044. Templates endpoints

- `/Users/mt/Documents/GitHub/sapour-app/backend/src/templates/templates.controller.ts`
- Implement GET `/templates/{templateType}/revisions` — depends T033
- Dependencies: T033

## T045. Reports endpoints (same controller file — sequential)

- `/Users/mt/Documents/GitHub/sapour-app/backend/src/reports/reports.controller.ts`
- Implement:
  - POST `/reports` — depends T034
  - GET `/reports/{reportId}` — depends T034
- Dependencies: T034

---

## Integration tasks (cross-cutting)

## T050. Sentry instrumentation (backend and frontend) [P]

- Backend: `@sentry/node` setup, performance tracing, error interceptor.
- Frontend: `@sentry/nextjs` setup.
- Dependencies: T001, T002

## T051. Structured logging and request ids (backend) [P]

- Add a logger module with request id middleware; log key events.
- Dependencies: T001

## T052. tRPC BFF in Next.js [P]

- Add `/Users/mt/Documents/GitHub/sapour-app/frontend/src/server/trpc/` with routers calling backend REST.
- Generate typed clients consumed by frontend pages/components.
- Dependencies: T002, T041–T045

---

## Frontend core (App Router)

## T060. App shell and navigation

- Files under `/Users/mt/Documents/GitHub/sapour-app/frontend/src/app/` with Shadcn UI layout and nav to Users and Experiments.
- Dependencies: T002

## T061. Users list with infinite scroll

- Page: `/Users/mt/Documents/GitHub/sapour-app/frontend/src/app/users/page.tsx`
- Calls tRPC → backend GET `/users`.
- Dependencies: T052

## T062. Add New User with media upload

- Page: `/Users/mt/Documents/GitHub/sapour-app/frontend/src/app/users/new/page.tsx`
- Uses signed URL flow for image/audio upload.
- Dependencies: T052

## T063. User profile (media gallery, audio player, reports list)

- Page: `/Users/mt/Documents/GitHub/sapour-app/frontend/src/app/users/[userId]/page.tsx`
- Dependencies: T052

## T064. Experiments pages (First Impression, My Type, Compatibility)

- Pages under `/Users/mt/Documents/GitHub/sapour-app/frontend/src/app/experiments/`
- Allow selecting template revision and generating report.
- Dependencies: T052

## T065. Report viewer (read-only with provenance)

- Page: `/Users/mt/Documents/GitHub/sapour-app/frontend/src/app/reports/[reportId]/page.tsx`
- Dependencies: T052

---

## Polish tasks

## T070. Backend unit tests for services [P]

- Add Jest unit tests under `/Users/mt/Documents/GitHub/sapour-app/backend/test/unit/` for users, media, templates, reports services.
- Dependencies: T031–T034

## T071. Accessibility checks (key pages) [P]

- Use `@axe-core/playwright` for keyboard nav and semantics on core pages.
- Dependencies: T060–T065

## T072. Performance budgets and checks [P]

- Backend p95 <200ms for core API (add simple perf tests).
- Frontend CWV budgets (LCP, CLS, INP) and Playwright traces.
- Dependencies: T041–T045, T060–T065

## T073. Documentation updates [P]

- Update README with run/test instructions and env docs.
- Link to `quickstart.md` and endpoints.
- Dependencies: All core complete

---

## Parallel execution examples

When dependencies are satisfied, you can run these groups in parallel:

- Group A [P]: T011, T012, T013, T014, T015 (integration/E2E tests)
- Group B [P]: T031, T032, T033, T034 (backend services by module)
- Group C [P]: T044, T050, T051, T052 (templates endpoint, instrumentation, logging, tRPC)
- Group D [P]: T061, T062, T064, T065 (frontend pages)

Example commands:

```bash
# Install and run tests
pnpm -w install
pnpm --filter backend test:contracts & pnpm --filter backend test:integration & pnpm --filter frontend test:e2e & wait

# Run dev services in Docker
docker compose up --build
```

---

Notes:

- Contracts: 1 file detected → 1 contract test task (T010).
- Entities: Admin, User, Media, Template, Report → one Prisma task each (T020–T024) executed sequentially (single schema file).
- Endpoints: Implement each path from OpenAPI as a distinct controller method; tasks grouped per module with sequential note where sharing a file.
