from __future__ import annotations

import mimetypes
from pathlib import Path
from uuid import uuid4

from azure.core.exceptions import ResourceExistsError
from azure.storage.blob import BlobServiceClient, ContainerClient, ContentSettings
from fastapi import UploadFile

from app.core.config import settings


def _get_container_client() -> ContainerClient:
    if not settings.azure_storage_connection_string:
        raise RuntimeError("Azure storage connection string is not configured.")
    blob_service = BlobServiceClient.from_connection_string(
        settings.azure_storage_connection_string
    )
    container_name = settings.azure_storage_container or "profile-avatars"
    container_client = blob_service.get_container_client(container_name)
    try:
        container_client.create_container()
    except ResourceExistsError:
        pass
    return container_client


def upload_avatar(file: UploadFile, user_id: int) -> str:
    container_client = _get_container_client()
    extension = Path(file.filename or "").suffix
    if not extension and file.content_type:
        extension = mimetypes.guess_extension(file.content_type) or ""

    blob_name = f"avatars/{user_id}/{uuid4().hex}{extension}"
    content_settings = ContentSettings(content_type=file.content_type or "image/jpeg")
    blob_client = container_client.get_blob_client(blob_name)
    file.file.seek(0)
    blob_client.upload_blob(file.file, overwrite=True, content_settings=content_settings)
    return blob_client.url
