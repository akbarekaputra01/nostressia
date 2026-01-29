from functools import lru_cache
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings pulled from environment variables or `.env` file."""

    app_name: str = Field("Nostressia API", description="Application name exposed in OpenAPI")
    api_prefix: str = Field("/api", description="Root API prefix")
    allowed_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://nostressia.vercel.app",
            "https://nostressia.vercel.app/",
        ],
        description="CORS allow list",
    )

    # --- DATABASE CONFIG ---
    db_user: str = Field(..., env="DB_USER")
    db_password: str = Field(..., env="DB_PASSWORD")
    db_host: str = Field(..., env="DB_HOST")
    db_port: int = Field(3306, env="DB_PORT")
    db_name: str = Field(..., env="DB_NAME")
    database_url_override: Optional[str] = Field(default=None, env="DATABASE_URL")

    # Extra settings needed for email delivery.
    brevo_api_key: str = Field(..., env="BREVO_API_KEY")

    # --- JWT CONFIG ---
    jwt_secret: str = Field(..., env="JWT_SECRET")
    jwt_algorithm: str = Field("HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(1440, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    azure_storage_connection_string: str = Field(
        "", env="AZURE_STORAGE_CONNECTION_STRING"
    )
    azure_storage_container: str = Field("profile-avatars", env="AZURE_STORAGE_CONTAINER")
    azure_storage_account_name: str = Field("", env="AZURE_STORAGE_ACCOUNT_NAME")
    azure_storage_container_name: str = Field("", env="AZURE_STORAGE_CONTAINER_NAME")

    vapid_public_key: str = Field("", env="VAPID_PUBLIC_KEY")
    vapid_private_key: str = Field("", env="VAPID_PRIVATE_KEY")
    vapid_subject: str = Field("mailto:nostressia.official@gmail.com", env="VAPID_SUBJECT")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Ignore unknown env vars so optional entries do not crash the app.
        extra = "ignore"

    @property
    def database_url(self) -> str:
        if self.database_url_override:
            return self.database_url_override
        return (
            f"mysql+mysqlconnector://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings instance."""
    return Settings()


settings = get_settings()
