from typing import Optional

from pydantic import BaseModel, Field


class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionPayload(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys


class NotificationSubscribeRequest(BaseModel):
    subscription: PushSubscriptionPayload
    reminderTime: str = Field(..., description="HH:mm")
    timezone: str = Field("Asia/Jakarta")


class NotificationStatusResponse(BaseModel):
    dailyReminder: bool
    reminderTime: Optional[str] = None
    timezone: Optional[str] = None
