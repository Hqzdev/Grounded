# System Requirements Specification

| Field | Value |
| --- | --- |
| Project | Grounded |
| Document Type | System Requirements Specification |
| Version | 0.1 |
| Revision Date | 2026-06-30 |
| Status | Draft |
| Owner | Engineering |

## Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-30 | Engineering | Initial system requirements specification. |

## Review and Approval

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Product Owner | TBD | Pending | TBD |
| Engineering Owner | TBD | Pending | TBD |
| Security Reviewer | TBD | Pending | TBD |

## Contents

1. Purpose
2. General System Requirements
3. Policy and Regulatory Requirements
4. Security Requirements
5. Training Requirements
6. Initial Capacity Requirements
7. Initial System Architecture
8. Acceptance Criteria
9. Current System Analysis
10. References
11. Glossary
12. Appendices

## 1. Purpose

This document defines system-level requirements for Grounded. It covers operational behavior, infrastructure components, security posture, capacity expectations, and acceptance conditions for the first local backend implementation.

## 2. General System Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| SYS-001 | The system shall provide a local end-to-end path from registration to cited answer generation. | High |
| SYS-002 | The system shall expose one public backend entry point through the gateway. | High |
| SYS-003 | The system shall use asynchronous processing for long-running document ingestion work. | High |
| SYS-004 | The system shall store transactional state in PostgreSQL. | High |
| SYS-005 | The system shall store vector search data in Qdrant. | High |
| SYS-006 | The system shall store raw document files in MinIO. | High |
| SYS-007 | The system shall transport ingestion jobs through RabbitMQ. | High |
| SYS-008 | The system shall reserve Redis for cache, session-adjacent runtime needs, and rate limiting. | Medium |
| SYS-009 | The system shall be runnable through Docker Compose before production infrastructure is introduced. | High |
| SYS-010 | The system shall keep Terraform, Kubernetes, WMS, and advanced operational integrations out of the first backend milestone. | High |

## 3. Policy and Regulatory Requirements

| ID | Requirement |
| --- | --- |
| POL-001 | The system shall avoid storing provider secrets in source control. |
| POL-002 | The system shall support audit-friendly usage records for model calls. |
| POL-003 | The system shall keep tenant data boundaries explicit in data models and service contracts. |
| POL-004 | The system shall avoid exposing raw storage locations to untrusted clients. |
| POL-005 | The system shall treat document content and generated answers as tenant-owned data. |

Formal compliance regimes are not part of the first milestone. Designing for basic auditability now prevents expensive rework later.

## 4. Security Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| SSR-001 | Passwords shall be stored using Argon2 hashing. | High |
| SSR-002 | Public API authentication shall use bearer tokens. | High |
| SSR-003 | Tenant isolation shall be enforced in API, database, vector, object storage, and job processing layers. | High |
| SSR-004 | Cross-tenant access attempts shall not disclose whether the target resource exists. | High |
| SSR-005 | Internal services shall not be directly called by the frontend. | High |
| SSR-006 | Queue messages shall not contain raw document payloads. | Medium |
| SSR-007 | Errors shall not expose stack traces, credentials, storage keys, or internal URLs. | High |

## 5. Training Requirements

| ID | Requirement |
| --- | --- |
| TRN-001 | Developers shall read the documentation register before implementing backend features. |
| TRN-002 | Developers shall understand tenant isolation requirements before writing repository queries. |
| TRN-003 | Developers shall understand Prisma migration flow before changing schema. |
| TRN-004 | Developers shall verify local services through documented health endpoints. |

## 6. Initial Capacity Requirements

| ID | Requirement |
| --- | --- |
| CAP-001 | The first local environment shall support at least two tenants for isolation testing. |
| CAP-002 | The first local environment shall support document upload, indexing, retrieval, and citation persistence on a single developer machine. |
| CAP-003 | Document processing shall be isolated in workers so API request latency is not tied to embedding completion. |
| CAP-004 | Performance targets shall be refined after the first measured local ingestion and retrieval benchmarks. |

The first milestone is correctness-focused. Pretending to have production capacity targets before the pipeline works would be theater, not engineering.

## 7. Initial System Architecture

```text
Web Application
  -> Rust Gateway
    -> Auth Service
    -> Ingestion Service
    -> Retrieval Service

Auth Service
  -> PostgreSQL

Ingestion Service
  -> PostgreSQL
  -> MinIO
  -> RabbitMQ

Embedding Worker
  -> RabbitMQ
  -> PostgreSQL
  -> MinIO
  -> Qdrant

Retrieval Service
  -> PostgreSQL
  -> Qdrant
  -> LLM Provider
```

| Component | Responsibility |
| --- | --- |
| Web Application | User interface for account, workspace, upload, search, chat, and sources. |
| Gateway | Public routing, request boundary, and frontend-facing contract. |
| Auth Service | Users, tenants, memberships, token issuance, and current tenant context. |
| Ingestion Service | Document metadata, raw object storage, and ingestion job creation. |
| Embedding Worker | Parsing, chunking, embedding generation, vector writes, and status updates. |
| Retrieval Service | Tenant-scoped search, answer generation, citations, messages, and usage records. |
| PostgreSQL | Source of truth for relational application state. |
| Qdrant | Tenant-filtered vector search index. |
| MinIO | Raw document object storage. |
| RabbitMQ | Asynchronous ingestion job transport. |
| Redis | Future cache and rate-limit runtime. |

## 8. Acceptance Criteria

| ID | Criterion |
| --- | --- |
| SAC-001 | The local system can start through Docker Compose. |
| SAC-002 | A user can register, log in, and receive tenant context. |
| SAC-003 | A document upload creates metadata, object storage state, and ingestion job state. |
| SAC-004 | Worker processing can produce document chunks and vector records. |
| SAC-005 | Retrieval can return an answer with citations from tenant-scoped sources. |
| SAC-006 | Two-tenant tests demonstrate that cross-tenant reads and searches are denied. |
| SAC-007 | Prisma validation and generation pass after schema changes. |

## 9. Current System Analysis

The current implementation is an early backend foundation. The frontend shell exists, the gateway boundary exists, the auth service has database-backed direction, and the Prisma schema establishes the initial persistence model. The next valuable work is not Kubernetes or Terraform. The next valuable work is completing the document ingestion path, worker processing, vector search, and cited answer flow.

## 10. References

| Document | Description |
| --- | --- |
| `software-requirements-specification.md` | Product and software behavior requirements. |
| `backend-architecture.md` | Service boundaries and implementation order. |
| `database.md` | Data model and migration requirements. |
| `tenant-isolation.md` | Tenant security controls. |
| `local-development.md` | Local runtime and verification requirements. |

## 11. Glossary

| Term | Definition |
| --- | --- |
| System Requirement | Requirement describing infrastructure, security, capacity, or operational behavior. |
| Tenant | Isolated workspace or organization. |
| Gateway | Public backend entry point. |
| Worker | Background process that handles asynchronous jobs. |
| Citation | Verifiable source reference attached to an answer. |

## 12. Appendices

Additional deployment, monitoring, and production-readiness requirements shall be added after the local RAG workflow is complete.
