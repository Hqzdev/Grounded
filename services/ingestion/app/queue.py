from __future__ import annotations

import json
import aio_pika
from app.config import get_settings


class IngestionQueue:
    async def publish_job(self, job_id: str) -> None:
        settings = get_settings()
        connection = await aio_pika.connect_robust(settings.queue_url)
        async with connection:
            channel = await connection.channel()
            await channel.declare_queue(settings.ingestion_queue, durable=True)
            message = aio_pika.Message(
                body=json.dumps({"job_id": job_id}).encode("utf-8"),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type="application/json",
            )
            await channel.default_exchange.publish(message, routing_key=settings.ingestion_queue)
