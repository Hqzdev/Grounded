import jwt
from app.config import get_settings
from app.errors import IngestionError


class TokenService:
    def decode_access_token(self, token: str) -> dict:
        settings = get_settings()
        try:
            return jwt.decode(
                token,
                settings.jwt_secret,
                algorithms=["HS256"],
                audience=settings.jwt_audience,
                issuer=settings.jwt_issuer,
            )
        except jwt.PyJWTError as exc:
            raise IngestionError.invalid_token() from exc
