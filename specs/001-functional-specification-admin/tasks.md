# Phase 2 Tasks

1. Configure CI to run lint, type-check, tests, and coverage gates [P]
2. Set up repository workspace with `frontend/` and `backend/` package.json and Dockerfiles [P]
3. Backend scaffold NestJS app with modules: auth, users, media, templates, reports [P]
4. Backend configure Prisma schema for Admin, User, Media, Template, Report [P]
5. Backend implement Supabase JWT guard and allowlist check
6. Backend implement `/health` endpoint
7. Backend implement `GET /users` with pagination and sorting
8. Backend implement `POST /users` creating consented user
9. Backend implement `GET /users/{id}` including media and reports
10. Backend implement `POST /media/signed-url` for images/audio
11. Backend implement `POST /media/{id}/analysis` dispatching Hume/OpenAI with polling
12. Backend implement `GET /templates/{type}/revisions` via Google Drive/Docs
13. Backend implement `POST /reports` generation with provenance and immutability
14. Backend add Sentry instrumentation and structured logging
15. Backend add unit tests for services (users, media, templates, reports)
16. Backend add contract tests for all endpoints from OpenAPI
17. Backend add integration tests for main flows and error cases
18. Frontend scaffold Next.js (App Router) with Shadcn + Tailwind + tRPC
19. Frontend configure Supabase Auth client and allowlist gating via middleware
20. Frontend implement Dashboard navigation to Users and Experiments
21. Frontend implement Add New User form with media upload (signed URL)
22. Frontend implement Users list with infinite scroll
23. Frontend implement User Profile with media gallery, audio player, reports list
24. Frontend implement Experiments pages (First Impression, My Type, Compatibility)
25. Frontend implement Report Viewer (read-only, provenance display)
26. Frontend add loading states and duplicate submission prevention
27. Frontend add error handling and Sentry reporting
28. E2E tests with Playwright for core user stories
29. Accessibility checks for key pages (keyboard nav, semantics)
30. Performance budgets and basic perf tests (API p95, CWV)
