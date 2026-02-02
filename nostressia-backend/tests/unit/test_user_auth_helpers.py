from datetime import date, datetime, timezone

import pytest
from fastapi import HTTPException

from app.models.user_model import User
from app.routes import user_auth_route
from app.utils.hashing import hash_password


def _create_user(db_session, email="user@example.com", username="user", verified=True):
    user = User(
        name="Auth User",
        username=username,
        email=email,
        password=hash_password("Password123!"),
        gender="unspecified",
        user_dob=date(2000, 1, 1),
        is_verified=verified,
        streak=0,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_normalize_otp_created_at():
    now = datetime(2024, 1, 1, tzinfo=timezone.utc)
    assert user_auth_route._normalize_otp_created_at(now) == now
    assert user_auth_route._normalize_otp_created_at("2024-01-01T00:00:00Z") == now
    assert user_auth_route._normalize_otp_created_at("invalid") is None
    assert user_auth_route._normalize_otp_created_at(None) is None


def test_utcnow_is_timezone_aware():
    now = user_auth_route._utcnow()
    assert now.tzinfo is not None


def test_serialize_user(db_session):
    user = _create_user(db_session)
    payload = user_auth_route._serialize_user(user)
    assert payload.email == user.email


def test_issue_token_for_user(db_session, monkeypatch):
    user = _create_user(db_session)
    monkeypatch.setattr(user_auth_route.stress_service, "get_user_current_streak", lambda *_: 3)

    token_payload = user_auth_route._issue_token_for_user(user, db_session)
    assert token_payload.user.email == user.email
    assert token_payload.user.streak == 3


def test_authenticate_user_by_email(db_session):
    user = _create_user(db_session, email="user@example.com", username="user")
    result = user_auth_route._authenticate_user("user@example.com", "Password123!", db_session)
    assert result.user_id == user.user_id


def test_authenticate_user_by_username(db_session):
    user = _create_user(db_session, email="another@example.com", username="another")
    result = user_auth_route._authenticate_user("another", "Password123!", db_session)
    assert result.user_id == user.user_id


def test_authenticate_user_invalid_password(db_session):
    _create_user(db_session, email="bad@example.com", username="bad")
    with pytest.raises(HTTPException):
        user_auth_route._authenticate_user("bad@example.com", "Wrong", db_session)


def test_authenticate_user_unverified(db_session):
    _create_user(db_session, email="unverified@example.com", username="unverified", verified=False)
    with pytest.raises(HTTPException):
        user_auth_route._authenticate_user("unverified", "Password123!", db_session)
