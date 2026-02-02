from datetime import date, datetime, timezone

from app.models.admin_model import Admin
from app.models.user_model import User
from app.utils.hashing import hash_password
from app.utils.jwt_handler import create_access_token


def _create_admin(db_session, username="admin", password="admin123"):
    admin = Admin(
        name="Admin User",
        username=username,
        email=f"{username}@example.com",
        password=hash_password(password),
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


def _create_user(db_session, email="user@example.com", password="Password123!"):
    user = User(
        name="Example User",
        username="exampleuser",
        email=email,
        password=hash_password(password),
        gender="unspecified",
        user_dob=date(2000, 1, 1),
        is_verified=True,
        streak=0,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_admin_login_success(client, db_session):
    _create_admin(db_session)

    response = client.post(
        "/api/auth/admin/login",
        json={"username": "admin", "password": "admin123"},
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["accessToken"]
    assert payload["tokenType"] == "bearer"
    assert payload["admin"]["username"] == "admin"


def test_admin_login_invalid_password(client, db_session):
    _create_admin(db_session)

    response = client.post(
        "/api/auth/admin/login",
        json={"username": "admin", "password": "wrong"},
    )

    assert response.status_code == 401
    assert response.json()["message"] == "Invalid username or password"


def test_user_login_and_profile(client, db_session):
    _create_user(db_session)

    response = client.post(
        "/api/auth/login",
        json={"identifier": "user@example.com", "password": "Password123!"},
    )

    assert response.status_code == 200
    token = response.json()["data"]["accessToken"]

    profile_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert profile_response.status_code == 200
    assert profile_response.json()["data"]["email"] == "user@example.com"


def test_user_login_invalid_password(client, db_session):
    _create_user(db_session)

    response = client.post(
        "/api/auth/login",
        json={"identifier": "user@example.com", "password": "wrong"},
    )

    assert response.status_code == 401


def test_user_auth_missing_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_user_auth_invalid_token(client):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid.token.value"},
    )
    assert response.status_code == 401


def test_user_login_token_form(client, db_session):
    _create_user(db_session, email="token@example.com", password="Password123!")

    response = client.post(
        "/api/auth/token",
        data={"username": "token@example.com", "password": "Password123!"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["accessToken"]


def test_forgot_and_reset_password_flow(client, db_session, monkeypatch):
    user = _create_user(db_session, email="reset@example.com", password="Password123!")
    user.otp_code = "123456"
    user.otp_created_at = datetime.now(timezone.utc)
    db_session.commit()

    monkeypatch.setattr(
        "app.routes.user_auth_route.send_reset_password_email",
        lambda *_: (True, None),
    )

    response = client.post(
        "/api/auth/forgot-password",
        json={"email": "reset@example.com"},
    )
    assert response.status_code == 200

    db_session.refresh(user)
    otp_code = user.otp_code

    response = client.post(
        "/api/auth/reset-password-verify",
        json={"email": "reset@example.com", "otpCode": otp_code},
    )
    assert response.status_code == 200

    response = client.post(
        "/api/auth/reset-password-confirm",
        json={
            "email": "reset@example.com",
            "otpCode": otp_code,
            "newPassword": "NewPassword123!",
        },
    )
    assert response.status_code == 200


def test_upload_user_avatar(client, db_session, monkeypatch):
    user = _create_user(db_session, email="avatar@example.com", password="Password123!")
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    monkeypatch.setattr(
        "app.routes.user_auth_route.upload_avatar",
        lambda *_: "https://example.com/avatar.png",
    )

    response = client.post(
        "/api/auth/me/avatar",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("avatar.png", b"data", "image/png")},
    )

    assert response.status_code == 200
    assert response.json()["data"]["avatar"] == "https://example.com/avatar.png"
