# Backend Architecture Specification

| Field | Value |
| --- | --- |
| Project | Grounded |
| Document Type | Backend Architecture Specification |
| Version | 0.1 |
| Revision Date | 2026-06-30 |
| Status | Draft |
| Owner | Engineering |

## Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-30 | Engineering | Initial backend architecture specification. |

## Review and Approval

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Engineering Owner | TBD | Pending | TBD |
| Security Reviewer | TBD | Pending | TBD |

## Contents

1. Purpose
2. Scope
3. System Context
4. Service Requirements
5. Data Ownership
6. Tenant Isolation
7. Implementation Sequence
8. Acceptance Criteria
9. References
10. Glossary

## 1. Purpose

This document specifies the backend architecture for Grounded. It defines service boundaries, ownership responsibilities, and integration rules for the system.

## 2. Scope

The scope includes the Rust gateway, Python services, background worker, PostgreSQL, Qdrant, RabbitMQ, MinIO, and Redis. Frontend presentation details are outside this document.

## 3. System Context

```text
Web
  -> Gateway
    -> Auth Service
    -> Ingestion Service
    -> Retrieval Service

Ingestion Service
  -> PostgreSQL
  -> MinIO
  -> RabbitMQ

Embedding Worker
  -> RabbitMQ
  -> MinIO
  -> PostgreSQL
  -> Qdrant

Retrieval Service
  -> PostgreSQL
  -> Qdrant
  -> LLM Provider
```

## 4. Service Requirements

| ID | Service | Requirement |
| --- | --- | --- |
| BAR-001 | Gateway | The gateway shall be the only public backend entry point for the web application. |
| BAR-002 | Gateway | The gateway shall proxy auth, document, tenant, and question requests to internal services. |
| BAR-003 | Auth Service | The auth service shall own users, tenants, memberships, API keys, and token issuance. |
| BAR-004 | Ingestion Service | The ingestion service shall own document intake, metadata creation, object storage writes, and ingestion job creation. |
| BAR-005 | Embedding Worker | The embedding worker shall own document parsing, chunking, embeddings, Qdrant writes, and indexed status updates. |
| BAR-006 | Retrieval Service | The retrieval service shall own question answering, citation creation, chat persistence, and usage recording. |

## 5. Data Ownership

PostgreSQL is the source of truth for transactional state. Qdrant stores vector search payloads. MinIO stores raw document versions. RabbitMQ transports asynchronous work. Redis is reserved for rate limiting, caching, and session-related runtime needs.

## 6. Tenant Isolation

Every service that reads or writes tenant-owned data shall require tenant context. Qdrant vector payloads shall include tenant identifiers. Internal service calls shall not infer tenant context from global state.

## 7. Implementation Sequence

1. Database schema and migrations.
2. DB-backed auth and tenant service.
3. DB-backed ingestion service.
4. RabbitMQ job publishing.
5. Embedding worker job consumption.
6. MinIO raw object storage.
7. Document parsing and chunking.
8. Qdrant vector writes.
9. Retrieval service vector search.
10. LLM answer generation and citations.
11. Usage ledger.
12. Frontend integration.

## 8. Acceptance Criteria

| ID | Criterion |
| --- | --- |
| BAC-001 | The web application uses the gateway URL only. |
| BAC-002 | Internal services expose health endpoints. |
| BAC-003 | Auth routes are available through the gateway. |
| BAC-004 | Document ingestion is asynchronous. |
| BAC-005 | Retrieval queries are tenant-scoped. |

## 9. References

| Document | Description |
| --- | --- |
| `software-requirements-specification.md` | Product-level requirements. |
| `database.md` | Data model and persistence requirements. |
| `tenant-isolation.md` | Tenant isolation controls. |

## 10. Glossary

| Term | Definition |
| --- | --- |
| Gateway | Public API boundary implemented in Rust. |
| Internal Service | Backend service not directly called by the frontend. |
| Worker | Background process that consumes queue jobs. |
