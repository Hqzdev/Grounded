# Security Policy

Grounded is a multi-tenant RAG platform. Security mistakes can expose customer documents, generated answers, citations, usage records, and provider credentials.

## Supported Versions

| Version | Supported |
| --- | --- |
| `0.1.x` | Yes |

## Reporting a Vulnerability

Report vulnerabilities privately to the project owner. Do not create public issues for exploitable security problems.

Include:

1. Affected component.
2. Reproduction steps.
3. Expected impact.
4. Logs or request examples with secrets removed.
5. Suggested fix if known.

## Security Principles

1. Tenant isolation is mandatory.
2. PostgreSQL is the source of truth for authorization-relevant state.
3. Qdrant searches must include tenant filters.
4. MinIO object access must be mediated by backend authorization.
5. RabbitMQ messages must not carry raw document payloads.
6. Secrets must never be committed.
7. Public errors must not disclose cross-tenant resource existence.
8. Internal service URLs must not be exposed to the frontend.
9. Provider credentials must stay server-side.
10. Authentication and authorization code must be easy to audit.

## Secrets

Never commit:

1. JWT secrets.
2. Database credentials for shared or production systems.
3. Object storage credentials for shared or production systems.
4. LLM provider API keys.
5. OAuth client secrets.
6. Private keys.
7. Session signing keys.

Example files may contain development-only dummy values.

## Tenant Isolation Requirements

Every tenant-owned read, write, search, citation, usage lookup, and job operation must carry tenant context.

Protected data includes:

1. Tenants.
2. Users and memberships.
3. Documents.
4. Document versions.
5. Chunks.
6. Vectors.
7. Chat sessions.
8. Messages.
9. Citations.
10. Usage ledger entries.
11. Raw objects.
12. Ingestion jobs.

## Dependency Security

New dependencies require review when they affect:

1. Authentication.
2. Authorization.
3. Cryptography.
4. File parsing.
5. Network calls.
6. Serialization.
7. Database access.
8. Provider SDKs.

Do not run automatic major-version security fixes without reviewing the resulting dependency graph.

## Security Review Triggers

Request security review for changes that touch:

1. Token creation or validation.
2. Password hashing.
3. Tenant filters.
4. Qdrant payloads.
5. MinIO object keys or access.
6. Error responses.
7. API gateway proxy logic.
8. Queue payloads.
9. Environment variable handling.
10. CI secrets.
