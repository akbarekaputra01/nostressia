from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PushDeliveryLog(Base):
    __tablename__ = "push_delivery_logs"

    delivery_id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(
        Integer, ForeignKey("push_subscriptions.subscription_id"), nullable=False
    )
    sent_date = Column(Date, nullable=False, index=True)
    sent_at = Column(DateTime, server_default=func.now())

    subscription = relationship("PushSubscription")
