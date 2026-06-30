# Authentication and Session Security Specification

| Field | Value |
| --- | --- |
| Project | Grounded |
| Document Type | Authentication Security Specification |
| Version | 0.1 |
| Revision Date | 2026-06-30 |
| Status | Draft |
| Owner | Engineering |

## Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-30 | Engineering | Initial authentication and session security specification. |

## Review and Approval

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Engineering Owner | TBD | Pending | TBD |
| Security Reviewer | TBD | Pending | TBD |

## Contents

1. Purpose
2. Scope
3. Security Objectives
4. Token Strategy
5. Email Verification
6. Password Security
7. Session Management
8. Audit Requirements
9. API Access Rules
10. Acceptance Criteria
11. References
12. Glossary

## 1. Purpose

This document defines the authentication, session, password, token, and audit requirements for Grounded.

## 2. Scope

The scope includes registration, login, access tokens, refresh tokens, refresh rotation, email verification, password change, password reset, logout, session revocation, and audit events.

## 3. Security Objectives

| ID | Objective |
| --- | --- |
| ASO-001 | Private API routes shall require a valid bearer access token. |
| ASO-002 | Product access shall require verified email. |
| ASO-003 | Access tokens shall be short-lived. |
| ASO-004 | Refresh tokens shall be opaque and stored only as hashes. |
| ASO-005 | Refresh token reuse shall revoke the token family. |
| ASO-006 | Password reset shall revoke active sessions. |
| ASO-007 | Security-sensitive actions shall write audit events. |

## 4. Token Strategy

Access tokens are JWTs with `sub`, `tid`, `sid`, `jti`, issuer, audience, issued-at, and expiry claims. Access tokens are valid for 15 minutes by default.

Refresh tokens are opaque random values. The database stores only a keyed hash. Refresh tokens rotate on every refresh. A reused, expired, revoked, or already-used refresh token invalidates the whole session family.

The web application shall not expose access tokens or refresh tokens to browser JavaScript. The Next.js web boundary stores tokens in `httpOnly` cookies and proxies browser requests through server-side BFF routes.

Authentication cookies are necessary cookies. They must use `SameSite=Lax`, path `/`, `httpOnly`, and `Secure` in production.

## 5. Email Verification

Registration creates an unverified user, tenant, owner membership, email verification token, and audit event. Login is denied until email verification completes.

Local development uses `DevEmailOutbox` and may expose development tokens when `EXPOSE_DEV_TOKENS=true`.

## 6. Password Security

Passwords are hashed with Argon2 through `pwdlib`. Passwords must contain at least 12 characters, uppercase letters, lowercase letters, and digits.

Password reset tokens are one-time tokens, stored as hashes, and expire after 30 minutes by default. Password reset revokes active sessions.

## 7. Session Management

Each login creates a `UserSession` and one active refresh token. Sessions store user, tenant, family id, device label, IP address, user agent, creation time, last seen time, expiry, and revocation time.

Users can list sessions, revoke one session, logout the current session, or logout all sessions.

## 8. Audit Requirements

The system shall write audit events for registration, verification, login success, login failure, refresh, refresh reuse, password change, password reset, session revocation, logout, and logout-all.

## 9. API Access Rules

Browser-facing web routes:

```text
POST /api/web/auth/register
POST /api/web/auth/login
POST /api/web/auth/logout
POST /api/web/auth/email/verify
GET  /api/web/auth/me
GET  /api/web/documents
POST /api/web/documents
POST /api/web/questions
```

These routes shall proxy the gateway from the server side. Browser JavaScript shall not attach bearer tokens manually.

Public routes:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/email/verify
POST /api/auth/email/resend
POST /api/auth/password/forgot
POST /api/auth/password/reset
GET  /api/health
```

Private routes require bearer access tokens:

```text
GET    /api/auth/me
POST   /api/auth/logout
POST   /api/auth/logout-all
POST   /api/auth/password/change
GET    /api/auth/sessions
DELETE /api/auth/sessions/:id
POST   /api/tenants
GET    /api/tenants/current
GET    /api/documents
POST   /api/documents
GET    /api/documents/:id
GET    /api/documents/:id/jobs
POST   /api/questions
```

## 10. Acceptance Criteria

| ID | Criterion |
| --- | --- |
| AAC-001 | Register does not grant product access before email verification. |
| AAC-002 | Login returns access and refresh tokens only after email verification. |
| AAC-003 | Refresh rotates refresh tokens. |
| AAC-004 | Reusing a used refresh token revokes the token family. |
| AAC-005 | Password reset revokes active sessions. |
| AAC-006 | Private API routes reject missing bearer tokens. |
| AAC-007 | Backend smoke test passes through register, verify, login, upload, index, question, and citation. |
| AAC-008 | Browser JavaScript cannot read access tokens or refresh tokens. |
| AAC-009 | Web authentication uses `httpOnly` cookies and server-side proxy routes. |

## 11. References

| Document | Description |
| --- | --- |
| `api-contracts.md` | Public API contract. |
| `tenant-isolation.md` | Tenant isolation controls. |
| `database.md` | Persistence requirements. |

## 12. Glossary

| Term | Definition |
| --- | --- |
| Access Token | Short-lived JWT used to call private API routes. |
| Refresh Token | Opaque long-lived token used to obtain a new access token. |
| Token Family | Group of refresh tokens descended from one login session. |
| Session | Server-side record of an authenticated login device. |
