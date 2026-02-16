from datetime import date

from fastapi import APIRouter, Depends, Query
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
from app.utils.jwt_handler import get_current_user  # Authenticated user resolver.
from app.utils.response import success_response

router = APIRouter(
    prefix="/stress-levels",
    tags=["Stress Levels"]
)

# Create stress log (POST)
@router.post("/", response_model=APIResponse[StressLevelResponse])
def add_stress_log(
    log_data: StressLevelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return success_response(
        data=stress_service.create_stress_log(
            db=db,
            stress_data=log_data,
            user_id=current_user.user_id,
        ),
        message="Stress log created",
    )

# 2. Restore stress log (POST)
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


# 3. Fetch my stress logs (GET)
@router.get("/my-logs", response_model=APIResponse[list[StressLevelResponse]])
def read_my_stress_logs(
    page: int = 1,
    limit: int = 10,
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only fetch data for the authenticated user.
    return success_response(
        data=stress_service.get_user_stress_logs(
            db=db,
            user_id=current_user.user_id,
            page=page,
            limit=limit,
            start_date=start_date,
            end_date=end_date,
        ),
        message="Stress logs fetched",
    )


# 4. Global eligibility
@router.get("/eligibility", response_model=APIResponse[EligibilityResponse])
def get_global_eligibility(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return success_response(
        data=stress_service.check_global_eligibility(db, current_user.user_id),
        message="Eligibility fetched",
    )

@router.put("/{stress_level_id}", response_model=APIResponse[StressLevelResponse])
def update_stress_log(
    stress_level_id: int,
    log_data: StressLevelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return success_response(
        data=stress_service.update_stress_log(
            db=db,
            stress_level_id=stress_level_id,
            stress_data=log_data,
            user_id=current_user.user_id,
        ),
        message="Stress log updated",
    )
