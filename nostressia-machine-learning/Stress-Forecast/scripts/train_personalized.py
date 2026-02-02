from __future__ import annotations

import argparse
import hashlib
import json
import pprint
import os
from datetime import timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import nbformat
import pandas as pd
from nbconvert.preprocessors import ExecutePreprocessor

from ml_state import MLState, utc_now_iso

REPO_ROOT = Path(__file__).resolve().parents[3]
NOTEBOOK_PATH = (
    REPO_ROOT / "nostressia-machine-learning" / "Stress-Forecast" / "notebooks" / "personalized_forecast.ipynb"
)
DATASET_PATH = (
    REPO_ROOT / "nostressia-machine-learning" / "Stress-Forecast" / "datasets" / "stress_forecast.csv"
)
DEFAULT_MODEL_OUT = REPO_ROOT / "nostressia-backend" / "app" / "models_ml" / "personalized_forecast.joblib"
DEFAULT_META_OUT = REPO_ROOT / "nostressia-backend" / "app" / "models_ml" / "personalized_forecast.meta.json"
STATE_PATH = REPO_ROOT / ".ml_state.json"

MILESTONE_INTERVAL = 60


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


def _current_streak(dates: List[datetime.date]) -> Tuple[int, Optional[datetime.date], Optional[datetime.date]]:
    if not dates:
        return 0, None, None
    unique_dates = sorted(set(dates))
    latest = unique_dates[-1]
    streak = 0
    current = latest
    while current in unique_dates:
        streak += 1
        current -= timedelta(days=1)
    start = latest - timedelta(days=streak - 1)
    return streak, start, latest


def _collect_candidates(
    df: pd.DataFrame, state: MLState, force_user_id: Optional[int]
) -> List[Dict[str, Any]]:
    candidates: List[Dict[str, Any]] = []
    for user_id, group in df.groupby("user_id"):
        if force_user_id is not None and int(user_id) != int(force_user_id):
            continue
        dates = [pd.to_datetime(item).date() for item in group["date"].tolist()]
        streak, start_date, end_date = _current_streak(dates)
        if force_user_id is None:
            if streak <= 0 or streak % MILESTONE_INTERVAL != 0:
                continue
        milestone = int(streak)
        if force_user_id is None:
            user_state = state.personalized.get("users", {}).get(str(user_id), {})
            last_milestone = int(user_state.get("last_trained_milestone", 0) or 0)
            last_start = user_state.get("streak_start_date")
            if last_start == (start_date.isoformat() if start_date else None) and milestone <= last_milestone:
                continue
        candidates.append(
            {
                "user_id": int(user_id),
                "milestone": milestone,
                "streak_start_date": start_date.isoformat() if start_date else None,
                "streak_end_date": end_date.isoformat() if end_date else None,
            }
        )
    return candidates


def _write_meta(path: Path, data_hash: str, trained_at: str, user_id: int, milestone: int) -> None:
    payload = {
        "trained_at": trained_at,
        "data_hash": data_hash,
        "git_sha": os.getenv("GITHUB_SHA") or os.getenv("GIT_SHA") or "",
        "user_id": user_id,
        "milestone": milestone,
    }
    path.write_text(json.dumps(payload, indent=2, sort_keys=True))


def train_personalized(
    force_user_id: Optional[int],
    force_window_size: Optional[int],
) -> bool:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    if df.empty:
        raise RuntimeError("Dataset is empty; cannot train personalized models.")

    state = MLState.load(STATE_PATH)
    candidates = _collect_candidates(df, state, force_user_id)
    if not candidates:
        if force_user_id is not None:
            print("Force training requested but user_id not found in dataset.")
        else:
            print("No personalized milestones reached in current dataset.")
        return False

    data_hash = _sha256(DATASET_PATH)
    print("DATASET_PATH :", DATASET_PATH)
    print("DATA_HASH    :", data_hash)
    trained_any = False

    for candidate in candidates:
        user_id = candidate["user_id"]
        milestone = int(force_window_size or candidate["milestone"])
        start_date = candidate["streak_start_date"]
        output_path = DEFAULT_MODEL_OUT
        meta_path = DEFAULT_META_OUT

        _execute_notebook(
            NOTEBOOK_PATH,
            {
                "data_source": "csv",
                "dataset_path": str(DATASET_PATH),
                "user_id": user_id,
                "window_size": milestone,
                "streak_start_date": start_date,
                "output_path": str(output_path),
                "metrics_output_path": None,
            },
            timeout_seconds=1800,
        )
        if not output_path.exists():
            raise FileNotFoundError(f"Personalized model output not created: {output_path}")

        trained_at = utc_now_iso()
        DEFAULT_MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
        _write_meta(meta_path, data_hash, trained_at, user_id, milestone)

        state.personalized.setdefault("users", {})[str(user_id)] = {
            "last_trained_at": trained_at,
            "last_trained_milestone": milestone,
            "streak_start_date": start_date,
            "streak_end_date": candidate["streak_end_date"],
            "data_hash": data_hash,
        }
        trained_any = True
        print(f"Trained personalized model for user_id={user_id} milestone={milestone}.")
        break

    if trained_any:
        state.save(STATE_PATH)
    return trained_any


def main() -> None:
    parser = argparse.ArgumentParser(description="Train personalized forecast model(s) based on streak milestones.")
    parser.add_argument("--force-user-id", type=int, help="Force training for a specific user_id.")
    parser.add_argument(
        "--force-window-size",
        type=int,
        help="Override window size when forcing a personalized training run.",
    )
    args = parser.parse_args()
    train_personalized(
        force_user_id=args.force_user_id,
        force_window_size=args.force_window_size,
    )


if __name__ == "__main__":
    main()
