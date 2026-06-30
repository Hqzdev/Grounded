# Continuous Integration And Delivery

| Field | Value |
| --- | --- |
| Project | Grounded |
| Document Type | CI/CD Specification |
| Version | 0.1 |
| Revision Date | 2026-06-30 |
| Status | Draft |
| Owner | Engineering |

## Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-30 | Engineering | Initial CI hardening and delivery roadmap. |

## Review and Approval

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Engineering Owner | TBD | Pending | TBD |
| Security Reviewer | TBD | Pending | TBD |
| Operations Owner | TBD | Pending | TBD |

## Contents

1. Purpose
2. Current CI Scope
3. Required Branch Policy
4. Required Pull Request Checks
5. Docker Build Validation
6. Delivery Roadmap
7. Required Secrets
8. Acceptance Criteria

## 1. Purpose

This document defines the controlled continuous integration and delivery model for Grounded. The current implementation focuses on reliable validation before delivery automation is introduced.

## 2. Current CI Scope

The CI workflow runs on pull requests and pushes to `main`.

| Job | Responsibility |
| --- | --- |
| `database` | Validate the Prisma schema and generate the Prisma client. |
| `python-services` | Install service dependencies and compile Python application modules. |
| `gateway` | Run Rust type checking for the public API gateway. |
| `web` | Run web linting and production build validation. |
| `docker-build` | Build all local runtime images without pushing them to a registry. |

## 3. Required Branch Policy

All non-trivial work must use a feature branch. Branch names must describe the change type and scope.

Allowed branch prefixes:

| Prefix | Use Case |
| --- | --- |
| `feature/` | Product or backend capability work. |
| `fix/` | Bug fixes and regressions. |
| `ci/` | Continuous integration, release, and pipeline work. |
| `docs/` | Documentation-only changes. |
| `chore/` | Tooling, dependency, and repository maintenance. |
| `security/` | Security hardening and vulnerability fixes. |

Protected branch rules for `main` should require:

| Rule | Required Setting |
| --- | --- |
| Direct pushes | Disabled |
| Pull request review | Required |
| Required checks | `database`, `python-services`, `gateway`, `web`, `docker-build` |
| Conversation resolution | Required |
| Force push | Disabled |
| Branch deletion | Disabled |

## 4. Required Pull Request Checks

Before a pull request can merge, the following commands must pass locally or in CI:

```bash
npm run check:database
npm run check:backend
npm run check:web
docker compose -f infra/docker/docker-compose.yml build gateway auth ingestion embedding retrieval web
```

Backend behavior changes should also run:

```bash
npm run smoke:backend
```

## 5. Docker Build Validation

The Docker build job verifies that service Dockerfiles, workspace paths, dependency files, and build contexts remain valid. It does not publish images.

Image publishing must be introduced only after a target registry and deployment environment are defined.

## 6. Delivery Roadmap

CD will be added in controlled phases.

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | CI validation for source, schema, and Docker builds. | Active |
| 2 | Publish versioned Docker images to a registry. | Planned |
| 3 | Deploy to a staging environment after `main` passes. | Planned |
| 4 | Run migrations through a controlled release job. | Planned |
| 5 | Promote staging builds to production through manual approval. | Planned |

## 7. Required Secrets

The following secrets are required before CD can be enabled:

| Secret | Purpose |
| --- | --- |
| `REGISTRY_USERNAME` | Container registry authentication. |
| `REGISTRY_TOKEN` | Container registry push access. |
| `STAGING_DATABASE_URL` | Staging database migrations and smoke checks. |
| `PRODUCTION_DATABASE_URL` | Production migration job. |
| `JWT_SECRET` | Runtime auth token signing secret. |
| `EMAIL_PROVIDER_API_KEY` | Production email delivery. |
| `SENTRY_DSN` | Runtime error reporting. |

## 8. Acceptance Criteria

CI hardening is acceptable when:

1. Pull requests run database, Python, Rust, web, and Docker build checks.
2. `main` receives the same validation on push.
3. Local root scripts mirror the required CI commands.
4. No deployment job runs until registry, environment, migration, and rollback rules are defined.
5. Required branch protection settings are documented before project collaboration scales.
