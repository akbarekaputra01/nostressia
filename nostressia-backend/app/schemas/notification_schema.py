from typing import Optional

from pydantic import Field

from app.schemas.base_schema import BaseSchema


class PushSubscriptionKeys(BaseSchema):
    p256dh: str
    auth: str


class PushSubscriptionPayload(BaseSchema):
    endpoint: str
    keys: PushSubscriptionKeys


class NotificationSubscribeRequest(BaseSchema):
    subscription: PushSubscriptionPayload
    reminderTime: str = Field(..., description="HH:mm")
    timezone: str = Field("Asia/Jakarta")


class NotificationStatusResponse(BaseSchema):
    dailyReminder: bool
    reminderTime: Optional[str] = None
    timezone: Optional[str] = None
