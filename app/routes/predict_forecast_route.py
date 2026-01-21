from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user_model import User
from app.services.global_forecast_service import global_forecast_service
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/predict", tags=["Machine Learning"])


@router.get("/global-forecast")
def predict_global_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return global_forecast_service.predict_next_day_for_user(db, current_user.userID)
