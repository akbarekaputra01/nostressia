from pydantic import Field

from app.schemas.base_schema import BaseSchema


class StorageUploadSasRequest(BaseSchema):
    """Payload for requesting an upload SAS URL."""

    file_name: str = Field(..., description="Original filename provided by the client")
    content_type: str = Field(..., description="MIME type of the file")
    folder: str = Field("uploads", description="Target folder prefix for the blob path")


class StorageUploadSasResponse(BaseSchema):
    """Response containing the upload SAS URL and blob info."""

    upload_url: str
    blob_url: str
    blob_name: str
    expires_in_minutes: int
