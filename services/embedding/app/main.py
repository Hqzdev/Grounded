from __future__ import annotations

import asyncio
import json
import aio_pika
from app.chunking import TextChunker
from app.config import get_settings
from app.database import SessionFactory
from app.embeddings import LocalEmbeddingProvider
from app.qdrant import QdrantIndex
from app.repositories import IngestionJobRepository
from app.services import IngestionJobProcessor
from app.storage import ObjectStorage


class EmbeddingWorker:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.storage = ObjectStorage()
        self.chunker = TextChunker(self.settings.chunk_size, self.settings.chunk_overlap)
        self.embeddings = LocalEmbeddingProvider(self.settings.embedding_dimensions)
        self.index = QdrantIndex(self.settings.qdrant_url, self.settings.qdrant_collection, self.settings.embedding_dimensions)

    async def run(self) -> None:
        connection = await aio_pika.connect_robust(self.settings.queue_url)
        async with connection:
            channel = await connection.channel()
            await channel.set_qos(prefetch_count=1)
            queue = await channel.declare_queue(self.settings.ingestion_queue, durable=True)
            await queue.consume(self.handle_message)
            await asyncio.Future()

    async def handle_message(self, message: aio_pika.IncomingMessage) -> None:
        async with message.process(requeue=False):
            payload = json.loads(message.body.decode("utf-8"))
            async with SessionFactory() as session:
                processor = IngestionJobProcessor(IngestionJobRepository(session), self.storage, self.chunker, self.embeddings, self.index)
                await processor.process(payload["job_id"])


if __name__ == "__main__":
    asyncio.run(EmbeddingWorker().run())
