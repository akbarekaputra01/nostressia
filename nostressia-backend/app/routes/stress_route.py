from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user_model import User
from app.schemas.stress_schema import (
    EligibilityResponse,
    StressLevelCreate,
    StressLevelResponse,
)
from app.schemas.response_schema import APIResponse
from app.services import stress_service
from app.utils.jwt_handler import get_current_user # <--- Import fungsi auth kamu
from app.utils.response import success_response

router = APIRouter(
    prefix="/stress-levels",
    tags=["Stress Levels"]
)

# 1. Endpoint Tambah Data (POST)
@router.post("/", response_model=APIResponse[StressLevelResponse])
def add_stress_log(
    log_data: StressLevelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # <--- Proteksi Token
):
    return success_response(
        data=stress_service.create_stress_log(
            db=db,
            stress_data=log_data,
            user_id=current_user.user_id,
        ),
        message="Stress log created",
    )

# 2. Endpoint Restore Data (POST)
@router.post("/restore", response_model=APIResponse[StressLevelResponse])
def restore_stress_log(
    log_data: StressLevelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return success_response(
        data=stress_service.create_restore_log(
            db=db,
            stress_data=log_data,
            user_id=current_user.user_id,
        ),
        message="Stress log restored",
    )


# 3. Endpoint Ambil Data Saya (GET)
@router.get("/my-logs", response_model=APIResponse[list[StressLevelResponse]])
def read_my_stress_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # <--- Proteksi Token
):
    # Hanya ambil data milik user yang sedang login
    return success_response(
        data=stress_service.get_user_stress_logs(
            db=db,
            user_id=current_user.user_id,
        ),
        message="Stress logs fetched",
    )


# 4. Endpoint Eligibility Global
@router.get("/eligibility", response_model=APIResponse[EligibilityResponse])
def get_global_eligibility(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return success_response(
        data=stress_service.check_global_eligibility(db, current_user.user_id),
        message="Eligibility fetched",
    )
