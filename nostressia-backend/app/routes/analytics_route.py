from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user_model import User
from app.utils.jwt_handler import get_current_user
from app.utils.response import success_response
from app.schemas.analytics_schema import AnalyticsSummaryResponse
from app.schemas.response_schema import APIResponse
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def send_weekly_report_email(db: Session, current_user: User):
    """Backward-compatible helper for weekly report delivery."""
    return analytics_service.send_weekly_report(db, current_user)


@router.get("/summary", response_model=APIResponse[AnalyticsSummaryResponse])
def get_user_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return success_response(
        data=analytics_service.get_user_summary(db, current_user),
        message="Analytics summary fetched",
    )


@router.post("/weekly-report", response_model=APIResponse[dict])
def send_weekly_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = send_weekly_report_email(db, current_user)
    if isinstance(result, tuple):
        sent, error = result
        if not sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error or "Failed to send weekly report.",
            )
        data = {"email": current_user.email}
    else:
        data = result

    return success_response(data=data, message="Weekly report sent")
