from typing import Annotated
from fastapi import Depends, FastAPI
from app.dependencies import current_claims, identity_service, request_context
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
    VerifyEmailRequest,
)
from app.services import IdentityService, RequestContext


app = FastAPI(title="Grounded Auth Service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "auth", "status": "ok"}


@app.post("/auth/register")
async def register(
    request: RegisterRequest,
    context: Annotated[RequestContext, Depends(request_context)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> RegisterResponse:
    return await service.register(request, context)


@app.post("/auth/login")
async def login(
    request: LoginRequest,
    context: Annotated[RequestContext, Depends(request_context)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> AuthResponse:
    return await service.login(request, context)


@app.post("/auth/refresh")
async def refresh(
    request: RefreshRequest,
    context: Annotated[RequestContext, Depends(request_context)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> AuthResponse:
    return await service.refresh(request, context)


@app.post("/auth/logout")
async def logout(
    claims: Annotated[dict, Depends(current_claims)],
    context: Annotated[RequestContext, Depends(request_context)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> GenericMessage:
    return await service.logout(claims["sub"], claims["sid"], context)


@app.post("/auth/logout-all")
async def logout_all(
    claims: Annotated[dict, Depends(current_claims)],
    context: Annotated[RequestContext, Depends(request_context)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> GenericMessage:
    return await service.logout_all(claims["sub"], context)


@app.get("/auth/me")
async def me(claims: Annotated[dict, Depends(current_claims)], service: Annotated[IdentityService, Depends(identity_service)]) -> MeResponse:
    return await service.me(claims["sub"], claims.get("tid"))


@app.post("/auth/email/verify")
async def verify_email(
    request: VerifyEmailRequest,
    context: Annotated[RequestContext, Depends(request_context)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> GenericMessage:
    return await service.verify_email(request, context)


@app.post("/auth/email/resend")
async def resend_verification(
    request: ResendVerificationRequest,
    context: Annotated[RequestContext, Depends(request_context)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> GenericMessage:
    return await service.resend_verification(request, context)


@app.post("/auth/password/forgot")
async def forgot_password(
    request: PasswordForgotRequest,
    context: Annotated[RequestContext, Depends(request_context)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> GenericMessage:
    return await service.forgot_password(request, context)


@app.post("/auth/password/reset")
async def reset_password(
    request: PasswordResetRequest,
    context: Annotated[RequestContext, Depends(request_context)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> GenericMessage:
    return await service.reset_password(request, context)


@app.post("/auth/password/change")
async def change_password(
    request: PasswordChangeRequest,
    claims: Annotated[dict, Depends(current_claims)],
    context: Annotated[RequestContext, Depends(request_context)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> GenericMessage:
    return await service.change_password(claims["sub"], claims["sid"], request, context)


@app.get("/auth/sessions")
async def list_sessions(
    claims: Annotated[dict, Depends(current_claims)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> list[SessionSummary]:
    return await service.list_sessions(claims["sub"])


@app.delete("/auth/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    claims: Annotated[dict, Depends(current_claims)],
    context: Annotated[RequestContext, Depends(request_context)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> GenericMessage:
    return await service.revoke_session(claims["sub"], session_id, context)


@app.post("/tenants")
async def create_tenant(
    request: TenantCreateRequest,
    claims: Annotated[dict, Depends(current_claims)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> TenantSummary:
    return await service.create_tenant(claims["sub"], request)


@app.get("/tenants/current")
async def current_tenant(
    claims: Annotated[dict, Depends(current_claims)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> TenantSummary:
    return await service.current_tenant(claims["sub"], claims.get("tid"))
