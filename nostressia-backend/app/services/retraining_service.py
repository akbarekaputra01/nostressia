import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from sqlalchemy import asc
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.training_job_model import TrainingJob
from app.models.user_model import User
from app.services.notebook_runner import read_metrics_json, run_notebook, validate_joblib_output
from app.services.training_data_service import fetch_personalized_training_rows

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[3]
NOTEBOOK_DIR = REPO_ROOT / "nostressia-machine-learning" / "Stress-Forecast" / "notebooks"
GLOBAL_NOTEBOOK = NOTEBOOK_DIR / "global_forecast.ipynb"
PERSONALIZED_NOTEBOOK = NOTEBOOK_DIR / "personalized_forecast.ipynb"

GLOBAL_MODEL_OUT = REPO_ROOT / "nostressia-backend" / "app" / "models_ml" / "global_forecast.joblib"
PERSONALIZED_MODEL_OUT = REPO_ROOT / "nostressia-backend" / "app" / "models_ml" / "personalized_forecast.joblib"

MIN_PERSONALIZED_ROWS = 14


def process_training_queue() -> None:
    """Ambil job queued dan eksekusi satu per satu."""
    with SessionLocal() as db:
        job = _claim_next_job(db)
        if not job:
            return

    if job.job_type == "global":
        _run_global_job(job.job_id)
    elif job.job_type == "personalized":
        _run_personalized_job(job.job_id)


def _claim_next_job(db: Session) -> Optional[TrainingJob]:
    with db.begin():
        job = (
            db.query(TrainingJob)
            .filter(TrainingJob.status == "queued")
            .order_by(asc(TrainingJob.created_at))
            .with_for_update(skip_locked=True)
            .first()
        )
        if not job:
            return None
        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        logger.info("Training job claimed. id=%s type=%s", job.job_id, job.job_type)
        return job


def _run_global_job(job_id: int) -> None:
    executed_output = f"/tmp/nostressia/global_retrain_{job_id}.ipynb"
    metrics_output = f"/tmp/nostressia/global_metrics_{job_id}.json"
    data_source = os.getenv("DATA_SOURCE", "db")
    env = _build_notebook_env()

    try:
        run_notebook(
            str(GLOBAL_NOTEBOOK),
            parameters={
                "data_source": data_source,
                "global_days_limit": None,
                "output_path": str(GLOBAL_MODEL_OUT),
                "metrics_output_path": metrics_output,
            },
            executed_output_path=executed_output,
            env=env,
        )
        validate_joblib_output(str(GLOBAL_MODEL_OUT))
        _mark_job_success(job_id, metrics_output)
        logger.info("Global retrain success. job_id=%s", job_id)
    except Exception as exc:
        _mark_job_failed(job_id, str(exc))
        logger.exception("Global retrain failed. job_id=%s", job_id)


def _run_personalized_job(job_id: int) -> None:
    executed_output = f"/tmp/nostressia/personalized_retrain_{job_id}.ipynb"
    metrics_output = f"/tmp/nostressia/personalized_metrics_{job_id}.json"
    data_source = os.getenv("DATA_SOURCE", "db")
    env = _build_notebook_env()

    with SessionLocal() as db:
        job = db.query(TrainingJob).filter(TrainingJob.job_id == job_id).first()
        if not job:
            return
        user = db.query(User).filter(User.user_id == job.user_id).first()
        if not user:
            _mark_job_failed(job_id, "User not found")
            return
        rows = fetch_personalized_training_rows(
            db if data_source == "db" else None,
            user_id=user.user_id,
            limit=60,
            data_source=data_source,
        )
        if len(rows) < MIN_PERSONALIZED_ROWS:
            _mark_personalized_skipped(db, user, job, rows)
            return

    try:
        run_notebook(
            str(PERSONALIZED_NOTEBOOK),
            parameters={
                "data_source": data_source,
                "user_id": job.user_id,
                "window_size": 60,
                "output_path": str(PERSONALIZED_MODEL_OUT),
                "metrics_output_path": metrics_output,
            },
            executed_output_path=executed_output,
            env=env,
        )
        validate_joblib_output(str(PERSONALIZED_MODEL_OUT))
        metrics = read_metrics_json(metrics_output)
        _mark_personalized_success(job_id, metrics)
        logger.info("Personalized retrain success. job_id=%s user_id=%s", job_id, job.user_id)
    except Exception as exc:
        _mark_personalized_failed(job_id, str(exc))
        logger.exception("Personalized retrain failed. job_id=%s user_id=%s", job_id, job.user_id)


def _build_notebook_env() -> dict[str, str]:
    return {
        "DATA_SOURCE": os.getenv("DATA_SOURCE", "db"),
        "DB_HOST": os.getenv("DB_HOST", ""),
        "DB_PORT": os.getenv("DB_PORT", "3306"),
        "DB_USER": os.getenv("DB_USER", ""),
        "DB_PASSWORD": os.getenv("DB_PASSWORD", ""),
        "DB_NAME": os.getenv("DB_NAME", ""),
        "BACKEND_BASE_URL": os.getenv("BACKEND_BASE_URL", ""),
        "INTERNAL_TOKEN": os.getenv("INTERNAL_TOKEN", ""),
    }


def _mark_job_success(job_id: int, metrics_path: Optional[str] = None) -> None:
    metrics = read_metrics_json(metrics_path)
    with SessionLocal() as db:
        job = db.query(TrainingJob).filter(TrainingJob.job_id == job_id).first()
        if not job:
            return
        job.status = "success"
        job.finished_at = datetime.now(timezone.utc)
        job.error_message = None
        if metrics:
            logger.info("Training metrics captured for job_id=%s metrics=%s", job_id, metrics)
        db.commit()


def _mark_job_failed(job_id: int, error_message: str) -> None:
    with SessionLocal() as db:
        job = db.query(TrainingJob).filter(TrainingJob.job_id == job_id).first()
        if not job:
            return
        job.status = "failed"
        job.finished_at = datetime.now(timezone.utc)
        job.error_message = error_message
        db.commit()


def _mark_personalized_skipped(db: Session, user: User, job: TrainingJob, rows: list[dict]) -> None:
    date_range = _resolve_date_range(rows)
    job.status = "failed"
    job.finished_at = datetime.now(timezone.utc)
    job.error_message = "skipped_insufficient_data"
    user.last_personalized_training_status = "skipped_insufficient_data"
    user.last_personalized_training_at = datetime.now(timezone.utc)
    if date_range:
        user.last_personalized_model_data_start = date_range[0]
        user.last_personalized_model_data_end = date_range[1]
    db.commit()
    logger.info(
        "Personalized retrain skipped (insufficient data). job_id=%s user_id=%s",
        job.job_id,
        user.user_id,
    )


def _mark_personalized_success(job_id: int, metrics: Optional[dict]) -> None:
    with SessionLocal() as db:
        job = db.query(TrainingJob).filter(TrainingJob.job_id == job_id).first()
        if not job:
            return
        user = db.query(User).filter(User.user_id == job.user_id).first()
        if not user:
            _mark_job_failed(job_id, "User not found")
            return
        job.status = "success"
        job.finished_at = datetime.now(timezone.utc)
        job.error_message = None
        user.last_personalized_trained_milestone = job.milestone or user.last_personalized_trained_milestone
        user.last_personalized_training_at = datetime.now(timezone.utc)
        user.last_personalized_training_status = "success"
        if metrics:
            user.last_personalized_metrics = json.dumps(metrics)
            date_range = metrics.get("date_range") if isinstance(metrics, dict) else None
            if date_range and date_range.get("start_date") and date_range.get("end_date"):
                user.last_personalized_model_data_start = _safe_date(date_range.get("start_date"))
                user.last_personalized_model_data_end = _safe_date(date_range.get("end_date"))
        db.commit()


def _mark_personalized_failed(job_id: int, error_message: str) -> None:
    with SessionLocal() as db:
        job = db.query(TrainingJob).filter(TrainingJob.job_id == job_id).first()
        if not job:
            return
        job.status = "failed"
        job.finished_at = datetime.now(timezone.utc)
        job.error_message = error_message
        user = db.query(User).filter(User.user_id == job.user_id).first()
        if user:
            user.last_personalized_training_status = "failed"
            user.last_personalized_training_at = datetime.now(timezone.utc)
        db.commit()


def _resolve_date_range(rows: list[dict]) -> Optional[tuple[datetime.date, datetime.date]]:
    if not rows:
        return None
    dates = [row.get("date") for row in rows if row.get("date")]
    if not dates:
        return None
    parsed = [_safe_date(item) for item in dates]
    parsed = [item for item in parsed if item]
    if not parsed:
        return None
    return min(parsed), max(parsed)


def _safe_date(value: Optional[str]) -> Optional[datetime.date]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value).date()
    except ValueError:
        return None
