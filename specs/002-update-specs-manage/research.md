# Research — In‑App Report Template Management and Editor

Date: 2025-09-26

## Decisions

1. Content format: Plain text; no variables
   - Rationale: Simplifies editor, validation, and rendering. Removes placeholder data coupling. Aligns with admin-only internal use.
   - Alternatives: Rich text/HTML, Markdown, JSON schema. Rejected to reduce complexity and avoid formatting engines.

2. Concurrency policy: Last write wins (no warning)
   - Rationale: Minimal implementation and acceptable risk for low editor concurrency among a small admin team.
   - Alternatives: Pessimistic locking, optimistic concurrency with merge, real-time collaboration. Rejected for complexity vs. value.

3. Size limit: ≤ 200 KB (204,800 bytes) per template
   - Rationale: Ensures responsive UX and manageable DB payloads.
   - Implications: Validation blocks publish above limit. Edge case behavior documented in spec.

4. Publish permissions: Any signed-in admin can publish
   - Rationale: Current system lacks role partitioning (per `001` spec). Keeps workflow simple.
   - Future: Role partitioning can be added if needed.

5. Provenance: Reports reference a specific Template Version
   - Rationale: Reproducibility and consistency with `001` requirement to show revision info in viewers.

6. Preview performance target: p95 < 200ms
   - Rationale: Constitution performance requirements; plain text render should be near-instant.

7. Secrets management mitigation
   - Observation: `.env` in repo contains real-looking secrets; implementation must move secrets to environment or CI secrets and rotate.

## Impacts and Alignments

- Frontend: Add Templates UI (list, editor for plain text, version list, publish/revert). Replace external revision selectors with internal Template Version selectors in experiment/report pages.
- Backend: New Templates module with CRUD, draft save, publish, list versions, revert. Generation flows default to latest published version unless specified.
- Database: Replace external document references with in-app Template/TemplateVersion tables; modify Report to reference TemplateVersion.

## Open Items (tracked but not blocking)

- Autosave cadence for drafts (default 15s suggested) — can be finalized during implementation.
- Localization — scoped out for this feature (English only), but copy externalization remains recommended.
- Import/export formats — simple TXT export/import acceptable initially.
