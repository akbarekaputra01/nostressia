from datetime import date

from app.models.user_model import User
from app.utils.hashing import hash_password, verify_password


def _create_user(db_session, email="user@example.com", username="exampleuser"):
    user = User(
        name="Existing User",
        username=username,
        email=email,
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


def test_register_creates_user_and_hashes_password(client, db_session, monkeypatch):
    monkeypatch.setattr(
        "app.routes.user_auth_route.send_otp_email", lambda *args, **kwargs: (True, None)
    )

    payload = {
        "name": "New User",
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "StrongPass123!",
        "gender": "female",
        "userDob": "2001-04-12",
        "avatar": "https://example.com/avatar.png",
    }

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 201
    user = (
        db_session.query(User)
        .filter(User.email == "newuser@example.com")
        .first()
    )
    assert user is not None
    assert user.password != payload["password"]
    assert verify_password(payload["password"], user.password)


def test_register_rejects_duplicate_email(client, db_session, monkeypatch):
    monkeypatch.setattr(
        "app.routes.user_auth_route.send_otp_email", lambda *args, **kwargs: (True, None)
    )
    _create_user(db_session, email="dupe@example.com", username="dupeuser")

    payload = {
        "name": "Another User",
        "username": "uniqueuser",
        "email": "dupe@example.com",
        "password": "StrongPass123!",
        "gender": "male",
        "userDob": "2001-04-12",
        "avatar": "https://example.com/avatar.png",
    }

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 400
