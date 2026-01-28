from datetime import date

from app.schemas.stress_schema import StressLevelCreate
from app.services import stress_service
from app.models.user_model import User
from app.utils.hashing import hash_password


def _create_user(db_session):
    user = User(
        name="Example User",
        username="exampleuser",
        email="user@example.com",
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


def test_impute_latest_gpa_from_existing_logs(db_session):
    user = _create_user(db_session)
    first_log = StressLevelCreate(
        date=date(2024, 1, 1),
        stress_level=2,
        gpa=3.4,
        extracurricular_hour_per_day=1,
        physical_activity_hour_per_day=1,
        sleep_hour_per_day=7,
        study_hour_per_day=2,
        social_hour_per_day=1,
        emoji=1,
    )
    stress_service.create_stress_log(db_session, first_log, user.user_id)

    missing_gpa_log = StressLevelCreate(
        date=date(2024, 1, 2),
        stress_level=2,
        gpa=None,
        extracurricular_hour_per_day=1,
        physical_activity_hour_per_day=1,
        sleep_hour_per_day=7,
        study_hour_per_day=2,
        social_hour_per_day=1,
        emoji=1,
    )
    created = stress_service.create_stress_log(
        db_session, missing_gpa_log, user.user_id
    )

    assert created.gpa == 3.4


def test_impute_latest_gpa_missing_remains_null(db_session):
    user = _create_user(db_session)
    missing_gpa_log = StressLevelCreate(
        date=date(2024, 1, 3),
        stress_level=1,
        gpa=None,
        extracurricular_hour_per_day=0,
        physical_activity_hour_per_day=1,
        sleep_hour_per_day=7,
        study_hour_per_day=2,
        social_hour_per_day=1,
        emoji=1,
    )
    created = stress_service.create_stress_log(
        db_session, missing_gpa_log, user.user_id
    )

    assert created.gpa is None
