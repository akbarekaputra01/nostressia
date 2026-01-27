# nostressia-backend/app/services/notification_scheduler.py

import logging
from datetime import datetime, date
from typing import Optional

import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.database import SessionLocal
from app.models.push_subscription_model import PushSubscription
from app.services.push_notification_service import WebPushException, send_push

logger = logging.getLogger(__name__)

DEFAULT_TZ = "Asia/Jakarta"

# scheduler global biar bisa dipanggil dari route
_scheduler: Optional[BackgroundScheduler] = None


def _build_payload() -> dict:
    return {
        "title": "Nostressia Daily Reminder",
        "body": "Time to check-in dan log stress level kamu.",
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
    # reminder_time sudah distandarkan "HH:mm" dari route
    h, m = reminder_time.split(":")
    return int(h), int(m)


def _job_id_for_subscription(subscription_id: int) -> str:
    return f"daily-reminder-sub-{subscription_id}"


def _send_daily_reminder(subscription_id: int) -> None:
    """
    Ini yang dipanggil APScheduler tepat di detik 00.
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
            print(f"ℹ️ [scheduler] subscription_id={subscription_id} inactive/not found", flush=True)
            return

        tz_name = _normalize_tz(sub.timezone or DEFAULT_TZ)
        tz = pytz.timezone(tz_name)
        now = datetime.now(tz)

        # dedupe: jangan double-send dalam tanggal yang sama
        if sub.last_sent_date == now.date():
            print(
                f"⏭️ [scheduler] skip already sent today sub_id={sub.subscription_id} date={sub.last_sent_date}",
                flush=True,
            )
            return

        print(
            f"🚀 [scheduler] sending sub_id={sub.subscription_id} user_id={sub.user_id} now={now.strftime('%H:%M:%S')} tz={tz_name}",
            flush=True,
        )

        send_push(sub, _build_payload())

        sub.last_sent_date = now.date()
        db.add(sub)
        db.commit()

        print(
            f"✅ [scheduler] sent OK sub_id={sub.subscription_id} user_id={sub.user_id}",
            flush=True,
        )

    except WebPushException as exc:
        status_code = exc.response.status_code if exc.response else None
        print(
            f"❌ [scheduler] WebPushException sub_id={subscription_id} status={status_code} err={exc}",
            flush=True,
        )
        # expired subscription -> matiin
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
                    print(f"🧹 [scheduler] deactivated expired sub_id={subscription_id}", flush=True)
            except Exception:
                logger.exception("Failed to deactivate expired subscription.")
        logger.warning("Push gagal sub_id=%s: %s", subscription_id, exc)

    except Exception as exc:
        print(f"💥 [scheduler] unexpected error sub_id={subscription_id}: {exc}", flush=True)
        logger.exception("Scheduler job error: %s", exc)

    finally:
        db.close()


def _ensure_scheduler_started() -> BackgroundScheduler:
    global _scheduler
    if _scheduler and _scheduler.running:
        return _scheduler

    print("✅ [scheduler] starting BackgroundScheduler (cron mode)...", flush=True)
    _scheduler = BackgroundScheduler(timezone=DEFAULT_TZ)
    _scheduler.start()
    return _scheduler


def upsert_daily_reminder_job(subscription_id: int, reminder_time: str, timezone: str) -> None:
    """
    Buat/update job agar jalan tepat di HH:mm:00 sesuai timezone.
    """
    scheduler = _ensure_scheduler_started()

    tz_name = _normalize_tz(timezone or DEFAULT_TZ)
    hour, minute = _parse_hhmm(reminder_time)

    # CronTrigger => exact di detik 00
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

    print(
        f"🧩 [scheduler] upsert job_id={job_id} time={reminder_time}:00 tz={tz_name}",
        flush=True,
    )


def remove_daily_reminder_job(subscription_id: int) -> None:
    scheduler = _ensure_scheduler_started()
    job_id = _job_id_for_subscription(subscription_id)
    try:
        scheduler.remove_job(job_id)
        print(f"🧹 [scheduler] removed job_id={job_id}", flush=True)
    except Exception:
        # kalau job belum ada, aman
        pass


def load_jobs_from_db() -> None:
    """
    Saat startup, ambil semua subscription aktif lalu pasang job cron-nya.
    Ini penting karena HF restart = scheduler kosong.
    """
    scheduler = _ensure_scheduler_started()

    db = SessionLocal()
    try:
        subs = db.query(PushSubscription).filter(PushSubscription.is_active.is_(True)).all()
        print(f"📌 [scheduler] loading active subs={len(subs)}", flush=True)

        for sub in subs:
            try:
                upsert_daily_reminder_job(
                    subscription_id=sub.subscription_id,
                    reminder_time=sub.reminder_time,
                    timezone=sub.timezone or DEFAULT_TZ,
                )
            except Exception as exc:
                print(f"⚠️ [scheduler] failed load job sub_id={sub.subscription_id}: {exc}", flush=True)

    finally:
        db.close()


def start_notification_scheduler() -> BackgroundScheduler:
    """
    Dipanggil dari app startup.
    """
    scheduler = _ensure_scheduler_started()
    load_jobs_from_db()
    print("✅ [scheduler] cron jobs ready.", flush=True)
    return scheduler


def stop_notification_scheduler(scheduler: Optional[BackgroundScheduler]) -> None:
    global _scheduler
    if scheduler:
        try:
            scheduler.shutdown(wait=False)
        except Exception:
            pass
    _scheduler = None
    print("🛑 [scheduler] stopped.", flush=True)
