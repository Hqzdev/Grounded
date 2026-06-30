# Tenant Isolation and Security Specification

| Field | Value |
| --- | --- |
| Project | Grounded |
| Document Type | Security Requirements Specification |
| Version | 0.1 |
| Revision Date | 2026-06-30 |
| Status | Draft |
| Owner | Engineering |

## Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-30 | Engineering | Initial tenant isolation and security requirements. |

## Review and Approval

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Engineering Owner | TBD | Pending | TBD |
| Security Reviewer | TBD | Pending | TBD |

## Contents

1. Purpose
2. Scope
3. Security Objective
4. Isolation Guarantees
5. Enforcement Requirements
6. Error Disclosure Requirements
7. Test Requirements
8. Acceptance Criteria
9. References
10. Glossary

## 1. Purpose

This document defines tenant isolation requirements for Grounded. Tenant isolation is a launch requirement, not a later hardening task.

## 2. Scope

The scope includes API access, PostgreSQL queries, Qdrant vector search, MinIO object keys, RabbitMQ job payloads, citations, usage records, and error behavior.

## 3. Security Objective

Grounded shall prevent one tenant from reading, searching, citing, listing, modifying, inferring, or deleting another tenant's data.

## 4. Isolation Guarantees

| ID | Guarantee |
| --- | --- |
| TIG-001 | Tenant A cannot list Tenant B documents. |
| TIG-002 | Tenant A cannot retrieve Tenant B document chunks. |
| TIG-003 | Tenant A cannot search Tenant B vectors. |
| TIG-004 | Tenant A cannot cite Tenant B sources. |
| TIG-005 | Tenant A cannot access Tenant B chat sessions or messages. |
| TIG-006 | Tenant A cannot view Tenant B usage events. |
| TIG-007 | Tenant A cannot infer Tenant B document names from errors. |
| TIG-008 | Tenant A cannot trigger worker processing for Tenant B documents. |

## 5. Enforcement Requirements

### 5.1 Gateway

| ID | Requirement |
| --- | --- |
| TIE-001 | The gateway shall authenticate tenant-owned requests before proxying them. |
| TIE-002 | The gateway shall forward authenticated tenant context to internal services. |
| TIE-003 | The gateway shall not trust tenant identifiers from request bodies as authorization proof. |

### 5.2 Services

| ID | Requirement |
| --- | --- |
| TIE-004 | Repository methods shall receive `tenantId` explicitly for tenant-owned operations. |
| TIE-005 | Service methods shall validate resource ownership before returning data. |
| TIE-006 | Background jobs shall load tenant and document state from PostgreSQL before processing. |

### 5.3 PostgreSQL

| ID | Requirement |
| --- | --- |
| TIE-007 | Tenant-owned tables shall include `tenantId`. |
| TIE-008 | Tenant-owned queries shall filter by `tenantId`. |
| TIE-009 | Tenant-owned indexes shall include `tenantId` where it is part of the access path. |

### 5.4 Qdrant

| ID | Requirement |
| --- | --- |
| TIE-010 | Every vector point shall include tenant payload metadata. |
| TIE-011 | Every vector search shall include a tenant filter. |
| TIE-012 | Vector payloads shall not contain sensitive raw document content beyond required retrieval metadata. |

### 5.5 MinIO

| ID | Requirement |
| --- | --- |
| TIE-013 | Object keys shall include tenant and document version identifiers. |
| TIE-014 | Raw object URLs shall not be exposed directly to clients. |
| TIE-015 | Object access shall be mediated by backend authorization. |

### 5.6 RabbitMQ

| ID | Requirement |
| --- | --- |
| TIE-016 | Queue messages shall reference job identifiers instead of carrying full document payloads. |
| TIE-017 | Workers shall treat queue messages as hints and verify authoritative state in PostgreSQL. |

## 6. Error Disclosure Requirements

| ID | Requirement |
| --- | --- |
| EDR-001 | Missing and unauthorized cross-tenant resources shall use indistinguishable public responses where appropriate. |
| EDR-002 | Error responses shall not include internal service URLs, storage keys, provider credentials, or raw stack traces. |
| EDR-003 | Diagnostic details shall be written to logs with request identifiers instead of public responses. |

## 7. Test Requirements

The first isolation test suite shall create two tenants and verify that each tenant can only access its own documents, chunks, messages, citations, jobs, sources, and usage events.

| ID | Test Requirement |
| --- | --- |
| TIT-001 | Cross-tenant document list access is denied. |
| TIT-002 | Cross-tenant document detail access is denied. |
| TIT-003 | Cross-tenant vector retrieval is denied by Qdrant filters. |
| TIT-004 | Cross-tenant citation lookup is denied. |
| TIT-005 | Cross-tenant usage lookup is denied. |
| TIT-006 | Cross-tenant job processing is rejected or ignored after state validation. |

## 8. Acceptance Criteria

| ID | Criterion |
| --- | --- |
| TAC-001 | Tenant-owned database queries include tenant scope. |
| TAC-002 | Vector search cannot execute without a tenant filter. |
| TAC-003 | Raw object access requires backend authorization. |
| TAC-004 | Public errors do not disclose cross-tenant resource existence. |
| TAC-005 | Automated tests prove denied cross-tenant access. |

## 9. References

| Document | Description |
| --- | --- |
| `software-requirements-specification.md` | Product-level security requirements. |
| `database.md` | Tenant-scoped data model. |
| `api-contracts.md` | Authentication and public error contracts. |

## 10. Glossary

| Term | Definition |
| --- | --- |
| Tenant Isolation | Enforcement that keeps workspace data separated between tenants. |
| Tenant Context | Authenticated tenant identifier and membership role used for authorization. |
| Disclosure | Accidental revelation of data or metadata through a response, error, or timing behavior. |
