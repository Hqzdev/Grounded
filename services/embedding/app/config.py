from functools import lru_cache
from pydantic import Field, model_validator
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
    embedding_provider: str = Field(default="local")
    embedding_model: str = Field(default="local-hash-v1")
    embedding_dimensions: int = Field(default=64)
    openai_api_key: str = Field(default="")
    openai_base_url: str = Field(default="https://api.openai.com/v1")
    ollama_base_url: str = Field(default="http://localhost:11434")
    chunk_size: int = Field(default=900)
    chunk_overlap: int = Field(default=120)

    @model_validator(mode="after")
    def validate_provider_config(self) -> "Settings":
        supported_embedding = {"local", "openai", "ollama"}
        if self.embedding_provider not in supported_embedding:
            raise ValueError(f"Unsupported embedding provider: {self.embedding_provider}")
        if self.embedding_provider == "openai" and not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required when EMBEDDING_PROVIDER=openai")
        if self.embedding_dimensions <= 0:
            raise ValueError("EMBEDDING_DIMENSIONS must be greater than zero")
        if self.chunk_size <= 0:
            raise ValueError("CHUNK_SIZE must be greater than zero")
        if self.chunk_overlap < 0:
            raise ValueError("CHUNK_OVERLAP must be zero or greater")
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError("CHUNK_OVERLAP must be smaller than CHUNK_SIZE")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
