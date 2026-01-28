from datetime import date

from app.models.user_model import User
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt_handler import create_access_token


def _create_user(db_session, password="Password123!"):
    user = User(
        name="Example User",
        username="exampleuser",
        email="user@example.com",
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


def test_verify_current_password_success(client, db_session):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    response = client.post(
        "/api/auth/verify-current-password",
        json={"currentPassword": "Password123!"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200


def test_verify_current_password_invalid(client, db_session):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    response = client.post(
        "/api/auth/verify-current-password",
        json={"currentPassword": "WrongPassword"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400


def test_change_password_updates_hash(client, db_session):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    response = client.put(
        "/api/auth/change-password",
        json={"currentPassword": "Password123!", "newPassword": "NewPass123!"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    db_session.refresh(user)
    assert verify_password("NewPass123!", user.password)
