from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = Field(default="postgresql+asyncpg://grounded:grounded@localhost:5432/grounded")
    queue_url: str = Field(default="amqp://guest:guest@localhost:5672")
    ingestion_queue: str = Field(default="document_ingestion")
    minio_endpoint: str = Field(default="http://localhost:9000")
    minio_root_user: str = Field(default="grounded")
    minio_root_password: str = Field(default="groundedsecret")
    minio_bucket: str = Field(default="grounded-documents")
    qdrant_url: str = Field(default="http://localhost:6333")
    qdrant_collection: str = Field(default="grounded_chunks")
    embedding_dimensions: int = Field(default=64)
    chunk_size: int = Field(default=900)
    chunk_overlap: int = Field(default=120)


@lru_cache
def get_settings() -> Settings:
    return Settings()
