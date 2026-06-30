# Development Workflow Specification

| Field | Value |
| --- | --- |
| Project | Grounded |
| Document Type | Development Process Specification |
| Version | 0.1 |
| Revision Date | 2026-06-30 |
| Status | Draft |
| Owner | Engineering |

## Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-30 | Engineering | Initial development workflow specification. |

## Review and Approval

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Engineering Owner | TBD | Pending | TBD |
| Security Reviewer | TBD | Pending | TBD |

## Contents

1. Purpose
2. Scope
3. Development Sequence
4. Definition of Ready
5. Definition of Done
6. Review Requirements
7. Verification Matrix
8. Release Notes Requirements
9. Acceptance Criteria
10. References
11. Glossary

## 1. Purpose

This document defines the required development workflow for Grounded. It exists to keep implementation work aligned with architecture, security, and documentation requirements.

## 2. Scope

The scope includes feature readiness, implementation order, review criteria, verification commands, documentation updates, and release notes.

## 3. Development Sequence

Work shall follow this sequence for non-trivial changes:

1. Confirm the affected requirement or architecture document.
2. Identify service ownership and data ownership.
3. Update or create the relevant contract before implementation when behavior changes.
4. Implement the narrowest complete change.
5. Run targeted verification.
6. Update documentation.
7. Open a pull request with evidence.

## 4. Definition of Ready

A task is ready for implementation when:

| ID | Requirement |
| --- | --- |
| DOR-001 | The affected service boundary is known. |
| DOR-002 | The tenant isolation impact is understood. |
| DOR-003 | Required data model changes are identified. |
| DOR-004 | Required API contract changes are identified. |
| DOR-005 | Verification commands are known. |

## 5. Definition of Done

A task is done when:

| ID | Requirement |
| --- | --- |
| DOD-001 | The implementation satisfies the linked requirement. |
| DOD-002 | Relevant checks pass. |
| DOD-003 | Public API changes are documented. |
| DOD-004 | Schema changes include Prisma migrations. |
| DOD-005 | Tenant-owned behavior is tenant-scoped. |
| DOD-006 | Security-sensitive behavior has been reviewed. |
| DOD-007 | The pull request includes verification evidence. |

## 6. Review Requirements

Reviewers shall check:

1. Service boundary correctness.
2. Tenant isolation.
3. Public API stability.
4. Database migration safety.
5. Error disclosure behavior.
6. Dependency justification.
7. Test and verification quality.
8. Documentation alignment.

## 7. Verification Matrix

| Change Area | Verification |
| --- | --- |
| Web UI | `npm --workspace apps/web run lint` and `npm --workspace apps/web run build` |
| Prisma schema | `npm run db:validate` and `npm run db:generate` |
| Gateway | `cargo check` in `apps/gateway` |
| Auth service | `python -m compileall services/auth/app` |
| Ingestion service | `python -m compileall services/ingestion/app` |
| Embedding worker | `python -m compileall services/embedding/app` |
| Retrieval service | `python -m compileall services/retrieval/app` |
| Docker Compose | `docker compose -f infra/docker/docker-compose.yml config` |
| Documentation | Check headings, links, requirement IDs, and acceptance criteria |

## 8. Release Notes Requirements

Changes that affect user-visible behavior, backend contracts, security posture, database schema, or local operation shall update `CHANGELOG.md`.

## 9. Acceptance Criteria

| ID | Criterion |
| --- | --- |
| WAC-001 | Contributors can identify required checks before opening a pull request. |
| WAC-002 | Reviewers can reject unsafe tenant behavior using written policy. |
| WAC-003 | Documentation updates are tied to architecture and contract changes. |
| WAC-004 | Security-sensitive changes have explicit review triggers. |

## 10. References

| Document | Description |
| --- | --- |
| `../CONTRIBUTING.md` | Contributor workflow and PR rules. |
| `../CODE_STYLE.md` | Code style rules. |
| `../SECURITY.md` | Security policy. |
| `backend-architecture.md` | Service boundaries. |
| `tenant-isolation.md` | Tenant isolation requirements. |

## 11. Glossary

| Term | Definition |
| --- | --- |
| Definition of Ready | Conditions required before implementation starts. |
| Definition of Done | Conditions required before work is accepted. |
| Verification Evidence | Commands run and relevant results included in a pull request. |
