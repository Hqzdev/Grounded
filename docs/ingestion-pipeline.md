# Ingestion Pipeline Requirements

| Field | Value |
| --- | --- |
| Project | Grounded |
| Document Type | Pipeline Requirements Specification |
| Version | 0.1 |
| Revision Date | 2026-06-30 |
| Status | Draft |
| Owner | Engineering |

## Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-30 | Engineering | Initial ingestion pipeline requirements. |

## Review and Approval

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Engineering Owner | TBD | Pending | TBD |

## Contents

1. Purpose
2. Scope
3. Pipeline Overview
4. Functional Requirements
5. Worker Requirements
6. Error Handling Requirements
7. Acceptance Criteria
8. References
9. Glossary

## 1. Purpose

This document defines requirements for turning user-uploaded documents into indexed chunks ready for retrieval.

## 2. Scope

The scope includes document metadata creation, raw object storage, job creation, queue publishing, worker processing, chunk persistence, and status updates.

## 3. Pipeline Overview

```text
Frontend
  -> Gateway
  -> Ingestion Service
  -> PostgreSQL
  -> MinIO
  -> RabbitMQ
  -> Embedding Worker
  -> PostgreSQL
  -> Qdrant
```

## 4. Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| IPR-001 | The ingestion service shall create a `Document` record for each accepted upload. | High |
| IPR-002 | The ingestion service shall create a `DocumentVersion` record for each raw object. | High |
| IPR-003 | The ingestion service shall store raw objects in MinIO. | High |
| IPR-004 | The ingestion service shall create an `IngestionJob` record. | High |
| IPR-005 | The ingestion service shall publish a job message to RabbitMQ. | High |
| IPR-006 | The upload response shall return document and job status without waiting for embeddings. | High |

## 5. Worker Requirements

| ID | Requirement |
| --- | --- |
| IWR-001 | The worker shall load authoritative job state from PostgreSQL. |
| IWR-002 | The worker shall mark jobs as running before processing. |
| IWR-003 | The worker shall parse raw documents into text. |
| IWR-004 | The worker shall split text into deterministic chunks. |
| IWR-005 | The worker shall write chunk metadata to PostgreSQL. |
| IWR-006 | The worker shall write chunk metadata to PostgreSQL. |
| IWR-007 | The worker shall write vectors to Qdrant with tenant payloads. |
| IWR-008 | The worker shall mark documents indexed after successful processing. |

## 6. Error Handling Requirements

Failed jobs shall store error code, error message, attempt count, and terminal status when retries are exhausted. Duplicate queue delivery shall not create duplicate chunks for the same document version.

## 7. Acceptance Criteria

| ID | Criterion |
| --- | --- |
| IAC-001 | Uploading a document creates document, version, and job records. |
| IAC-002 | A job message contains an identifier, not the full document payload. |
| IAC-003 | Worker processing is idempotent for a document version. |
| IAC-004 | Failed processing updates job and document status. |
| IAC-005 | Text and Markdown documents can move from queued to indexed locally. |
| IAC-006 | Indexed documents have PostgreSQL chunks and Qdrant vector points. |

## 8. References

| Document | Description |
| --- | --- |
| `database.md` | Document and job data model. |
| `backend-architecture.md` | Service ownership. |

## 9. Glossary

| Term | Definition |
| --- | --- |
| Raw Object | Original uploaded document stored in MinIO. |
| Chunk | Searchable text span derived from a document version. |
| Job | Asynchronous unit of ingestion work. |
