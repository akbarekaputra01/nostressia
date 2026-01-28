from datetime import date

from app.models.admin_model import Admin
from app.models.user_model import User
from app.utils.hashing import hash_password


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
