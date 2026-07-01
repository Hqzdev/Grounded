from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4


class RetrievalRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def load_chunks(self, tenant_id: str, chunk_ids: list[str]) -> list[dict]:
        if not chunk_ids:
            return []

        result = await self.session.execute(
            text(
                'SELECT c."id", c."tenantId", c."documentId", c."content", c."sourceStart", c."sourceEnd", d."title" AS "documentTitle" '
                'FROM "DocumentChunk" c '
                'JOIN "Document" d ON d."id" = c."documentId" '
                'WHERE c."tenantId" = :tenant_id AND c."id" = ANY(:chunk_ids) AND d."deletedAt" IS NULL'
            ),
            {"tenant_id": tenant_id, "chunk_ids": chunk_ids},
        )
        rows = [dict(row) for row in result.mappings().all()]
        positions = {chunk_id: index for index, chunk_id in enumerate(chunk_ids)}
        return sorted(rows, key=lambda row: positions.get(row["id"], len(positions)))

    async def create_session(self, tenant_id: str, user_id: str, title: str) -> dict:
        result = await self.session.execute(
            text(
                'INSERT INTO "ChatSession" ("id", "tenantId", "userId", "title", "updatedAt") '
                'VALUES (:id, :tenant_id, :user_id, :title, now()) '
                'RETURNING "id", "createdAt"'
            ),
            {"id": f"ses_{uuid4().hex}", "tenant_id": tenant_id, "user_id": user_id, "title": title[:160]},
        )
        return dict(result.mappings().one())

    async def ensure_session(self, tenant_id: str, user_id: str, session_id: str | None, title: str) -> dict:
        if not session_id:
            return await self.create_session(tenant_id, user_id, title)

        result = await self.session.execute(
            text(
                'SELECT "id", "createdAt" FROM "ChatSession" '
                'WHERE "tenantId" = :tenant_id AND "userId" = :user_id AND "id" = :session_id'
            ),
            {"tenant_id": tenant_id, "user_id": user_id, "session_id": session_id},
        )
        row = result.mappings().first()
        if row:
            return dict(row)
        return await self.create_session(tenant_id, user_id, title)

    async def create_message(self, tenant_id: str, session_id: str, user_id: str | None, role: str, content: str) -> dict:
        result = await self.session.execute(
            text(
                'INSERT INTO "Message" ("id", "tenantId", "sessionId", "userId", "role", "content", "provider", "model") '
                'VALUES (:id, :tenant_id, :session_id, :user_id, CAST(:role AS "MessageRole"), :content, CAST(:provider AS "ProviderType"), :model) '
                'RETURNING "id", "createdAt"'
            ),
            {
                "id": f"msg_{uuid4().hex}",
                "tenant_id": tenant_id,
                "session_id": session_id,
                "user_id": user_id,
                "role": role,
                "content": content,
                "provider": "local",
                "model": "local-extractive-v1",
            },
        )
        return dict(result.mappings().one())

    async def create_citation(self, tenant_id: str, message_id: str, chunk: dict, score: float, snippet: str) -> dict:
        result = await self.session.execute(
            text(
                'INSERT INTO "Citation" ("id", "tenantId", "messageId", "documentId", "chunkId", "documentTitle", "snippet", "score", "sourceStart", "sourceEnd") '
                'VALUES (:id, :tenant_id, :message_id, :document_id, :chunk_id, :document_title, :snippet, :score, :source_start, :source_end) '
                'RETURNING "id"'
            ),
            {
                "id": f"cit_{uuid4().hex}",
                "tenant_id": tenant_id,
                "message_id": message_id,
                "document_id": chunk["documentId"],
                "chunk_id": chunk["id"],
                "document_title": chunk["documentTitle"],
                "snippet": snippet,
                "score": score,
                "source_start": chunk["sourceStart"],
                "source_end": chunk["sourceEnd"],
            },
        )
        return dict(result.mappings().one())

    async def create_usage(self, tenant_id: str, user_id: str, message_id: str, input_tokens: int, output_tokens: int) -> None:
        await self.session.execute(
            text(
                'INSERT INTO "UsageLedger" ("id", "tenantId", "userId", "messageId", "eventType", "provider", "model", "inputTokens", "outputTokens", "totalTokens", "estimatedCost") '
                'VALUES (:id, :tenant_id, :user_id, :message_id, CAST(:event_type AS "UsageEventType"), CAST(:provider AS "ProviderType"), :model, :input_tokens, :output_tokens, :total_tokens, :estimated_cost)'
            ),
            {
                "id": f"use_{uuid4().hex}",
                "tenant_id": tenant_id,
                "user_id": user_id,
                "message_id": message_id,
                "event_type": "question_answered",
                "provider": "local",
                "model": "local-extractive-v1",
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
                "estimated_cost": "0",
            },
        )

    async def touch_session(self, session_id: str) -> None:
        await self.session.execute(
            text('UPDATE "ChatSession" SET "updatedAt" = now() WHERE "id" = :session_id'),
            {"session_id": session_id},
        )

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()
