from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.model_registry_model import ModelRegistry
from app.models.training_job_model import TrainingJob
from app.models.user_model import User

MILESTONE_INTERVAL_DAYS = 60
GLOBAL_RETRAIN_INTERVAL_DAYS = 60


def handle_personalized_training_trigger(db: Session, user: User) -> Optional[TrainingJob]:
    if not user:
        return None

    last_milestone = user.last_personalized_trained_milestone or 0
    if user.streak < last_milestone:
        user.last_personalized_trained_milestone = 0
        user.last_personalized_training_at = None
        return None

    if user.streak <= 0 or user.streak % MILESTONE_INTERVAL_DAYS != 0:
        return None

    milestone = int(user.streak)
    if milestone <= last_milestone:
        return None

    job = TrainingJob(
        job_type="personalized",
        user_id=user.user_id,
        milestone=milestone,
        status="queued",
    )
    db.add(job)
    user.last_personalized_trained_milestone = milestone
    user.last_personalized_training_at = datetime.now(timezone.utc)
    return job


def enqueue_global_training_if_due(db: Session, now: Optional[datetime] = None) -> Optional[TrainingJob]:
    timestamp = now or datetime.now(timezone.utc)
    existing_job = (
        db.query(TrainingJob)
        .filter(
            TrainingJob.job_type == "global",
            TrainingJob.status.in_(["queued", "running"]),
        )
        .first()
    )
    if existing_job:
        return None

    latest_model = (
        db.query(ModelRegistry)
        .filter(ModelRegistry.model_type == "global")
        .order_by(desc(ModelRegistry.trained_at))
        .first()
    )
    if latest_model and latest_model.trained_at:
        trained_at = latest_model.trained_at
        if trained_at.tzinfo is None:
            trained_at = trained_at.replace(tzinfo=timezone.utc)
        if timestamp - trained_at < timedelta(days=GLOBAL_RETRAIN_INTERVAL_DAYS):
            return None

    job = TrainingJob(job_type="global", status="queued")
    db.add(job)
    return job
