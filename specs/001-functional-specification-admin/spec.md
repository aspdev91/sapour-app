# Feature Specification: Admin App for First Impressions & Compatibility Reports

**Feature Branch**: `001-functional-specification-admin`  
**Created**: 2025-09-20  
**Status**: Draft  
**Input**: Internal admin tool to upload user media (images and/or audio), fetch external template revisions, inject analysis variables, and generate immutable AI-powered personality and compatibility reports, viewable and managed by admins.

## User Scenarios & Testing (mandatory)

### Primary User Story

An approved admin signs in and uses the dashboard to add a new user with media, then navigates to an experiment page to select a template revision and generate an immutable report. Where applicable, the admin inputs the user’s self-observed differences and/or selects a second user, then generates additional reports. The admin can browse users, open a user profile to view their media and report history, and open any report in a read-only viewer that clearly shows which template revision and AI model/provider were used.

### Acceptance Scenarios

1. Authentication — allowlisted access only
   - Given an email on the allowlist, when the admin signs in, then they reach the dashboard and can access all admin features.
   - Given an email not on the allowlist, when attempting to sign in, then access is denied with a clear message.
2. Add New User — validation of required media
   - Given the Add New User form, when the admin submits with images only, then the user is created and images are stored; consent is recorded as true.
   - Given the form, when the admin submits with audio only, then the user is created, audio is stored, and voice analysis is queued/performed; consent is recorded as true.
   - Given the form, when the admin submits with neither images nor audio, then submission is blocked with a clear validation message.
3. Audio processing
   - Given a successful audio upload, when voice analysis completes, then JSON attributes are stored and linked to the user’s media.
   - Given a processing error, when analysis fails, then the admin sees a clear error state without losing the user record.
4. View All Users — infinite scroll
   - Given many users exist, when the admin opens the list, then users are shown newest first with infinite scroll loading additional pages.
   - Given the list, when the admin clicks a user, then the User Profile opens.
5. User Profile — media and reports
   - Given a user with media, when viewing the profile, then the image gallery and/or audio player are visible if uploaded.
   - Given reports exist, when viewing the profile, then reports are listed newest first showing type, timestamp, template revision identifier/label, and model/provider; clicking a report opens the viewer.
6. Report Viewer — immutability and provenance
   - Given a report, when the viewer opens, then the full output is displayed read-only and shows the template revision identifier and revision date/name used.
7. First Impression Divergence — base report
   - Given a selected user and a template revision, when the admin selects a revision, then a First Impression report is automatically generated with injected image/voice analysis if available; a loading indicator is shown; on success the report is stored immutably with model/provider and template revision metadata and displayed in the left column.
8. First Impression Divergence — divergence report
   - Given a generated First Impression report, when the admin enters self-observed differences and selects a divergence template revision, then clicking Generate creates a new Divergence report comparing AI impressions (image + voice) and self-observations; the result is stored immutably with its own template revision metadata and displayed in the right column.
9. My Type Divergence — base and divergence
   - Given a selected user, when a My Type template revision is selected, then a base My Type report is generated and stored; when self-observations and a divergence template revision are provided, then a My Type Divergence report is generated and stored, shown side-by-side.
10. Romance & Friendship Compatibility — two-user flows
    - Given two selected users, when a Romance template revision is selected, then a Romance Compatibility report is generated using available media analyses from both users, stored with metadata, and shown in the left column.
    - Given two selected users, when a Friendship template revision is selected, then a Friendship Compatibility report is generated similarly and shown in the right column.
11. Error handling
    - Given an AI model error or a voice analysis error, when generation fails, then a clear, actionable error message is shown and no partial report is saved.

### Edge Cases

- Missing media combinations (images only, audio only, both missing, one user missing in compatibility) and corresponding validation.
- Voice analysis delays/timeouts or third-party unavailability; queued processing and status display.
- External template system revision list unavailable or revision removed after selection.
- Duplicate clicks generating the same report; ensure single creation per action and clear loading state.
- Very large media uploads; file type/size validation and user feedback. Compress any images or audio that's larger than 5mb.
- Concurrent report generations across multiple admins; results remain consistent and immutable.
- Allowlist changes while an admin is signed in; Supabase will most likely revoke the auth token and the user will be signed out.
- Accessibility/internationalization of viewer and forms - no need, everything will be in English
- Data export or deletion requests from users; no retention policy or need for this at the moment

## Requirements (mandatory)

### Functional Requirements

- FR-001: The system MUST restrict access to approved admin accounts only via a sign-in flow (no self-serve sign-up).
- FR-002: Approved admins MUST have access to all admin features (no role-based partitioning in this version).
- FR-003: The dashboard MUST provide navigation to User Management and Experiments, and a persistent way to return to the dashboard from any page.
- FR-004: The Add New User form MUST require at least one media input (images and/or a single audio file) before submission.
- FR-005: On successful submission, the system MUST create a new user with a unique identifier and set consent to true.
- FR-006: If images are provided, the system MUST store them, initiate image analysis, and associate them to the user, and persist resulting JSON attributes associated to the user.
- FR-007: If an audio file is provided, the system MUST store it, initiate voice analysis, and persist resulting JSON attributes associated to the user.
- FR-008: The system MUST present validation errors clearly when required inputs are missing or invalid.
- FR-009: The View All Users screen MUST list users newest first and support infinite scroll/loading of additional pages.
- FR-010: Clicking a user in the list MUST navigate to that user’s profile page.
- FR-011: The User Profile MUST display the user’s name, image gallery (if any), audio player (if any), and a list of all reports newest first.
- FR-012: Each report entry in the profile list MUST show report type, timestamp, template revision identifier, template revision date/name label, and AI model/provider.
- FR-013: Clicking a report entry MUST open a read-only Report Viewer showing the full report output and its template revision identifier and label.
- FR-014: Experiment pages MUST show a revision selector listing available revisions for the chosen template, labeled by revision date or by revision name if present.
- FR-015: Selecting a template revision in an experiment MUST auto-generate a new immutable report and show a loading indicator until completion or error.
- FR-016: During generation, the system MUST inject available variables into the prompt template: image analysis results, voice analysis results, and self-observed differences where applicable.
- FR-017: Each generated report MUST be stored as append-only with metadata: report type, involved user(s), template revision identifier, template revision label (date/name), AI model name, AI provider name, and creation timestamp.
- FR-018: The system MUST surface clear error messages when report generation or analysis fails and MUST NOT save a partial or placeholder report.
- FR-019: First Impression Divergence page MUST display the base First Impression report in the left column after selection, and support generating a Divergence report in the right column using self-observed differences and a divergence template revision.
- FR-020: My Type Divergence page MUST mirror the First Impression Divergence flow using the corresponding templates.
- FR-021: Romance & Friendship Compatibility page MUST allow selecting two users and independently generating/storing Romance (left) and Friendship (right) reports.
- FR-022: Compatibility reports MUST inject available analyses for both users; if analysis is missing for one or both users, the system MUST proceed with available inputs and note missing inputs in context. Both users should have the inputs in the system. If not, display an error.
- FR-023: Reports MUST be immutable; edits to existing reports are disallowed. New generations MUST create new entries.
- FR-024: The system MUST provide a consistent loading state and prevent duplicate submissions while a generation is in progress.
- FR-025: The system MUST preserve provenance by clearly displaying template revision identifiers and labels in the viewer.
- FR-026: The system MUST fetch template revisions dynamically from an external document system with revision history.
- FR-027: If the external revision list cannot be fetched, the system MUST show an error and allow retry without losing page state.
- FR-028: The system doesn't need to log generation attempts and outcomes for auditability.
- FR-029: The system SHOULD display human-friendly timestamps and template labels. Use the date and time in a human readable format.

### Key Entities (include if feature involves data)

- User: Represents an individual whose media and reports are managed.
  - Key attributes: id, name, consent flag, created timestamp, created by admin.
- Media: Represents user-uploaded assets and derived attributes.
  - Key attributes: user reference; type of media; media storage URL; analysis results; api provider used; model used; created timestamp.
- Report: Represents an immutable AI-generated output tied to a specific template revision.
  - Key attributes: id; report type (First Impression, First Impression Divergence, My Type, My Type Divergence, Romance Compatibility, Friendship Compatibility); primary user; optional secondary user; template revision identifier; template revision label (date/name); AI model name; AI provider name; creation timestamp; full report content.
- Template: Represents a template family with revisions maintained in an external document system.
  - Key attributes: template type; external document URL/reference; list of available revisions with identifiers and labels (date/name).
- Admin: Represents an operator allowed to use the system.
  - Key attributes: email/identifier; allowlist status; created timestamp; last active timestamp.

---

## Review & Acceptance Checklist

### Content Quality

- [ ] No implementation details (languages, frameworks, specific vendors)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous (except where explicitly marked)
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---
