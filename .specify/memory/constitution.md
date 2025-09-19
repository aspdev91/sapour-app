<!--
Sync Impact Report
- Version change: N/A → 1.0.0
- Modified principles: (template placeholders) → concrete principles
- Added sections:
  - Core Principles: Code Quality & Maintainability
  - Core Principles: Test-Driven Development (TDD)
  - Core Principles: User Experience Consistency
  - Core Principles: Performance Requirements
  - Section 2: Quality Gates & CI Requirements
  - Section 3: Development Workflow & Review Process
- Removed sections: None
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (version reference updated and path corrected)
  - ✅ .specify/templates/spec-template.md (no outdated references)
  - ✅ .specify/templates/tasks-template.md (aligned with TDD and performance gates)
  - ⚠ commands templates: N/A (no `.specify/templates/commands/` directory present)
- Follow-up TODOs: None
-->

# Sapour App Constitution

## Core Principles

### I. Code Quality & Maintainability (NON‑NEGOTIABLE)

- Code MUST be simple, readable, and intentionally named; no dead or commented‑out code in `main`.
- Linting and formatting MUST run in CI and block merges on any error or warning levels configured as errors.
- Static typing SHOULD be used wherever available; type errors MUST block merges.
- Modules MUST be cohesive with clear public interfaces; cyclic dependencies are not allowed.
- Public APIs MUST be documented at the source (docstrings) and significant modules MUST include a short README.
- Security hygiene is required: input validation at boundaries, least‑privilege access, and no secrets in source control.
  Rationale: High code quality reduces defects and accelerates change, lowering total cost of ownership.

### II. Test‑Driven Development (TDD)

- Tests MUST be written before implementation (Red‑Green‑Refactor). Initial tests MUST fail to validate signal.
- Each feature/change MUST include tests that demonstrate behavior (contract/integration) and logic (unit) as applicable.
- Coverage thresholds: ≥85% project‑wide and ≥80% per changed package/module; new/changed files SHOULD not reduce coverage.
- Tests MUST be deterministic, isolated, and fast; network, time, and randomness MUST be controlled via seams.
- CI MUST block merges unless all tests pass on clean environments.
  Rationale: TDD drives design, prevents regressions, and provides living documentation of behavior.

### III. User Experience Consistency

- A single design system (tokens, components) MUST be used; ad‑hoc styles/components are prohibited without prior approval.
- Accessibility MUST meet WCAG 2.1 AA standards, including keyboard navigation and semantic structure.
- UX copy MUST be clear, concise, and consistent; error messages MUST be actionable and non‑technical to end users.
- Responsive behavior MUST be validated at agreed breakpoints; design reviews MUST occur before implementation for net‑new UI.
- Internationalization readiness SHOULD be maintained (string externalization and locale support) where applicable.
  Rationale: Consistent, accessible UX improves usability, trust, and reduces support burden.

### IV. Performance Requirements

- Backend: p95 latency for core API actions MUST be <200ms intra‑region; p99 <1s. N+1 queries MUST be eliminated.
- Frontend (Core Web Vitals): LCP <2.5s, CLS <0.1, INP <200ms on a mid‑tier device and 4G network.
- Resource budgets MUST be defined and enforced (bundle size, DB query counts, memory/CPU for critical paths).
- Performance regression tests/benchmarks SHOULD guard critical paths in CI; observability (structured logs, metrics, tracing) MUST be enabled.
  Rationale: Meeting clear budgets ensures predictable scalability and user satisfaction.

## Quality Gates & CI Requirements

- Lint, format, and type checks MUST pass.
- Tests MUST exist for all changes and pass; coverage thresholds enforced as above.
- Performance budgets for critical paths MUST be checked (automated where feasible) and documented otherwise.
- Accessibility checks MUST run on UI changes (automated where feasible) with manual spot‑checks for complex flows.
- Constitution Check from the feature plan MUST be completed and referenced in the PR description.

## Development Workflow & Review Process

- Branches follow `[###-feature-name]`; PRs MUST link the feature spec and plan.
- Definition of Done includes: passing gates, updated docs, UX review (for UI changes), and no outstanding TODOs.
- Code review MUST verify adherence to principles; reviewers block on gate failures or unjustified deviations.
- Breaking changes MUST include migration notes and communication plan.

## Governance

- This Constitution supersedes other practices. Deviations require explicit, temporary waivers documented in the PR.
- Amendments are proposed via PR updating this file with a Sync Impact Report. Approval by at least one maintainer and one feature owner is required.
- Versioning policy (semantic):
  - MAJOR: Backward‑incompatible principle removal/redefinition or governance changes.
  - MINOR: New principle/section or materially expanded guidance.
  - PATCH: Clarifications, wording, typo fixes, non‑semantic refinements.
- Compliance reviews occur on every PR and via quarterly audits of random features.

**Version**: 1.0.0 | **Ratified**: 2025-09-19 | **Last Amended**: 2025-09-19
