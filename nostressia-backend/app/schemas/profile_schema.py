from datetime import datetime

from pydantic import Field

from app.schemas.base_schema import BaseSchema


class ProfilePictureSasRequest(BaseSchema):
    """Payload for requesting a profile upload SAS."""

    file_name: str = Field(..., description="Original filename provided by the user")
    content_type: str = Field(..., description="MIME type of the image file")
    file_size: int = Field(..., description="File size in bytes")


class ProfilePictureSasResponse(BaseSchema):
    """Response for profile upload SAS."""

    sas_url: str
    blob_url: str
    blob_name: str
    expires_at: datetime


class ProfilePictureUpdateRequest(BaseSchema):
    """Payload for storing the profile photo URL in the database."""

    profile_image_url: str = Field(
        ..., description="Profile image URL stored in Azure Blob Storage"
    )
