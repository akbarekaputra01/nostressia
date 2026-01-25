from __future__ import annotations

from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user_model import User
from app.schemas.profile_schema import (
    ProfilePictureSasRequest,
    ProfilePictureSasResponse,
    ProfilePictureUpdateRequest,
)
from app.schemas.user_auth_schema import UserResponse
from app.utils.azure_sas import (
    ALLOWED_IMAGE_EXTENSIONS,
    ALLOWED_IMAGE_TYPES,
    MAX_PROFILE_PICTURE_SIZE,
    build_profile_picture_blob_name,
    generate_profile_picture_sas,
)


def _validate_profile_picture_payload(payload: ProfilePictureSasRequest) -> None:
    """Validasi file gambar sebelum membuat SAS."""
    if payload.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content type gambar tidak didukung.",
        )

    extension = Path(payload.file_name).suffix.lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ekstensi file gambar tidak didukung.",
        )

    if payload.file_size > MAX_PROFILE_PICTURE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ukuran file melebihi batas 2MB.",
        )


def create_profile_picture_sas(
    user_id: int, payload: ProfilePictureSasRequest
) -> ProfilePictureSasResponse:
    """Generate SAS untuk upload foto profil."""
    _validate_profile_picture_payload(payload)
    blob_name = build_profile_picture_blob_name(user_id, payload.file_name)
    sas_url, blob_url, expires_at = generate_profile_picture_sas(blob_name)
    return ProfilePictureSasResponse(
        sas_url=sas_url,
        blob_url=blob_url,
        blob_name=blob_name,
        expires_at=expires_at,
    )


def update_profile_picture(
    current_user: User, payload: ProfilePictureUpdateRequest, db: Session
) -> UserResponse:
    """Simpan URL foto profil ke database."""
    current_user.avatar = payload.profile_image_url
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
