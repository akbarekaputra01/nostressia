from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.stress_log_model import StressLevel
from app.schemas.stress_schema import (
    EligibilityResponse,
    RESTORE_LIMIT,
    REQUIRED_STREAK,
    StressLevelCreate,
)
from app.services.global_forecast_service import global_forecast_service


def _month_bounds(ref_date: date) -> tuple[date, date]:
    first_day = ref_date.replace(day=1)
    if ref_date.month == 12:
        next_month = date(ref_date.year + 1, 1, 1)
    else:
        next_month = date(ref_date.year, ref_date.month + 1, 1)
    return first_day, next_month


def get_user_streak_count(db: Session, user_id: int) -> int:
    return (
        db.query(func.count(func.distinct(StressLevel.date)))
        .filter(StressLevel.user_id == user_id)
        .scalar()
        or 0
    )


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
    streak = get_user_streak_count(db, user_id)
    eligible = streak >= required_streak
    today = datetime.now(tz=timezone.utc).date()
    restore_used = get_restore_used_in_month(db, user_id, today)
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


def create_stress_log(db: Session, stress_data: StressLevelCreate, user_id: int) -> StressLevel:
    _ensure_no_duplicate(db, user_id, stress_data.date)
    new_log = _build_stress_level(stress_data, user_id, is_restored=False)
    db.add(new_log)
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
    new_log = _build_stress_level(stress_data, user_id, is_restored=True)
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


def get_user_stress_logs(db: Session, user_id: int):
    return db.query(StressLevel).filter(StressLevel.user_id == user_id).all()
