from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.model_registry_model import ModelRegistry
from app.models.training_job_model import TrainingJob
from app.models.user_model import User

MILESTONE_INTERVAL_COUNT = 60
GLOBAL_RETRAIN_INTERVAL_DAYS = 1


def handle_personalized_training_trigger(db: Session, user: User) -> Optional[TrainingJob]:
    if not user:
        return None

    last_milestone = user.last_personalized_trained_milestone or 0
    lifetime_count = user.lifetime_valid_count or 0

    if lifetime_count <= 0 or lifetime_count % MILESTONE_INTERVAL_COUNT != 0:
        return None

    milestone = int(lifetime_count)
    if milestone <= last_milestone:
        return None

    existing_job = (
        db.query(TrainingJob)
        .filter(
            TrainingJob.job_type == "personalized",
            TrainingJob.user_id == user.user_id,
            TrainingJob.status.in_(["queued", "running"]),
        )
        .first()
    )
    if existing_job:
        return None

    job = TrainingJob(
        job_type="personalized",
        user_id=user.user_id,
        milestone=milestone,
        status="queued",
    )
    db.add(job)
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


def enqueue_personalized_training_if_due(db: Session) -> int:
    in_progress_subquery = (
        db.query(TrainingJob.user_id)
        .filter(
            TrainingJob.job_type == "personalized",
            TrainingJob.status.in_(["queued", "running"]),
        )
        .subquery()
    )

    eligible_users = (
        db.query(User)
        .filter(
            User.lifetime_valid_count.isnot(None),
            User.lifetime_valid_count > 0,
            (User.lifetime_valid_count % MILESTONE_INTERVAL_COUNT) == 0,
            User.last_personalized_trained_milestone < User.lifetime_valid_count,
            ~User.user_id.in_(in_progress_subquery),
        )
        .all()
    )

    created = 0
    for user in eligible_users:
        milestone = int(user.lifetime_valid_count or 0)
        if milestone <= (user.last_personalized_trained_milestone or 0):
            continue
        job = TrainingJob(
            job_type="personalized",
            user_id=user.user_id,
            milestone=milestone,
            status="queued",
        )
        db.add(job)
        created += 1
    return created
