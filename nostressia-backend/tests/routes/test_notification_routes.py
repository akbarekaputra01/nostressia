from datetime import date

from app.models.push_delivery_log_model import PushDeliveryLog
from app.models.push_subscription_model import PushSubscription
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


def test_notification_time_update_after_send(client, db_session, monkeypatch):
    monkeypatch.setattr(
        "app.routes.notification_route.upsert_daily_reminder_job", lambda *args, **kwargs: None
    )

    user = _create_user(db_session)
    subscription = PushSubscription(
        user_id=user.user_id,
        endpoint="https://example.com/endpoint",
        p256dh="test-p256dh",
        auth="test-auth",
        reminder_time="01:00",
        timezone="Asia/Jakarta",
        is_active=True,
    )
    db_session.add(subscription)
    db_session.commit()
    db_session.refresh(subscription)

    delivery_log = PushDeliveryLog(
        subscription_id=subscription.subscription_id,
        sent_date=date.today(),
    )
    db_session.add(delivery_log)
    db_session.commit()

    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    response = client.post(
        "/api/notifications/subscribe",
        json={
            "subscription": {
                "endpoint": "https://example.com/endpoint",
                "keys": {"p256dh": "test-p256dh", "auth": "test-auth"},
            },
            "reminderTime": "03:00",
            "timezone": "Asia/Jakarta",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    db_session.refresh(subscription)
    assert subscription.reminder_time == "03:00"
