from __future__ import annotations

import json
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4


class IdentityRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def find_user_by_email(self, email: str) -> dict | None:
        result = await self.session.execute(
            text('SELECT "id", "email", "name", "passwordHash", "emailVerifiedAt" FROM "User" WHERE lower("email") = lower(:email)'),
            {"email": email},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def find_user_by_id(self, user_id: str) -> dict | None:
        result = await self.session.execute(
            text('SELECT "id", "email", "name", "emailVerifiedAt" FROM "User" WHERE "id" = :user_id'),
            {"user_id": user_id},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def create_user(self, email: str, name: str, password_hash: str) -> dict:
        result = await self.session.execute(
            text(
                'INSERT INTO "User" ("id", "email", "name", "passwordHash", "updatedAt") '
                'VALUES (:id, :email, :name, :password_hash, now()) '
                'RETURNING "id", "email", "name", "emailVerifiedAt"'
            ),
            {"id": f"usr_{uuid4().hex}", "email": email, "name": name, "password_hash": password_hash},
        )
        return dict(result.mappings().one())

    async def mark_email_verified(self, user_id: str) -> dict:
        result = await self.session.execute(
            text(
                'UPDATE "User" SET "emailVerifiedAt" = now(), "updatedAt" = now() '
                'WHERE "id" = :user_id '
                'RETURNING "id", "email", "name", "emailVerifiedAt"'
            ),
            {"user_id": user_id},
        )
        return dict(result.mappings().one())

    async def update_password(self, user_id: str, password_hash: str) -> None:
        await self.session.execute(
            text('UPDATE "User" SET "passwordHash" = :password_hash, "updatedAt" = now() WHERE "id" = :user_id'),
            {"user_id": user_id, "password_hash": password_hash},
        )

    async def create_tenant(self, name: str, slug: str) -> dict:
        result = await self.session.execute(
            text(
                'INSERT INTO "Tenant" ("id", "slug", "name", "updatedAt") '
                'VALUES (:id, :slug, :name, now()) '
                'RETURNING "id", "slug", "name"'
            ),
            {"id": f"ten_{uuid4().hex}", "name": name, "slug": slug},
        )
        return dict(result.mappings().one())

    async def create_membership(self, tenant_id: str, user_id: str, role: str) -> dict:
        result = await self.session.execute(
            text(
                'INSERT INTO "Membership" ("id", "tenantId", "userId", "role", "updatedAt") '
                'VALUES (:id, :tenant_id, :user_id, :role, now()) '
                'RETURNING "id", "tenantId", "userId", "role"'
            ),
            {"id": f"mem_{uuid4().hex}", "tenant_id": tenant_id, "user_id": user_id, "role": role},
        )
        return dict(result.mappings().one())

    async def list_tenants_for_user(self, user_id: str) -> list[dict]:
        result = await self.session.execute(
            text(
                'SELECT t."id", t."slug", t."name", m."role" '
                'FROM "Membership" m '
                'JOIN "Tenant" t ON t."id" = m."tenantId" '
                'WHERE m."userId" = :user_id '
                'ORDER BY m."createdAt" ASC'
            ),
            {"user_id": user_id},
        )
        return [dict(row) for row in result.mappings().all()]

    async def find_tenant_for_user(self, user_id: str, tenant_id: str) -> dict | None:
        result = await self.session.execute(
            text(
                'SELECT t."id", t."slug", t."name", m."role" '
                'FROM "Membership" m '
                'JOIN "Tenant" t ON t."id" = m."tenantId" '
                'WHERE m."userId" = :user_id AND t."id" = :tenant_id'
            ),
            {"user_id": user_id, "tenant_id": tenant_id},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def create_session(self, user_id: str, tenant_id: str | None, family_id: str, expires_at: datetime, ip_address: str | None, user_agent: str | None, device_label: str | None) -> dict:
        result = await self.session.execute(
            text(
                'INSERT INTO "UserSession" ("id", "userId", "tenantId", "familyId", "expiresAt", "ipAddress", "userAgent", "deviceLabel") '
                'VALUES (:id, :user_id, :tenant_id, :family_id, :expires_at, :ip_address, :user_agent, :device_label) '
                'RETURNING "id", "userId", "tenantId", "familyId", "createdAt", "lastSeenAt", "expiresAt", "revokedAt", "ipAddress", "userAgent", "deviceLabel"'
            ),
            {
                "id": f"ses_{uuid4().hex}",
                "user_id": user_id,
                "tenant_id": tenant_id,
                "family_id": family_id,
                "expires_at": expires_at,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "device_label": device_label,
            },
        )
        return dict(result.mappings().one())

    async def create_refresh_token(self, user_id: str, session_id: str, family_id: str, token_hash: str, expires_at: datetime) -> dict:
        result = await self.session.execute(
            text(
                'INSERT INTO "RefreshToken" ("id", "userId", "sessionId", "familyId", "tokenHash", "expiresAt") '
                'VALUES (:id, :user_id, :session_id, :family_id, :token_hash, :expires_at) '
                'RETURNING "id", "userId", "sessionId", "familyId", "expiresAt", "usedAt", "revokedAt"'
            ),
            {
                "id": f"rt_{uuid4().hex}",
                "user_id": user_id,
                "session_id": session_id,
                "family_id": family_id,
                "token_hash": token_hash,
                "expires_at": expires_at,
            },
        )
        return dict(result.mappings().one())

    async def find_refresh_token(self, token_hash: str) -> dict | None:
        result = await self.session.execute(
            text(
                'SELECT rt."id", rt."userId", rt."sessionId", rt."familyId", rt."expiresAt", rt."usedAt", rt."revokedAt", '
                's."tenantId", s."revokedAt" AS "sessionRevokedAt", s."expiresAt" AS "sessionExpiresAt", '
                'u."email", u."name", u."emailVerifiedAt" '
                'FROM "RefreshToken" rt '
                'JOIN "UserSession" s ON s."id" = rt."sessionId" '
                'JOIN "User" u ON u."id" = rt."userId" '
                'WHERE rt."tokenHash" = :token_hash'
            ),
            {"token_hash": token_hash},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def find_active_session(self, user_id: str, session_id: str) -> dict | None:
        result = await self.session.execute(
            text(
                'SELECT "id", "userId", "tenantId", "expiresAt", "revokedAt" '
                'FROM "UserSession" '
                'WHERE "id" = :session_id AND "userId" = :user_id AND "revokedAt" IS NULL AND "expiresAt" > now()'
            ),
            {"user_id": user_id, "session_id": session_id},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def mark_refresh_token_used(self, token_id: str, replaced_by_id: str | None) -> None:
        await self.session.execute(
            text('UPDATE "RefreshToken" SET "usedAt" = now(), "replacedById" = :replaced_by_id WHERE "id" = :token_id'),
            {"token_id": token_id, "replaced_by_id": replaced_by_id},
        )

    async def touch_session(self, session_id: str) -> None:
        await self.session.execute(
            text('UPDATE "UserSession" SET "lastSeenAt" = now() WHERE "id" = :session_id AND "revokedAt" IS NULL'),
            {"session_id": session_id},
        )

    async def list_sessions(self, user_id: str) -> list[dict]:
        result = await self.session.execute(
            text(
                'SELECT "id", "tenantId", "createdAt", "lastSeenAt", "expiresAt", "revokedAt", "ipAddress", "userAgent", "deviceLabel" '
                'FROM "UserSession" '
                'WHERE "userId" = :user_id '
                'ORDER BY "lastSeenAt" DESC'
            ),
            {"user_id": user_id},
        )
        return [dict(row) for row in result.mappings().all()]

    async def revoke_session(self, user_id: str, session_id: str) -> bool:
        result = await self.session.execute(
            text(
                'UPDATE "UserSession" SET "revokedAt" = now() '
                'WHERE "userId" = :user_id AND "id" = :session_id AND "revokedAt" IS NULL '
                'RETURNING "id"'
            ),
            {"user_id": user_id, "session_id": session_id},
        )
        await self.session.execute(
            text('UPDATE "RefreshToken" SET "revokedAt" = now() WHERE "userId" = :user_id AND "sessionId" = :session_id AND "revokedAt" IS NULL'),
            {"user_id": user_id, "session_id": session_id},
        )
        return result.mappings().first() is not None

    async def revoke_all_sessions(self, user_id: str, except_session_id: str | None = None) -> None:
        if except_session_id:
            await self.session.execute(
                text('UPDATE "UserSession" SET "revokedAt" = now() WHERE "userId" = :user_id AND "id" != :session_id AND "revokedAt" IS NULL'),
                {"user_id": user_id, "session_id": except_session_id},
            )
            await self.session.execute(
                text('UPDATE "RefreshToken" SET "revokedAt" = now() WHERE "userId" = :user_id AND "sessionId" != :session_id AND "revokedAt" IS NULL'),
                {"user_id": user_id, "session_id": except_session_id},
            )
            return

        await self.session.execute(
            text('UPDATE "UserSession" SET "revokedAt" = now() WHERE "userId" = :user_id AND "revokedAt" IS NULL'),
            {"user_id": user_id},
        )
        await self.session.execute(
            text('UPDATE "RefreshToken" SET "revokedAt" = now() WHERE "userId" = :user_id AND "revokedAt" IS NULL'),
            {"user_id": user_id},
        )

    async def revoke_family(self, family_id: str) -> None:
        await self.session.execute(
            text('UPDATE "UserSession" SET "revokedAt" = now() WHERE "familyId" = :family_id AND "revokedAt" IS NULL'),
            {"family_id": family_id},
        )
        await self.session.execute(
            text('UPDATE "RefreshToken" SET "revokedAt" = now() WHERE "familyId" = :family_id AND "revokedAt" IS NULL'),
            {"family_id": family_id},
        )

    async def create_email_verification(self, user_id: str, email: str, token_hash: str, expires_at: datetime) -> None:
        await self.session.execute(
            text('UPDATE "UserEmailVerification" SET "usedAt" = now() WHERE "userId" = :user_id AND "usedAt" IS NULL'),
            {"user_id": user_id},
        )
        await self.session.execute(
            text(
                'INSERT INTO "UserEmailVerification" ("id", "userId", "email", "tokenHash", "expiresAt") '
                'VALUES (:id, :user_id, :email, :token_hash, :expires_at)'
            ),
            {"id": f"evt_{uuid4().hex}", "user_id": user_id, "email": email, "token_hash": token_hash, "expires_at": expires_at},
        )

    async def find_email_verification(self, token_hash: str) -> dict | None:
        result = await self.session.execute(
            text(
                'SELECT ev."id", ev."userId", ev."email", ev."expiresAt", ev."usedAt", u."emailVerifiedAt" '
                'FROM "UserEmailVerification" ev '
                'JOIN "User" u ON u."id" = ev."userId" '
                'WHERE ev."tokenHash" = :token_hash'
            ),
            {"token_hash": token_hash},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def mark_email_verification_used(self, token_id: str) -> None:
        await self.session.execute(
            text('UPDATE "UserEmailVerification" SET "usedAt" = now() WHERE "id" = :token_id'),
            {"token_id": token_id},
        )

    async def create_password_reset(self, user_id: str, token_hash: str, expires_at: datetime) -> None:
        await self.session.execute(
            text('UPDATE "PasswordResetToken" SET "usedAt" = now() WHERE "userId" = :user_id AND "usedAt" IS NULL'),
            {"user_id": user_id},
        )
        await self.session.execute(
            text(
                'INSERT INTO "PasswordResetToken" ("id", "userId", "tokenHash", "expiresAt") '
                'VALUES (:id, :user_id, :token_hash, :expires_at)'
            ),
            {"id": f"prt_{uuid4().hex}", "user_id": user_id, "token_hash": token_hash, "expires_at": expires_at},
        )

    async def find_password_reset(self, token_hash: str) -> dict | None:
        result = await self.session.execute(
            text(
                'SELECT pr."id", pr."userId", pr."expiresAt", pr."usedAt" '
                'FROM "PasswordResetToken" pr '
                'WHERE pr."tokenHash" = :token_hash'
            ),
            {"token_hash": token_hash},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def mark_password_reset_used(self, token_id: str) -> None:
        await self.session.execute(
            text('UPDATE "PasswordResetToken" SET "usedAt" = now() WHERE "id" = :token_id'),
            {"token_id": token_id},
        )

    async def create_outbox_email(self, recipient: str, subject: str, token: str | None, payload: dict | None) -> None:
        await self.session.execute(
            text(
                'INSERT INTO "DevEmailOutbox" ("id", "recipient", "subject", "token", "payload") '
                'VALUES (:id, :recipient, :subject, :token, CAST(:payload AS JSONB))'
            ),
            {"id": f"mail_{uuid4().hex}", "recipient": recipient, "subject": subject, "token": token, "payload": json.dumps(payload or {})},
        )

    async def audit(self, event_type: str, user_id: str | None = None, session_id: str | None = None, ip_address: str | None = None, user_agent: str | None = None, metadata: dict | None = None) -> None:
        await self.session.execute(
            text(
                'INSERT INTO "AuthAuditEvent" ("id", "userId", "sessionId", "eventType", "ipAddress", "userAgent", "metadata") '
                'VALUES (:id, :user_id, :session_id, CAST(:event_type AS "AuthAuditEventType"), :ip_address, :user_agent, CAST(:metadata AS JSONB))'
            ),
            {
                "id": f"aud_{uuid4().hex}",
                "user_id": user_id,
                "session_id": session_id,
                "event_type": event_type,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "metadata": json.dumps(metadata or {}),
            },
        )

    async def find_rate_limit(self, key: str) -> dict | None:
        result = await self.session.execute(
            text(
                'SELECT "key", "action", "attempts", "windowStart", "lockedUntil" '
                'FROM "AuthRateLimit" '
                'WHERE "key" = :key'
            ),
            {"key": key},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def save_rate_limit(self, key: str, action: str, attempts: int, window_start: datetime, locked_until: datetime | None) -> None:
        await self.session.execute(
            text(
                'INSERT INTO "AuthRateLimit" ("key", "action", "attempts", "windowStart", "lockedUntil", "updatedAt") '
                'VALUES (:key, :action, :attempts, :window_start, :locked_until, now()) '
                'ON CONFLICT ("key") DO UPDATE SET '
                '"attempts" = EXCLUDED."attempts", '
                '"windowStart" = EXCLUDED."windowStart", '
                '"lockedUntil" = EXCLUDED."lockedUntil", '
                '"updatedAt" = now()'
            ),
            {
                "key": key,
                "action": action,
                "attempts": attempts,
                "window_start": window_start,
                "locked_until": locked_until,
            },
        )

    async def clear_rate_limits(self, keys: list[str]) -> None:
        if not keys:
            return

        await self.session.execute(
            text('DELETE FROM "AuthRateLimit" WHERE "key" = ANY(:keys)'),
            {"keys": keys},
        )

    async def commit(self) -> None:
        try:
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise

    async def rollback(self) -> None:
        await self.session.rollback()
