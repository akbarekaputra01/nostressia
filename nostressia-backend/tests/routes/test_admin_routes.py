from datetime import date

from app.models.admin_model import Admin
from app.models.diary_model import Diary
from app.models.user_model import User
from app.utils.hashing import hash_password
from app.utils.jwt_handler import create_access_token


def _create_admin(db_session):
    admin = Admin(
        name="Admin User",
        username="admin",
        email="admin@example.com",
        password=hash_password("admin123"),
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


def _create_user(db_session):
    user = User(
        name="Example User",
        username="example",
        email="example@example.com",
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


def test_admin_user_list_requires_auth(client):
    response = client.get("/api/admin/users/")
    assert response.status_code == 401


def test_admin_user_list_with_token(client, db_session):
    admin = _create_admin(db_session)
    _create_user(db_session)
    token = create_access_token({"sub": admin.username, "role": "admin"})

    response = client.get(
        "/api/admin/users/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["total"] >= 1


def test_admin_user_detail_update_delete(client, db_session):
    admin = _create_admin(db_session)
    user = _create_user(db_session)
    token = create_access_token({"sub": admin.username, "role": "admin"})

    response = client.get(
        f"/api/admin/users/{user.user_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200

    response = client.put(
        f"/api/admin/users/{user.user_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Updated User", "email": "updated@example.com"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["email"] == "updated@example.com"

    response = client.delete(
        f"/api/admin/users/{user.user_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_admin_user_not_found(client, db_session):
    admin = _create_admin(db_session)
    token = create_access_token({"sub": admin.username, "role": "admin"})

    response = client.get(
        "/api/admin/users/999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_admin_diary_list_and_delete(client, db_session):
    admin = _create_admin(db_session)
    user = _create_user(db_session)
    token = create_access_token({"sub": admin.username, "role": "admin"})

    diary = Diary(
        user_id=user.user_id,
        title="Test Diary",
        note="Entry",
        date=date(2024, 1, 1),
        emoji="🙂",
        font="sans-serif",
    )
    db_session.add(diary)
    db_session.commit()
    db_session.refresh(diary)

    response = client.get(
        "/api/admin/diaries/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["total"] >= 1

    response = client.delete(
        f"/api/admin/diaries/{diary.diary_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_admin_diary_not_found(client, db_session):
    admin = _create_admin(db_session)
    token = create_access_token({"sub": admin.username, "role": "admin"})

    response = client.delete(
        "/api/admin/diaries/999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404
