from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = Field(default="postgresql+asyncpg://grounded:grounded@localhost:5432/grounded")
    jwt_secret: str = Field(default="dev-only-change-me")
    jwt_issuer: str = Field(default="grounded-auth")
    jwt_audience: str = Field(default="grounded-web")
    qdrant_url: str = Field(default="http://localhost:6333")
    qdrant_collection: str = Field(default="grounded_chunks")
    embedding_dimensions: int = Field(default=64)
    retrieval_limit: int = Field(default=5)


@lru_cache
def get_settings() -> Settings:
    return Settings()
