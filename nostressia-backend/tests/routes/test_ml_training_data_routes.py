from datetime import date

import pytest

from app.core.config import settings
from app.models.stress_log_model import StressLevel
from app.models.user_model import User
from app.utils.hashing import hash_password


def _create_user(db_session):
    user = User(
        name="ML User",
        username="mluser",
        email="ml@example.com",
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


def _create_log(db_session, user_id, log_date):
    log = StressLevel(
        user_id=user_id,
        date=log_date,
        stress_level=1,
        gpa=3.0,
        extracurricular_hour_per_day=1.0,
        physical_activity_hour_per_day=1.0,
        sleep_hour_per_day=7.0,
        study_hour_per_day=3.0,
        social_hour_per_day=2.0,
        emoji=1,
        is_restored=False,
    )
    db_session.add(log)
    db_session.commit()
    return log


def test_ml_training_data_global(client, db_session):
    user = _create_user(db_session)
    _create_log(db_session, user.user_id, date(2024, 1, 1))

    response = client.get("/api/ml/training-data/global")
    assert response.status_code == 200
    assert response.json()["data"][0]["user_id"] == user.user_id


def test_ml_training_data_personalized(client, db_session):
    user = _create_user(db_session)
    _create_log(db_session, user.user_id, date(2024, 1, 1))

    response = client.get(
        "/api/ml/training-data/personalized",
        params={"userId": user.user_id, "limit": 10},
    )
    assert response.status_code == 200
    assert response.json()["data"][0]["user_id"] == user.user_id


def test_ml_training_data_requires_internal_token(client, db_session, monkeypatch):
    user = _create_user(db_session)
    _create_log(db_session, user.user_id, date(2024, 1, 1))

    monkeypatch.setattr(settings, "internal_training_token", "secret-token")
    response = client.get("/api/ml/training-data/global")
    assert response.status_code == 401

    response = client.get(
        "/api/ml/training-data/global",
        headers={"X-Internal-Token": "secret-token"},
    )
    assert response.status_code == 200
