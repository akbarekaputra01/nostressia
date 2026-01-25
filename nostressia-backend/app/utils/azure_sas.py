from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

from azure.storage.blob import BlobServiceClient, BlobSasPermissions, generate_blob_sas

from app.core.config import settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_PROFILE_PICTURE_SIZE = 2 * 1024 * 1024
SAS_EXPIRES_MINUTES = 10


def _sanitize_filename(file_name: str) -> str:
    """Bersihkan nama file agar aman dipakai sebagai blob name."""
    base_name = Path(file_name).name
    return re.sub(r"[^a-zA-Z0-9._-]", "_", base_name)


def _get_blob_service_client() -> BlobServiceClient:
    if not settings.azure_storage_connection_string:
        raise RuntimeError("Azure storage connection string belum dikonfigurasi.")
    return BlobServiceClient.from_connection_string(
        settings.azure_storage_connection_string
    )


def build_profile_picture_blob_name(user_id: int, original_name: str) -> str:
    """Buat path blob rapi untuk foto profil."""
    sanitized = _sanitize_filename(original_name)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"profile-pictures/{user_id}/{timestamp}-{sanitized}"


def generate_profile_picture_sas(blob_name: str) -> tuple[str, str, datetime]:
    """Generate SAS URL untuk upload blob tertentu."""
    blob_service_client = _get_blob_service_client()
    container_name = (
        settings.azure_storage_container_name
        or settings.azure_storage_container
        or "profile-avatars"
    )

    credential = blob_service_client.credential
    account_name = settings.azure_storage_account_name or blob_service_client.account_name
    account_key = None

    if hasattr(credential, "account_key"):
        account_key = credential.account_key
    elif hasattr(credential, "key"):
        account_key = credential.key

    if not account_key:
        raise RuntimeError("Azure storage account key tidak tersedia.")

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
