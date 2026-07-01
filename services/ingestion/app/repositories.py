from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4


class DocumentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_document(self, tenant_id: str, user_id: str, title: str, filename: str, content_type: str) -> dict:
        result = await self.session.execute(
            text(
                'INSERT INTO "Document" ("id", "tenantId", "uploadedById", "title", "filename", "contentType", "sourceType", "status", "currentVersion", "updatedAt") '
                'VALUES (:id, :tenant_id, :user_id, :title, :filename, :content_type, CAST(:source_type AS "DocumentSourceType"), CAST(:status AS "DocumentStatus"), 1, now()) '
                'RETURNING "id", "tenantId", "title", "filename", "contentType", "status", "currentVersion", "createdAt", "updatedAt"'
            ),
            {
                "id": f"doc_{uuid4().hex}",
                "tenant_id": tenant_id,
                "user_id": user_id,
                "title": title,
                "filename": filename,
                "content_type": content_type,
                "source_type": "upload",
                "status": "queued",
            },
        )
        return dict(result.mappings().one())

    async def find_document_by_checksum(self, tenant_id: str, checksum: str) -> dict | None:
        result = await self.session.execute(
            text(
                'SELECT d."id", d."tenantId", d."title", d."filename", d."contentType", d."status", d."currentVersion", d."createdAt", d."updatedAt" '
                'FROM "DocumentVersion" v '
                'JOIN "Document" d ON d."id" = v."documentId" '
                'WHERE v."tenantId" = :tenant_id AND v."checksum" = :checksum AND d."deletedAt" IS NULL '
                'ORDER BY v."createdAt" DESC '
                'LIMIT 1'
            ),
            {"tenant_id": tenant_id, "checksum": checksum},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def create_version(self, tenant_id: str, document_id: str, object_key: str, checksum: str, byte_size: int, extracted_text: str) -> dict:
        result = await self.session.execute(
            text(
                'INSERT INTO "DocumentVersion" ("id", "documentId", "tenantId", "version", "objectKey", "checksum", "byteSize", "extractedText") '
                'VALUES (:id, :document_id, :tenant_id, 1, :object_key, :checksum, :byte_size, :extracted_text) '
                'RETURNING "id", "version", "objectKey", "checksum", "byteSize", "createdAt"'
            ),
            {
                "id": f"ver_{uuid4().hex}",
                "document_id": document_id,
                "tenant_id": tenant_id,
                "object_key": object_key,
                "checksum": checksum,
                "byte_size": byte_size,
                "extracted_text": extracted_text,
            },
        )
        return dict(result.mappings().one())

    async def create_job(self, tenant_id: str, document_id: str, document_version_id: str) -> dict:
        result = await self.session.execute(
            text(
                'INSERT INTO "IngestionJob" ("id", "tenantId", "documentId", "documentVersionId", "status", "updatedAt") '
                'VALUES (:id, :tenant_id, :document_id, :document_version_id, CAST(:status AS "IngestionJobStatus"), now()) '
                'RETURNING "id", "tenantId", "documentId", "documentVersionId", "status", "attempts", "errorCode", "errorMessage", "queuedAt", "startedAt", "finishedAt"'
            ),
            {
                "id": f"job_{uuid4().hex}",
                "tenant_id": tenant_id,
                "document_id": document_id,
                "document_version_id": document_version_id,
                "status": "queued",
            },
        )
        return dict(result.mappings().one())

    async def list_documents(self, tenant_id: str) -> list[dict]:
        result = await self.session.execute(
            text(
                'SELECT "id", "tenantId", "title", "filename", "contentType", "status", "currentVersion", "createdAt", "updatedAt" '
                'FROM "Document" '
                'WHERE "tenantId" = :tenant_id AND "deletedAt" IS NULL '
                'ORDER BY "createdAt" DESC'
            ),
            {"tenant_id": tenant_id},
        )
        return [dict(row) for row in result.mappings().all()]

    async def find_document(self, tenant_id: str, document_id: str) -> dict | None:
        result = await self.session.execute(
            text(
                'SELECT "id", "tenantId", "title", "filename", "contentType", "status", "currentVersion", "createdAt", "updatedAt" '
                'FROM "Document" '
                'WHERE "tenantId" = :tenant_id AND "id" = :document_id AND "deletedAt" IS NULL'
            ),
            {"tenant_id": tenant_id, "document_id": document_id},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def list_jobs_for_document(self, tenant_id: str, document_id: str) -> list[dict]:
        result = await self.session.execute(
            text(
                'SELECT "id", "tenantId", "documentId", "documentVersionId", "status", "attempts", "errorCode", "errorMessage", "queuedAt", "startedAt", "finishedAt" '
                'FROM "IngestionJob" '
                'WHERE "tenantId" = :tenant_id AND "documentId" = :document_id '
                'ORDER BY "queuedAt" DESC'
            ),
            {"tenant_id": tenant_id, "document_id": document_id},
        )
        return [dict(row) for row in result.mappings().all()]

    async def find_job_for_document(self, tenant_id: str, document_id: str, job_id: str) -> dict | None:
        result = await self.session.execute(
            text(
                'SELECT "id", "tenantId", "documentId", "documentVersionId", "status", "attempts", "errorCode", "errorMessage", "queuedAt", "startedAt", "finishedAt" '
                'FROM "IngestionJob" '
                'WHERE "tenantId" = :tenant_id AND "documentId" = :document_id AND "id" = :job_id'
            ),
            {"tenant_id": tenant_id, "document_id": document_id, "job_id": job_id},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def find_latest_version(self, tenant_id: str, document_id: str) -> dict | None:
        result = await self.session.execute(
            text(
                'SELECT "id", "documentId", "tenantId", "version" '
                'FROM "DocumentVersion" '
                'WHERE "tenantId" = :tenant_id AND "documentId" = :document_id '
                'ORDER BY "version" DESC '
                'LIMIT 1'
            ),
            {"tenant_id": tenant_id, "document_id": document_id},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def soft_delete_document(self, tenant_id: str, document_id: str) -> dict | None:
        result = await self.session.execute(
            text(
                'UPDATE "Document" '
                'SET "deletedAt" = now(), "status" = CAST(:status AS "DocumentStatus"), "updatedAt" = now() '
                'WHERE "tenantId" = :tenant_id AND "id" = :document_id AND "deletedAt" IS NULL '
                'RETURNING "id", "tenantId", "title", "filename", "contentType", "status", "currentVersion", "createdAt", "updatedAt"'
            ),
            {"tenant_id": tenant_id, "document_id": document_id, "status": "deleted"},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def create_retry_job(self, tenant_id: str, document_id: str, document_version_id: str) -> dict:
        await self.session.execute(
            text(
                'UPDATE "Document" '
                'SET "status" = CAST(:document_status AS "DocumentStatus"), "updatedAt" = now() '
                'WHERE "tenantId" = :tenant_id AND "id" = :document_id AND "deletedAt" IS NULL'
            ),
            {"tenant_id": tenant_id, "document_id": document_id, "document_status": "queued"},
        )
        return await self.create_job(tenant_id, document_id, document_version_id)

    async def create_reindex_job(self, tenant_id: str, document_id: str, document_version_id: str) -> dict:
        await self.session.execute(
            text(
                'UPDATE "Document" '
                'SET "status" = CAST(:document_status AS "DocumentStatus"), "updatedAt" = now() '
                'WHERE "tenantId" = :tenant_id AND "id" = :document_id AND "deletedAt" IS NULL'
            ),
            {"tenant_id": tenant_id, "document_id": document_id, "document_status": "queued"},
        )
        return await self.create_job(tenant_id, document_id, document_version_id)

    async def mark_publish_failed(self, tenant_id: str, document_id: str, job_id: str, error_message: str) -> None:
        await self.session.execute(
            text(
                'UPDATE "IngestionJob" '
                'SET "status" = CAST(:job_status AS "IngestionJobStatus"), "errorCode" = :error_code, "errorMessage" = :error_message, "finishedAt" = now(), "updatedAt" = now() '
                'WHERE "tenantId" = :tenant_id AND "id" = :job_id'
            ),
            {
                "tenant_id": tenant_id,
                "job_id": job_id,
                "job_status": "failed",
                "error_code": "queue_publish_failed",
                "error_message": error_message[:500],
            },
        )
        await self.session.execute(
            text(
                'UPDATE "Document" '
                'SET "status" = CAST(:document_status AS "DocumentStatus"), "updatedAt" = now() '
                'WHERE "tenantId" = :tenant_id AND "id" = :document_id'
            ),
            {"tenant_id": tenant_id, "document_id": document_id, "document_status": "failed"},
        )

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()
