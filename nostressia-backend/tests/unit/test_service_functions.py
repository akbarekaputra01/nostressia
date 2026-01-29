from datetime import date, datetime, timezone

import pytest
from fastapi import HTTPException

from app.models.admin_model import Admin
from app.models.user_model import User
from app.schemas.diary_schema import DiaryCreate, DiaryUpdate
from app.schemas.profile_schema import ProfilePictureSasRequest, ProfilePictureUpdateRequest
from app.schemas.user_auth_schema import UserRegister
from app.services import auth_service, diary_service, email_service, profile_service, user_auth_service
from app.utils.hashing import hash_password


def test_authenticate_admin_success(db_session):
    admin = Admin(
        name="Admin",
        username="admin",
        email="admin@example.com",
        password=hash_password("Admin123!"),
    )
    db_session.add(admin)
    db_session.commit()

    result = auth_service.authenticate_admin(db_session, "admin", "Admin123!")
    assert result is not None


def test_authenticate_admin_failure(db_session):
    result = auth_service.authenticate_admin(db_session, "missing", "bad")
    assert result is None


def test_user_auth_service_create_and_authenticate(db_session):
    payload = UserRegister(
        name="User",
        username="user1",
        email="user1@example.com",
        password="Password123!",
        gender="female",
        user_dob=date(2000, 1, 1),
        avatar=None,
    )

    user = user_auth_service.create_user(db_session, payload)
    assert user.user_id is not None

    authenticated = user_auth_service.authenticate_user(db_session, payload.email, payload.password)
    assert authenticated is not False


def test_user_auth_service_duplicate_rejected(db_session):
    payload = UserRegister(
        name="User",
        username="user1",
        email="dup@example.com",
        password="Password123!",
        gender="female",
        user_dob=date(2000, 1, 1),
        avatar=None,
    )
    user_auth_service.create_user(db_session, payload)

    with pytest.raises(HTTPException):
        user_auth_service.create_user(db_session, payload)


def test_diary_service_create_update(db_session):
    user = User(
        name="Diary User",
        username="diaryuser",
        email="diary@example.com",
        password=hash_password("Password123!"),
        gender="unspecified",
        user_dob=date(2000, 1, 1),
        is_verified=True,
        streak=0,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    diary = diary_service.create_diary(
        db_session,
        diary_data=DiaryCreate(
            title="Day",
            note="Ok",
            date=date.today(),
            emoji="😊",
            font="serif",
        ),
        user_id=user.user_id,
    )
    assert diary.diary_id is not None

    updated = diary_service.update_diary(
        db_session,
        diary_id=diary.diary_id,
        user_id=user.user_id,
        data=DiaryUpdate(title="Updated"),
    )
    assert updated.title == "Updated"


def test_profile_service_create_sas_validates(monkeypatch):
    request = ProfilePictureSasRequest(
        file_name="avatar.png",
        content_type="image/png",
        file_size=1024,
    )

    monkeypatch.setattr(
        "app.services.profile_service.generate_profile_picture_sas",
        lambda blob_name: ("sas", "blob", datetime.now(timezone.utc)),
    )

    response = profile_service.create_profile_picture_sas(1, request)
    assert response.sas_url == "sas"


def test_profile_service_rejects_invalid_type():
    request = ProfilePictureSasRequest(
        file_name="avatar.txt",
        content_type="text/plain",
        file_size=1024,
    )

    with pytest.raises(HTTPException):
        profile_service.create_profile_picture_sas(1, request)


def test_profile_service_update_picture(db_session):
    user = User(
        name="Profile User",
        username="profileuser",
        email="profile@example.com",
        password=hash_password("Password123!"),
        gender="unspecified",
        user_dob=date(2000, 1, 1),
        is_verified=True,
        streak=0,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    payload = ProfilePictureUpdateRequest(profile_image_url="https://example.com/avatar.png")
    response = profile_service.update_profile_picture(user, payload, db_session)
    assert response.avatar == "https://example.com/avatar.png"


def test_email_service_handles_missing_client(monkeypatch):
    monkeypatch.setattr(
        "app.services.email_service._get_brevo_client",
        lambda: (None, "Missing"),
    )

    sent, error = email_service.send_otp_email("user@example.com", "123456")
    assert sent is False
    assert error == "Missing"


def test_email_service_reset_password_missing_client(monkeypatch):
    monkeypatch.setattr(
        "app.services.email_service._get_brevo_client",
        lambda: (None, "Missing"),
    )

    sent, error = email_service.send_reset_password_email("user@example.com", "123456")
    assert sent is False
    assert error == "Missing"


def test_email_service_weekly_report_missing_client(monkeypatch):
    monkeypatch.setattr(
        "app.services.email_service._get_brevo_client",
        lambda: (None, "Missing"),
    )

    sent, error = email_service.send_weekly_report_email(
        "user@example.com", {"date_range": "2024-01-01"}, user_name="User"
    )
    assert sent is False
    assert error == "Missing"
