from __future__ import annotations

import re
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path

from azure.storage.blob import BlobServiceClient, BlobSasPermissions, generate_blob_sas

from app.core.config import settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_PROFILE_PICTURE_SIZE = 2 * 1024 * 1024
SAS_EXPIRES_MINUTES = 10
MAX_FILENAME_LENGTH = 120


def _sanitize_filename(file_name: str, max_length: int = MAX_FILENAME_LENGTH) -> str:
    """Sanitize filenames to make them safe for blob names."""
    base_name = Path(file_name).name
    cleaned = re.sub(r"[^a-zA-Z0-9._-]", "_", base_name).strip("._")
    if not cleaned:
        cleaned = "file"
    if len(cleaned) <= max_length:
        return cleaned

    suffix = Path(cleaned).suffix
    stem = Path(cleaned).stem
    max_stem = max_length - len(suffix)
    if max_stem <= 0:
        return cleaned[:max_length]
    return f"{stem[:max_stem]}{suffix}"


def _sanitize_folder(folder: str) -> str:
    """Sanitize folder paths to avoid unsafe blob prefixes."""
    parts = [
        re.sub(r"[^a-zA-Z0-9_-]", "_", part)
        for part in str(folder or "").split("/")
        if part
    ]
    safe_folder = "/".join(part for part in parts if part)
    return safe_folder or "uploads"


def _get_blob_service_client() -> BlobServiceClient:
    if not settings.azure_storage_connection_string:
        raise RuntimeError("Azure storage connection string is not configured.")
    return BlobServiceClient.from_connection_string(
        settings.azure_storage_connection_string
    )


def _resolve_account_key(blob_service_client: BlobServiceClient) -> tuple[str, str]:
    credential = blob_service_client.credential
    account_name = settings.azure_storage_account_name or blob_service_client.account_name
    account_key = None

    if hasattr(credential, "account_key"):
        account_key = credential.account_key
    elif hasattr(credential, "key"):
        account_key = credential.key

    if not account_key:
        raise RuntimeError("Azure storage account key is not available.")

    return account_name, account_key


def build_profile_picture_blob_name(user_id: int, original_name: str) -> str:
    """Build a clean blob path for profile photos."""
    sanitized = _sanitize_filename(original_name)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"profile-pictures/{user_id}/{timestamp}-{sanitized}"


def build_user_upload_blob_name(
    user_id: str, folder: str, original_name: str
) -> str:
    """Build a clean blob path for user uploads."""
    sanitized = _sanitize_filename(original_name)
    safe_folder = _sanitize_folder(folder)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    random_suffix = secrets.token_hex(4)
    return f"users/{user_id}/{safe_folder}/{timestamp}-{random_suffix}-{sanitized}"


def generate_profile_picture_sas(blob_name: str) -> tuple[str, str, datetime]:
    """Generate a SAS URL for uploading a specific blob."""
    blob_service_client = _get_blob_service_client()
    container_name = (
        settings.azure_storage_container_name
        or settings.azure_storage_container
        or "profile-avatars"
    )
    account_name, account_key = _resolve_account_key(blob_service_client)

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=SAS_EXPIRES_MINUTES)
    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=container_name,
        blob_name=blob_name,
        account_key=account_key,
        permission=BlobSasPermissions(create=True, write=True),
        expiry=expires_at,
    )

    blob_url = (
        f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}"
    )
    sas_url = f"{blob_url}?{sas_token}"
    return sas_url, blob_url, expires_at


def generate_upload_sas(blob_name: str) -> tuple[str, str, datetime]:
    """Generate a SAS URL for a specific blob upload."""
    blob_service_client = _get_blob_service_client()
    container_name = (
        settings.azure_storage_container_name
        or settings.azure_storage_container
        or "profile-avatars"
    )
    account_name, account_key = _resolve_account_key(blob_service_client)

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=SAS_EXPIRES_MINUTES)
    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=container_name,
        blob_name=blob_name,
        account_key=account_key,
        permission=BlobSasPermissions(create=True, write=True),
        expiry=expires_at,
    )

    blob_url = (
        f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}"
    )
    sas_url = f"{blob_url}?{sas_token}"
    return sas_url, blob_url, expires_at
