# Local Development Environment Specification

| Field | Value |
| --- | --- |
| Project | Grounded |
| Document Type | Operational Requirements Specification |
| Version | 0.1 |
| Revision Date | 2026-06-30 |
| Status | Draft |
| Owner | Engineering |

## Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-30 | Engineering | Initial local development environment specification. |

## Review and Approval

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Engineering Owner | TBD | Pending | TBD |

## Contents

1. Purpose
2. Scope
3. Development Principle
4. Runtime Components
5. Configuration Requirements
6. Startup Procedure
7. Database Procedure
8. Backend Smoke Procedure
9. Verification Requirements
10. Service URLs
11. Acceptance Criteria
12. References
13. Glossary

## 1. Purpose

This document defines the local development environment for Grounded. It exists to keep backend implementation practical before Kubernetes, Terraform, and production deployment work are introduced.

## 2. Scope

The scope includes local service composition, required environment variables, database commands, service URLs, and developer verification expectations.

## 3. Development Principle

The local Docker Compose pipeline shall work before Kubernetes, Terraform, GitOps, or production observability are added. Skipping this step would hide core product risk behind infrastructure work.

## 4. Runtime Components

| Component | Purpose |
| --- | --- |
| `web` | Next.js frontend. |
| `gateway` | Public Rust API gateway. |
| `auth` | Authentication and tenant service. |
| `ingestion` | Document intake service. |
| `embedding` | Background worker for parsing, chunking, and embeddings. |
| `retrieval` | Question answering and citation service. |
| `postgres` | Transactional source of truth. |
| `redis` | Cache and future rate-limit runtime. |
| `qdrant` | Vector database. |
| `rabbitmq` | Asynchronous job transport. |
| `minio` | Raw object storage. |

## 5. Configuration Requirements

| ID | Requirement |
| --- | --- |
| LCR-001 | Each service shall read local configuration from environment variables. |
| LCR-002 | Example environment files shall avoid production secrets. |
| LCR-003 | Auth shall require `JWT_SECRET`, `JWT_ISSUER`, and `JWT_AUDIENCE`. |
| LCR-004 | Production deployments shall replace all local development secrets. |
| LCR-005 | The frontend shall use the gateway URL, not internal service URLs. |

## 6. Startup Procedure

The local environment shall start through Docker Compose.

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

This command is the expected first operational path for a new developer.

## 7. Database Procedure

The database package shall be prepared through Prisma commands.

```bash
npm install
npm run db:validate
npm run db:migrate
```

Schema edits shall be made in `packages/database/prisma/schema.prisma` and committed with migrations.

## 8. Verification Requirements

## 8. Backend Smoke Procedure

After Docker Compose is running and migrations have been applied, run the backend smoke test.

```bash
npm run smoke:backend
```

The smoke test registers a user, uploads a Markdown document, waits for indexing, asks a question, and verifies that the response includes citations.

Required local commands:

| Command | Purpose |
| --- | --- |
| `curl` | Calls gateway endpoints. |
| `python3` | Parses JSON responses inside the script. |
| `npm` | Runs the repository script. |

The smoke test accepts `GATEWAY_URL`, `SMOKE_EMAIL`, `SMOKE_PASSWORD`, `SMOKE_NAME`, `SMOKE_TENANT_NAME`, and `SMOKE_TENANT_SLUG` environment overrides.

## 9. Verification Requirements

| ID | Requirement |
| --- | --- |
| LVR-001 | The web application shall start without direct backend service configuration in components. |
| LVR-002 | The gateway health endpoint shall respond locally. |
| LVR-003 | Auth health shall respond locally. |
| LVR-004 | Prisma validation shall pass after schema changes. |
| LVR-005 | Python service import or compile checks shall pass after service changes. |
| LVR-006 | Rust gateway checks shall pass after gateway changes. |
| LVR-007 | Backend smoke tests shall pass before treating ingestion and retrieval as integrated. |

## 10. Service URLs

| Service | URL |
| --- | --- |
| Web | `http://localhost:3000` |
| Gateway | `http://localhost:8080/health` |
| Auth | `http://localhost:8001/health` |
| Ingestion | `http://localhost:8002/health` |
| Retrieval | `http://localhost:8004/health` |
| Qdrant | `http://localhost:6333` |
| RabbitMQ | `http://localhost:15672` |
| MinIO | `http://localhost:9001` |

## 11. Acceptance Criteria

| ID | Criterion |
| --- | --- |
| LAC-001 | A developer can start the local stack with Docker Compose. |
| LAC-002 | A developer can validate and run database migrations through Prisma. |
| LAC-003 | Health endpoints identify whether core services are running. |
| LAC-004 | Local configuration is documented without production secrets. |
| LAC-005 | The documented service URLs match Compose port mappings. |
| LAC-006 | Backend smoke test proves registration, ingestion, indexing, retrieval, and citations. |

## 12. References

| Document | Description |
| --- | --- |
| `backend-architecture.md` | Runtime service architecture. |
| `database.md` | Prisma schema and migration rules. |
| `api-contracts.md` | Gateway integration requirements. |

## 13. Glossary

| Term | Definition |
| --- | --- |
| Docker Compose | Local orchestration tool for development services. |
| Local Secret | Development-only credential that must not be reused in production. |
| Health Endpoint | Route used to confirm whether a service is running. |
