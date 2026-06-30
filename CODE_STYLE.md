# Code Style

Grounded code must be boring in the best sense: explicit, small, testable, and hard to misuse.

## Core Rules

1. Do not write comments in code.
2. Prefer self-documenting names over explanations.
3. Keep functions short and single-purpose.
4. Keep modules focused on one reason to change.
5. Prefer composition over inheritance.
6. Do not add dead code, placeholder code, commented-out code, or unused abstractions.
7. Do not hide architectural uncertainty inside generic helpers.
8. Do not bypass tenant isolation for convenience.

## Naming

Names must reveal domain intent.

Good names:

```text
TenantMembershipRepository
DocumentIngestionService
createAccessToken
findTenantDocuments
```

Weak names:

```text
Manager
Helper
Data
process
handleStuff
```

## TypeScript and React

1. Components must not call internal backend services directly.
2. Components must use shared API client modules for backend calls.
3. UI state must stay close to the component that owns it.
4. Shared state must exist only when multiple screens genuinely need it.
5. Mock data must be isolated from production API clients.
6. Components must be named by product role, not visual shape only.
7. Avoid decorative abstractions that only wrap one element.

## Python Services

1. Route handlers should coordinate request parsing and response mapping only.
2. Service classes own business decisions.
3. Repository classes own database access.
4. Schema classes own request and response validation.
5. Security code must stay isolated from feature code.
6. Tenant context must be passed explicitly into service and repository methods.
7. Exceptions must map to stable public errors at the service boundary.

## Rust Gateway

1. The gateway owns the public API boundary.
2. Gateway handlers should validate boundary concerns and forward to internal services.
3. Internal service URLs must come from configuration.
4. Public response shapes must remain stable once connected to the frontend.
5. Request identifiers must be propagated when implemented.

## Prisma and Database

1. `packages/database/prisma/schema.prisma` is the canonical relational schema.
2. Schema changes require migrations.
3. Manual production database patching is not allowed.
4. Tenant-owned records must include tenant scope.
5. Repository queries must filter tenant-owned reads by tenant.
6. Destructive migrations require explicit review.

## API Contracts

1. Public API changes must update `docs/api-contracts.md`.
2. Breaking frontend-facing changes require coordinated frontend updates.
3. Internal service changes may move faster when the gateway contract remains stable.
4. Error shapes must stay consistent across public routes.
5. Cross-tenant errors must not disclose resource existence.

## Dependencies

1. Add dependencies only when they remove real implementation risk.
2. Do not add libraries for trivial wrappers, formatting, or one-off helpers.
3. Prefer mature libraries for authentication, cryptography, parsing, and protocol clients.
4. Every new dependency must have an owner and a reason.
5. Security-sensitive dependencies require extra review.

## Tests and Verification

1. Backend changes require the narrowest meaningful test or compile check.
2. Schema changes require Prisma validation and generation.
3. Gateway changes require Rust checks.
4. Web changes require lint or build checks.
5. Tenant isolation changes require cross-tenant negative cases.

## Documentation

1. Architecture changes must update `docs/backend-architecture.md`.
2. Database changes must update `docs/database.md`.
3. API changes must update `docs/api-contracts.md`.
4. Ingestion changes must update `docs/ingestion-pipeline.md`.
5. Retrieval changes must update `docs/retrieval-pipeline.md`.
6. Security-sensitive changes must update `docs/tenant-isolation.md`.
