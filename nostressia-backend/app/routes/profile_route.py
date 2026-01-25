from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user_model import User
from app.schemas.profile_schema import (
    ProfilePictureSasRequest,
    ProfilePictureSasResponse,
    ProfilePictureUpdateRequest,
)
from app.schemas.response_schema import APIResponse
from app.schemas.user_auth_schema import UserResponse
from app.services.profile_service import create_profile_picture_sas, update_profile_picture
from app.utils.jwt_handler import get_current_user
from app.utils.response import success_response

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.post("/picture/sas", response_model=APIResponse[ProfilePictureSasResponse])
def request_profile_picture_sas(
    payload: ProfilePictureSasRequest,
    current_user: User = Depends(get_current_user),
):
    """Buat SAS URL pendek untuk upload foto profil."""
    sas_payload = create_profile_picture_sas(current_user.user_id, payload)
    return success_response(data=sas_payload, message="SAS created")


@router.put("/picture", response_model=APIResponse[UserResponse])
def save_profile_picture(
    payload: ProfilePictureUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Simpan URL foto profil ke database."""
    user_payload = update_profile_picture(current_user, payload, db)
    return success_response(data=user_payload, message="Profile picture updated")
