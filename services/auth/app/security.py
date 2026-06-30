from __future__ import annotations

from datetime import datetime, timedelta, timezone
from hashlib import sha256
from hmac import new as hmac_new
import re
from secrets import token_urlsafe
from uuid import uuid4
import jwt
from pwdlib import PasswordHash
from app.config import get_settings
from app.errors import AuthError


password_hash = PasswordHash.recommended()


class PasswordService:
    def hash(self, password: str) -> str:
        self.validate(password)
        return password_hash.hash(password)

    def verify(self, password: str, hashed_password: str) -> bool:
        return password_hash.verify(password, hashed_password)

    def validate(self, password: str) -> None:
        checks = [
            len(password) >= 12,
            bool(re.search(r"[A-Z]", password)),
            bool(re.search(r"[a-z]", password)),
            bool(re.search(r"[0-9]", password)),
        ]
        if not all(checks):
            raise AuthError.weak_password()


class SecretTokenService:
    def create(self) -> str:
        return token_urlsafe(48)

    def hash(self, token: str) -> str:
        secret = get_settings().jwt_secret.encode("utf-8")
        return hmac_new(secret, token.encode("utf-8"), sha256).hexdigest()


class TokenService:
    def create_access_token(self, user_id: str, tenant_id: str | None, session_id: str) -> str:
        settings = get_settings()
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user_id,
            "tid": tenant_id,
            "sid": session_id,
            "iss": settings.jwt_issuer,
            "aud": settings.jwt_audience,
            "iat": now,
            "exp": now + timedelta(minutes=settings.access_token_minutes),
            "jti": str(uuid4()),
        }
        return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

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
            raise AuthError.invalid_token() from exc
