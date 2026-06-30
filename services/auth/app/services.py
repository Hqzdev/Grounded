from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from uuid import uuid4
import re
from sqlalchemy.exc import IntegrityError
from app.config import get_settings
from app.errors import AuthError
from app.repositories import IdentityRepository
from app.schemas import (
    AuthResponse,
    GenericMessage,
    LoginRequest,
    MeResponse,
    PasswordChangeRequest,
    PasswordForgotRequest,
    PasswordResetRequest,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    SessionSummary,
    TenantCreateRequest,
    TenantSummary,
    UserSummary,
    VerifyEmailRequest,
)
from app.security import PasswordService, SecretTokenService, TokenService


@dataclass(frozen=True)
class RequestContext:
    ip_address: str | None
    user_agent: str | None


class SlugService:
    def from_name(self, value: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
        return slug or "workspace"


class IdentityService:
    def __init__(self, repository: IdentityRepository) -> None:
        self.repository = repository
        self.passwords = PasswordService()
        self.tokens = TokenService()
        self.secrets = SecretTokenService()
        self.slugs = SlugService()

    async def register(self, request: RegisterRequest, context: RequestContext) -> RegisterResponse:
        existing_user = await self.repository.find_user_by_email(request.email)
        if existing_user:
            raise AuthError.email_taken()

        slug = request.tenant_slug or self.slugs.from_name(request.tenant_name)

        try:
            user = await self.repository.create_user(request.email, request.name, self.passwords.hash(request.password))
            tenant = await self.repository.create_tenant(request.tenant_name, slug)
            membership = await self.repository.create_membership(tenant["id"], user["id"], "owner")
            verification_token = await self.issue_email_verification(user["id"], user["email"])
            await self.repository.audit("user_registered", user["id"], ip_address=context.ip_address, user_agent=context.user_agent)
            await self.repository.commit()
        except IntegrityError as exc:
            await self.repository.rollback()
            raise AuthError.tenant_slug_taken() from exc

        return RegisterResponse(
            user=self.user_summary(user),
            tenant=TenantSummary(id=tenant["id"], slug=tenant["slug"], name=tenant["name"], role=membership["role"]),
            dev_verification_token=verification_token if get_settings().expose_dev_tokens else None,
        )

    async def login(self, request: LoginRequest, context: RequestContext) -> AuthResponse:
        user = await self.repository.find_user_by_email(request.email)
        if not user or not user["passwordHash"] or not self.passwords.verify(request.password, user["passwordHash"]):
            await self.repository.audit("login_failed", user["id"] if user else None, ip_address=context.ip_address, user_agent=context.user_agent)
            await self.repository.commit()
            raise AuthError.invalid_credentials()

        if not user["emailVerifiedAt"]:
            await self.repository.audit("login_failed", user["id"], ip_address=context.ip_address, user_agent=context.user_agent, metadata={"reason": "email_not_verified"})
            await self.repository.commit()
            raise AuthError.email_not_verified()

        tenants = await self.repository.list_tenants_for_user(user["id"])
        tenant = tenants[0] if tenants else None
        response = await self.create_auth_response(user, tenant, context, request.device_label)
        await self.repository.audit("login_succeeded", user["id"], ip_address=context.ip_address, user_agent=context.user_agent)
        await self.repository.commit()
        return response

    async def refresh(self, request: RefreshRequest, context: RequestContext) -> AuthResponse:
        token_hash = self.secrets.hash(request.refresh_token)
        stored = await self.repository.find_refresh_token(token_hash)
        now = datetime.utcnow()

        if not stored:
            raise AuthError.invalid_token()

        if stored["usedAt"] or stored["revokedAt"] or stored["sessionRevokedAt"] or stored["expiresAt"] <= now or stored["sessionExpiresAt"] <= now:
            await self.repository.revoke_family(stored["familyId"])
            await self.repository.audit("refresh_reuse_detected", stored["userId"], stored["sessionId"], context.ip_address, context.user_agent)
            await self.repository.commit()
            raise AuthError.invalid_token()

        raw_refresh = self.secrets.create()
        refresh_hash = self.secrets.hash(raw_refresh)
        refresh_expires_at = now + timedelta(days=get_settings().refresh_token_days)
        new_refresh = await self.repository.create_refresh_token(stored["userId"], stored["sessionId"], stored["familyId"], refresh_hash, refresh_expires_at)
        await self.repository.mark_refresh_token_used(stored["id"], new_refresh["id"])
        await self.repository.touch_session(stored["sessionId"])
        await self.repository.audit("token_refreshed", stored["userId"], stored["sessionId"], context.ip_address, context.user_agent)
        await self.repository.commit()

        tenant = await self.current_tenant_dict(stored["userId"], stored["tenantId"])
        user = {
            "id": stored["userId"],
            "email": stored["email"],
            "name": stored["name"],
            "emailVerifiedAt": stored["emailVerifiedAt"],
        }
        return AuthResponse(
            access_token=self.tokens.create_access_token(stored["userId"], stored["tenantId"], stored["sessionId"]),
            refresh_token=raw_refresh,
            expires_in=get_settings().access_token_minutes * 60,
            user=self.user_summary(user),
            tenant=TenantSummary(**tenant) if tenant else None,
        )

    async def verify_email(self, request: VerifyEmailRequest, context: RequestContext) -> GenericMessage:
        stored = await self.repository.find_email_verification(self.secrets.hash(request.token))
        now = datetime.utcnow()
        if not stored or stored["usedAt"] or stored["expiresAt"] <= now:
            raise AuthError.invalid_token()

        await self.repository.mark_email_verification_used(stored["id"])
        await self.repository.mark_email_verified(stored["userId"])
        await self.repository.audit("email_verified", stored["userId"], ip_address=context.ip_address, user_agent=context.user_agent)
        await self.repository.commit()
        return GenericMessage(message="Email verified")

    async def resend_verification(self, request: ResendVerificationRequest, context: RequestContext) -> GenericMessage:
        user = await self.repository.find_user_by_email(request.email)
        dev_token = None
        if user and not user["emailVerifiedAt"]:
            dev_token = await self.issue_email_verification(user["id"], user["email"])
            await self.repository.audit("email_verification_requested", user["id"], ip_address=context.ip_address, user_agent=context.user_agent)
            await self.repository.commit()
        return GenericMessage(message="If the account exists and requires verification, an email has been sent", dev_token=dev_token if get_settings().expose_dev_tokens else None)

    async def forgot_password(self, request: PasswordForgotRequest, context: RequestContext) -> GenericMessage:
        user = await self.repository.find_user_by_email(request.email)
        dev_token = None
        if user:
            raw_token = self.secrets.create()
            expires_at = datetime.utcnow() + timedelta(minutes=get_settings().password_reset_minutes)
            await self.repository.create_password_reset(user["id"], self.secrets.hash(raw_token), expires_at)
            await self.repository.create_outbox_email(user["email"], "Reset your Grounded password", raw_token, {"purpose": "password_reset"})
            await self.repository.audit("password_reset_requested", user["id"], ip_address=context.ip_address, user_agent=context.user_agent)
            await self.repository.commit()
            dev_token = raw_token
        return GenericMessage(message="If the account exists, a password reset email has been sent", dev_token=dev_token if get_settings().expose_dev_tokens else None)

    async def reset_password(self, request: PasswordResetRequest, context: RequestContext) -> GenericMessage:
        stored = await self.repository.find_password_reset(self.secrets.hash(request.token))
        now = datetime.utcnow()
        if not stored or stored["usedAt"] or stored["expiresAt"] <= now:
            raise AuthError.invalid_token()

        await self.repository.update_password(stored["userId"], self.passwords.hash(request.new_password))
        await self.repository.mark_password_reset_used(stored["id"])
        await self.repository.revoke_all_sessions(stored["userId"])
        await self.repository.audit("password_reset_completed", stored["userId"], ip_address=context.ip_address, user_agent=context.user_agent)
        await self.repository.commit()
        return GenericMessage(message="Password reset completed")

    async def change_password(self, user_id: str, session_id: str, request: PasswordChangeRequest, context: RequestContext) -> GenericMessage:
        user = await self.repository.find_user_by_email((await self.repository.find_user_by_id(user_id))["email"])
        if not user or not user["passwordHash"] or not self.passwords.verify(request.current_password, user["passwordHash"]):
            raise AuthError.invalid_credentials()

        await self.repository.update_password(user_id, self.passwords.hash(request.new_password))
        if request.logout_other_sessions:
            await self.repository.revoke_all_sessions(user_id, session_id)
        await self.repository.audit("password_change_succeeded", user_id, session_id, context.ip_address, context.user_agent)
        await self.repository.commit()
        return GenericMessage(message="Password changed")

    async def logout(self, user_id: str, session_id: str, context: RequestContext) -> GenericMessage:
        await self.repository.revoke_session(user_id, session_id)
        await self.repository.audit("logout", user_id, session_id, context.ip_address, context.user_agent)
        await self.repository.commit()
        return GenericMessage(message="Logged out")

    async def logout_all(self, user_id: str, context: RequestContext) -> GenericMessage:
        await self.repository.revoke_all_sessions(user_id)
        await self.repository.audit("logout_all", user_id, ip_address=context.ip_address, user_agent=context.user_agent)
        await self.repository.commit()
        return GenericMessage(message="All sessions revoked")

    async def list_sessions(self, user_id: str) -> list[SessionSummary]:
        return [self.session_summary(session) for session in await self.repository.list_sessions(user_id)]

    async def revoke_session(self, user_id: str, session_id: str, context: RequestContext) -> GenericMessage:
        revoked = await self.repository.revoke_session(user_id, session_id)
        if not revoked:
            raise AuthError.session_not_found()
        await self.repository.audit("session_revoked", user_id, session_id, context.ip_address, context.user_agent)
        await self.repository.commit()
        return GenericMessage(message="Session revoked")

    async def me(self, user_id: str, tenant_id: str | None) -> MeResponse:
        user = await self.repository.find_user_by_id(user_id)
        if not user:
            raise AuthError.invalid_token()

        tenants = [TenantSummary(**tenant) for tenant in await self.repository.list_tenants_for_user(user_id)]
        current = next((tenant for tenant in tenants if tenant.id == tenant_id), tenants[0] if tenants else None)
        return MeResponse(user=self.user_summary(user), tenants=tenants, current_tenant=current)

    async def create_tenant(self, user_id: str, request: TenantCreateRequest) -> TenantSummary:
        slug = request.slug or self.slugs.from_name(request.name)

        try:
            tenant = await self.repository.create_tenant(request.name, slug)
            membership = await self.repository.create_membership(tenant["id"], user_id, "owner")
            await self.repository.commit()
        except IntegrityError as exc:
            await self.repository.rollback()
            raise AuthError.tenant_slug_taken() from exc

        return TenantSummary(id=tenant["id"], slug=tenant["slug"], name=tenant["name"], role=membership["role"])

    async def current_tenant(self, user_id: str, tenant_id: str | None) -> TenantSummary:
        tenant = await self.current_tenant_dict(user_id, tenant_id)
        if not tenant:
            raise AuthError.tenant_not_found()
        return TenantSummary(**tenant)

    async def current_tenant_dict(self, user_id: str, tenant_id: str | None) -> dict | None:
        if not tenant_id:
            tenants = await self.repository.list_tenants_for_user(user_id)
            return tenants[0] if tenants else None
        return await self.repository.find_tenant_for_user(user_id, tenant_id)

    async def issue_email_verification(self, user_id: str, email: str) -> str:
        raw_token = self.secrets.create()
        expires_at = datetime.utcnow() + timedelta(hours=get_settings().email_verification_hours)
        await self.repository.create_email_verification(user_id, email, self.secrets.hash(raw_token), expires_at)
        await self.repository.create_outbox_email(email, "Verify your Grounded email", raw_token, {"purpose": "email_verification"})
        await self.repository.audit("email_verification_requested", user_id)
        return raw_token

    async def create_auth_response(self, user: dict, tenant: dict | None, context: RequestContext, device_label: str | None) -> AuthResponse:
        now = datetime.utcnow()
        family_id = f"fam_{uuid4().hex}"
        refresh_expires_at = now + timedelta(days=get_settings().refresh_token_days)
        session = await self.repository.create_session(user["id"], tenant["id"] if tenant else None, family_id, refresh_expires_at, context.ip_address, context.user_agent, device_label)
        raw_refresh = self.secrets.create()
        await self.repository.create_refresh_token(user["id"], session["id"], family_id, self.secrets.hash(raw_refresh), refresh_expires_at)
        return AuthResponse(
            access_token=self.tokens.create_access_token(user["id"], tenant["id"] if tenant else None, session["id"]),
            refresh_token=raw_refresh,
            expires_in=get_settings().access_token_minutes * 60,
            user=self.user_summary(user),
            tenant=TenantSummary(**tenant) if tenant else None,
        )

    def user_summary(self, user: dict) -> UserSummary:
        return UserSummary(id=user["id"], email=user["email"], name=user["name"], email_verified=bool(user["emailVerifiedAt"]))

    def session_summary(self, session: dict) -> SessionSummary:
        return SessionSummary(
            id=session["id"],
            tenant_id=session["tenantId"],
            created_at=session["createdAt"],
            last_seen_at=session["lastSeenAt"],
            expires_at=session["expiresAt"],
            revoked_at=session["revokedAt"],
            ip_address=session["ipAddress"],
            user_agent=session["userAgent"],
            device_label=session["deviceLabel"],
        )
