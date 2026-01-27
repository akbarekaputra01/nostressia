# nostressia-backend/app/services/notification_scheduler.py

import logging
from datetime import datetime, time
from typing import Optional

import pytz
from apscheduler.schedulers.background import BackgroundScheduler

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.push_subscription_model import PushSubscription
from app.services.push_notification_service import WebPushException, send_push

logger = logging.getLogger(__name__)

DEFAULT_TIMEZONE = "Asia/Jakarta"


def _build_payload() -> dict:
    return {
        "title": "Nostressia Daily Reminder",
        "body": "Time to check-in dan log stress level kamu.",
        "url": "/",
    }


def _parse_hhmm(value: str) -> time:
    """
    Konversi 'HH:mm' -> datetime.time
    Aman karena reminder_time kamu sudah dinormalisasi di endpoint subscribe.
    """
    hours, minutes = value.split(":")
    return time(int(hours), int(minutes))


def _should_send(subscription: PushSubscription, now: datetime) -> bool:
    """
    Rule kirim yang lebih 'pas' tanpa harus exact tick di menit yang sama:
    - Jangan kirim kalau sudah terkirim hari ini (dedupe)
    - Kirim kalau waktu sekarang sudah melewati jam target user
    """
    if subscription.last_sent_date == now.date():
        return False

    target = _parse_hhmm(subscription.reminder_time)
    target_dt = now.replace(
        hour=target.hour,
        minute=target.minute,
        second=0,
        microsecond=0,
    )

    # Kalau scheduler tick telat (misalnya 13:02:10) tetap kirim untuk target 13:02
    return now >= target_dt


def process_daily_reminders() -> None:
    # NOTE:
    # HF Space kadang tidak menampilkan logger.info. Jadi pakai print + flush.
    print("⏰ [scheduler] tick process_daily_reminders()", flush=True)
    logger.info("Scheduler tick: process_daily_reminders running")

    if not settings.vapid_private_key:
        print("⚠️ [scheduler] VAPID_PRIVATE_KEY kosong. Skip.", flush=True)
        logger.warning("VAPID private key belum diisi, scheduler notifikasi dilewati.")
        return

    db = SessionLocal()
    try:
        subscriptions = (
            db.query(PushSubscription)
            .filter(PushSubscription.is_active.is_(True))
            .all()
        )

        print(f"📌 [scheduler] active_subscriptions={len(subscriptions)}", flush=True)

        if not subscriptions:
            return

        for subscription in subscriptions:
            timezone_name = subscription.timezone or DEFAULT_TIMEZONE
            try:
                timezone = pytz.timezone(timezone_name)
            except pytz.UnknownTimeZoneError:
                timezone = pytz.timezone(DEFAULT_TIMEZONE)
                timezone_name = DEFAULT_TIMEZONE

            now = datetime.now(timezone)

            # Debug penting biar kamu lihat scheduler jalan dan apa yang dibandingkan
            print(
                f"🕒 [scheduler] user_id={subscription.user_id} tz={timezone_name} "
                f"now={now.strftime('%H:%M:%S')} db_time={subscription.reminder_time} "
                f"last_sent={subscription.last_sent_date}",
                flush=True,
            )

            if not _should_send(subscription, now):
                continue

            try:
                print(
                    f"🚀 [scheduler] sending push to user_id={subscription.user_id}",
                    flush=True,
                )

                send_push(subscription, _build_payload())

                # dedupe per hari
                subscription.last_sent_date = now.date()
                db.add(subscription)
                db.commit()

                print(
                    f"✅ [scheduler] push sent ok user_id={subscription.user_id}",
                    flush=True,
                )

            except WebPushException as exc:
                status_code = exc.response.status_code if exc.response else None
                print(
                    f"❌ [scheduler] WebPushException status={status_code} err={exc}",
                    flush=True,
                )

                # Kalau subscription sudah expired/hilang, matikan
                if status_code in {404, 410}:
                    subscription.is_active = False
                    db.add(subscription)
                    db.commit()
                    print(
                        f"🧹 [scheduler] deactivated expired subscription user_id={subscription.user_id}",
                        flush=True,
                    )

                logger.warning("Push gagal untuk %s: %s", subscription.endpoint, exc)

            except Exception as exc:
                # Jangan biarkan error bikin job mati diam-diam
                print(f"💥 [scheduler] unexpected error: {exc}", flush=True)
                logger.exception("Push scheduler gagal: %s", exc)

    finally:
        db.close()


def start_notification_scheduler() -> BackgroundScheduler:
    # Pastikan log muncul saat scheduler mulai
    print("✅ [scheduler] starting BackgroundScheduler...", flush=True)

    scheduler = BackgroundScheduler(timezone=DEFAULT_TIMEZONE)
    scheduler.add_job(
        process_daily_reminders,
        "interval",
        minutes=1,
        id="daily-reminder",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=30,
    )

    scheduler.start()
    print("✅ [scheduler] BackgroundScheduler started.", flush=True)
    logger.info("Scheduler notifikasi harian dimulai.")
    return scheduler


def stop_notification_scheduler(scheduler: Optional[BackgroundScheduler]) -> None:
    if not scheduler:
        return

    try:
        scheduler.shutdown(wait=False)
        print("🛑 [scheduler] BackgroundScheduler stopped.", flush=True)
        logger.info("Scheduler notifikasi harian dihentikan.")
    except Exception as exc:
        print(f"⚠️ [scheduler] error while stopping scheduler: {exc}", flush=True)
        logger.exception("Error stopping scheduler: %s", exc)
