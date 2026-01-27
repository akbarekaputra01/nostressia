import json
import logging

from pywebpush import WebPushException, webpush

from app.core.config import settings
from app.models.push_subscription_model import PushSubscription

logger = logging.getLogger(__name__)


def send_push(subscription: PushSubscription, payload: dict) -> None:
    webpush(
        subscription_info={
            "endpoint": subscription.endpoint,
            "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
        },
        data=json.dumps(payload),
        vapid_private_key=settings.vapid_private_key,
        vapid_claims={"sub": settings.vapid_subject},
    )


__all__ = ["send_push", "WebPushException"]
