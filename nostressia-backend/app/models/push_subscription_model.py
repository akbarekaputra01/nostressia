from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    subscription_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    endpoint = Column(String(512), unique=True, nullable=False)
    p256dh = Column(String(255), nullable=False)
    auth = Column(String(255), nullable=False)
    reminder_time = Column(String(5), nullable=False)
    timezone = Column(String(64), default="Asia/Jakarta")
    is_active = Column(Boolean, default=True)
    last_sent_date = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")
