# Grounded Documentation Set

| Field | Value |
| --- | --- |
| Project | Grounded |
| Document Type | Documentation Register |
| Version | 0.1 |
| Revision Date | 2026-06-30 |
| Status | Draft |
| Owner | Engineering |

## Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-30 | Engineering | Initial requirements-style documentation set. |

## Review and Approval

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Product Owner | TBD | Pending | TBD |
| Engineering Owner | TBD | Pending | TBD |
| Security Reviewer | TBD | Pending | TBD |

## Contents

1. Purpose
2. Document Register
3. Reading Order
4. Documentation Standards
5. Maintenance Rules

## 1. Purpose

This register defines the controlled documentation set for Grounded. The documents are written in Markdown while following a formal software requirements and system requirements structure.

## 2. Document Register

| Document | Purpose | Status |
| --- | --- | --- |
| `system-requirements-specification.md` | System-level operational, security, capacity, and acceptance requirements. | Draft |
| `software-requirements-specification.md` | Overall product and system requirements. | Draft |
| `backend-architecture.md` | Backend architecture requirements and service boundaries. | Draft |
| `database.md` | Database requirements and data model specification. | Draft |
| `api-contracts.md` | Public API requirements and response contracts. | Draft |
| `auth-security.md` | Authentication, session, token, password, and audit requirements. | Draft |
| `ci-cd.md` | Continuous integration checks, branch policy, and delivery roadmap. | Draft |
| `ingestion-pipeline.md` | Document ingestion and asynchronous processing requirements. | Draft |
| `retrieval-pipeline.md` | Retrieval, answer generation, citation, and usage requirements. | Draft |
| `tenant-isolation.md` | Tenant isolation and security requirements. | Draft |
| `local-development.md` | Local runtime and developer environment requirements. | Draft |
| `development-workflow.md` | Required engineering workflow, review, and verification rules. | Draft |

## 3. Reading Order

1. Read the System Requirements Specification first.
2. Read the Software Requirements Specification second.
3. Read Backend Architecture to understand service ownership.
4. Read Database before implementing persistence.
5. Read API Contracts before connecting the frontend.
6. Read Auth Security before changing authentication or private API access.
7. Read CI/CD before changing GitHub Actions, release, or branch policy.
8. Read Ingestion Pipeline and Retrieval Pipeline before implementing RAG flows.
9. Read Tenant Isolation before writing tenant-scoped queries.
10. Read Local Development before running the system.
11. Read Development Workflow before opening a pull request.

## 4. Documentation Standards

All engineering documents must use English, numbered sections, explicit requirements, and acceptance criteria. Documents should be formal enough for external review but concise enough to remain useful during implementation.

## 5. Maintenance Rules

Each major backend change must update the affected requirements document. Schema changes must update `database.md`. Public API changes must update `api-contracts.md`. Security-sensitive tenant behavior must update `tenant-isolation.md`.

Workflow and contributor policy changes must update `development-workflow.md`, `../CONTRIBUTING.md`, or `../CODE_STYLE.md`.
