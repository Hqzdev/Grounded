from typing import Annotated
from fastapi import Depends, FastAPI
from app.config import get_settings
from app.dependencies import current_claims, retrieval_service
from app.schemas import AnswerResponse, ProviderConfigResponse, ProviderStatusResponse, QuestionRequest
from app.services import RetrievalService


app = FastAPI(title="Grounded Retrieval Service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "retrieval", "status": "ok"}


@app.post("/questions")
async def answer_question(
    request: QuestionRequest,
    claims: Annotated[dict, Depends(current_claims)],
    service: Annotated[RetrievalService, Depends(retrieval_service)],
) -> AnswerResponse:
    return await service.answer(claims["tid"], claims["sub"], request)


@app.get("/providers/status")
async def provider_status(claims: Annotated[dict, Depends(current_claims)]) -> ProviderStatusResponse:
    settings = get_settings()
    return ProviderStatusResponse(
        embedding=ProviderConfigResponse(
            provider=settings.embedding_provider,
            model=resolved_embedding_model(settings.embedding_provider, settings.embedding_model),
            ready=provider_ready(settings.embedding_provider, settings.openai_api_key),
            status=provider_status_label(settings.embedding_provider, settings.openai_api_key),
        ),
        answer=ProviderConfigResponse(
            provider=settings.answer_provider,
            model=resolved_answer_model(settings.answer_provider, settings.answer_model),
            ready=provider_ready(settings.answer_provider, settings.openai_api_key),
            status=provider_status_label(settings.answer_provider, settings.openai_api_key),
        ),
        retrieval_limit=settings.retrieval_limit,
        qdrant_collection=settings.qdrant_collection,
    )


def provider_ready(provider: str, openai_api_key: str) -> bool:
    return provider != "openai" or bool(openai_api_key)


def provider_status_label(provider: str, openai_api_key: str) -> str:
    if provider == "openai" and not openai_api_key:
        return "missing_openai_api_key"
    return "configured"


def resolved_embedding_model(provider: str, model: str) -> str:
    if provider == "openai" and model == "local-hash-v1":
        return "text-embedding-3-small"
    if provider == "ollama" and model == "local-hash-v1":
        return "nomic-embed-text"
    return model


def resolved_answer_model(provider: str, model: str) -> str:
    if provider == "openai" and model == "local-extractive-v1":
        return "gpt-4o-mini"
    if provider == "ollama" and model == "local-extractive-v1":
        return "llama3.2"
    return model
