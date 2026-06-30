from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class TenantSummary(BaseModel):
    id: str
    slug: str
    name: str
    role: str


class UserSummary(BaseModel):
    id: str
    email: EmailStr
    name: str
    email_verified: bool


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=256)
    name: str = Field(min_length=1, max_length=160)
    tenant_name: str = Field(min_length=1, max_length=160)
    tenant_slug: str | None = Field(default=None, min_length=2, max_length=80)


class RegisterResponse(BaseModel):
    user: UserSummary
    tenant: TenantSummary
    email_verification_required: bool = True
    dev_verification_token: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)
    device_label: str | None = Field(default=None, max_length=160)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=32, max_length=512)


class LogoutRequest(BaseModel):
    refresh_token: str | None = Field(default=None, min_length=32, max_length=512)


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=32, max_length=512)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class PasswordForgotRequest(BaseModel):
    email: EmailStr


class PasswordResetRequest(BaseModel):
    token: str = Field(min_length=32, max_length=512)
    new_password: str = Field(min_length=12, max_length=256)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=256)
    new_password: str = Field(min_length=12, max_length=256)
    logout_other_sessions: bool = True


class TenantCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    slug: str | None = Field(default=None, min_length=2, max_length=80)


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserSummary
    tenant: TenantSummary | None


class MeResponse(BaseModel):
    user: UserSummary
    tenants: list[TenantSummary]
    current_tenant: TenantSummary | None


class GenericMessage(BaseModel):
    message: str
    dev_token: str | None = None


class SessionSummary(BaseModel):
    id: str
    tenant_id: str | None
    created_at: datetime
    last_seen_at: datetime
    expires_at: datetime
    revoked_at: datetime | None
    ip_address: str | None
    user_agent: str | None
    device_label: str | None
