from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class DocumentCreateRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=260)
    title: str | None = Field(default=None, min_length=1, max_length=260)
    content_type: str = Field(default="text/plain", min_length=1, max_length=120)
    content: str = Field(min_length=1)


class DocumentSummary(BaseModel):
    id: str
    tenant_id: str
    title: str
    filename: str
    content_type: str
    status: str
    current_version: int
    created_at: datetime
    updated_at: datetime


class DocumentVersionSummary(BaseModel):
    id: str
    version: int
    object_key: str
    checksum: str
    byte_size: int
    created_at: datetime


class IngestionJobSummary(BaseModel):
    id: str
    tenant_id: str
    document_id: str
    document_version_id: str
    status: str
    attempts: int
    error_code: str | None
    error_message: str | None
    queued_at: datetime
    started_at: datetime | None
    finished_at: datetime | None


class DocumentCreateResponse(BaseModel):
    document: DocumentSummary
    version: DocumentVersionSummary
    job: IngestionJobSummary
