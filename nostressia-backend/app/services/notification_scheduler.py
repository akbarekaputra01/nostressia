"""Notification scheduler helpers for daily reminders."""
import logging
from datetime import datetime
from typing import Optional

import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.database import SessionLocal
from app.models.push_subscription_model import PushSubscription
from app.services.push_notification_service import WebPushException, send_push

logger = logging.getLogger(__name__)

DEFAULT_TZ = "Asia/Jakarta"

# Global scheduler instance for route handlers.
_scheduler: Optional[BackgroundScheduler] = None


def _build_payload() -> dict:
    return {
        "title": "Nostressia Daily Reminder",
        "body": "Time to check in and log your stress level.",
        "url": "/",
    }


def _normalize_tz(tz_name: str) -> str:
    if not tz_name:
        return DEFAULT_TZ
    try:
        pytz.timezone(tz_name)
        return tz_name
    except pytz.UnknownTimeZoneError:
        return DEFAULT_TZ


def _parse_hhmm(reminder_time: str) -> tuple[int, int]:
    # reminder_time is normalized to "HH:mm" by the route layer.
    h, m = reminder_time.split(":")
    return int(h), int(m)


def _job_id_for_subscription(subscription_id: int) -> str:
    return f"daily-reminder-sub-{subscription_id}"


def _send_daily_reminder(subscription_id: int) -> None:
    """
    APScheduler callback that runs at second 00.
    """
    db = SessionLocal()
    try:
        sub = (
            db.query(PushSubscription)
            .filter(
                PushSubscription.subscription_id == subscription_id,
                PushSubscription.is_active.is_(True),
            )
            .first()
        )
        if not sub:
            logger.info(
                "Subscription inactive or not found. subscription_id=%s",
                subscription_id,
            )
            return

        tz_name = _normalize_tz(sub.timezone or DEFAULT_TZ)
        tz = pytz.timezone(tz_name)
        now = datetime.now(tz)

        # Dedupe: avoid sending more than once per day.
        if sub.last_sent_date == now.date():
            logger.info(
                "Skipping already sent notification. sub_id=%s date=%s",
                sub.subscription_id,
                sub.last_sent_date,
            )
            return

        logger.info(
            "Sending reminder. sub_id=%s user_id=%s time=%s tz=%s",
            sub.subscription_id,
            sub.user_id,
            now.strftime("%H:%M:%S"),
            tz_name,
        )

        send_push(sub, _build_payload())

        sub.last_sent_date = now.date()
        db.add(sub)
        db.commit()

        logger.info(
            "Reminder sent. sub_id=%s user_id=%s",
            sub.subscription_id,
            sub.user_id,
        )

    except WebPushException as exc:
        status_code = exc.response.status_code if exc.response else None
        logger.warning(
            "WebPushException. sub_id=%s status=%s err=%s",
            subscription_id,
            status_code,
            exc,
        )
        # Expired subscription -> deactivate it.
        if status_code in {404, 410}:
            try:
                sub = (
                    db.query(PushSubscription)
                    .filter(PushSubscription.subscription_id == subscription_id)
                    .first()
                )
                if sub:
                    sub.is_active = False
                    db.add(sub)
                    db.commit()
                    logger.info("Deactivated expired subscription. sub_id=%s", subscription_id)
            except Exception:
                logger.exception("Failed to deactivate expired subscription.")
        logger.warning("Push failed. sub_id=%s: %s", subscription_id, exc)

    except Exception as exc:
        logger.exception(
            "Unexpected scheduler error. sub_id=%s error=%s", subscription_id, exc
        )

    finally:
        db.close()


def _ensure_scheduler_started() -> BackgroundScheduler:
    global _scheduler
    if _scheduler and _scheduler.running:
        return _scheduler

    logger.info("Starting BackgroundScheduler (cron mode).")
    _scheduler = BackgroundScheduler(timezone=DEFAULT_TZ)
    _scheduler.start()
    return _scheduler


def upsert_daily_reminder_job(subscription_id: int, reminder_time: str, timezone: str) -> None:
    """
    Create or update the job to run at HH:mm:00 in the selected timezone.
    """
    scheduler = _ensure_scheduler_started()

    tz_name = _normalize_tz(timezone or DEFAULT_TZ)
    hour, minute = _parse_hhmm(reminder_time)

    # CronTrigger => execute at second 00.
    trigger = CronTrigger(hour=hour, minute=minute, second=0, timezone=pytz.timezone(tz_name))

    job_id = _job_id_for_subscription(subscription_id)

    scheduler.add_job(
        _send_daily_reminder,
        trigger=trigger,
        args=[subscription_id],
        id=job_id,
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=30,
    )

    logger.info(
        "Upserted scheduler job. job_id=%s time=%s:00 tz=%s",
        job_id,
        reminder_time,
        tz_name,
    )


def remove_daily_reminder_job(subscription_id: int) -> None:
    scheduler = _ensure_scheduler_started()
    job_id = _job_id_for_subscription(subscription_id)
    try:
        scheduler.remove_job(job_id)
        logger.info("Removed scheduler job. job_id=%s", job_id)
    except Exception:
        # If the job does not exist, nothing to do.
        pass


def load_jobs_from_db() -> None:
    """
    On startup, load all active subscriptions and register cron jobs.
    This is important because a restart clears the scheduler.
    """
    scheduler = _ensure_scheduler_started()

    db = SessionLocal()
    try:
        subs = db.query(PushSubscription).filter(PushSubscription.is_active.is_(True)).all()
        logger.info("Loading active subscriptions. count=%s", len(subs))

        for sub in subs:
            try:
                upsert_daily_reminder_job(
                    subscription_id=sub.subscription_id,
                    reminder_time=sub.reminder_time,
                    timezone=sub.timezone or DEFAULT_TZ,
                )
            except Exception as exc:
                logger.warning(
                    "Failed to load scheduler job. sub_id=%s error=%s",
                    sub.subscription_id,
                    exc,
                )

    finally:
        db.close()


def start_notification_scheduler() -> BackgroundScheduler:
    """
    Called during application startup.
    """
    scheduler = _ensure_scheduler_started()
    load_jobs_from_db()
    logger.info("Scheduler cron jobs ready.")
    return scheduler


def stop_notification_scheduler(scheduler: Optional[BackgroundScheduler]) -> None:
    global _scheduler
    if scheduler:
        try:
            scheduler.shutdown(wait=False)
        except Exception:
            pass
    _scheduler = None
    logger.info("Scheduler stopped.")
