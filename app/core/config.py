from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings pulled from environment variables or `.env` file."""

    app_name: str = Field("Nostressia API", description="Application name exposed in OpenAPI")
    api_prefix: str = Field("/api", description="Root API prefix")
    allowed_origins: List[str] = Field(default_factory=lambda: ["*"], description="CORS allow list")

    db_user: str = Field(..., env="DB_USER")
    db_password: str = Field(..., env="DB_PASSWORD")
    db_host: str = Field(..., env="DB_HOST")
    db_port: int = Field(3306, env="DB_PORT")
    db_name: str = Field(..., env="DB_NAME")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def database_url(self) -> str:
        return (
            f"mysql+mysqlconnector://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings instance."""

    return Settings()


settings = get_settings()
