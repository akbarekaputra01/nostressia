from datetime import date, timedelta
from typing import Dict, Any, Tuple

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.stress_log_model import StressLevel
from app.models.diary_model import Diary
from app.models.user_model import User
from app.services.email_service import send_weekly_report_email

def get_user_summary(db: Session, user: User) -> Dict[str, Any]:
    stress_logs_count = (
        db.query(StressLevel).filter(StressLevel.user_id == user.user_id).count()
    )
    diary_count = db.query(Diary).filter(Diary.user_id == user.user_id).count()

    return {
        "stressLogsCount": stress_logs_count,
        "diaryCount": diary_count,
        "streak": user.streak,
    }

def send_weekly_report(db: Session, user: User) -> Dict[str, Any]:
    end_date = date.today()
    start_date = end_date - timedelta(days=6)

    stress_logs = (
        db.query(StressLevel)
        .filter(
            StressLevel.user_id == user.user_id,
            StressLevel.date >= start_date,
            StressLevel.date <= end_date,
        )
        .all()
    )
    diary_count = (
        db.query(Diary)
        .filter(
            Diary.user_id == user.user_id,
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
        "streak": user.streak or 0,
    }

    email_sent, error = send_weekly_report_email(
        user.email,
        report_payload,
        user_name=user.name or "there",
    )
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error or "Failed to send weekly report.",
        )

    return {"email": user.email, "report": report_payload}
