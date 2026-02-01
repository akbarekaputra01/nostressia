"""Scheduler retraining global dan worker queue training."""
import logging
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.core.database import SessionLocal
from app.models.training_job_model import TrainingJob
from app.services.retraining_service import process_training_queue

logger = logging.getLogger(__name__)

_scheduler: Optional[BackgroundScheduler] = None


def _ensure_scheduler_started() -> BackgroundScheduler:
    global _scheduler
    if _scheduler and _scheduler.running:
        return _scheduler
    _scheduler = BackgroundScheduler()
    _scheduler.start()
    return _scheduler


def _enqueue_global_retrain_job() -> None:
    with SessionLocal() as db:
        existing = (
            db.query(TrainingJob)
            .filter(TrainingJob.job_type == "global", TrainingJob.status.in_(["queued", "running"]))
            .first()
        )
        if existing:
            logger.info("Global retrain job already queued/running. job_id=%s", existing.job_id)
            return
        job = TrainingJob(job_type="global", status="queued")
        db.add(job)
        db.commit()
        logger.info("Queued global retrain job. job_id=%s", job.job_id)

    process_training_queue()


def start_retraining_scheduler() -> BackgroundScheduler:
    scheduler = _ensure_scheduler_started()

    scheduler.add_job(
        _enqueue_global_retrain_job,
        trigger=CronTrigger(hour=0, minute=0),
        id="global_retrain_midnight",
        replace_existing=True,
    )

    scheduler.add_job(
        process_training_queue,
        trigger=IntervalTrigger(seconds=60),
        id="training_queue_worker",
        replace_existing=True,
    )

    logger.info("Retraining scheduler started.")
    return scheduler


def stop_retraining_scheduler(scheduler: Optional[BackgroundScheduler]) -> None:
    global _scheduler
    if scheduler:
        scheduler.shutdown(wait=False)
    _scheduler = None
    logger.info("Retraining scheduler stopped.")
