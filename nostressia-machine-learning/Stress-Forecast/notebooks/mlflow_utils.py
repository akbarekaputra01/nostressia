from __future__ import annotations

import shutil
from pathlib import Path

import mlflow
from mlflow.exceptions import MlflowException
from mlflow.tracking import MlflowClient


def resolve_repo_root() -> Path:
    cwd = Path.cwd().resolve()
    for parent in [cwd, *cwd.parents]:
        if (parent / "nostressia-machine-learning").exists() and (parent / "nostressia-backend").exists():
            return parent
    return cwd


def configure_mlflow(experiment_name: str) -> tuple[Path, str]:
    repo_root = resolve_repo_root()
    mlruns_dir = (repo_root / "mlruns").resolve()
    mlruns_dir.mkdir(parents=True, exist_ok=True)
    trash_dir = mlruns_dir / ".trash"
    trash_dir.mkdir(parents=True, exist_ok=True)

    tracking_uri = "file:" + str(mlruns_dir).replace("\\", "/")
    mlflow.set_tracking_uri(tracking_uri)

    client = MlflowClient()
    experiment = client.get_experiment_by_name(experiment_name)
    if experiment and experiment.lifecycle_stage == "deleted":
        trash_experiment_dir = trash_dir / experiment.experiment_id
        if trash_experiment_dir.exists():
            shutil.rmtree(trash_experiment_dir)

    try:
        mlflow.set_experiment(experiment_name)
    except MlflowException as exc:
        if "deleted experiment" not in str(exc).lower():
            raise
        recovered_experiment = client.get_experiment_by_name(experiment_name)
        if recovered_experiment and recovered_experiment.lifecycle_stage == "deleted":
            client.restore_experiment(recovered_experiment.experiment_id)
        mlflow.set_experiment(experiment_name)

    return repo_root, tracking_uri


def ensure_notebook_run(run_name: str):
    active = mlflow.active_run()
    if active is not None:
        mlflow.end_run()
    return mlflow.start_run(run_name=run_name)
