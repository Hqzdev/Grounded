# Privacy And Cookie Requirements

| Field | Value |
| --- | --- |
| Project | Grounded |
| Document Type | Privacy and Cookie Requirements |
| Version | 0.1 |
| Revision Date | 2026-06-30 |
| Status | Draft |
| Owner | Engineering |

## Revision History

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-30 | Engineering | Initial privacy pages and cookie consent requirements. |

## Review and Approval

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Product Owner | TBD | Pending | TBD |
| Security Reviewer | TBD | Pending | TBD |
| Legal Reviewer | TBD | Pending | TBD |

## Contents

1. Purpose
2. Public Legal Pages
3. Cookie Categories
4. Consent Requirements
5. Authentication Cookies
6. Acceptance Criteria

## 1. Purpose

This document defines the privacy page, terms page, cookie policy page, security overview page, and cookie consent behavior for the Grounded web application.

## 2. Public Legal Pages

The web application shall expose the following public pages:

| Page | Purpose |
| --- | --- |
| `/privacy` | Describe account, tenant, document, question, citation, and operational data processing. |
| `/terms` | Describe acceptable use, user responsibility, and reliance limits. |
| `/cookies` | Describe necessary and optional cookie categories. |
| `/security` | Summarize authentication, token handling, tenant isolation, and audit posture. |

## 3. Cookie Categories

| Category | Required | Purpose |
| --- | --- | --- |
| Necessary | Yes | Authentication, session security, consent storage, and application integrity. |
| Analytics | No | Product usage, reliability, and performance analysis. |
| Preferences | No | Non-sensitive interface preferences. |
| Marketing | No | Campaign attribution and product communication measurement. |

## 4. Consent Requirements

The consent menu shall offer:

| Choice | Behavior |
| --- | --- |
| Use necessary only | Store only required cookies. |
| Allow all | Enable all optional categories. |
| Customize | Let the user choose optional categories individually. |

Necessary cookies cannot be disabled because product login and security depend on them.

## 5. Authentication Cookies

Authentication cookies shall be treated as necessary cookies. They shall be `httpOnly`, `SameSite=Lax`, path-scoped to `/`, and marked `Secure` in production.

Browser JavaScript shall not read access tokens or refresh tokens.

## 6. Acceptance Criteria

| ID | Criterion |
| --- | --- |
| PAC-001 | The consent menu appears before a consent preference is stored. |
| PAC-002 | The user can choose necessary-only cookies. |
| PAC-003 | The user can allow all cookie categories. |
| PAC-004 | The user can customize optional categories. |
| PAC-005 | Legal links are visible from the consent menu and footer. |
| PAC-006 | Authentication remains functional when optional categories are disabled. |
