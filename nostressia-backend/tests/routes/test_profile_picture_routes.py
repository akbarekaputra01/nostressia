from datetime import date, datetime, timezone

from app.models.user_model import User
from app.utils.hashing import hash_password
from app.utils.jwt_handler import create_access_token


def _create_user(db_session):
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
    return user


def test_profile_picture_sas(client, db_session, monkeypatch):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    monkeypatch.setattr(
        "app.routes.profile_route.create_profile_picture_sas",
        lambda *_: {
            "sasUrl": "https://example.com/sas",
            "blobUrl": "https://example.com/blob",
            "blobName": "profile-pictures/1/test.png",
            "expiresAt": datetime.now(timezone.utc).isoformat(),
        },
    )

    response = client.post(
        "/api/profile/picture/sas",
        json={
            "fileName": "avatar.png",
            "contentType": "image/png",
            "fileSize": 1024,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["sasUrl"].startswith("https://")


def test_profile_picture_update(client, db_session, monkeypatch):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    monkeypatch.setattr(
        "app.routes.profile_route.update_profile_picture",
        lambda current_user, payload, db: {
            "userId": current_user.user_id,
            "name": current_user.name,
            "username": current_user.username,
            "email": current_user.email,
            "gender": current_user.gender,
            "userDob": current_user.user_dob.isoformat(),
            "avatar": payload.profile_image_url,
            "streak": current_user.streak,
            "isVerified": current_user.is_verified,
        },
    )

    response = client.put(
        "/api/profile/picture",
        json={"profileImageUrl": "https://example.com/avatar.png"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["avatar"] == "https://example.com/avatar.png"
