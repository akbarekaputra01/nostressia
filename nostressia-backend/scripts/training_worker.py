import argparse
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from azure.storage.blob import BlobServiceClient, ContentSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.models.model_registry_model import ModelRegistry
from app.models.training_job_model import TrainingJob
from app.services.training_job_service import enqueue_global_training_if_due

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONTAINER = "model-artifacts"


def _build_database_url() -> str:
    if settings.database_url:
        return settings.database_url
    user = settings.db_user
    password = settings.db_password
    host = settings.db_host
    name = settings.db_name
    return f"mysql+mysqlconnector://{user}:{password}@{host}/{name}"


def _get_session() -> Session:
    engine = create_engine(_build_database_url())
    session_local = sessionmaker(bind=engine)
    return session_local()


def _upload_artifact(file_path: Path, job_type: str, user_id: Optional[int]) -> str:
    connection_string = os.environ.get("AZURE_STORAGE_CONNECTION_STRING")
    if not connection_string:
        raise RuntimeError("AZURE_STORAGE_CONNECTION_STRING is required to upload artifacts.")

    container_name = (
        os.environ.get("AZURE_STORAGE_CONTAINER_NAME")
        or os.environ.get("AZURE_STORAGE_CONTAINER")
        or DEFAULT_CONTAINER
    )

    blob_service = BlobServiceClient.from_connection_string(connection_string)
    container_client = blob_service.get_container_client(container_name)
    if not container_client.exists():
        container_client.create_container()

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    prefix = f"{job_type}/global"
    if user_id is not None:
        prefix = f"{job_type}/user-{user_id}"
    blob_name = f"{prefix}/{timestamp}-{file_path.name}"
    blob_client = container_client.get_blob_client(blob_name)
    content_settings = ContentSettings(content_type="application/octet-stream")
    with file_path.open("rb") as artifact_file:
        blob_client.upload_blob(artifact_file, overwrite=True, content_settings=content_settings)
    return blob_client.url


def _run_training(job: TrainingJob) -> Path:
    output_dir = ROOT / "artifacts"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"job_{job.job_id}.joblib"

    command = [
        "python",
        str(ROOT / "nostressia-machine-learning" / "runner" / "train_models.py"),
        "--mode",
        job.job_type,
        "--output-path",
        str(output_path),
    ]
    if job.user_id is not None:
        command.extend(["--user-id", str(job.user_id)])
    if job.milestone is not None:
        command.extend(["--milestone", str(job.milestone)])

    subprocess.run(command, check=True, cwd=ROOT)
    if not output_path.exists():
        raise FileNotFoundError(f"Training output was not created at {output_path}.")
    return output_path


def _activate_model_record(
    db: Session,
    job: TrainingJob,
    artifact_url: str,
) -> ModelRegistry:
    db.query(ModelRegistry).filter(
        ModelRegistry.model_type == job.job_type,
        ModelRegistry.user_id == job.user_id,
        ModelRegistry.is_active.is_(True),
    ).update({"is_active": False})

    record = ModelRegistry(
        model_type=job.job_type,
        user_id=job.user_id,
        milestone=job.milestone,
        artifact_url=artifact_url,
        trained_at=datetime.now(timezone.utc),
        is_active=True,
    )
    db.add(record)
    return record


def _claim_next_job(db: Session, job_type: str) -> Optional[TrainingJob]:
    job = (
        db.query(TrainingJob)
        .filter(TrainingJob.job_type == job_type, TrainingJob.status == "queued")
        .order_by(TrainingJob.created_at.asc())
        .with_for_update(skip_locked=True)
        .first()
    )
    if not job:
        return None
    job.status = "running"
    job.started_at = datetime.now(timezone.utc)
    return job


def _run_worker(job_type: str) -> None:
    session = _get_session()
    try:
        if job_type == "global":
            enqueue_global_training_if_due(session)
            session.commit()

        job = _claim_next_job(session, job_type)
        if not job:
            return
        session.commit()

        try:
            artifact_path = _run_training(job)
            artifact_url = _upload_artifact(artifact_path, job_type, job.user_id)
            _activate_model_record(session, job, artifact_url)
            job.status = "success"
            job.finished_at = datetime.now(timezone.utc)
            job.error_message = None
            session.commit()
        except Exception as exc:
            session.rollback()
            job.status = "failed"
            job.finished_at = datetime.now(timezone.utc)
            job.error_message = str(exc)
            session.add(job)
            session.commit()
            raise
    finally:
        session.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Process queued model training jobs.")
    parser.add_argument(
        "--job-type",
        choices=["global", "personalized"],
        required=True,
        help="Training job type to process.",
    )
    args = parser.parse_args()
    _run_worker(args.job_type)


if __name__ == "__main__":
    main()
