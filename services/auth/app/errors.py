from fastapi import HTTPException, status


class AuthError:
    @staticmethod
    def invalid_credentials() -> HTTPException:
        return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    @staticmethod
    def invalid_token() -> HTTPException:
        return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    @staticmethod
    def email_not_verified() -> HTTPException:
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email verification is required")

    @staticmethod
    def email_taken() -> HTTPException:
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    @staticmethod
    def tenant_slug_taken() -> HTTPException:
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tenant slug is already taken")

    @staticmethod
    def tenant_not_found() -> HTTPException:
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant was not found")

    @staticmethod
    def session_not_found() -> HTTPException:
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session was not found")

    @staticmethod
    def weak_password() -> HTTPException:
        return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password does not meet security requirements")
