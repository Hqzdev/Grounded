from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = Field(default="postgresql+asyncpg://grounded:grounded@localhost:5432/grounded")
    jwt_secret: str = Field(default="dev-only-change-me")
    jwt_issuer: str = Field(default="grounded-auth")
    jwt_audience: str = Field(default="grounded-web")
    minio_endpoint: str = Field(default="http://localhost:9000")
    minio_root_user: str = Field(default="grounded")
    minio_root_password: str = Field(default="groundedsecret")
    minio_bucket: str = Field(default="grounded-documents")
    queue_url: str = Field(default="amqp://guest:guest@localhost:5672")
    ingestion_queue: str = Field(default="document_ingestion")


@lru_cache
def get_settings() -> Settings:
    return Settings()
