from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, Integer, Text
from sqlalchemy.sql import func

from app.core.database import Base


class TrainingJob(Base):
    __tablename__ = "training_jobs"

    job_id = Column(Integer, primary_key=True, index=True)
    job_type = Column(Enum("global", "personalized", name="training_job_type"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    milestone = Column(Integer, nullable=True)
    status = Column(
        Enum("queued", "running", "success", "failed", name="training_job_status"),
        nullable=False,
        default="queued",
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_training_jobs_status_created_at", "status", "created_at"),
        Index("ix_training_jobs_job_type_status", "job_type", "status"),
        Index("ix_training_jobs_user_id_milestone", "user_id", "milestone"),
    )
