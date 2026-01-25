from datetime import datetime

from pydantic import Field

from app.schemas.base_schema import BaseSchema


class ProfilePictureSasRequest(BaseSchema):
    """Payload untuk meminta SAS upload foto profil."""

    file_name: str = Field(..., description="Nama file asli dari user")
    content_type: str = Field(..., description="MIME type file gambar")
    file_size: int = Field(..., description="Ukuran file dalam bytes")


class ProfilePictureSasResponse(BaseSchema):
    """Response untuk SAS upload foto profil."""

    sas_url: str
    blob_url: str
    blob_name: str
    expires_at: datetime


class ProfilePictureUpdateRequest(BaseSchema):
    """Payload untuk menyimpan URL foto profil di database."""

    profile_image_url: str = Field(..., description="URL foto profil di Azure Blob")
