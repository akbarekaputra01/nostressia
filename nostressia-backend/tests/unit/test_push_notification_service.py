import pytest

from app.models.push_subscription_model import PushSubscription
from app.services import push_notification_service


def _subscription():
    return PushSubscription(
        user_id=1,
        endpoint="https://example.com",
        p256dh="p256dh",
        auth="auth",
        reminder_time="08:00",
        timezone="Asia/Jakarta",
        is_active=True,
    )


def test_send_push_requires_vapid_private_key(monkeypatch):
    monkeypatch.setattr(push_notification_service.settings, "vapid_private_key", "")
    with pytest.raises(RuntimeError, match="VAPID_PRIVATE_KEY"):
        push_notification_service.send_push(_subscription(), {"title": "Hello"})


def test_send_push_requires_vapid_subject(monkeypatch):
    monkeypatch.setattr(push_notification_service.settings, "vapid_private_key", "key")
    monkeypatch.setattr(push_notification_service.settings, "vapid_subject", "")
    with pytest.raises(RuntimeError, match="VAPID_SUBJECT"):
        push_notification_service.send_push(_subscription(), {"title": "Hello"})


def test_send_push_calls_webpush(monkeypatch):
    called = {"value": False}

    monkeypatch.setattr(push_notification_service.settings, "vapid_private_key", "key")
    monkeypatch.setattr(push_notification_service.settings, "vapid_subject", "mailto:test@example.com")

    def fake_webpush(**_kwargs):
        called["value"] = True

    monkeypatch.setattr(push_notification_service, "webpush", fake_webpush)
    push_notification_service.send_push(_subscription(), {"title": "Hello"})
    assert called["value"] is True
