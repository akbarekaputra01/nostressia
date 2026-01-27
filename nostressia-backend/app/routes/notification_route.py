# nostressia-backend/app/routes/notification_route.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.push_subscription_model import PushSubscription
from app.models.user_model import User
from app.schemas.notification_schema import (
    NotificationStatusResponse,
    NotificationSubscribeRequest,
)
from app.schemas.response_schema import APIResponse
from app.utils.jwt_handler import get_current_user
from app.utils.response import success_response

# push sender (buat test-send)
from app.services.push_notification_service import WebPushException, send_push

# ✅ scheduler: pasang/remove job cron
from app.services.notification_scheduler import (
    upsert_daily_reminder_job,
    remove_daily_reminder_job,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _normalize_time(value: str) -> str:
    if not value or ":" not in value:
        raise ValueError("Format waktu tidak valid")
    parts = value.split(":")
    if len(parts) != 2:
        raise ValueError("Format waktu tidak valid")
    hours, minutes = parts
    if not hours.isdigit() or not minutes.isdigit():
        raise ValueError("Format waktu tidak valid")
    hour_value = int(hours)
    minute_value = int(minutes)
    if hour_value < 0 or hour_value > 23 or minute_value < 0 or minute_value > 59:
        raise ValueError("Format waktu tidak valid")
    return f"{hour_value:02d}:{minute_value:02d}"


@router.post(
    "/subscribe",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[NotificationStatusResponse],
)
def subscribe_notification(
    payload: NotificationSubscribeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        reminder_time = _normalize_time(payload.reminderTime)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    subscription_data = payload.subscription

    existing = (
        db.query(PushSubscription)
        .filter(
            PushSubscription.user_id == current_user.user_id,
            PushSubscription.endpoint == subscription_data.endpoint,
        )
        .first()
    )

    if existing:
        existing.p256dh = subscription_data.keys.p256dh
        existing.auth = subscription_data.keys.auth
        existing.reminder_time = reminder_time
        existing.timezone = payload.timezone
        existing.is_active = True
        db.add(existing)
        db.commit()
        db.refresh(existing)

        # ✅ pasang job cron (tepat detik 00) untuk subscription ini
        upsert_daily_reminder_job(
            subscription_id=existing.subscription_id,
            reminder_time=reminder_time,
            timezone=payload.timezone,
        )

    else:
        new_subscription = PushSubscription(
            user_id=current_user.user_id,
            endpoint=subscription_data.endpoint,
            p256dh=subscription_data.keys.p256dh,
            auth=subscription_data.keys.auth,
            reminder_time=reminder_time,
            timezone=payload.timezone,
            is_active=True,
        )
        db.add(new_subscription)
        db.commit()
        db.refresh(new_subscription)

        # ✅ pasang job cron (tepat detik 00) untuk subscription ini
        upsert_daily_reminder_job(
            subscription_id=new_subscription.subscription_id,
            reminder_time=reminder_time,
            timezone=payload.timezone,
        )

    response = NotificationStatusResponse(
        dailyReminder=True,
        reminderTime=reminder_time,
        timezone=payload.timezone,
    )
    return success_response(data=response, message="Subscription tersimpan")


@router.delete(
    "/unsubscribe",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[NotificationStatusResponse],
)
def unsubscribe_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ✅ ambil semua subscription aktif user ini dulu (buat remove job)
    active_subs = (
        db.query(PushSubscription)
        .filter(
            PushSubscription.user_id == current_user.user_id,
            PushSubscription.is_active.is_(True),
        )
        .all()
    )

    # ✅ remove job scheduler untuk semua subscription aktif
    for sub in active_subs:
        remove_daily_reminder_job(sub.subscription_id)

    # ✅ matikan di DB
    db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.user_id,
        PushSubscription.is_active.is_(True),
    ).update({"is_active": False})
    db.commit()

    response = NotificationStatusResponse(
        dailyReminder=False,
        reminderTime=None,
        timezone=None,
    )
    return success_response(data=response, message="Subscription dinonaktifkan")


@router.get(
    "/status",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[NotificationStatusResponse],
)
def notification_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    active_subscription = (
        db.query(PushSubscription)
        .filter(
            PushSubscription.user_id == current_user.user_id,
            PushSubscription.is_active.is_(True),
        )
        .order_by(PushSubscription.created_at.desc())
        .first()
    )

    response = NotificationStatusResponse(
        dailyReminder=bool(active_subscription),
        reminderTime=active_subscription.reminder_time if active_subscription else None,
        timezone=active_subscription.timezone if active_subscription else None,
    )
    return success_response(data=response, message="Status notifikasi")


@router.post(
    "/test-send",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[dict],
)
def test_send_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Endpoint test untuk memastikan:
    - subscription tersimpan di DB
    - VAPID private key terisi
    - pywebpush bisa ngirim
    - service worker bisa nampilin notifikasi
    """
    if not settings.vapid_private_key:
        raise HTTPException(
            status_code=500,
            detail="VAPID_PRIVATE_KEY belum diisi di environment backend.",
        )

    subscription = (
        db.query(PushSubscription)
        .filter(
            PushSubscription.user_id == current_user.user_id,
            PushSubscription.is_active.is_(True),
        )
        .order_by(PushSubscription.created_at.desc())
        .first()
    )

    if not subscription:
        raise HTTPException(
            status_code=404,
            detail="Tidak ada push subscription aktif untuk user ini. Pastikan sudah subscribe dari frontend.",
        )

    payload = {
        "title": "Nostressia Push Test",
        "body": "Kalau kamu lihat ini, berarti backend berhasil kirim web push ✅",
        "url": "/",
    }

    try:
        send_push(subscription, payload)
    except WebPushException as exc:
        status_code = exc.response.status_code if exc.response else None
        raise HTTPException(
            status_code=500,
            detail=f"Gagal kirim push. status={status_code}, error={str(exc)}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Push error: {str(exc)}") from exc

    return success_response(
        data={"sent": True},
        message="Push test terkirim (cek notifikasi device/browser).",
    )
