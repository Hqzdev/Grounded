from __future__ import annotations

from hashlib import sha256
from app.errors import IngestionError
from app.queue import IngestionQueue
from app.repositories import DocumentRepository
from app.schemas import DocumentCreateRequest, DocumentCreateResponse, DocumentSummary, DocumentVersionSummary, IngestionJobSummary
from app.storage import ObjectStorage


class DocumentService:
    supported_content_types = {"text/plain", "text/markdown", "application/markdown"}

    def __init__(self, repository: DocumentRepository, storage: ObjectStorage, queue: IngestionQueue) -> None:
        self.repository = repository
        self.storage = storage
        self.queue = queue

    async def create_document(self, tenant_id: str, user_id: str, request: DocumentCreateRequest) -> DocumentCreateResponse:
        if request.content_type not in self.supported_content_types:
            raise IngestionError.unsupported_content_type()

        title = request.title or request.filename
        checksum = sha256(request.content.encode("utf-8")).hexdigest()

        try:
            document = await self.repository.create_document(tenant_id, user_id, title, request.filename, request.content_type)
            object_key = f"{tenant_id}/{document['id']}/1/{request.filename}"
            byte_size = self.storage.put_text(object_key, request.content, request.content_type)
            version = await self.repository.create_version(tenant_id, document["id"], object_key, checksum, byte_size, request.content)
            job = await self.repository.create_job(tenant_id, document["id"], version["id"])
            await self.repository.commit()
        except Exception:
            await self.repository.rollback()
            raise

        try:
            await self.queue.publish_job(job["id"])
        except Exception as exc:
            await self.repository.mark_publish_failed(tenant_id, document["id"], job["id"], str(exc))
            await self.repository.commit()
            raise

        return DocumentCreateResponse(
            document=self.document_summary(document),
            version=self.version_summary(version),
            job=self.job_summary(job),
        )

    async def list_documents(self, tenant_id: str) -> list[DocumentSummary]:
        return [self.document_summary(document) for document in await self.repository.list_documents(tenant_id)]

    async def get_document(self, tenant_id: str, document_id: str) -> DocumentSummary:
        document = await self.repository.find_document(tenant_id, document_id)
        if not document:
            raise IngestionError.document_not_found()
        return self.document_summary(document)

    async def list_jobs(self, tenant_id: str, document_id: str) -> list[IngestionJobSummary]:
        document = await self.repository.find_document(tenant_id, document_id)
        if not document:
            raise IngestionError.document_not_found()
        return [self.job_summary(job) for job in await self.repository.list_jobs_for_document(tenant_id, document_id)]

    def document_summary(self, document: dict) -> DocumentSummary:
        return DocumentSummary(
            id=document["id"],
            tenant_id=document["tenantId"],
            title=document["title"],
            filename=document["filename"],
            content_type=document["contentType"],
            status=document["status"],
            current_version=document["currentVersion"],
            created_at=document["createdAt"],
            updated_at=document["updatedAt"],
        )

    def version_summary(self, version: dict) -> DocumentVersionSummary:
        return DocumentVersionSummary(
            id=version["id"],
            version=version["version"],
            object_key=version["objectKey"],
            checksum=version["checksum"],
            byte_size=version["byteSize"],
            created_at=version["createdAt"],
        )

    def job_summary(self, job: dict) -> IngestionJobSummary:
        return IngestionJobSummary(
            id=job["id"],
            tenant_id=job["tenantId"],
            document_id=job["documentId"],
            document_version_id=job["documentVersionId"],
            status=job["status"],
            attempts=job["attempts"],
            error_code=job["errorCode"],
            error_message=job["errorMessage"],
            queued_at=job["queuedAt"],
            started_at=job["startedAt"],
            finished_at=job["finishedAt"],
        )
