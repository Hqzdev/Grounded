from __future__ import annotations

from io import BytesIO
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

    def put_text(self, object_key: str, content: str, content_type: str) -> int:
        data = content.encode("utf-8")
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)
        self.client.put_object(
            self.bucket,
            object_key,
            BytesIO(data),
            length=len(data),
            content_type=content_type,
        )
        return len(data)
