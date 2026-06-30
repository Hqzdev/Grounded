# Contributors

This file records contributor roles and ownership expectations for Grounded.

## Maintainers

| Role | Responsibility | Owner |
| --- | --- | --- |
| Product Owner | Product direction, requirements priority, acceptance decisions | TBD |
| Engineering Owner | Architecture, service boundaries, code quality, release readiness | TBD |
| Security Reviewer | Tenant isolation, authentication, authorization, secret handling | TBD |

## Area Ownership

| Area | Primary Responsibility |
| --- | --- |
| `apps/web` | Frontend product experience and gateway API integration |
| `apps/gateway` | Public API boundary, proxying, gateway security, response stability |
| `services/auth` | Users, tenants, memberships, tokens, API keys, roles |
| `services/ingestion` | Upload intake, document metadata, object storage, job creation |
| `services/embedding` | Queue consumption, parsing, chunking, embeddings, vector writes |
| `services/retrieval` | Tenant-scoped search, answer generation, citations, usage records |
| `packages/database` | Prisma schema, migrations, relational data model |
| `packages/contracts` | Public API contract artifacts |
| `infra/docker` | Local development runtime |
| `docs` | Requirements, architecture, process, and security documentation |

## Contributor Expectations

Contributors are expected to:

1. Follow `CODE_STYLE.md`.
2. Follow `CONTRIBUTING.md`.
3. Respect `SECURITY.md`.
4. Keep tenant isolation explicit.
5. Keep documentation aligned with behavior.
6. Provide verification evidence in pull requests.

## Ownership Rule

Every non-trivial change must have an accountable owner. If ownership is unclear, the change is not ready.
