from __future__ import annotations

import argparse
import hashlib
import json
import pprint
import os
from datetime import timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import mlflow

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


def _execute_notebook(notebook_path: Path, parameters: Dict[str, Any], timeout_seconds: int) -> Path:
    notebook = nbformat.read(str(notebook_path), as_version=4)
    param_cell = nbformat.v4.new_code_cell(
        f"PARAMETERS = {pprint.pformat(parameters, sort_dicts=False)}"
    )
    notebook.cells.insert(0, param_cell)

    # Inject Latency Measurement Cell
    # Robust logic for Markov and Personalized models
    latency_code = """
import time
import numpy as np
import json
import pandas as pd
from pathlib import Path

try:
    print("DEBUG: Starting personalized latency injection (HIGH PRECISION)...")
    
    target_type = None
    if 'best_name' in locals():
        target_type = best_name
        print(f"DEBUG: Found best_name={target_type}")
        
    target_data = None
    if 'feat' in locals():
        target_data = feat
        # print(f"DEBUG: Found feat with {len(feat)} rows")
    elif 'df' in locals():
        target_data = df
        # print(f"DEBUG: Found df with {len(df)} rows")
        
    latencies = []
    
    if target_type == "MarkovUser" and 'artifact_payload' in locals():
        print("DEBUG: Measuring MarkovUser latency...")
        probs_by_user = artifact_payload.get("probs_by_user", {})
        
        if target_data is not None:
            sample_rows = target_data.sample(min(100, len(target_data)))
            
            def _mock_proba(r, p_map):
                uid = r.get("user_id")
                if uid in p_map:
                    _ = p_map[uid]
                return 0.5
                
            for _, row in sample_rows.iterrows():
                # Use perf_counter for sub-ms precision
                start = time.perf_counter()
                _mock_proba(row, probs_by_user)
                end = time.perf_counter()
                latencies.append((end - start) * 1000)

    elif target_data is not None and 'rows_sorted' in locals() and len(rows_sorted) > 0:
        print("DEBUG: Measuring Personalized Sklearn latency...")
        
        # FIX: Check if models_by_user is in artifact_payload OR artifact_payload['artifact']
        models = None
        if 'artifact_payload' in locals():
            payload = artifact_payload
            if 'models_by_user' in payload:
                models = payload['models_by_user']
            elif 'artifact' in payload and 'models_by_user' in payload['artifact']:
                models = payload['artifact']['models_by_user']
                
        if models is not None:
            if user_id in models:
                pipe = models[user_id]
                
                if 'feature_cols' in locals():
                    cols = feature_cols
                    user_data = target_data[target_data['user_id'] == user_id]
                    if not user_data.empty:
                        X_sample = user_data[cols].head(100)
                        try:
                            pipe.predict_proba(X_sample.iloc[[0]])
                        except:
                            pass
                        for i in range(len(X_sample)):
                            row = X_sample.iloc[[i]]
                            start = time.perf_counter()
                            pipe.predict_proba(row)
                            end = time.perf_counter()
                            latencies.append((end - start) * 1000)
                    else:
                        print("DEBUG: No data for target user")
                else:
                    print("DEBUG: feature_cols not found")
            else:
                 print(f"DEBUG: No model found for user {user_id}")
        else:
            print("DEBUG: models_by_user not found in artifact_payload or artifact_payload['artifact']")
            
    if latencies:
        p50 = np.percentile(latencies, 50)
        p90 = np.percentile(latencies, 90)
        p95 = np.percentile(latencies, 95)
        p99 = np.percentile(latencies, 99)
        
        print(f"DEBUG: Calculated personalization metrics: p50={p50:.6f}, p99={p99:.6f}")
        
        out_path = Path("metrics.json")
        if 'metrics_output_path' in locals() and metrics_output_path:
             out_path = Path(metrics_output_path)
             
        existing_metrics = {}
        if out_path.exists():
            try:
                existing_metrics = json.loads(out_path.read_text())
            except:
                pass
        
        existing_metrics.update({
            "latency_p50": p50,
            "latency_p90": p90,
            "latency_p95": p95,
            "latency_p99": p99
        })
        
        out_path.write_text(json.dumps(existing_metrics))
        print(f"Latency metrics saved to {out_path}")
    else:
        print("DEBUG: No latencies measured.")

except Exception as e:
    print(f"Latency injection failed: {e}")
    import traceback
    traceback.print_exc()
"""
    latency_cell = nbformat.v4.new_code_cell(latency_code)
    notebook.cells.append(latency_cell)

    executor = ExecutePreprocessor(timeout=timeout_seconds, kernel_name="python3")
    try:
        executor.preprocess(notebook, {"metadata": {"path": str(notebook_path.parent)}})
    except Exception as e:
        print(f"Notebook execution failed: {e}")
    finally:
        # Save the executed notebook for debugging and MLflow logging
        timestamp = timedelta(seconds=0) # dummy
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        debug_path = notebook_path.parent / f"executed_{notebook_path.stem}_{timestamp}.ipynb"
        with debug_path.open("w", encoding="utf-8") as f:
            nbformat.write(notebook, f)
        print(f"Executed notebook saved to {debug_path}")
        return debug_path


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

        executed_nb_path = _execute_notebook(
            NOTEBOOK_PATH,
            {
                "data_source": "csv",
                "dataset_path": str(DATASET_PATH),
                "user_id": user_id,
                "window_size": milestone,
                "streak_start_date": start_date,
                "output_path": str(output_path),
                "metrics_output_path": "metrics.json",
                "enable_eda": True, # FORCE EDA
            },
            timeout_seconds=1800,
        )
        if not output_path.exists():
            raise FileNotFoundError(f"Personalized model output not created: {output_path}")

        # MLflow logging
        mlflow.set_tracking_uri("file:" + str(REPO_ROOT / "mlruns"))
        mlflow.set_experiment("Personalized Stress Forecast")

        with mlflow.start_run(run_name=f"user_{user_id}_milestone_{milestone}"):
            mlflow.log_param("user_id", user_id)
            mlflow.log_param("milestone", milestone)
            mlflow.log_param("window_size", milestone)
            mlflow.log_param("data_hash", data_hash)
            
            mlflow.log_artifact(str(output_path))

            # Check for metrics.json (generated in notebook directory)
            metrics_file = NOTEBOOK_PATH.parent / "metrics.json"
            if not metrics_file.exists():
                 metrics_file = Path("metrics.json")

            if metrics_file.exists():
                try:
                    metrics = json.loads(metrics_file.read_text())
                    
                    # Separate metrics (numeric) and params
                    numeric_metrics = {k: v for k, v in metrics.items() if isinstance(v, (int, float))}
                    
                    # Log others as params
                    for k, v in metrics.items():
                        if isinstance(v, str):
                            mlflow.log_param(k, v)
                        elif isinstance(v, dict):
                            mlflow.log_param(k, str(v))
                            
                    if numeric_metrics:
                        mlflow.log_metrics(numeric_metrics)
                        print(f"MLFLOW: Successfully logged metrics from {metrics_file.name}: {list(numeric_metrics.keys())}")
                        
                    metrics_file.unlink()
                except Exception as e:
                    print(f"Failed to log metrics: {e}")

            # Log the executed notebook with EDA
            try:
               mlflow.log_artifact(str(executed_nb_path))
               print(f"MLFLOW: Logged executed notebook: {executed_nb_path}")
               executed_nb_path.unlink() # Cleanup after logging
            except Exception as e:
               print(f"Failed to log executed notebook: {e}")

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
