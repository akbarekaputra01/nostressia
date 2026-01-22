from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user_model import User
from app.services import stress_service
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/predict", tags=["Machine Learning"])


@router.get("/global-forecast")
def predict_global_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    eligibility = stress_service.check_global_eligibility(db, current_user.user_id)
    if not eligibility.eligible:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=eligibility.model_dump(by_alias=True),
        )

    # Placeholder: global forecast integration pending.
    return {
        "message": "Global forecast not integrated yet.",
        "eligibility": eligibility.model_dump(by_alias=True),
    }
