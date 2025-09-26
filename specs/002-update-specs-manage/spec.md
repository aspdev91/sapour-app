# Feature Specification: In‑App Report Template Management and Editor

**Feature Branch**: `[002-update-specs-manage]`  
**Created**: 2025-09-26  
**Status**: Draft  
**Input**: User description: "Update specs: manage report templates within app instead of Google Docs; provide in-app template editor for revisions; reports generated using saved templates"

## Execution Flow (main)

```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## Clarifications

### Session 2025-09-26

- Q: What is the canonical template content format in-app? → A: Plain text; no inline variables
- Q: How should concurrent edits to a draft template be handled? → A: Last write wins (no warning)
- Q: What’s the placeholder syntax for inline variables? → A: Not applicable (no variables)
- Q: What are the publish-time validation size limits? → A: Max 200 KB per template
- Q: Who can publish templates? → A: Any signed-in admin can publish

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

As an authorized team member, I can create and maintain report templates entirely within the app (no Google Docs), revise them through an in‑app editor, publish versions, and generate reports that always reference a specific published template version to ensure consistency and reproducibility.

### Acceptance Scenarios

1. Given I have permission to manage templates, When I create a new template with a name and initial content, Then the template is saved as a draft and visible in the templates list.
2. Given a draft template, When I edit content and save, Then my changes are persisted and version history remains in draft state.
3. Given a draft template ready for release, When I publish it with a change summary, Then a new immutable template version is created and marked as the latest published version.
4. Given at least one published template version, When a user generates a report without specifying a version, Then the report is generated using the latest published template version and the report stores a reference to that version.
5. Given multiple published versions exist, When I choose a specific version during report generation, Then the system generates using that selected version and records that selection on the report.
6. Given a published template has issues, When I revert to a previous published version, Then that prior version becomes the latest published version, and future reports default to it unless a version is explicitly chosen.
7. Given I lack edit/publish permissions, When I attempt to edit or publish a template, Then the system prevents the action and displays a clear permission error.
8. Given a template has empty content or exceeds the 200 KB limit, When I attempt to publish, Then the system blocks publishing and shows validation errors describing the issue.

### Edge Cases

- Generating a report when no published version exists: system must block and prompt to publish or select an older published version if available.
- Concurrent editing by two users: last write wins; newest save overwrites prior without warning. Audit trail records both saves.
- Very large templates (approaching 200 KB): system remains responsive within reasonable UI performance targets [NEEDS CLARIFICATION: preview latency], and publishing is blocked above 200 KB.
- Deleting/archiving templates referenced by existing reports: disallow hard delete; only allow archive with clear warnings; historical reports remain viewable.
- Attempting to publish with unsaved draft edits: prompt to save changes before publishing.
- Multi‑locale templates: support or explicitly defer [NEEDS CLARIFICATION: localization requirements].
- Migration from previous Google Docs‑based workflow: existing reports remain accessible and future templates are created in‑app only [NEEDS CLARIFICATION: need for import of legacy docs].

## Requirements _(mandatory)_

### Functional Requirements

- FR-001: System MUST allow authorized users to create new report templates with a name, description, and editable content body.
- FR-002: System MUST provide an in‑app editor to revise template content as plain text (no variables, no rich text), without requiring external tools.
- FR-003: System MUST support a draft state for templates; edits to drafts MUST be saved without affecting any published versions.
- FR-004: System MUST support publishing a template, creating an immutable Template Version with a version number and change summary.
- FR-005: System MUST maintain a full version history for each template and allow viewing, comparing, and reverting to prior published versions.
- FR-006: System MUST validate templates before publishing (e.g., non‑empty content, size ≤ 200 KB/204,800 bytes, allowed characters/patterns) and block publish on validation failure with actionable errors.
- FR-007: System MUST enable generating reports using templates: by default the latest published version, or a specific version if explicitly selected.
- FR-008: Each generated report MUST store a reference to the exact Template Version used so it can be reproduced later.
- FR-009: System MUST provide a preview of the template content exactly as it will appear (plain text) prior to publishing.
- FR-010: System MUST enforce permissions such that any signed-in admin can view, create, edit, publish, revert, archive templates, and generate reports using them.
- FR-011: System MUST prevent destructive operations: hard delete of templates or versions is disallowed if referenced by any report; archiving is allowed with safeguards.
- FR-012: System MUST allow duplicating an existing template (including optionally a specific version) to create a new template as a starting point.
- FR-013: System MUST support organizing templates (e.g., by report type/category) and filtering/searching by name, tags, owner, status. [NEEDS CLARIFICATION: required taxonomy/tags]
- FR-014: System MUST capture an audit trail (who, what, when) for template edits, publishes, reverts, and archives.
- FR-015: System MUST apply a last‑write‑wins policy for concurrent draft edits; the newest save overwrites prior changes without warning.
- FR-016: System MUST support archiving a template to remove it from active selection while keeping history and not impacting historical reports.
- FR-017: If no published version exists for a template, the system MUST block default report generation with that template and present clear guidance to publish or choose a different template.
- FR-018: System SHOULD support autosave for draft edits to reduce data loss risk. [NEEDS CLARIFICATION: autosave frequency and UX]
- FR-019: System SHOULD allow exporting a template’s content and metadata for backup/review. [NEEDS CLARIFICATION: export format]
- FR-020: System SHOULD support importing content into a draft (e.g., copy/paste or file upload). [NEEDS CLARIFICATION: accepted input formats]

### Key Entities _(include if feature involves data)_

- Template: Represents a logical template concept used for a class of reports. Key attributes: name, description, status (draft/published/archived), ownership/visibility, latestPublishedVersion, createdBy/updatedBy, tags/categories.
- Template Version: An immutable snapshot of a Template’s content at publish time. Key attributes: version number, content body (plain text), change summary, createdAt/createdBy; relationship: belongs to exactly one Template (1‑many).
- [Removed] Placeholder/Variable entity: Not applicable; templates are plain text with no inline variables.
- Report: The generated artifact for end users. Key attributes: report id, report type, generatedAt, createdBy, templateVersionRef, generation status/outcome; relationship: references exactly one Template Version used for generation.

---

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status

_Updated by main() during processing_

- [ ] User description parsed
- [ ] Key concepts extracted
- [ ] Ambiguities marked
- [ ] User scenarios defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed

---
