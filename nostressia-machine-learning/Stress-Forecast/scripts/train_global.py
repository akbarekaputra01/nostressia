from __future__ import annotations

import argparse
import hashlib
import json
import pprint
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict

import nbformat
from nbconvert.preprocessors import ExecutePreprocessor

from ml_state import MLState, utc_now_iso

REPO_ROOT = Path(__file__).resolve().parents[3]
NOTEBOOK_PATH = (
    REPO_ROOT / "nostressia-machine-learning" / "Stress-Forecast" / "notebooks" / "global_forecast.ipynb"
)
DATASET_PATH = (
    REPO_ROOT / "nostressia-machine-learning" / "Stress-Forecast" / "datasets" / "stress_forecast.csv"
)
MODEL_OUT = REPO_ROOT / "nostressia-backend" / "app" / "models_ml" / "global_forecast.joblib"
META_OUT = REPO_ROOT / "nostressia-backend" / "app" / "models_ml" / "global_forecast.meta.json"
STATE_PATH = REPO_ROOT / ".ml_state.json"

GLOBAL_INTERVAL_DAYS = 60


def _sha256(path: Path) -> str:
    sha = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            sha.update(chunk)
    return sha.hexdigest()


def _execute_notebook(notebook_path: Path, parameters: Dict[str, Any], timeout_seconds: int) -> None:
    notebook = nbformat.read(str(notebook_path), as_version=4)
    param_cell = nbformat.v4.new_code_cell(
        f"PARAMETERS = {pprint.pformat(parameters, sort_dicts=False)}"
    )
    notebook.cells.insert(0, param_cell)
    executor = ExecutePreprocessor(timeout=timeout_seconds, kernel_name="python3")
    executor.preprocess(notebook, {"metadata": {"path": str(notebook_path.parent)}})


def _is_due(state: MLState, now: datetime) -> bool:
    last = state.global_state.get("last_trained_at")
    if not last:
        return True
    try:
        last_dt = datetime.fromisoformat(last)
    except ValueError:
        return True
    if last_dt.tzinfo is None:
        last_dt = last_dt.replace(tzinfo=timezone.utc)
    return now - last_dt >= timedelta(days=GLOBAL_INTERVAL_DAYS)


def _write_meta(data_hash: str, trained_at: str) -> None:
    META_OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "trained_at": trained_at,
        "data_hash": data_hash,
        "git_sha": os.getenv("GITHUB_SHA") or os.getenv("GIT_SHA") or "",
    }
    META_OUT.write_text(json.dumps(payload, indent=2, sort_keys=True))


def train_global(force: bool) -> bool:
    state = MLState.load(STATE_PATH)
    now = datetime.now(timezone.utc)
    if not force and not _is_due(state, now):
        print("Global training skipped: last run is within 60 days.")
        return False

    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

    data_hash = _sha256(DATASET_PATH)
    print("DATASET_PATH :", DATASET_PATH)
    print("DATA_HASH    :", data_hash)
    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    _execute_notebook(
        NOTEBOOK_PATH,
        {
            "data_source": "csv",
            "dataset_path": str(DATASET_PATH),
            "output_path": str(MODEL_OUT),
            "metrics_output_path": None,
        },
        timeout_seconds=1800,
    )
    if not MODEL_OUT.exists():
        raise FileNotFoundError(f"Global model output not created: {MODEL_OUT}")

    trained_at = utc_now_iso()
    state.global_state["last_trained_at"] = trained_at
    state.global_state["data_hash"] = data_hash
    state.save(STATE_PATH)
    _write_meta(data_hash, trained_at)
    print("Global training completed.")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Train global forecast model with gating.")
    parser.add_argument("--force", action="store_true", help="Run training regardless of 60-day gate.")
    args = parser.parse_args()
    train_global(force=args.force)


if __name__ == "__main__":
    main()
