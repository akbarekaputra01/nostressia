"""Push notification delivery and subscription helpers."""
import json
import logging
from typing import Optional

from pywebpush import WebPushException, webpush
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.push_subscription_model import PushSubscription
from app.schemas.notification_schema import NotificationSubscription
from app.services.notification_scheduler import (
    upsert_daily_reminder_job,
    remove_daily_reminder_job,
)

logger = logging.getLogger(__name__)

def _normalize_time(value: str) -> str:
    if not value or ":" not in value:
        raise ValueError("Invalid time format")
    parts = value.split(":")
    if len(parts) != 2:
        raise ValueError("Invalid time format")
    hours, minutes = parts
    if not hours.isdigit() or not minutes.isdigit():
        raise ValueError("Invalid time format")
    hour_value = int(hours)
    minute_value = int(minutes)
    if hour_value < 0 or hour_value > 23 or minute_value < 0 or minute_value > 59:
        raise ValueError("Invalid time format")
    return f"{hour_value:02d}:{minute_value:02d}"

def send_push(subscription: PushSubscription, payload: dict) -> None:
    if not settings.vapid_private_key:
        raise RuntimeError("VAPID_PRIVATE_KEY is not configured.")
    if not settings.vapid_subject:
        raise RuntimeError(
            "VAPID_SUBJECT is not configured (format: mailto:email@domain.com)."
        )

    webpush(
        subscription_info={
            "endpoint": subscription.endpoint,
            "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
        },
        data=json.dumps(payload),
        vapid_private_key=settings.vapid_private_key,
        vapid_claims={"sub": settings.vapid_subject},
    )

def subscribe_user(
    db: Session, 
    user_id: int, 
    subscription_data: NotificationSubscription, 
    reminder_time_str: str, 
    timezone: str
) -> str:
    """
    Creates or updates a push subscription and registers the cron job.
    Returns the normalized reminder time.
    """
    reminder_time = _normalize_time(reminder_time_str)

    existing = (
        db.query(PushSubscription)
        .filter(
            PushSubscription.user_id == user_id,
            PushSubscription.endpoint == subscription_data.endpoint,
        )
        .first()
    )

    if existing:
        existing.p256dh = subscription_data.keys.p256dh
        existing.auth = subscription_data.keys.auth
        existing.reminder_time = reminder_time
        existing.timezone = timezone
        existing.is_active = True
        db.add(existing)
        db.commit()
        db.refresh(existing)
        
        target_sub_id = existing.subscription_id
    else:
        new_subscription = PushSubscription(
            user_id=user_id,
            endpoint=subscription_data.endpoint,
            p256dh=subscription_data.keys.p256dh,
            auth=subscription_data.keys.auth,
            reminder_time=reminder_time,
            timezone=timezone,
            is_active=True,
        )
        db.add(new_subscription)
        db.commit()
        db.refresh(new_subscription)
        target_sub_id = new_subscription.subscription_id

    # Register/Update Cron Job
    upsert_daily_reminder_job(
        subscription_id=target_sub_id,
        reminder_time=reminder_time,
        timezone=timezone,
    )
    
    return reminder_time

def unsubscribe_user(db: Session, user_id: int) -> None:
    """
    Deactivates all active subscriptions for the user and removes cron jobs.
    """
    active_subs = (
        db.query(PushSubscription)
        .filter(
            PushSubscription.user_id == user_id,
            PushSubscription.is_active.is_(True),
        )
        .all()
    )

    for sub in active_subs:
        remove_daily_reminder_job(sub.subscription_id)

    if active_subs:
        db.query(PushSubscription).filter(
            PushSubscription.user_id == user_id,
            PushSubscription.is_active.is_(True),
        ).update({"is_active": False})
        db.commit()

def get_active_subscription(db: Session, user_id: int) -> Optional[PushSubscription]:
    return (
        db.query(PushSubscription)
        .filter(
            PushSubscription.user_id == user_id,
            PushSubscription.is_active.is_(True),
        )
        .order_by(PushSubscription.created_at.desc())
        .first()
    )
