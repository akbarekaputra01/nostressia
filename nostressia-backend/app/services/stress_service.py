from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.stress_log_model import StressLevel
from app.models.user_model import User
from app.schemas.stress_schema import (
    EligibilityResponse,
    RESTORE_LIMIT,
    REQUIRED_STREAK,
    StressLevelCreate,
)
from app.services.global_forecast_service import global_forecast_service
from typing import Optional

def _month_bounds(ref_date: date) -> tuple[date, date]:
    first_day = ref_date.replace(day=1)
    if ref_date.month == 12:
        next_month = date(ref_date.year + 1, 1, 1)
    else:
        next_month = date(ref_date.year, ref_date.month + 1, 1)
    return first_day, next_month


def get_user_current_streak(db: Session, user_id: int) -> int:
    dates = (
        db.query(StressLevel.date)
        .filter(StressLevel.user_id == user_id)
        .all()
    )
    if not dates:
        return 0
    date_values = {row[0] for row in dates}
    latest_date = max(date_values)
    streak = 0
    current_date = latest_date
    while current_date in date_values:
        streak += 1
        current_date -= timedelta(days=1)
    return streak


def get_restore_used_in_month(db: Session, user_id: int, ref_date: date) -> int:
    start_date, end_date = _month_bounds(ref_date)
    return (
        db.query(func.count(StressLevel.stress_level_id))
        .filter(
            StressLevel.user_id == user_id,
            StressLevel.is_restored.is_(True),
            StressLevel.date >= start_date,
            StressLevel.date < end_date,
        )
        .scalar()
        or 0
    )


def _resolve_required_streak() -> int:
    required_streak = REQUIRED_STREAK
    model_required = global_forecast_service.get_required_history_days()
    if model_required:
        required_streak = max(required_streak, model_required)
    return required_streak


def check_global_eligibility(db: Session, user_id: int) -> EligibilityResponse:
    required_streak = _resolve_required_streak()
    log_streak = get_user_current_streak(db, user_id)
    streak = log_streak
    eligible = streak >= required_streak
    today = datetime.now(tz=timezone.utc).date()
    restore_used = get_restore_used_in_month(db, user_id, today)
    restore_remaining = max(RESTORE_LIMIT - restore_used, 0)
    missing = max(0, required_streak - streak)
    note = (
        "Eligible for global forecast."
        if eligible
        else f"Need {missing} more entries to unlock global forecast."
    )

    return EligibilityResponse(
        user_id=user_id,
        eligible=eligible,
        streak=streak,
        required_streak=required_streak,
        restore_used=restore_used,
        restore_remaining=restore_remaining,
        missing=missing,
        note=note,
    )


def _ensure_no_duplicate(db: Session, user_id: int, entry_date: date) -> None:
    exists = (
        db.query(StressLevel.stress_level_id)
        .filter(StressLevel.user_id == user_id, StressLevel.date == entry_date)
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Stress level for this date already exists.",
        )


def _build_stress_level(stress_data: StressLevelCreate, user_id: int, is_restored: bool) -> StressLevel:
    return StressLevel(
        date=stress_data.date,
        stress_level=stress_data.stress_level,
        gpa=stress_data.gpa,
        extracurricular_hour_per_day=stress_data.extracurricular_hour_per_day,
        physical_activity_hour_per_day=stress_data.physical_activity_hour_per_day,
        sleep_hour_per_day=stress_data.sleep_hour_per_day,
        study_hour_per_day=stress_data.study_hour_per_day,
        social_hour_per_day=stress_data.social_hour_per_day,
        emoji=stress_data.emoji,
        user_id=user_id,
        is_restored=is_restored,
    )


def _resolve_latest_gpa(db: Session, user_id: int) -> Optional[float]:
    latest = (
        db.query(StressLevel)
        .filter(StressLevel.user_id == user_id, StressLevel.gpa.is_not(None))
        .order_by(StressLevel.date.desc(), StressLevel.created_at.desc())
        .first()
    )
    return float(latest.gpa) if latest and latest.gpa is not None else None


def _ensure_gpa_imputed(db: Session, stress_data: StressLevelCreate, user_id: int) -> StressLevelCreate:
    if stress_data.gpa is not None:
        return stress_data
    latest_gpa = _resolve_latest_gpa(db, user_id)
    if latest_gpa is None:
        return stress_data
    return stress_data.model_copy(update={"gpa": latest_gpa})


def create_stress_log(db: Session, stress_data: StressLevelCreate, user_id: int) -> StressLevel:
    _ensure_no_duplicate(db, user_id, stress_data.date)
    stress_payload = _ensure_gpa_imputed(db, stress_data, user_id)
    new_log = _build_stress_level(stress_payload, user_id, is_restored=False)
    db.add(new_log)
    db.flush()
    current_streak = get_user_current_streak(db, user_id)
    user = db.query(User).filter(User.user_id == user_id).first()
    if user:
        user.streak = current_streak
    db.commit()
    db.refresh(new_log)
    return new_log


def create_restore_log(db: Session, stress_data: StressLevelCreate, user_id: int) -> StressLevel:
    _ensure_no_duplicate(db, user_id, stress_data.date)
    restore_used = get_restore_used_in_month(db, user_id, stress_data.date)
    if restore_used >= RESTORE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Restore limit reached for this month.",
        )
    stress_payload = _ensure_gpa_imputed(db, stress_data, user_id)
    new_log = _build_stress_level(stress_payload, user_id, is_restored=True)
    db.add(new_log)
    db.flush()
    current_streak = get_user_current_streak(db, user_id)
    user = db.query(User).filter(User.user_id == user_id).first()
    if user:
        user.streak = current_streak
    db.commit()
    db.refresh(new_log)
    return new_log


def get_user_stress_logs(db: Session, user_id: int):
    return db.query(StressLevel).filter(StressLevel.user_id == user_id).all()
