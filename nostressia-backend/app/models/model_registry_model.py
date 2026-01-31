from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Index, Integer, Text
from sqlalchemy.sql import func

from app.core.database import Base


class ModelRegistry(Base):
    __tablename__ = "model_registry"

    model_id = Column(Integer, primary_key=True, index=True)
    model_type = Column(Enum("global", "personalized", name="model_registry_type"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    milestone = Column(Integer, nullable=True)
    artifact_url = Column(Text, nullable=False)
    trained_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("ix_model_registry_type_active", "model_type", "is_active"),
        Index("ix_model_registry_user_active", "user_id", "model_type", "is_active"),
        Index("ix_model_registry_type_trained_at", "model_type", "trained_at"),
    )
