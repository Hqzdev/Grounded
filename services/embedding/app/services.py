from __future__ import annotations

from app.chunking import TextChunker
from app.embeddings import LocalEmbeddingProvider
from app.qdrant import QdrantIndex, VectorPoint
from app.repositories import IngestionJobRepository
from app.storage import ObjectStorage


class IngestionJobProcessor:
    def __init__(
        self,
        repository: IngestionJobRepository,
        storage: ObjectStorage,
        chunker: TextChunker,
        embeddings: LocalEmbeddingProvider,
        index: QdrantIndex,
    ) -> None:
        self.repository = repository
        self.storage = storage
        self.chunker = chunker
        self.embeddings = embeddings
        self.index = index

    async def process(self, job_id: str) -> None:
        job = await self.repository.find_job(job_id)
        if not job:
            return
        if job["status"] not in {"queued", "failed"}:
            return

        await self.repository.mark_running(job_id)
        await self.repository.commit()

        try:
            text = self.storage.get_text(job["objectKey"])
            chunks = self.chunker.split(text)
            if not chunks:
                raise ValueError("Document produced no chunks")
            point_ids = [self.index.point_id_for_chunk(f"{job['documentVersionId']}:{chunk.index}") for chunk in chunks]
            stored_chunks = await self.repository.replace_chunks(job["tenantId"], job["documentId"], job["documentVersionId"], chunks, point_ids)
            self.index.upsert(
                [
                    VectorPoint(
                        id=chunk.qdrant_point_id,
                        vector=self.embeddings.embed(chunk.content),
                        payload={
                            "tenantId": job["tenantId"],
                            "documentId": job["documentId"],
                            "documentVersionId": job["documentVersionId"],
                            "chunkId": chunk.id,
                            "chunkIndex": chunk.index,
                            "sourceStart": chunk.source_start,
                            "sourceEnd": chunk.source_end,
                        },
                    )
                    for chunk in stored_chunks
                ]
            )
            await self.repository.mark_completed(job_id, job["documentId"])
            await self.repository.commit()
        except Exception as exc:
            await self.repository.rollback()
            await self.repository.mark_failed(job_id, job["documentId"], exc.__class__.__name__, str(exc))
            await self.repository.commit()
            raise
