# Implementation Plan: Admin App for First Impressions & Compatibility Reports

**Branch**: `001-functional-specification-admin` | **Date**: 2025-09-20 | **Spec**: `/Users/mt/Documents/GitHub/sapour-app/specs/001-functional-specification-admin/spec.md`
**Input**: Feature specification from `/Users/mt/Documents/GitHub/sapour-app/specs/001-functional-specification-admin/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

## Summary

Build an internal admin-only web application to upload user media (images/audio), perform AI analyses, fetch Google Docs template revisions, and generate immutable personality and compatibility reports with clear provenance. Technical approach: Next.js (React) frontend with Shadcn UI and Tailwind; NestJS TypeScript backend using Prisma against Supabase Postgres and Supabase Storage; Google Docs/Drive APIs for revisioned templates; Hume.ai for voice analysis; OpenAI for image analysis and report generation; Supabase Auth allowlist; Sentry for observability; Dockerized services; comprehensive tests (Jest/RTL/Playwright) and linting/formatting gates.

## Technical Context

**Language/Version**: TypeScript 5.x; Node.js 24.x; React 19; Next.js 15 (App Router)  
**Primary Dependencies**: Next.js, React, Shadcn UI, Tailwind CSS, tRPC (BFF), NestJS, Prisma, Zod, Supabase JS, @sentry/nextjs, @sentry/node, Google APIs (docs/drive), Hume SDK, OpenAI SDK  
**Storage**: Supabase Postgres (via Prisma), Supabase Storage (images/audio)  
**Testing**: Jest + React Testing Library; Playwright for E2E; ESLint + Prettier  
**Target Platform**: Web application (frontend + backend) in Docker containers  
**Project Type**: web (frontend + backend)  
**Performance Goals**: Backend p95 <200ms for core API, p99 <1s; Frontend LCP <2.5s, CLS <0.1, INP <200ms  
**Constraints**: No job queues; admin-only; immutable reports; clear provenance; accessible UI (WCAG 2.1 AA)  
**Scale/Scope**: Small internal tool (tens of admins, thousands of users, tens of thousands of media files/reports)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Code Quality & Maintainability: Enforce ESLint, Prettier, strict TypeScript, cohesive modules, no secrets in repo. CI blocks on errors. PASS (planned gates)
- Test-Driven Development (TDD): Contract/integration/unit tests authored first; initial tests fail; ≥85% coverage target. PASS (planned gates)
- User Experience Consistency: Single design system (Shadcn + Tailwind), semantic HTML, keyboard navigation, responsive breakpoints. PASS (design + components)
- Performance Requirements: Budgets defined (API p95 <200ms; CWV targets), structured logs/metrics/tracing via Sentry. PASS (budgets + instrumentation)
- Quality Gates & CI: Lint/type/tests/perf checks configured in CI; Constitution Check referenced in PRs. PASS (to be configured)

## Project Structure

### Documentation (this feature)

```
specs/001-functional-specification-admin/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)

```
# Option 2: Web application (frontend + backend)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── app/ (Next.js App Router)
│   └── services/
└── tests/
```

**Structure Decision**: Option 2 (web) — Next.js frontend and NestJS backend

## Phase 0: Outline & Research

See `/Users/mt/Documents/GitHub/sapour-app/specs/001-functional-specification-admin/research.md` for resolved unknowns and technology selections. All NEEDS CLARIFICATION items addressed.

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

- Data model extracted to `/Users/mt/Documents/GitHub/sapour-app/specs/001-functional-specification-admin/data-model.md`
- API contracts generated at `/Users/mt/Documents/GitHub/sapour-app/specs/001-functional-specification-admin/contracts/openapi.yaml`
- Quickstart authored at `/Users/mt/Documents/GitHub/sapour-app/specs/001-functional-specification-admin/quickstart.md`
- Agent context updated via `.specify/scripts/bash/update-agent-context.sh cursor`

## Phase 2: Task Planning Approach

Tasks have been generated at `/Users/mt/Documents/GitHub/sapour-app/specs/001-functional-specification-admin/tasks.md` using the strategies outlined (TDD-first, dependency ordering, [P] for parallelizable items).

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

| Violation                                  | Why Needed                                                                                                    | Simpler Alternative Rejected Because                                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dual backend/BFF (Next.js + NestJS + tRPC) | Separate concerns: UI rendering (Next) vs API orchestration/integrations (Nest); typed client boundary (tRPC) | Single Next API routes: weaker modularity, less suitable for structured services/integrations; tRPC-only backend: loses Nest ecosystem (pipes/guards) |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---

_Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`_
