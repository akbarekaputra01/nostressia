from datetime import date

from app.models.diary_model import Diary
from app.models.stress_log_model import StressLevel
from app.models.user_model import User
from app.utils.hashing import hash_password
from app.utils.jwt_handler import create_access_token


def _create_user(db_session):
    user = User(
        name="Analytics User",
        username="analyticsuser",
        email="analytics@example.com",
        password=hash_password("Password123!"),
        gender="unspecified",
        user_dob=date(2000, 1, 1),
        is_verified=True,
        streak=5,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_analytics_summary(client, db_session):
    user = _create_user(db_session)
    db_session.add(
        StressLevel(
            user_id=user.user_id,
            date=date.today(),
            stress_level=2,
            emoji=0,
        )
    )
    db_session.add(
        Diary(
            title="Log",
            note="Feeling ok",
            date=date.today(),
            emoji="😊",
            font="sans-serif",
            user_id=user.user_id,
        )
    )
    db_session.commit()

    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )
    response = client.get(
        "/api/analytics/summary",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["stressLogsCount"] == 1
    assert response.json()["data"]["diaryCount"] == 1


def test_weekly_report_success(client, db_session, monkeypatch):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    monkeypatch.setattr(
        "app.routes.analytics_route.send_weekly_report_email",
        lambda *args, **kwargs: (True, None),
    )

    response = client.post(
        "/api/analytics/weekly-report",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["email"] == user.email


def test_weekly_report_failure(client, db_session, monkeypatch):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    monkeypatch.setattr(
        "app.routes.analytics_route.send_weekly_report_email",
        lambda *args, **kwargs: (False, "Failed"),
    )

    response = client.post(
        "/api/analytics/weekly-report",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 500
