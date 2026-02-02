from datetime import date

from app.models.user_model import User
from app.utils.hashing import hash_password
from app.utils.jwt_handler import create_access_token


def _create_user(db_session):
    user = User(
        name="Storage User",
        username="storageuser",
        email="storage@example.com",
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


def test_storage_upload_sas_route(client, db_session, monkeypatch):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    monkeypatch.setattr(
        "app.services.storage_service.generate_upload_sas",
        lambda *_: ("https://upload", "https://blob", None),
    )

    response = client.post(
        "/api/storage/sas/upload",
        headers={"Authorization": f"Bearer {token}"},
        json={"fileName": "avatar.png", "contentType": "image/png", "folder": "uploads"},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "SAS created"
