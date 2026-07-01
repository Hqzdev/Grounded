# Retrieval Pipeline Requirements

| Field | Value |
| --- | --- |
| Project | Grounded |
| Document Type | Retrieval Requirements Specification |
| Version | 0.1 |
| Revision Date | 2026-06-30 |
| Status | Draft |
| Owner | Engineering |

## Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-30 | Engineering | Initial retrieval pipeline requirements. |

## Review and Approval

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Engineering Owner | TBD | Pending | TBD |
| Security Reviewer | TBD | Pending | TBD |

## Contents

1. Purpose
2. Scope
3. Pipeline Overview
4. Functional Requirements
5. Citation Requirements
6. Usage Requirements
7. Acceptance Criteria
8. References
9. Glossary

## 1. Purpose

This document defines requirements for answering tenant-scoped questions with verifiable citations.

## 2. Scope

The scope includes question intake, tenant validation, vector search, context construction, answer generation, citation persistence, and usage recording.

## 3. Pipeline Overview

```text
Question
  -> Tenant Context
  -> Question Embedding
  -> Qdrant Search
  -> PostgreSQL Chunk Lookup
  -> Context Assembly
  -> Answer Provider
  -> Citation Persistence
  -> Usage Ledger
```

## 4. Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| RPR-001 | The retrieval service shall reject requests without tenant context. | High |
| RPR-002 | The retrieval service shall embed user questions with the local deterministic provider until external providers are enabled. | High |
| RPR-003 | The retrieval service shall search Qdrant with a tenant filter. | High |
| RPR-004 | The retrieval service shall load chunk metadata from PostgreSQL. | High |
| RPR-005 | The retrieval service shall build answer context from retrieved chunks. | High |
| RPR-006 | The retrieval service shall return an answer and citations. | High |
| RPR-007 | The retrieval service shall persist messages and citations. | Medium |
| RPR-008 | The retrieval service shall record provider usage. | Medium |
| RPR-009 | The retrieval service shall select embedding and answer providers from runtime configuration. | Medium |

## 5. Citation Requirements

Each citation shall include document identifier, document title, page or span metadata, source snippet, and retrieval score. An answer that uses document facts shall include citations.

## 6. Usage Requirements

Usage records shall include tenant, provider, model, input tokens, output tokens, total tokens, estimated cost, and event type.

Default local development uses `EMBEDDING_PROVIDER=local`, `EMBEDDING_MODEL=local-hash-v1`, `ANSWER_PROVIDER=local`, and `ANSWER_MODEL=local-extractive-v1`. External providers must preserve tenant filtering, citation persistence, and usage ledger recording.

Supported provider modes:

| Mode | Variables |
| --- | --- |
| Local deterministic MVP | `EMBEDDING_PROVIDER=local`, `ANSWER_PROVIDER=local` |
| OpenAI hosted quality | `EMBEDDING_PROVIDER=openai`, `ANSWER_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_BASE_URL` |
| Ollama local models | `EMBEDDING_PROVIDER=ollama`, `ANSWER_PROVIDER=ollama`, `OLLAMA_BASE_URL` |

Embedding model output dimensions must match `EMBEDDING_DIMENSIONS` and the Qdrant collection dimensions. Changing embedding provider or dimensions requires re-indexing documents into a compatible collection.

OpenAI mode defaults to `text-embedding-3-small` and `gpt-4o-mini` when the local model names are left unchanged. Ollama mode defaults to `nomic-embed-text` and `llama3.2` when the local model names are left unchanged; operators must pull those models before using the mode.

## 7. Acceptance Criteria

| ID | Criterion |
| --- | --- |
| RAC-001 | A question response includes citations when retrieved evidence exists. |
| RAC-002 | Qdrant search includes tenant payload filtering. |
| RAC-003 | Assistant messages and citations are persisted together. |
| RAC-004 | Usage ledger records are created for answer generation. |
| RAC-005 | Tenant context is read from the bearer token, not the request body. |
| RAC-006 | Provider and model values are not hardcoded in repository writes. |

## 8. References

| Document | Description |
| --- | --- |
| `database.md` | Message, citation, chunk, and usage models. |
| `tenant-isolation.md` | Tenant filter requirements. |

## 9. Glossary

| Term | Definition |
| --- | --- |
| Context | Retrieved source material sent to the LLM. |
| Citation | Evidence reference returned with an answer. |
| Reranking | Later-stage relevance sorting after initial retrieval. |
