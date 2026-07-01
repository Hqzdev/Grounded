from fastapi import HTTPException, status


class IngestionError:
    @staticmethod
    def response(status_code: int, message: str, code: str) -> HTTPException:
        return HTTPException(status_code=status_code, detail={"message": message, "code": code})

    @staticmethod
    def invalid_token() -> HTTPException:
        return IngestionError.response(status.HTTP_401_UNAUTHORIZED, "Invalid token", "invalid_token")

    @staticmethod
    def tenant_required() -> HTTPException:
        return IngestionError.response(status.HTTP_403_FORBIDDEN, "Tenant context is required", "tenant_required")

    @staticmethod
    def document_not_found() -> HTTPException:
        return IngestionError.response(status.HTTP_404_NOT_FOUND, "Document was not found", "document_not_found")

    @staticmethod
    def job_not_found() -> HTTPException:
        return IngestionError.response(status.HTTP_404_NOT_FOUND, "Ingestion job was not found", "job_not_found")

    @staticmethod
    def unsupported_content_type() -> HTTPException:
        return IngestionError.response(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Content type is not supported", "unsupported_content_type")

    @staticmethod
    def document_too_large() -> HTTPException:
        return IngestionError.response(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Document content is too large", "document_too_large")

    @staticmethod
    def duplicate_document() -> HTTPException:
        return IngestionError.response(status.HTTP_409_CONFLICT, "Document content already exists in this tenant", "duplicate_document")

    @staticmethod
    def retry_not_allowed() -> HTTPException:
        return IngestionError.response(status.HTTP_409_CONFLICT, "Only failed ingestion jobs can be retried", "retry_not_allowed")
