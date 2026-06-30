# API Contract Specification

| Field | Value |
| --- | --- |
| Project | Grounded |
| Document Type | Interface Requirements Specification |
| Version | 0.1 |
| Revision Date | 2026-06-30 |
| Status | Draft |
| Owner | Engineering |

## Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-30 | Engineering | Initial public API contract specification. |

## Review and Approval

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Product Owner | TBD | Pending | TBD |
| Engineering Owner | TBD | Pending | TBD |
| Security Reviewer | TBD | Pending | TBD |

## Contents

1. Purpose
2. Scope
3. API Ownership
4. Public Route Requirements
5. Authentication Requirements
6. Tenant Context Requirements
7. Request and Response Requirements
8. Error Handling Requirements
9. Versioning Requirements
10. Frontend Integration Requirements
11. Acceptance Criteria
12. References
13. Glossary

## 1. Purpose

This document defines the public API contract for Grounded. It describes the gateway-facing interface that the web application may use and the stability rules that backend services must preserve.

## 2. Scope

The scope includes public gateway routes, request shapes, response shapes, authentication behavior, tenant context propagation, error responses, and versioning rules. Internal service-to-service contracts are outside this document unless they affect public behavior.

## 3. API Ownership

The Rust gateway is the public API owner. The frontend shall communicate with the gateway only. Python services may change internal route names, transport details, or DTOs when the gateway contract remains stable.

## 4. Public Route Requirements

| ID | Method | Route | Requirement |
| --- | --- | --- | --- |
| API-001 | GET | `/health` | The gateway shall expose a direct health endpoint. |
| API-002 | GET | `/api/health` | The gateway shall expose a frontend-compatible health endpoint. |
| API-003 | POST | `/api/auth/register` | The gateway shall register a user and initial workspace. |
| API-004 | POST | `/api/auth/login` | The gateway shall authenticate a user and return an access token. |
| API-005 | GET | `/api/auth/me` | The gateway shall return the authenticated user and tenant context. |
| API-006 | GET | `/api/tenants/current` | The gateway shall return the current tenant context. |
| API-007 | POST | `/api/tenants` | The gateway shall create a tenant for an authenticated user. |
| API-008 | GET | `/api/documents` | The gateway shall list tenant-scoped documents. |
| API-009 | POST | `/api/documents` | The gateway shall accept document upload requests. |
| API-010 | GET | `/api/documents/:id` | The gateway shall return one tenant-scoped document. |
| API-011 | GET | `/api/documents/:id/jobs` | The gateway shall return ingestion job status for a document. |
| API-012 | POST | `/api/chat/sessions` | The gateway shall create chat sessions. |
| API-013 | GET | `/api/chat/sessions` | The gateway shall list tenant-scoped chat sessions. |
| API-014 | GET | `/api/chat/sessions/:id` | The gateway shall return a chat session with messages. |
| API-015 | POST | `/api/chat/sessions/:id/messages` | The gateway shall accept a user question and return an answer. |
| API-016 | GET | `/api/sources` | The gateway shall list tenant-scoped source documents. |
| API-017 | GET | `/api/usage` | The gateway shall return tenant-scoped usage records. |
| API-018 | POST | `/api/questions` | The gateway shall accept a tenant-scoped question and return an extractive cited answer. |
| API-019 | POST | `/api/auth/refresh` | The gateway shall rotate refresh tokens and return a new access token. |
| API-020 | POST | `/api/auth/logout` | The gateway shall revoke the current session. |
| API-021 | POST | `/api/auth/email/verify` | The gateway shall verify email tokens. |
| API-022 | POST | `/api/auth/password/forgot` | The gateway shall initiate password reset without user enumeration. |
| API-023 | POST | `/api/auth/password/reset` | The gateway shall complete one-time password reset. |
| API-024 | GET | `/api/auth/sessions` | The gateway shall list authenticated user sessions. |

## 5. Authentication Requirements

### 5.1 Registration Request

```json
{
  "email": "ada@example.com",
  "password": "correct horse battery staple",
  "name": "Ada Lovelace",
  "tenant_name": "Northwind Legal",
  "tenant_slug": "northwind-legal"
}
```

Registration shall create the user, tenant, owner membership, and bearer token in one transactional workflow.

### 5.2 Login Response

```json
{
  "access_token": "token",
  "token_type": "bearer",
  "user": {
    "id": "usr_123",
    "email": "ada@example.com",
    "name": "Ada Lovelace"
  },
  "tenant": {
    "id": "ten_123",
    "slug": "northwind-legal",
    "name": "Northwind Legal",
    "role": "owner"
  }
}
```

Authenticated requests shall include the access token in the `Authorization` header.

```text
Authorization: Bearer <access_token>
```

## 6. Tenant Context Requirements

| ID | Requirement |
| --- | --- |
| TCR-001 | Tenant context shall be derived from authenticated membership. |
| TCR-002 | The gateway shall forward tenant context to internal services for tenant-owned routes. |
| TCR-003 | Internal services shall reject tenant-owned operations when tenant context is missing. |
| TCR-004 | Client-supplied tenant identifiers shall not override authenticated tenant context. |

## 7. Request and Response Requirements

### 7.1 Document Create Request

```json
{
  "filename": "contract.md",
  "title": "Contract",
  "content_type": "text/markdown",
  "content": "# Contract\nTermination requires 30 days notice."
}
```

The current implementation accepts text and Markdown content as JSON. Multipart file upload is a later API expansion.

### 7.2 Document Create Response

```json
{
  "document": {
    "id": "doc_123",
    "tenant_id": "ten_123",
    "title": "Contract",
    "filename": "contract.md",
    "content_type": "text/markdown",
    "status": "queued",
    "current_version": 1,
    "created_at": "2026-06-30T00:00:00Z",
    "updated_at": "2026-06-30T00:00:00Z"
  },
  "version": {
    "id": "ver_123",
    "version": 1,
    "object_key": "ten_123/doc_123/1/contract.md",
    "checksum": "sha256",
    "byte_size": 48,
    "created_at": "2026-06-30T00:00:00Z"
  },
  "job": {
    "id": "job_123",
    "tenant_id": "ten_123",
    "document_id": "doc_123",
    "document_version_id": "ver_123",
    "status": "queued",
    "attempts": 0,
    "error_code": null,
    "error_message": null,
    "queued_at": "2026-06-30T00:00:00Z",
    "started_at": null,
    "finished_at": null
  }
}
```

### 7.3 Question Request

```json
{
  "question": "What does this contract say about termination?",
  "session_id": "ses_123"
}
```

`session_id` is optional. Tenant context shall come from the bearer token, not from the request body.

### 7.4 Question Response

```json
{
  "session_id": "ses_123",
  "user_message_id": "msg_123",
  "assistant_message_id": "msg_124",
  "answer": "Based on the indexed sources, termination requires 30 days notice.",
  "citations": [
    {
      "document_id": "doc_123",
      "document_title": "Contract",
      "chunk_id": "chk_123",
      "snippet": "Termination requires 30 days notice.",
      "score": 0.91,
      "source_start": 0,
      "source_end": 38
    }
  ],
  "created_at": "2026-06-30T00:00:00Z"
}
```

| ID | Requirement |
| --- | --- |
| RSR-001 | Public JSON fields shall use stable names once connected to the frontend. |
| RSR-002 | Identifiers shall be returned as strings. |
| RSR-003 | Date-time values shall use ISO 8601 strings. |
| RSR-004 | Paginated list endpoints shall support explicit limit and cursor or page parameters before production use. |
| RSR-005 | Upload endpoints shall return document and job state without blocking on embeddings. |

## 8. Error Handling Requirements

All public errors shall use a consistent shape.

```json
{
  "error": {
    "code": "document_not_found",
    "message": "Document was not found in this workspace.",
    "requestId": "req_123"
  }
}
```

| ID | Requirement |
| --- | --- |
| ERR-001 | Error messages shall not reveal cross-tenant resource existence. |
| ERR-002 | Validation errors shall identify invalid public fields. |
| ERR-003 | Authentication failures shall return a stable unauthorized error code. |
| ERR-004 | Authorization failures shall not expose internal policy details. |
| ERR-005 | Server errors shall include request identifiers for support and diagnostics. |

## 9. Versioning Requirements

The first API version shall use the `/api` prefix. Breaking public changes shall be introduced under a versioned prefix only when the frontend and backend must support parallel behavior.

## 10. Frontend Integration Requirements

The web application shall keep API integration in a shared API client module. Components shall not hardcode service URLs, internal route paths, or authentication header construction.

## 11. Acceptance Criteria

| ID | Criterion |
| --- | --- |
| AAC-001 | The frontend can register and log in through gateway routes only. |
| AAC-002 | Authenticated requests include bearer tokens. |
| AAC-003 | Tenant-owned routes require tenant context. |
| AAC-004 | Public errors use the documented error shape. |
| AAC-005 | Internal service URLs are not referenced by web components. |

## 12. References

| Document | Description |
| --- | --- |
| `software-requirements-specification.md` | Product-level requirements. |
| `backend-architecture.md` | Gateway and service ownership. |
| `tenant-isolation.md` | Tenant context and isolation requirements. |

## 13. Glossary

| Term | Definition |
| --- | --- |
| Public API | Gateway routes used by the frontend or external clients. |
| Internal API | Service routes used behind the gateway. |
| Request Identifier | Unique value used to correlate errors with logs. |
