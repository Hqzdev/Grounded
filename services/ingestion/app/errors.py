from fastapi import HTTPException, status


class IngestionError:
    @staticmethod
    def invalid_token() -> HTTPException:
        return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    @staticmethod
    def tenant_required() -> HTTPException:
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context is required")

    @staticmethod
    def document_not_found() -> HTTPException:
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document was not found")

    @staticmethod
    def unsupported_content_type() -> HTTPException:
        return HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Content type is not supported")
