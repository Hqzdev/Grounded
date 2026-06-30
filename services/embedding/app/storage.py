from __future__ import annotations

from urllib.parse import urlparse
from minio import Minio
from app.config import get_settings


class ObjectStorage:
    def __init__(self) -> None:
        settings = get_settings()
        parsed = urlparse(settings.minio_endpoint)
        endpoint = parsed.netloc or parsed.path
        secure = parsed.scheme == "https"
        self.bucket = settings.minio_bucket
        self.client = Minio(
            endpoint,
            access_key=settings.minio_root_user,
            secret_key=settings.minio_root_password,
            secure=secure,
        )

    def get_text(self, object_key: str) -> str:
        response = self.client.get_object(self.bucket, object_key)
        try:
            return response.read().decode("utf-8")
        finally:
            response.close()
            response.release_conn()
