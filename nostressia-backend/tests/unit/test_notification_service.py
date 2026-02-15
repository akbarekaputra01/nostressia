import pytest
from unittest.mock import patch, MagicMock
from app.services import push_notification_service
from app.models.push_subscription_model import PushSubscription
from app.schemas.notification_schema import PushSubscriptionKeys, PushSubscriptionPayload

def test_subscribe_user_new(db_session):
    user_id = 1
    sub_data = PushSubscriptionPayload(
        endpoint="https://fcm.googleapis.com/fcm/send/ABC",
        keys=PushSubscriptionKeys(p256dh="key", auth="auth")
    )
    
    with patch("app.services.push_notification_service.upsert_daily_reminder_job") as mock_upsert:
        normalized_time = push_notification_service.subscribe_user(
            db_session, user_id, sub_data, "08:00", "UTC"
        )
        
        assert normalized_time == "08:00"
        mock_upsert.assert_called_once()
        
        # Check DB
        sub = db_session.query(PushSubscription).filter_by(user_id=user_id).first()
        assert sub is not None
        assert sub.endpoint == "https://fcm.googleapis.com/fcm/send/ABC"
        assert sub.is_active is True

def test_subscribe_user_update(db_session):
    user_id = 1
    # Create existing
    existing = PushSubscription(
        user_id=user_id,
        endpoint="https://existing.com",
        p256dh="old",
        auth="old",
        reminder_time="09:00",
        timezone="UTC",
        is_active=True
    )
    db_session.add(existing)
    db_session.commit()
    
    sub_data = PushSubscriptionPayload(
        endpoint="https://existing.com",
        keys=PushSubscriptionKeys(p256dh="new", auth="new")
    )
    
    with patch("app.services.push_notification_service.upsert_daily_reminder_job") as mock_upsert:
        push_notification_service.subscribe_user(
            db_session, user_id, sub_data, "10:00", "Asia/Jakarta"
        )
        
        db_session.refresh(existing)
        assert existing.p256dh == "new"
        assert existing.reminder_time == "10:00"
        assert existing.timezone == "Asia/Jakarta"
        mock_upsert.assert_called_once()

def test_unsubscribe_user(db_session):
    user_id = 1
    sub = PushSubscription(
        user_id=user_id,
        endpoint="https://to-remove.com",
        p256dh="k",
        auth="a",
        is_active=True
    )
    db_session.add(sub)
    db_session.commit()
    
    with patch("app.services.push_notification_service.remove_daily_reminder_job") as mock_remove:
        push_notification_service.unsubscribe_user(db_session, user_id)
        
        mock_remove.assert_called()
        db_session.refresh(sub)
        assert sub.is_active is False

def test_get_active_subscription(db_session):
    user_id = 99
    sub = PushSubscription(
        user_id=user_id,
        endpoint="https://active.com",
        p256dh="k",
        auth="a",
        is_active=True
    )
    db_session.add(sub)
    db_session.commit()
    
    result = push_notification_service.get_active_subscription(db_session, user_id)
    assert result.endpoint == "https://active.com"
    
    # Check inactive
    sub.is_active = False
    db_session.commit()
    result = push_notification_service.get_active_subscription(db_session, user_id)
    assert result is None
