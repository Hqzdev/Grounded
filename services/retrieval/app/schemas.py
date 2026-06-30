from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class QuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    session_id: str | None = Field(default=None, min_length=1)


class CitationResponse(BaseModel):
    document_id: str
    document_title: str
    chunk_id: str
    snippet: str
    score: float
    source_start: int | None
    source_end: int | None


class AnswerResponse(BaseModel):
    session_id: str
    user_message_id: str
    assistant_message_id: str
    answer: str
    citations: list[CitationResponse]
    created_at: datetime
