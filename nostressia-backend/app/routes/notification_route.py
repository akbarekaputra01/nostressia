"""Notification subscription routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.user_model import User
from app.schemas.notification_schema import (
    NotificationStatusResponse,
    NotificationSubscribeRequest,
)
from app.schemas.response_schema import APIResponse
from app.utils.jwt_handler import get_current_user
from app.utils.response import success_response

# Service
from app.services import push_notification_service
from app.services.notification_scheduler import (
    remove_daily_reminder_job,
    upsert_daily_reminder_job,
)
from app.services.push_notification_service import WebPushException

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def send_push(subscription, payload: dict) -> None:
    push_notification_service.send_push(subscription, payload)


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
        normalized_time = push_notification_service.subscribe_user(
            db, 
            current_user.user_id, 
            payload.subscription, 
            payload.reminderTime,
            payload.timezone
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    response = NotificationStatusResponse(
        dailyReminder=True,
        reminderTime=normalized_time,
        timezone=payload.timezone,
    )
    return success_response(data=response, message="Subscription saved")


@router.delete(
    "/unsubscribe",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[NotificationStatusResponse],
)
def unsubscribe_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    push_notification_service.unsubscribe_user(db, current_user.user_id)

    response = NotificationStatusResponse(
        dailyReminder=False,
        reminderTime=None,
        timezone=None,
    )
    return success_response(data=response, message="Subscription deactivated")


@router.get(
    "/status",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[NotificationStatusResponse],
)
def notification_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    active_subscription = push_notification_service.get_active_subscription(db, current_user.user_id)

    response = NotificationStatusResponse(
        dailyReminder=bool(active_subscription),
        reminderTime=active_subscription.reminder_time if active_subscription else None,
        timezone=active_subscription.timezone if active_subscription else None,
    )
    return success_response(data=response, message="Notification status")


@router.post(
    "/test-send",
    status_code=status.HTTP_200_OK,
    response_model=APIResponse[dict],
)
def test_send_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Retrieve active subscription
    subscription = push_notification_service.get_active_subscription(db, current_user.user_id)

    if not subscription:
        raise HTTPException(
            status_code=404,
            detail=(
                "No active push subscription for this user. "
                "Ensure the frontend has subscribed."
            ),
        )

    payload = {
        "title": "Nostressia Push Test",
        "body": "If you can see this, the backend successfully sent a push notification.",
        "url": "/",
    }

    try:
        send_push(subscription, payload)
    except RuntimeError as exc: # Missing config
        raise HTTPException(status_code=500, detail=str(exc))
    except WebPushException as exc:
        status_code = exc.response.status_code if exc.response else None
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send push. status={status_code}, error={str(exc)}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Push error: {str(exc)}") from exc

    return success_response(
        data={"sent": True},
        message="Push test sent. Check the device/browser notifications.",
    )
