from __future__ import annotations

from typing import Annotated
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.errors import AuthError
from app.repositories import IdentityRepository
from app.security import TokenService
from app.services import IdentityService, RequestContext


bearer = HTTPBearer(auto_error=False)


async def identity_service(session: Annotated[AsyncSession, Depends(get_session)]) -> IdentityService:
    return IdentityService(IdentityRepository(session))


async def current_claims(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    context: Annotated[RequestContext, Depends(request_context)],
    service: Annotated[IdentityService, Depends(identity_service)],
) -> dict:
    if not credentials:
        raise AuthError.invalid_token()
    claims = TokenService().decode_access_token(credentials.credentials)
    return await service.require_active_session(claims, context)


async def request_context(request: Request) -> RequestContext:
    forwarded_for = request.headers.get("x-forwarded-for")
    ip_address = forwarded_for.split(",")[0].strip() if forwarded_for else (request.client.host if request.client else None)
    return RequestContext(ip_address=ip_address, user_agent=request.headers.get("user-agent"), route=request.url.path, action=request.method)
