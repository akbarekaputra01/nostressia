from datetime import date

import pytest

from app.models.stress_log_model import StressLevel
from app.models.user_model import User
from app.services import training_data_service
from app.utils.hashing import hash_password


def _create_user(db_session):
    user = User(
        name="Training User",
        username="training",
        email="training@example.com",
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


def _create_log(db_session, user_id, log_date, level=1):
    log = StressLevel(
        user_id=user_id,
        date=log_date,
        stress_level=level,
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


def test_fetch_global_training_rows_db(db_session):
    user = _create_user(db_session)
    _create_log(db_session, user.user_id, date(2024, 1, 1))

    rows = training_data_service.fetch_global_training_rows(
        db_session, data_source="db"
    )

    assert rows
    assert rows[0]["user_id"] == user.user_id


def test_fetch_global_training_rows_default_source(db_session, monkeypatch):
    user = _create_user(db_session)
    _create_log(db_session, user.user_id, date(2024, 1, 1))

    monkeypatch.setattr(training_data_service, "_resolve_data_source", lambda: "db")
    rows = training_data_service.fetch_global_training_rows(db_session)
    assert rows[0]["user_id"] == user.user_id


def test_fetch_global_training_rows_api_requires_base_url(monkeypatch):
    monkeypatch.setattr(training_data_service, "_resolve_backend_base_url", lambda: None)
    with pytest.raises(RuntimeError, match="BACKEND_BASE_URL is not set"):
        training_data_service.fetch_global_training_rows(
            None, data_source="api"
        )


def test_fetch_personalized_training_rows_db(db_session):
    user = _create_user(db_session)
    _create_log(db_session, user.user_id, date(2024, 1, 1))
    _create_log(db_session, user.user_id, date(2024, 1, 2))

    rows = training_data_service.fetch_personalized_training_rows(
        db_session, user_id=user.user_id, data_source="db"
    )

    assert [row["date"] for row in rows] == ["2024-01-01", "2024-01-02"]


def test_fetch_personalized_training_rows_api_requires_base_url(monkeypatch):
    monkeypatch.setattr(training_data_service, "_resolve_backend_base_url", lambda: None)
    with pytest.raises(RuntimeError, match="BACKEND_BASE_URL is not set"):
        training_data_service.fetch_personalized_training_rows(
            None, user_id=1, data_source="api"
        )


def test_fetch_global_training_rows_api_success(monkeypatch):
    monkeypatch.setattr(training_data_service, "_resolve_backend_base_url", lambda: "https://api")
    monkeypatch.setattr(training_data_service, "_resolve_internal_token", lambda: "token")

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"data": [{"user_id": 1}]}

    monkeypatch.setattr(training_data_service.requests, "get", lambda *_args, **_kwargs: FakeResponse())

    rows = training_data_service.fetch_global_training_rows(None, data_source="api")
    assert rows == [{"user_id": 1}]


def test_api_headers_include_internal_token(monkeypatch):
    monkeypatch.setattr(training_data_service, "_resolve_internal_token", lambda: "secret")
    assert training_data_service._api_headers() == {"X-Internal-Token": "secret"}
