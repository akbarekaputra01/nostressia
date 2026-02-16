from datetime import date, timedelta

from app.models.stress_log_model import StressLevel
from app.models.user_model import User
from app.services import analytics_service
from app.utils.hashing import hash_password


def _create_user(db_session):
    user = User(
        name="Analytics User",
        username="analytics_mode_user",
        email="analytics_mode@example.com",
        password=hash_password("Password123!"),
        gender="unspecified",
        user_dob=date(2000, 1, 1),
        is_verified=True,
        streak=12,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_send_weekly_report_uses_most_frequent_stress_label(db_session, monkeypatch):
    user = _create_user(db_session)
    today = date.today()

    db_session.add_all(
        [
            StressLevel(user_id=user.user_id, date=today - timedelta(days=1), stress_level=1, emoji=0),
            StressLevel(user_id=user.user_id, date=today - timedelta(days=2), stress_level=2, emoji=0),
            StressLevel(user_id=user.user_id, date=today - timedelta(days=3), stress_level=2, emoji=0),
            StressLevel(user_id=user.user_id, date=today - timedelta(days=4), stress_level=3, emoji=0),
        ]
    )
    db_session.commit()

    monkeypatch.setattr(
        "app.services.analytics_service.send_weekly_report_email",
        lambda *args, **kwargs: (True, None),
    )

    result = analytics_service.send_weekly_report(db_session, user)

    assert result["report"]["dominant_stress_level"] == "Moderate"


def test_send_weekly_report_sets_dash_when_no_stress_logs(db_session, monkeypatch):
    user = _create_user(db_session)

    monkeypatch.setattr(
        "app.services.analytics_service.send_weekly_report_email",
        lambda *args, **kwargs: (True, None),
    )

    result = analytics_service.send_weekly_report(db_session, user)

    assert result["report"]["stress_logs"] == 0
    assert result["report"]["dominant_stress_level"] == "-"
