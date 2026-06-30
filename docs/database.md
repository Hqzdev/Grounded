# Database Requirements and Data Model Specification

| Field | Value |
| --- | --- |
| Project | Grounded |
| Document Type | Database Requirements Specification |
| Version | 0.1 |
| Revision Date | 2026-06-30 |
| Status | Draft |
| Owner | Engineering |

## Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-30 | Engineering | Initial Prisma-backed database specification. |

## Review and Approval

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Engineering Owner | TBD | Pending | TBD |
| Security Reviewer | TBD | Pending | TBD |

## Contents

1. Purpose
2. Scope
3. Database Package
4. Data Model Requirements
5. Tenant Scope Requirements
6. Migration Requirements
7. Indexing Requirements
8. Acceptance Criteria
9. References
10. Glossary

## 1. Purpose

This document defines the PostgreSQL schema requirements for Grounded. Prisma is the schema and migration layer for the repository.

## 2. Scope

The scope includes application tables, tenant boundaries, migration discipline, and expected query access paths. Runtime repository implementation details are outside this document.

## 3. Database Package

```text
packages/database/
  package.json
  prisma/
    schema.prisma
    migrations/
  .env.example
```

## 4. Data Model Requirements

| ID | Entity | Requirement |
| --- | --- | --- |
| DBR-001 | Tenant | The system shall store tenant workspaces with unique slugs. |
| DBR-002 | User | The system shall store users with unique email addresses and optional password hashes. |
| DBR-003 | Membership | The system shall connect users to tenants with explicit roles. |
| DBR-004 | ApiKey | The system shall support hashed API keys with active and revoked states. |
| DBR-005 | Document | The system shall store tenant-scoped document metadata and status. |
| DBR-006 | DocumentVersion | The system shall store immutable raw object metadata for each document version. |
| DBR-007 | DocumentChunk | The system shall store searchable chunk text, source span data, and Qdrant point identifiers. |
| DBR-008 | IngestionJob | The system shall store asynchronous document processing status. |
| DBR-009 | ChatSession | The system shall group user and assistant messages into sessions. |
| DBR-010 | Message | The system shall store user, assistant, and system messages. |
| DBR-011 | Citation | The system shall connect assistant messages to source chunks. |
| DBR-012 | UsageLedger | The system shall record provider, model, token count, and estimated cost events. |

## 5. Tenant Scope Requirements

Tenant-owned tables shall include `tenantId`. Repository functions shall accept tenant context explicitly. Queries that list, retrieve, update, search, or cite tenant-owned data shall filter by tenant.

## 6. Migration Requirements

Schema changes shall be made through Prisma migrations. Manual production database patching is not allowed. Destructive migrations require explicit review because document, citation, and usage records are audit-sensitive.

## 7. Indexing Requirements

| ID | Requirement |
| --- | --- |
| DBI-001 | Document lists shall be indexed by tenant, status, and creation time. |
| DBI-002 | Ingestion jobs shall be indexed by tenant and status. |
| DBI-003 | Messages shall be indexed by tenant, session, and creation time. |
| DBI-004 | Usage events shall be indexed by tenant, event type, and creation time. |
| DBI-005 | Additional indexes shall be added from measured query plans. |

## 8. Acceptance Criteria

| ID | Criterion |
| --- | --- |
| DAC-001 | `npm run db:validate` passes. |
| DAC-002 | `npm run db:generate` passes. |
| DAC-003 | Initial migration exists under `packages/database/prisma/migrations`. |
| DAC-004 | Tenant-scoped entities include tenant identifiers. |

## 9. References

| Document | Description |
| --- | --- |
| `packages/database/prisma/schema.prisma` | Canonical schema definition. |
| `backend-architecture.md` | Service and data ownership. |
| `tenant-isolation.md` | Tenant isolation requirements. |

## 10. Glossary

| Term | Definition |
| --- | --- |
| Prisma | Schema and migration tool used for PostgreSQL. |
| Migration | Versioned database schema change. |
| Ledger | Append-oriented record of usage events. |
