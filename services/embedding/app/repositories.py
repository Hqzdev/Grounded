from __future__ import annotations

from dataclasses import dataclass
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from app.chunking import TextChunk


@dataclass(frozen=True)
class StoredChunk:
    id: str
    index: int
    content: str
    token_count: int
    source_start: int
    source_end: int
    qdrant_point_id: str


class IngestionJobRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def find_job(self, job_id: str) -> dict | None:
        result = await self.session.execute(
            text(
                'SELECT j."id", j."tenantId", j."documentId", j."documentVersionId", j."status", j."attempts", v."objectKey" '
                'FROM "IngestionJob" j '
                'JOIN "DocumentVersion" v ON v."id" = j."documentVersionId" '
                'WHERE j."id" = :job_id'
            ),
            {"job_id": job_id},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def mark_running(self, job_id: str) -> None:
        await self.session.execute(
            text(
                'UPDATE "IngestionJob" '
                'SET "status" = CAST(:status AS "IngestionJobStatus"), "attempts" = "attempts" + 1, "startedAt" = now(), "updatedAt" = now(), "errorCode" = NULL, "errorMessage" = NULL '
                'WHERE "id" = :job_id'
            ),
            {"job_id": job_id, "status": "running"},
        )

    async def replace_chunks(self, tenant_id: str, document_id: str, document_version_id: str, chunks: list[TextChunk], point_ids: list[str]) -> list[StoredChunk]:
        await self.session.execute(
            text('DELETE FROM "DocumentChunk" WHERE "tenantId" = :tenant_id AND "documentVersionId" = :document_version_id'),
            {"tenant_id": tenant_id, "document_version_id": document_version_id},
        )

        stored_chunks: list[StoredChunk] = []

        for chunk, point_id in zip(chunks, point_ids, strict=True):
            chunk_id = f"chk_{uuid4().hex}"
            await self.session.execute(
                text(
                    'INSERT INTO "DocumentChunk" ("id", "tenantId", "documentId", "documentVersionId", "chunkIndex", "content", "tokenCount", "sourceStart", "sourceEnd", "qdrantPointId") '
                    'VALUES (:id, :tenant_id, :document_id, :document_version_id, :chunk_index, :content, :token_count, :source_start, :source_end, :qdrant_point_id)'
                ),
                {
                    "id": chunk_id,
                    "tenant_id": tenant_id,
                    "document_id": document_id,
                    "document_version_id": document_version_id,
                    "chunk_index": chunk.index,
                    "content": chunk.content,
                    "token_count": chunk.token_count,
                    "source_start": chunk.start,
                    "source_end": chunk.end,
                    "qdrant_point_id": point_id,
                },
            )
            stored_chunks.append(
                StoredChunk(
                    id=chunk_id,
                    index=chunk.index,
                    content=chunk.content,
                    token_count=chunk.token_count,
                    source_start=chunk.start,
                    source_end=chunk.end,
                    qdrant_point_id=point_id,
                )
            )

        return stored_chunks

    async def mark_completed(self, job_id: str, document_id: str) -> None:
        await self.session.execute(
            text(
                'UPDATE "IngestionJob" '
                'SET "status" = CAST(:job_status AS "IngestionJobStatus"), "finishedAt" = now(), "updatedAt" = now() '
                'WHERE "id" = :job_id'
            ),
            {"job_id": job_id, "job_status": "completed"},
        )
        await self.session.execute(
            text(
                'UPDATE "Document" '
                'SET "status" = CAST(:document_status AS "DocumentStatus"), "updatedAt" = now() '
                'WHERE "id" = :document_id'
            ),
            {"document_id": document_id, "document_status": "indexed"},
        )

    async def mark_failed(self, job_id: str, document_id: str | None, error_code: str, error_message: str) -> None:
        await self.session.execute(
            text(
                'UPDATE "IngestionJob" '
                'SET "status" = CAST(:job_status AS "IngestionJobStatus"), "errorCode" = :error_code, "errorMessage" = :error_message, "finishedAt" = now(), "updatedAt" = now() '
                'WHERE "id" = :job_id'
            ),
            {
                "job_id": job_id,
                "job_status": "failed",
                "error_code": error_code,
                "error_message": error_message[:500],
            },
        )
        if document_id:
            await self.session.execute(
                text(
                    'UPDATE "Document" '
                    'SET "status" = CAST(:document_status AS "DocumentStatus"), "updatedAt" = now() '
                    'WHERE "id" = :document_id'
                ),
                {"document_id": document_id, "document_status": "failed"},
            )

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()
