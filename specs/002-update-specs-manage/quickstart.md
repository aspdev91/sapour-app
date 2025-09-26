# Quickstart — In‑App Templates

This guide helps an admin and a developer exercise the in‑app templates feature.

## As an Admin (UI)
1. Open Templates → New Template.
2. Enter name, pick Template Type, write plain‑text content.
3. Save draft. Reopen and edit as needed.
4. Publish with a change summary. A new immutable version is created.
5. In Experiments/Report pages, select a template; default generation uses the latest published version unless you select a specific version.

## As a Developer (Local)
1. Apply DB migration adding Template/TemplateVersion and updating Report.
2. Start backend and frontend.
3. Hit API contracts in `contracts/openapi.yaml` to create/edit/publish templates.
4. Verify report generation references `templateVersionId` on new reports.

## Validation
- Publishing blocks when content is empty or >200KB.
- Concurrent edits: last save wins; verify audit entries record both saves.
- Reports show the exact Template Version used.

## Migration Notes
- External Google Docs references are deprecated. For existing data, backfill Template and optionally an initial TemplateVersion, then update reports to reference a TemplateVersion.
