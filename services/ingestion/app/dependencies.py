from __future__ import annotations

from typing import Annotated
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.errors import IngestionError
from app.queue import IngestionQueue
from app.repositories import DocumentRepository
from app.security import TokenService
from app.services import DocumentService
from app.storage import ObjectStorage


bearer = HTTPBearer(auto_error=False)


async def current_claims(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    if not credentials:
        raise IngestionError.invalid_token()
    claims = TokenService().decode_access_token(credentials.credentials)
    if not claims.get("tid"):
        raise IngestionError.tenant_required()
    active_session = await session.execute(
        text(
            'SELECT "id" FROM "UserSession" '
            'WHERE "id" = :session_id AND "userId" = :user_id AND "tenantId" = :tenant_id AND "revokedAt" IS NULL AND "expiresAt" > now()'
        ),
        {"session_id": claims.get("sid"), "user_id": claims.get("sub"), "tenant_id": claims.get("tid")},
    )
    if not active_session.mappings().first():
        raise IngestionError.invalid_token()
    return claims


async def document_service(session: Annotated[AsyncSession, Depends(get_session)]) -> DocumentService:
    return DocumentService(DocumentRepository(session), ObjectStorage(), IngestionQueue())
