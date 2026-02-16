from datetime import date, timedelta
from typing import Any, Dict, Iterable, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.diary_model import Diary
from app.models.stress_log_model import StressLevel
from app.models.user_model import User
from app.services.email_service import send_weekly_report_email

STRESS_LABELS = {
    1: "Low",
    2: "Moderate",
    3: "High",
}


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


def _get_dominant_stress_label(stress_logs: Iterable[StressLevel]) -> str:
    stats: Dict[int, Tuple[int, date]] = {}
    for log in stress_logs:
        level = int(log.stress_level or 0)
        if level not in STRESS_LABELS:
            continue
        current_count, latest_date = stats.get(level, (0, date.min))
        stats[level] = (current_count + 1, max(latest_date, log.date or date.min))

    if not stats:
        return "-"

    dominant_level = max(
        stats.items(),
        key=lambda item: (item[1][0], item[1][1], item[0]),
    )[0]
    return STRESS_LABELS[dominant_level]


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

    report_payload = {
        "date_range": f"{start_date.isoformat()} - {end_date.isoformat()}",
        "stress_logs": len(stress_logs),
        "diary_entries": diary_count,
        "dominant_stress_level": _get_dominant_stress_label(stress_logs),
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
