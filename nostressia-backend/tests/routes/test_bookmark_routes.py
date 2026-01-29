from datetime import date

from app.models.motivation_model import Motivation
from app.models.user_model import User
from app.utils.hashing import hash_password
from app.utils.jwt_handler import create_access_token


def _create_user(db_session):
    user = User(
        name="Bookmark User",
        username="bookmarkuser",
        email="bookmark@example.com",
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


def _create_motivation(db_session):
    motivation = Motivation(quote="Keep calm", uploader_id=1, author_name="Admin")
    db_session.add(motivation)
    db_session.commit()
    db_session.refresh(motivation)
    return motivation


def test_bookmark_flow(client, db_session):
    user = _create_user(db_session)
    motivation = _create_motivation(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    add_response = client.post(
        f"/api/bookmarks/{motivation.motivation_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert add_response.status_code == 201

    list_response = client.get(
        "/api/bookmarks/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["data"]

    delete_response = client.delete(
        f"/api/bookmarks/{motivation.motivation_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_response.status_code == 200


def test_bookmark_not_found(client, db_session):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    response = client.post(
        "/api/bookmarks/999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_remove_missing_bookmark(client, db_session):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    response = client.delete(
        "/api/bookmarks/999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404
