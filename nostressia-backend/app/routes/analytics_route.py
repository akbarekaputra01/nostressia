from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.stress_log_model import StressLevel
from app.models.diary_model import Diary
from app.models.user_model import User
from app.utils.jwt_handler import get_current_user
from app.utils.response import success_response
from app.schemas.analytics_schema import AnalyticsSummaryResponse
from app.schemas.response_schema import APIResponse
from app.services.email_service import send_weekly_report_email

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=APIResponse[AnalyticsSummaryResponse])
def get_user_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stress_logs_count = (
        db.query(StressLevel).filter(StressLevel.user_id == current_user.user_id).count()
    )
    diary_count = db.query(Diary).filter(Diary.user_id == current_user.user_id).count()

    return success_response(
        data={
            "stressLogsCount": stress_logs_count,
            "diaryCount": diary_count,
            "streak": current_user.streak,
        },
        message="Analytics summary fetched",
    )


@router.post("/weekly-report", response_model=APIResponse[dict])
def send_weekly_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end_date = date.today()
    start_date = end_date - timedelta(days=6)

    stress_logs = (
        db.query(StressLevel)
        .filter(
            StressLevel.user_id == current_user.user_id,
            StressLevel.date >= start_date,
            StressLevel.date <= end_date,
        )
        .all()
    )
    diary_count = (
        db.query(Diary)
        .filter(
            Diary.user_id == current_user.user_id,
            Diary.date >= start_date,
            Diary.date <= end_date,
        )
        .count()
    )

    avg_stress = "-"
    if stress_logs:
        avg_stress_value = sum(log.stress_level or 0 for log in stress_logs) / len(stress_logs)
        avg_stress = round(avg_stress_value, 2)

    report_payload = {
        "date_range": f"{start_date.isoformat()} - {end_date.isoformat()}",
        "stress_logs": len(stress_logs),
        "diary_entries": diary_count,
        "avg_stress_level": avg_stress,
        "streak": current_user.streak or 0,
    }

    email_sent, error = send_weekly_report_email(
        current_user.email,
        report_payload,
        user_name=current_user.name or "there",
    )
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error or "Failed to send weekly report.",
        )

    return success_response(
        data={"email": current_user.email, "report": report_payload},
        message="Weekly report sent",
    )
