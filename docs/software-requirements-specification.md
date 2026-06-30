# Software Requirements Specification

| Field | Value |
| --- | --- |
| Project | Grounded |
| Document Type | Software Requirements Specification |
| Version | 0.1 |
| Revision Date | 2026-06-30 |
| Status | Draft |
| Owner | Engineering |

## Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-30 | Engineering | Initial SRS for the Grounded platform. |

## Review and Approval

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Product Owner | TBD | Pending | TBD |
| Engineering Owner | TBD | Pending | TBD |
| Security Reviewer | TBD | Pending | TBD |

## Contents

1. Introduction
2. General Description
3. Functional Requirements
4. Interface Requirements
5. Data Requirements
6. Performance Requirements
7. Security Requirements
8. Reliability and Maintainability Requirements
9. Operational Scenarios
10. Acceptance Criteria
11. References
12. Glossary
13. Appendices

## 1. Introduction

### 1.1 Purpose

This document defines the software requirements for Grounded, a self-hostable, multi-tenant Retrieval-Augmented Generation platform that answers user questions from documents and returns verifiable citations.

### 1.2 Scope

Grounded includes a web application, a Rust API gateway, Python backend services, PostgreSQL, Qdrant, Redis, RabbitMQ, and MinIO. The first implementation target is a local Docker Compose environment with a complete upload-to-answer workflow.

### 1.3 Product Objective

The system shall allow teams to upload documents, index them, ask natural-language questions, and receive answers grounded in tenant-scoped source citations.

## 2. General Description

### 2.1 Product Functions

The system shall provide document upload, document processing status, tenant-scoped retrieval, cited answers, chat history, source browsing, and usage tracking.

### 2.2 User Classes

| User Class | Description |
| --- | --- |
| Workspace Owner | Creates tenants, manages members, uploads documents, and reviews usage. |
| Workspace Member | Uploads documents, asks questions, and reviews citations. |
| Viewer | Reads answers and sources without administrative privileges. |
| System Operator | Runs local infrastructure, migrations, and service deployments. |

### 2.3 Constraints

The system shall run locally with Docker Compose before Kubernetes or Terraform are introduced. Multi-tenant data isolation is mandatory from the first backend implementation.

## 3. Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-001 | The system shall allow a user to register with email, password, name, and workspace information. | High |
| FR-002 | The system shall authenticate users and issue bearer tokens. | High |
| FR-003 | The system shall allow authenticated users to retrieve their current tenant context. | High |
| FR-004 | The system shall allow users to upload documents into a tenant workspace. | High |
| FR-005 | The system shall store raw document versions in object storage. | High |
| FR-006 | The system shall create asynchronous ingestion jobs for document processing. | High |
| FR-007 | The system shall parse documents into searchable chunks. | High |
| FR-008 | The system shall write vector embeddings with tenant-scoped payloads. | High |
| FR-009 | The system shall answer questions using tenant-scoped retrieval. | High |
| FR-010 | The system shall return citations with document title, page or span, snippet, and score. | High |
| FR-011 | The system shall record chat sessions and messages. | Medium |
| FR-012 | The system shall record token usage and estimated cost. | Medium |

## 4. Interface Requirements

### 4.1 User Interface

The web application shall expose landing, login, registration, and workspace screens. Backend integration shall be implemented through the gateway API only.

### 4.2 API Interface

The Rust gateway shall expose public REST endpoints under `/api`. Internal service URLs shall not be used by the frontend.

### 4.3 Storage Interfaces

The system shall use PostgreSQL for transactional state, MinIO for raw objects, Qdrant for vector search, RabbitMQ for asynchronous work, and Redis for future cache and rate-limit needs.

## 5. Data Requirements

The data model shall include tenants, users, memberships, API keys, documents, document versions, document chunks, ingestion jobs, chat sessions, messages, citations, and usage ledger entries.

All business records that represent tenant-owned data shall include tenant scope.

## 6. Performance Requirements

| ID | Requirement |
| --- | --- |
| PR-001 | Document upload requests shall return after queueing work and shall not wait for embedding completion. |
| PR-002 | Retrieval requests shall avoid cross-service calls not needed for the first answer path. |
| PR-003 | Long-running document processing shall execute in workers. |

## 7. Security Requirements

| ID | Requirement |
| --- | --- |
| SR-001 | Passwords shall be stored as Argon2 hashes. |
| SR-002 | Authenticated API requests shall use bearer tokens. |
| SR-003 | Tenant isolation shall be enforced in PostgreSQL queries and Qdrant filters. |
| SR-004 | Raw object URLs shall not be exposed directly to clients. |
| SR-005 | Tenant A shall not be able to retrieve, search, cite, list, or infer Tenant B data. |

## 8. Reliability and Maintainability Requirements

The system shall keep PostgreSQL as the source of truth for job status. Queue messages shall be treated as transport events, not authoritative state. Backend modules shall keep service, repository, schema, and security responsibilities separate.

## 9. Operational Scenarios

### 9.1 User Registration

A new user submits account and workspace details. The auth service creates a user, tenant, owner membership, and access token.

### 9.2 Document Ingestion

A user uploads a document. The ingestion service stores the raw file, creates document metadata, creates an ingestion job, and publishes work to RabbitMQ.

### 9.3 Question Answering

A user asks a question. The retrieval service searches tenant-scoped chunks, builds context, generates an answer, returns citations, and records usage.

## 10. Acceptance Criteria

| ID | Criterion |
| --- | --- |
| AC-001 | A user can register and receive an access token. |
| AC-002 | A registered user can retrieve current tenant context. |
| AC-003 | A document upload creates document, version, and ingestion job records. |
| AC-004 | A worker can mark a document indexed after processing. |
| AC-005 | A question response includes at least one citation when evidence exists. |
| AC-006 | Tenant isolation tests prove cross-tenant access is denied. |

## 11. References

| Document | Purpose |
| --- | --- |
| `docs/backend-architecture.md` | Backend service architecture. |
| `docs/database.md` | Database schema and migration contract. |
| `docs/tenant-isolation.md` | Tenant isolation requirements. |

## 12. Glossary

| Term | Definition |
| --- | --- |
| RAG | Retrieval-Augmented Generation. |
| Tenant | Isolated workspace or organization. |
| Citation | Link between generated answer text and source document chunk. |
| Ingestion Job | Asynchronous task that processes a document version. |

## 13. Appendices

Additional diagrams, deployment notes, and provider-specific details shall be added as the implementation matures.
