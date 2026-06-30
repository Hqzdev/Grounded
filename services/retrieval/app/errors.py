from fastapi import HTTPException, status


class RetrievalError:
    @staticmethod
    def invalid_token() -> HTTPException:
        return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    @staticmethod
    def tenant_required() -> HTTPException:
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context is required")

    @staticmethod
    def no_evidence() -> HTTPException:
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No indexed evidence was found")
