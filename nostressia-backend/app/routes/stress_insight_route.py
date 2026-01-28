from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user_model import User
from app.schemas.predict_schema import PredictRequest, PredictResponse
from app.schemas.response_schema import APIResponse
from app.schemas.stress_schema import GlobalForecastPayload
from app.services import forecast_service, stress_service
from app.services.ml_service import ml_service
from app.utils.jwt_handler import get_current_user
from app.utils.response import success_response

router = APIRouter(prefix="/stress", tags=["Stress Insights"])


@router.post("/current", response_model=APIResponse[PredictResponse])
def predict_current_stress(
    request: PredictRequest,
    db: Session = Depends(get_db),
):
    input_data = {
        "study_hours": request.study_hours,
        "extracurricular_hours": request.extracurricular_hours,
        "sleep_hours": request.sleep_hours,
        "social_hours": request.social_hours,
        "physical_hours": request.physical_hours,
        "gpa": request.gpa,
    }

    result = ml_service.predict_stress(input_data)

    if result == "Error":
        raise HTTPException(status_code=500, detail="An error occurred in the ML model.")

    payload = PredictResponse(
        result=result,
        message=f"Your stress level is detected as: {result}",
    )
    return success_response(data=payload, message="Prediction created")


@router.get("/global-forecast", response_model=APIResponse[GlobalForecastPayload])
def get_global_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    eligibility = stress_service.check_global_eligibility(db, current_user.user_id)
    if not eligibility.eligible:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=eligibility.model_dump(by_alias=True),
        )

    forecast = forecast_service.get_global_forecast_for_user(
        current_user.user_id,
        eligibility,
        db,
    )
    return success_response(data=forecast, message="Forecast fetched")
