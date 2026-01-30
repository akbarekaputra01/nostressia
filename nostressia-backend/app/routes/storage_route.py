from fastapi import APIRouter, Depends

from app.models.user_model import User
from app.schemas.response_schema import APIResponse
from app.schemas.storage_schema import StorageUploadSasRequest, StorageUploadSasResponse
from app.services.storage_service import create_upload_sas
from app.utils.jwt_handler import get_current_user
from app.utils.response import success_response

router = APIRouter(prefix="/storage", tags=["Storage"])


@router.post("/sas/upload", response_model=APIResponse[StorageUploadSasResponse])
def request_upload_sas(
    payload: StorageUploadSasRequest,
    current_user: User = Depends(get_current_user),
):
    """Create a short-lived SAS URL for a single blob upload."""
    sas_payload = create_upload_sas(current_user, payload)
    return success_response(data=sas_payload, message="SAS created")
