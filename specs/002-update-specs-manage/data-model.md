# Data Model — In‑App Templates

Date: 2025-09-26

## Current (from backend/prisma/schema.prisma)

- `Template { templateType, externalDocumentId, externalDocumentUrl }`
- `Report { templateType, templateDocumentId, templateRevisionId, templateRevisionLabel }`

## Proposed Changes

Introduce in-app entities and deprecate external fields.

### New Entities

1. Template
   - id: UUID (PK)
   - templateType: TemplateType (unique)
   - name: String (human-friendly label)
   - description: String?
   - status: Enum { draft, published, archived }
   - latestPublishedVersionId: UUID? (FK → TemplateVersion)
   - tags: String[]? (Postgres text[])
   - createdAt: DateTime (default now)
   - createdByAdminId: UUID (FK → Admin)
   - updatedAt: DateTime (auto-update)

2. TemplateVersion (immutable)
   - id: UUID (PK)
   - templateId: UUID (FK → Template)
   - versionNumber: Int (1..n, unique per template)
   - content: String (plain text, ≤ 200 KB)
   - changeSummary: String?
   - createdAt: DateTime (default now)
   - createdByAdminId: UUID (FK → Admin)

### Modify Report

- Add: templateVersionId: UUID (FK → TemplateVersion)
- Remove/Deprecate: templateDocumentId, templateRevisionId, templateRevisionLabel
- Keep: reportType (aligns with TemplateType)

### Remove/Deprecate on Template

- Remove: externalDocumentId, externalDocumentUrl

## Constraints & Indexes

- Template.templateType unique (existing)
- TemplateVersion: unique (templateId, versionNumber)
- Report.templateVersionId index

## State Transitions

- Template
  - draft → published (creates TemplateVersion, updates latestPublishedVersionId)
  - published → archived (no deletion; versions preserved)

## Validation Rules

- TemplateVersion.content: non-empty, length ≤ 204,800 bytes
- Publish blocked if no changes (optional) — keep simple initially

## Migration Notes

1. Create new tables: Template (new fields), TemplateVersion
2. Backfill: For each existing Template with external refs, create Template with same templateType; optionally create an initial TemplateVersion using last known content if available; otherwise leave without versions.
3. Update Report: add templateVersionId (nullable initially), populate by mapping templateType to Template.latestPublishedVersionId; then make non-null and drop old fields.
4. Drop externalDocumentId/externalDocumentUrl from Template after migration.
