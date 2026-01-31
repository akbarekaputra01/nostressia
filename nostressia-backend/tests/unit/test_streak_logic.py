from datetime import date

import pytest
from fastapi import HTTPException

from app.models.user_model import User
from app.schemas.stress_schema import RESTORE_LIMIT, StressLevelCreate
from app.services import stress_service
from app.utils.hashing import hash_password


def _create_user(db_session):
    user = User(
        name="Streak User",
        username="streakuser",
        email="streak@example.com",
        password=hash_password("Password123!"),
        gender="unspecified",
        user_dob=date(2000, 1, 1),
        is_verified=True,
        streak=0,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _build_log(entry_date: date) -> StressLevelCreate:
    return StressLevelCreate(
        date=entry_date,
        stress_level=2,
        gpa=3.4,
        extracurricular_hour_per_day=1,
        physical_activity_hour_per_day=1,
        sleep_hour_per_day=7,
        study_hour_per_day=2,
        social_hour_per_day=1,
        emoji=1,
    )


def test_gap_without_restore_resets_streak(db_session):
    user = _create_user(db_session)
    stress_service.create_stress_log(db_session, _build_log(date(2024, 1, 1)), user.user_id)
    stress_service.create_stress_log(db_session, _build_log(date(2024, 1, 2)), user.user_id)

    stress_service.create_stress_log(db_session, _build_log(date(2024, 1, 4)), user.user_id)
    db_session.refresh(user)

    assert user.streak == 1


def test_gap_covered_by_restore_keeps_streak(db_session):
    user = _create_user(db_session)
    stress_service.create_stress_log(db_session, _build_log(date(2024, 1, 1)), user.user_id)
    stress_service.create_stress_log(db_session, _build_log(date(2024, 1, 2)), user.user_id)

    stress_service.create_restore_log(db_session, _build_log(date(2024, 1, 3)), user.user_id)
    db_session.refresh(user)
    assert user.streak == 3

    stress_service.create_stress_log(db_session, _build_log(date(2024, 1, 4)), user.user_id)
    db_session.refresh(user)
    assert user.streak == 4


def test_restore_limit_enforced_per_month(db_session):
    user = _create_user(db_session)
    for day in range(1, RESTORE_LIMIT + 1):
        stress_service.create_restore_log(
            db_session,
            _build_log(date(2024, 2, day)),
            user.user_id,
        )

    with pytest.raises(HTTPException) as excinfo:
        stress_service.create_restore_log(
            db_session,
            _build_log(date(2024, 2, RESTORE_LIMIT + 1)),
            user.user_id,
        )

    assert excinfo.value.status_code == 403


def test_restore_limit_resets_each_month(db_session):
    user = _create_user(db_session)
    for day in range(1, RESTORE_LIMIT + 1):
        stress_service.create_restore_log(
            db_session,
            _build_log(date(2024, 1, day)),
            user.user_id,
        )

    created = stress_service.create_restore_log(
        db_session,
        _build_log(date(2024, 2, 1)),
        user.user_id,
    )

    assert created.is_restored is True


def test_duplicate_date_rejected_across_restore_and_original(db_session):
    user = _create_user(db_session)
    stress_service.create_stress_log(db_session, _build_log(date(2024, 3, 10)), user.user_id)

    with pytest.raises(HTTPException) as excinfo:
        stress_service.create_restore_log(db_session, _build_log(date(2024, 3, 10)), user.user_id)

    assert excinfo.value.status_code == 409
