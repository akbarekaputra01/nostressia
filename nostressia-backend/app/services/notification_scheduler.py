import logging
from datetime import datetime

import pytz
from apscheduler.schedulers.background import BackgroundScheduler

from app.core.database import SessionLocal
from app.core.config import settings
from app.models.push_subscription_model import PushSubscription
from app.services.push_notification_service import WebPushException, send_push

from typing import Optional

logger = logging.getLogger(__name__)

DEFAULT_TIMEZONE = "Asia/Jakarta"


def _build_payload() -> dict:
    return {
        "title": "Nostressia Daily Reminder",
        "body": "Time to check-in dan log stress level kamu.",
        "url": "/",
    }


def _should_send(subscription: PushSubscription, now: datetime) -> bool:
    if subscription.reminder_time != now.strftime("%H:%M"):
        return False
    if subscription.last_sent_date == now.date():
        return False
    return True


def process_daily_reminders() -> None:
    if not settings.vapid_private_key:
        logger.warning("VAPID private key belum diisi, scheduler notifikasi dilewati.")
        return
    db = SessionLocal()
    try:
        subscriptions = (
            db.query(PushSubscription)
            .filter(PushSubscription.is_active.is_(True))
            .all()
        )
        if not subscriptions:
            return

        for subscription in subscriptions:
            timezone_name = subscription.timezone or DEFAULT_TIMEZONE
            try:
                timezone = pytz.timezone(timezone_name)
            except pytz.UnknownTimeZoneError:
                timezone = pytz.timezone(DEFAULT_TIMEZONE)
            now = datetime.now(timezone)

            if not _should_send(subscription, now):
                continue

            try:
                send_push(subscription, _build_payload())
                subscription.last_sent_date = now.date()
                db.add(subscription)
                db.commit()
            except WebPushException as exc:
                status_code = exc.response.status_code if exc.response else None
                if status_code in {404, 410}:
                    subscription.is_active = False
                    db.add(subscription)
                    db.commit()
                logger.warning("Push gagal untuk %s: %s", subscription.endpoint, exc)
            except Exception as exc:
                logger.exception("Push scheduler gagal: %s", exc)
    finally:
        db.close()


def start_notification_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone=DEFAULT_TIMEZONE)
    scheduler.add_job(process_daily_reminders, "interval", minutes=1, id="daily-reminder")
    scheduler.start()
    logger.info("Scheduler notifikasi harian dimulai.")
    return scheduler


def stop_notification_scheduler(scheduler: Optional[BackgroundScheduler]) -> None:
    if scheduler:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler notifikasi harian dihentikan.")
