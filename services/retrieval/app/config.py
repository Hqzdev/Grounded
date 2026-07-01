from functools import lru_cache
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = Field(default="postgresql+asyncpg://grounded:grounded@localhost:5432/grounded")
    jwt_secret: str = Field(default="dev-only-change-me")
    jwt_issuer: str = Field(default="grounded-auth")
    jwt_audience: str = Field(default="grounded-web")
    qdrant_url: str = Field(default="http://localhost:6333")
    qdrant_collection: str = Field(default="grounded_chunks")
    embedding_provider: str = Field(default="local")
    embedding_model: str = Field(default="local-hash-v1")
    embedding_dimensions: int = Field(default=64)
    answer_provider: str = Field(default="local")
    answer_model: str = Field(default="local-extractive-v1")
    answer_temperature: float = Field(default=0.1)
    openai_api_key: str = Field(default="")
    openai_base_url: str = Field(default="https://api.openai.com/v1")
    ollama_base_url: str = Field(default="http://localhost:11434")
    retrieval_limit: int = Field(default=5)

    @model_validator(mode="after")
    def validate_provider_config(self) -> "Settings":
        supported_embedding = {"local", "openai", "ollama"}
        supported_answer = {"local", "openai", "ollama"}
        if self.embedding_provider not in supported_embedding:
            raise ValueError(f"Unsupported embedding provider: {self.embedding_provider}")
        if self.answer_provider not in supported_answer:
            raise ValueError(f"Unsupported answer provider: {self.answer_provider}")
        if (self.embedding_provider == "openai" or self.answer_provider == "openai") and not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required when OpenAI providers are enabled")
        if self.embedding_dimensions <= 0:
            raise ValueError("EMBEDDING_DIMENSIONS must be greater than zero")
        if self.retrieval_limit <= 0:
            raise ValueError("RETRIEVAL_LIMIT must be greater than zero")
        if self.answer_temperature < 0:
            raise ValueError("ANSWER_TEMPERATURE must be zero or greater")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
