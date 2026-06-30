from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = Field(default="postgresql+asyncpg://grounded:grounded@localhost:5432/grounded")
    jwt_secret: str = Field(default="dev-only-change-me")
    jwt_issuer: str = Field(default="grounded-auth")
    jwt_audience: str = Field(default="grounded-web")
    access_token_minutes: int = Field(default=15)
    refresh_token_days: int = Field(default=14)
    email_verification_hours: int = Field(default=24)
    password_reset_minutes: int = Field(default=30)
    expose_dev_tokens: bool = Field(default=True)
    auth_rate_limit_window_minutes: int = Field(default=15)
    auth_rate_limit_lockout_minutes: int = Field(default=15)
    auth_rate_limit_ip_attempts: int = Field(default=20)
    auth_rate_limit_email_attempts: int = Field(default=5)


@lru_cache
def get_settings() -> Settings:
    return Settings()
