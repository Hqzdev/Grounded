from typing import Annotated
from fastapi import Depends, FastAPI
from app.dependencies import current_claims, document_service
from app.schemas import DocumentCreateRequest, DocumentCreateResponse, DocumentSummary, IngestionJobSummary
from app.services import DocumentService


app = FastAPI(title="Grounded Ingestion Service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "ingestion", "status": "ok"}


@app.post("/documents")
async def create_document(
    request: DocumentCreateRequest,
    claims: Annotated[dict, Depends(current_claims)],
    service: Annotated[DocumentService, Depends(document_service)],
) -> DocumentCreateResponse:
    return await service.create_document(claims["tid"], claims["sub"], request)


@app.get("/documents")
async def list_documents(
    claims: Annotated[dict, Depends(current_claims)],
    service: Annotated[DocumentService, Depends(document_service)],
) -> list[DocumentSummary]:
    return await service.list_documents(claims["tid"])


@app.get("/documents/{document_id}")
async def get_document(
    document_id: str,
    claims: Annotated[dict, Depends(current_claims)],
    service: Annotated[DocumentService, Depends(document_service)],
) -> DocumentSummary:
    return await service.get_document(claims["tid"], document_id)


@app.get("/documents/{document_id}/jobs")
async def list_jobs(
    document_id: str,
    claims: Annotated[dict, Depends(current_claims)],
    service: Annotated[DocumentService, Depends(document_service)],
) -> list[IngestionJobSummary]:
    return await service.list_jobs(claims["tid"], document_id)
