from datetime import date, timedelta

from app.models.user_model import User
from app.utils.hashing import hash_password
from app.utils.jwt_handler import create_access_token


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


def test_update_profile_supports_birthday_and_gender(client, db_session):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    payload = {"userDob": "1999-05-12", "gender": "female"}

    response = client.put(
        "/api/auth/me",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["userDob"] == "1999-05-12"
    assert data["gender"] == "female"


def test_update_profile_rejects_future_birthday(client, db_session):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )
    future_date = (date.today() + timedelta(days=1)).isoformat()

    response = client.put(
        "/api/auth/me",
        json={"userDob": future_date},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
