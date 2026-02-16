from functools import lru_cache
from typing import List, Optional

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings pulled from environment variables or `.env` file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    app_name: str = Field("Nostressia API", description="Application name exposed in OpenAPI")
    api_prefix: str = Field("/api", description="Root API prefix")
    app_timezone: str = Field("Asia/Jakarta", validation_alias="APP_TIMEZONE")
    log_level: str = Field("INFO", validation_alias="LOG_LEVEL")
    allowed_origins: List[str] = Field(
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://nostressia.vercel.app",
        ],
        validation_alias="ALLOWED_ORIGINS",
        description="CORS allow list (comma-separated if from env)",
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    # Database configuration
    db_user: Optional[str] = Field(default=None, validation_alias="DB_USER")
    db_password: Optional[str] = Field(default=None, validation_alias="DB_PASSWORD")
    db_host: Optional[str] = Field(default=None, validation_alias="DB_HOST")
    db_port: int = Field(3306, validation_alias="DB_PORT")
    db_name: Optional[str] = Field(default=None, validation_alias="DB_NAME")
    database_url_override: Optional[str] = Field(
        default=None, validation_alias="DATABASE_URL"
    )

    # Optional email provider key; email features degrade gracefully when missing.
    brevo_api_key: str = Field("", validation_alias="BREVO_API_KEY")

    # JWT configuration
    jwt_secret: str = Field(..., validation_alias="JWT_SECRET")
    jwt_algorithm: str = Field("HS256", validation_alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        1440, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )

    azure_storage_connection_string: str = Field(
        "", validation_alias="AZURE_STORAGE_CONNECTION_STRING"
    )
    azure_storage_container: str = Field(
        "profile-avatars", validation_alias="AZURE_STORAGE_CONTAINER"
    )
    azure_storage_account_name: str = Field(
        "", validation_alias="AZURE_STORAGE_ACCOUNT_NAME"
    )
    azure_storage_container_name: str = Field(
        "", validation_alias="AZURE_STORAGE_CONTAINER_NAME"
    )

    vapid_public_key: str = Field("", validation_alias="VAPID_PUBLIC_KEY")
    vapid_private_key: str = Field("", validation_alias="VAPID_PRIVATE_KEY")
    vapid_subject: str = Field(
        "mailto:nostressia.official@gmail.com", validation_alias="VAPID_SUBJECT"
    )

    internal_training_token: str = Field("", validation_alias="INTERNAL_TOKEN")


    @field_validator("jwt_secret")
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("JWT_SECRET must not be empty.")
        if normalized.lower() in {"change-me", "changeme", "secret", "default"}:
            raise ValueError("JWT_SECRET must be changed from the default placeholder.")
        if len(normalized) < 8:
            raise ValueError("JWT_SECRET must be at least 8 characters long.")
        return normalized

    @field_validator("db_port", mode="before")
    @classmethod
    def parse_db_port(cls, value: object) -> object:
        if value is None:
            return 3306
        if isinstance(value, str) and not value.strip():
            return 3306
        return value

    @model_validator(mode="after")
    def validate_database_config(self) -> "Settings":
        if self.database_url_override:
            return self
        missing = [
            field
            for field in ("db_user", "db_password", "db_host", "db_name")
            if not getattr(self, field)
        ]
        if missing:
            missing_list = ", ".join(missing)
            raise ValueError(f"Missing required database settings: {missing_list}.")
        return self

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
