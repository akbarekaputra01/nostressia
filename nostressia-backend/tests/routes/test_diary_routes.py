from datetime import date

from app.models.user_model import User
from app.utils.hashing import hash_password
from app.utils.jwt_handler import create_access_token


def _create_user(db_session):
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
    return user


def test_diary_crud_flow(client, db_session):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    payload = {
        "title": "Day 1",
        "note": "Feeling good.",
        "date": "2024-01-02",
        "emoji": "😊",
        "font": "serif",
    }

    create_response = client.post(
        "/api/diary/",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert create_response.status_code == 200
    diary_id = create_response.json()["data"]["diaryId"]

    list_response = client.get(
        "/api/diary/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_response.status_code == 200
    assert any(item["diaryId"] == diary_id for item in list_response.json()["data"])

    detail_response = client.get(
        f"/api/diary/{diary_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["note"] == "Feeling good."

    update_response = client.put(
        f"/api/diary/{diary_id}",
        json={"note": "Feeling better."},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["data"]["note"] == "Feeling better."


def test_diary_not_found(client, db_session):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    response = client.get(
        "/api/diary/999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404
