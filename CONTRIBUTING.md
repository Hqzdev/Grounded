# Contributing

Grounded uses a strict contribution workflow because the system is intentionally multi-service and multi-tenant. Fast work is useful only when it does not weaken service boundaries.

## Required Reading

Read these before making non-trivial changes:

1. `README.md`
2. `CODE_STYLE.md`
3. `SECURITY.md`
4. `docs/README.md`
5. `docs/system-requirements-specification.md`
6. `docs/backend-architecture.md`
7. The document that matches the area being changed

## Branches

Use short, scoped branch names.

```text
feature/ingestion-worker
fix/auth-token-validation
docs/backend-requirements
chore/prisma-migration
```

## Commit Rules

Commits should be small enough to review and large enough to represent one coherent change.

Preferred format:

```text
type(scope): summary
```

Examples:

```text
feat(auth): persist tenant memberships
fix(gateway): preserve auth error shape
docs(security): define tenant isolation tests
chore(database): add initial Prisma migration
```

Allowed types:

| Type | Use |
| --- | --- |
| `feat` | User-visible or platform capability. |
| `fix` | Bug fix. |
| `docs` | Documentation-only change. |
| `test` | Test-only change. |
| `refactor` | Behavior-preserving code structure change. |
| `chore` | Tooling, maintenance, or infrastructure support. |
| `ci` | CI pipeline change. |

## Pull Request Requirements

Every pull request must include:

1. Clear summary of the change.
2. Reason for the change.
3. Verification commands and results.
4. Documentation updates when contracts or behavior changed.
5. Security impact statement.
6. Tenant isolation impact statement.

## Required Checks

Run the checks that match the changed area.

| Area | Required Verification |
| --- | --- |
| Web | `npm --workspace apps/web run lint` and `npm --workspace apps/web run build` |
| Database | `npm run db:validate` and `npm run db:generate` |
| Gateway | `cargo check` in `apps/gateway` |
| Python service | `python -m compileall <service>/app` |
| Docs | Markdown structure review and link review |
| Compose | `docker compose -f infra/docker/docker-compose.yml config` |

## Database Changes

Database changes must follow this order:

1. Update `packages/database/prisma/schema.prisma`.
2. Generate a Prisma migration.
3. Validate Prisma schema.
4. Update `docs/database.md`.
5. Update service repositories that depend on the changed model.
6. Add or update tests when behavior changed.

Do not manually edit production databases as a substitute for migrations.

## API Changes

Public API changes must follow this order:

1. Update `docs/api-contracts.md`.
2. Update gateway behavior.
3. Update affected internal service contract.
4. Update frontend API client.
5. Verify frontend behavior.

Do not let React components call internal services directly.

## Security-Sensitive Changes

These changes require extra review:

1. Authentication.
2. Authorization.
3. Tenant isolation.
4. Password handling.
5. Token handling.
6. Object storage access.
7. Vector search filtering.
8. Queue payload design.
9. Provider credentials.
10. Error response behavior.

## What Will Be Rejected

1. Code comments.
2. Dead code.
3. Placeholder implementations presented as finished work.
4. Cross-tenant queries without tenant filters.
5. Frontend calls to internal service URLs.
6. Schema changes without documentation updates.
7. API changes without contract updates.
8. Dependencies added without a clear reason.
9. Broad refactors mixed with feature work.
10. Security-sensitive behavior hidden in generic helper code.
