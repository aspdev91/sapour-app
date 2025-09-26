# Tasks: In‑App Report Template Management and Editor

**Input**: Design documents from `/specs/002-update-specs-manage/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md and confirm decisions (plain text, 200KB limit, last-write-wins, any admin publish)
2. Load data-model.md → extract entities/fields/relationships
3. Load contracts/openapi.yaml → list endpoints
4. Load research.md and quickstart.md → scenarios for tests
5. Generate tasks in TDD order with dependencies
6. Validate coverage (contracts, entities, user stories)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup
- [ ] T001 Verify feature branch `002-update-specs-manage` is checked out and sync plan artifacts
  - Paths: `/specs/002-update-specs-manage/*`
- [ ] T002 Backend: Create new module scaffolding for templates (if missing) under `backend/src/modules/templates/`
  - Files:
    - `backend/src/modules/templates/templates.module.ts`
    - `backend/src/modules/templates/templates.controller.ts`
    - `backend/src/modules/templates/templates.service.ts`
    - `backend/src/modules/templates/dto/*.ts`
- [ ] T003 Ensure test harness ready (backend)
  - Confirm `backend/test/setup-env.ts` and Jest config support new contract/integration tests
- [ ] T004 [P] Frontend: Create route folder `frontend/src/routes/templates/` (list, editor, versions)
  - Files:
    - `frontend/src/routes/templates/TemplatesList.tsx`
    - `frontend/src/routes/templates/TemplateEditor.tsx`
    - `frontend/src/routes/templates/TemplateVersions.tsx`

## Phase 3.2: Tests First (TDD) — MUST FAIL before implementation
Contract tests (one per endpoint group, including reports generation parameterization) derived from `/specs/002-update-specs-manage/contracts/openapi.yaml`

- [ ] T010 [P] Contract tests: Templates list/create/get/update/archive
  - File: `backend/test/contracts/templates.contract.spec.ts`
  - Endpoints: `GET /api/templates`, `POST /api/templates`, `GET /api/templates/{id}`, `PATCH /api/templates/{id}`, `DELETE /api/templates/{id}`
- [ ] T011 [P] Contract tests: Publish + Versions list + Revert
  - File: `backend/test/contracts/template-versions.contract.spec.ts`
  - Endpoints: `POST /api/templates/{id}/publish`, `GET /api/templates/{id}/versions`, `POST /api/templates/{id}/versions/{versionNumber}/revert`
- [ ] T012 [P] Contract tests: Resolve default template version for TemplateType
  - File: `backend/test/contracts/default-template-version.contract.spec.ts`
  - Endpoint: `GET /api/report-generation/default-template-version?templateType=...`
  - Also validate the Reports generation contract accepts an optional `templateVersionId` (or version number) to force using a specific TemplateVersion and that provenance is returned in the response

Integration tests (user scenarios from spec and quickstart)
- [ ] T013 [P] Integration test: Create draft → edit → publish → verify version history
  - File: `backend/test/integration/templates.publish.flow.spec.ts`
- [ ] T014 [P] Integration test: Report generation uses latest published version by default, and uses selected TemplateVersion when provided
  - File: `backend/test/integration/reports.generation.version-selection.spec.ts`
- [ ] T015 [P] Integration test: Revert to previous published version updates default for future generations
  - File: `backend/test/integration/templates.revert.flow.spec.ts`
- [ ] T016 [P] Integration test: Publish validation blocks empty or >200KB content
  - File: `backend/test/integration/templates.validation.spec.ts`

Frontend E2E (Playwright)
- [ ] T017 [P] E2E: Admin creates draft, publishes, sees version in list
  - File: `tests/e2e/templates-flow.spec.ts`
- [ ] T018 [P] E2E: Experiments page allows selecting a Template Version for the report type and generates using the selected version (defaults to latest if none selected)
  - File: `tests/e2e/experiments-internal-templates-version-select.spec.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
Database (Prisma)
- [ ] T020 Update Prisma schema for in‑app templates per data-model
  - File: `backend/prisma/schema.prisma`
  - Add models: `Template` (expanded fields), `TemplateVersion`; modify `Report` to add `templateVersionId` and deprecate old fields
- [ ] T021 Generate migration and Prisma client
  - Commands executed by agent; migration files in `backend/prisma/migrations/*`
- [ ] T022 Data migration step: backfill initial Template/TemplateVersion and map reports to `templateVersionId`
  - File: `backend/prisma/migrations/*` or a one-off script `backend/scripts/migrate-templates.ts`

Backend (NestJS)
- [ ] T030 DTOs and validation for Templates
  - Files: `backend/src/modules/templates/dto/create-template.dto.ts`, `update-template.dto.ts`, `publish-template.dto.ts`
  - Enforce plain text, ≤200KB
- [ ] T031 TemplatesService: draft CRUD, publish (create TemplateVersion), list versions, revert
  - File: `backend/src/modules/templates/templates.service.ts`
- [ ] T032 TemplatesController: wire endpoints to service
  - File: `backend/src/modules/templates/templates.controller.ts`
- [ ] T033 AuthZ: Protect all templates endpoints for signed‑in admins only
  - File: `backend/src/modules/templates/templates.controller.ts` (guards) and/or shared auth module
- [ ] T034 Reports integration: use internal TemplateVersion
  - File: `backend/src/modules/reports/reports.service.ts`
  - Accept optional `templateVersionId` (or `versionNumber`) from the generate request to override the default; default to `Template.latestPublishedVersionId` when not specified; persist `report.templateVersionId`
  - Update request/response DTOs and controller to surface the optional selection parameter and to include provenance of the used TemplateVersion in responses
- [ ] T035 Remove usages of external document fields; adapt any code accessing `templateDocumentId`, `templateRevisionId`, `templateRevisionLabel`
  - Search and update across `backend/src/modules/**`
- [ ] T036 Structured audit logging on publish/revert
  - File: `backend/src/modules/templates/templates.service.ts` using `shared/logger.service.ts`

Frontend (React)
- [ ] T040 API client additions for Templates endpoints
  - File: `frontend/src/lib/api-client.ts`
  - Methods: list/create/get/update/archive, publish, listVersions, revert, resolveDefaultVersion
  - Report generation client should accept an optional `templateVersionId` parameter and pass it through to the backend
- [ ] T041 TemplatesList page (list + create + archive)
  - File: `frontend/src/routes/templates/TemplatesList.tsx`
- [ ] T042 TemplateEditor page (plain text editor, save draft, publish with summary)
  - File: `frontend/src/routes/templates/TemplateEditor.tsx`
- [ ] T043 TemplateVersions view (list versions, revert)
  - File: `frontend/src/routes/templates/TemplateVersions.tsx`
- [ ] T044 Experiments pages: add Template Version selector for the report type and pass selection through
  - Files: `frontend/src/routes/experiments/*` (show dropdown of published TemplateVersions for the selected Template type, default to latest; update generation calls to include optional `templateVersionId`)
- [ ] T045 Report Viewer: display Template Version (id/versionNumber/createdAt) instead of external label
  - File: `frontend/src/routes/reports/*` (or existing viewer component)

## Phase 3.4: Integration & Gates
- [ ] T050 Backend performance: ensure p95 <200ms for CRUD/publish; add lightweight timing logs
  - Files: `backend/src/modules/templates/*.ts`
- [ ] T051 Security: ensure endpoints require auth; add tests for unauthorized access
  - Files: `backend/test/contracts/*.spec.ts`
- [ ] T052 Observability: add structured logs for create/edit/publish/revert and report generation default-version resolution
  - Files: `backend/src/modules/templates/templates.service.ts`, `backend/src/modules/reports/reports.service.ts`
- [ ] T053 Secrets hygiene: remove any real secrets from repo; switch to local env vars and CI secrets; rotate keys out-of-band
  - Files: `.env` references in docs; ensure backend reads from process.env only

## Phase 3.5: Polish
- [ ] T060 [P] Autosave drafts (e.g., 15s) in editor
  - File: `frontend/src/routes/templates/TemplateEditor.tsx`
- [ ] T061 [P] Export/Import plain text (TXT)
  - Files: `frontend/src/routes/templates/TemplateEditor.tsx` (+ server endpoint optional if needed)
- [ ] T062 [P] Unit tests for TemplatesService edge cases
  - File: `backend/test/unit/templates.service.spec.ts`
- [ ] T063 [P] Performance test for preview latency (<200ms) and publish path
  - Files: `backend/test/integration/templates.performance.spec.ts`
- [ ] T064 Docs: Update admin quickstart and README sections
  - Files: `/specs/002-update-specs-manage/quickstart.md`, `README.md`

## Dependencies
- T010–T018 (tests) MUST run and fail before T020+ (implementation)
- Prisma schema (T020) → migration (T021) → data migration (T022) → backend service/controller (T031–T032)
- Reports integration (T034) depends on Prisma changes and Templates service
- Frontend pages (T041–T045) depend on backend endpoints (T032)
- Polish tasks (T060+) run after core passes tests

## Parallel Execution Examples
```
# Run all contract tests in parallel ([P] different files):
Task: "T010 Contract tests templates.contract.spec.ts"
Task: "T011 Contract tests template-versions.contract.spec.ts"
Task: "T012 Contract tests default-template-version.contract.spec.ts"

# Run integration tests in parallel ([P] different files):
Task: "T013 Integration publish flow"
Task: "T014 Integration default vs selected version in generation"
Task: "T015 Integration revert flow"
Task: "T016 Integration validation"

# Frontend feature work that can start in parallel after contracts are set:
Task: "T040 API client additions"
Task: "T041 TemplatesList page"
Task: "T042 TemplateEditor page"
Task: "T043 TemplateVersions view"
```

## Validation Checklist
- [ ] All contracts have corresponding tests (T010–T012)
- [ ] All entities have model tasks (Template, TemplateVersion, Report update in T020–T022)
- [ ] Tests precede implementation (T010–T018 before T020+)
- [ ] Parallel tasks use different files
- [ ] Each task specifies exact file path(s)
- [ ] External document fields removed from code paths
- [ ] Report generation stores `templateVersionId`
 - [ ] User can select a specific TemplateVersion for a report type; selection is honored in contract, integration, and E2E tests; UI defaults to latest when none selected

---
Based on Constitution v1.0.0 and plan for `002-update-specs-manage`. Aligns with `001-functional-specification-admin` flows.