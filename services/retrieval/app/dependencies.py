from __future__ import annotations

from typing import Annotated
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.database import get_session
from app.embeddings import LocalEmbeddingProvider
from app.errors import RetrievalError
from app.qdrant import QdrantSearch
from app.repositories import RetrievalRepository
from app.security import TokenService
from app.services import AnswerComposer, RetrievalService


bearer = HTTPBearer(auto_error=False)


async def current_claims(credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]) -> dict:
    if not credentials:
        raise RetrievalError.invalid_token()
    claims = TokenService().decode_access_token(credentials.credentials)
    if not claims.get("tid"):
        raise RetrievalError.tenant_required()
    return claims


async def retrieval_service(session: Annotated[AsyncSession, Depends(get_session)]) -> RetrievalService:
    settings = get_settings()
    embeddings = LocalEmbeddingProvider(settings.embedding_dimensions)
    search = QdrantSearch(settings.qdrant_url, settings.qdrant_collection, settings.retrieval_limit)
    return RetrievalService(RetrievalRepository(session), embeddings, search, AnswerComposer())
