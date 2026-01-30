import logging

from fastapi import HTTPException, status

from app.models.user_model import User
from app.schemas.storage_schema import StorageUploadSasRequest, StorageUploadSasResponse
from app.utils.azure_sas import (
    ALLOWED_IMAGE_TYPES,
    SAS_EXPIRES_MINUTES,
    build_user_upload_blob_name,
    generate_upload_sas,
)

logger = logging.getLogger(__name__)


def _resolve_user_namespace(user: User) -> str:
    if user.user_id is not None:
        return str(user.user_id)
    if user.username:
        return user.username
    return user.email


def create_upload_sas(
    current_user: User, payload: StorageUploadSasRequest
) -> StorageUploadSasResponse:
    """Generate a SAS URL for a single blob upload."""
    if payload.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The file content type is not supported.",
        )

    if not payload.file_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name is required.",
        )

    user_namespace = _resolve_user_namespace(current_user)
    blob_name = build_user_upload_blob_name(
        user_namespace, payload.folder, payload.file_name
    )
    upload_url, blob_url, _expires_at = generate_upload_sas(blob_name)

    logger.info(
        "Generated upload SAS for user=%s blob=%s content_type=%s",
        user_namespace,
        blob_name,
        payload.content_type,
    )

    return StorageUploadSasResponse(
        upload_url=upload_url,
        blob_url=blob_url,
        blob_name=blob_name,
        expires_in_minutes=SAS_EXPIRES_MINUTES,
    )
