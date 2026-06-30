# Changelog

All notable changes to Grounded will be documented in this file.

This project follows a practical changelog format based on Keep a Changelog and semantic versioning principles.

## [Unreleased]

### Added

- DB-backed ingestion document endpoints.
- MinIO object storage for text and Markdown document content.
- RabbitMQ ingestion job publishing.
- Embedding worker queue consumption, deterministic chunk persistence, and Qdrant vector upserts.
- Gateway document route forwarding with authorization headers.
- Authenticated retrieval service with Qdrant tenant-filtered search.
- Local extractive answer generation with persisted messages, citations, and usage ledger entries.
- Backend smoke script for registration, ingestion, indexing, retrieval, and citation verification.
- Gateway Docker build now uses a Rust toolchain compatible with locked gateway dependencies.
- Gateway HTTP client now uses rustls to avoid OpenSSL system dependencies in slim containers.
- Python services normalize Prisma-style PostgreSQL URLs before using asyncpg.
- Auth subsystem now includes email verification, session records, refresh token rotation, password reset, password change, session revocation, and audit events.
- Initial microservice architecture documentation.
- System requirements specification.
- Software requirements specification.
- Backend architecture specification.
- Database requirements specification.
- API contract specification.
- Ingestion and retrieval pipeline specifications.
- Tenant isolation and security specification.
- Local development environment specification.
- Contribution, code style, security, and conduct policies.

### Changed

- Project documentation now uses a formal requirements-style Markdown structure.

### Security

- Tenant isolation requirements are documented as mandatory launch criteria.
