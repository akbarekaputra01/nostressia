from __future__ import annotations

import argparse
import base64
import hashlib
import json
import pprint
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

import mlflow
import pandas as pd

import nbformat
import joblib
from mlflow.models import infer_signature
import mlflow.sklearn
import mlflow.data
from nbconvert.preprocessors import ExecutePreprocessor

from ml_state import MLState, should_retrain_global, utc_now_iso

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
TEMP_LOG_NAME = "metrics.json"

# --- Constants for Feature Engineering (Mapping to Notebook) ---
WINDOW = 7
TARGET_COL = "stress_level"
DATE_COL = "date"
USER_COL = "user_id"

GLOBAL_INTERVAL_DAYS = 60
FORECAST_HORIZON_DAYS = 7


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
    latency_code = """
import time
import numpy as np
import json
from pathlib import Path

try:
    print("DEBUG: Starting latency injection...")
    # Attempt to identify the model and test set
    target_model = None
    target_data = None
    
    # 1. Try to get ML pipeline from best_obj
    if 'best_obj' in locals():
        print("DEBUG: Found best_obj")
        if isinstance(best_obj, dict) and 'pipe' in best_obj:
            target_model = best_obj['pipe']
            print("DEBUG: Found pipe in best_obj")
    
    # 2. Fallback: try 'final_pipe' if available (last trained model)
    if target_model is None and 'final_pipe' in locals():
        target_model = final_pipe
        print("DEBUG: Using final_pipe fallback")
        
    # 3. Identify data (X_test)
    if 'X_test' in locals():
        target_data = X_test
        print("DEBUG: Found X_test")
    else:
        print("DEBUG: X_test NOT found")
        
    if target_model is not None and target_data is not None:
        print(f"DEBUG: Measuring latency on {len(target_data)} samples...")
        latencies = []
        # Warmup
        try:
            target_model.predict(target_data.iloc[[0]])
        except Exception as e:
            print(f"DEBUG: Warmup failed: {e}")
            pass # ignore warmup fail
        
        # Measure
        n_measure = min(100, len(target_data))
        for i in range(n_measure):
            sample = target_data.iloc[[i]]
            start = time.perf_counter()
            target_model.predict(sample)
            end = time.perf_counter()
            latencies.append((end - start) * 1000) # in ms
            
        p50 = np.percentile(latencies, 50)
        p90 = np.percentile(latencies, 90)
        p95 = np.percentile(latencies, 95)
        p99 = np.percentile(latencies, 99)
        
        print(f"DEBUG: Calculated metrics: p50={p50}, p99={p99}")
        
        # Update metrics.json
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
        print(f"Latency skip: model={target_model is not None}, data={target_data is not None}")
        if target_model is None: print("DEBUG: target_model is None")
        if target_data is None: print("DEBUG: target_data is None")
except Exception as e:
    print(f"Latency injection failed: {e}")
    import traceback
    traceback.print_exc()
"""
    latency_cell = nbformat.v4.new_code_cell(latency_code)
    notebook.cells.append(latency_cell)
    
    executor = ExecutePreprocessor(timeout=timeout_seconds, kernel_name="python3", allow_errors=False)
    execution_error: Exception | None = None
    try:
        executor.preprocess(notebook, {"metadata": {"path": str(notebook_path.parent)}})
    except Exception as e:
        execution_error = e
    finally:
        # Save the executed notebook for debugging and MLflow logging
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        debug_path = notebook_path.parent / f"executed_{notebook_path.stem}_{timestamp}.ipynb"
        with debug_path.open("w", encoding="utf-8") as f:
            nbformat.write(notebook, f)
        print(f"Executed notebook saved to {debug_path}")

    if execution_error is not None:
        raise RuntimeError(
            "Notebook execution failed for global forecast. "
            f"See executed notebook for details: {debug_path}"
        ) from execution_error

    return debug_path


def _cleanup_log(log_path: Path) -> None:
    if log_path.exists():
        try:
            log_path.unlink()
            print(f"Log cleaned up: {log_path.name}")
        except Exception as e:
            print(f"Warning: Could not clean up log {log_path.name}: {e}")


def _prepare_eval_data_global(df: pd.DataFrame) -> pd.DataFrame:
    """
    Replicates feature engineering from global_forecast.ipynb for evaluation.
    WINDOW = 7 for global forecast.
    """
    import pandas as pd
    import numpy as np
    
    BEHAVIOR_COLS = [
        "extracurricular_hour_per_day", "physical_activity_hour_per_day",
        "sleep_hour_per_day", "study_hour_per_day", "social_hour_per_day"
    ]
    
    # Check required columns
    for col in [DATE_COL, USER_COL, TARGET_COL]:
        if col not in df.columns:
            return pd.DataFrame()
            
    df[DATE_COL] = pd.to_datetime(df[DATE_COL], errors="coerce")
    df = df.sort_values([USER_COL, DATE_COL]).reset_index(drop=True)
    
    rows = []
    for uid, g in df.groupby(USER_COL):
        g = g.sort_values(DATE_COL).reset_index(drop=True)

        # Calendar features
        g["dow"] = g[DATE_COL].dt.dayofweek.astype(int)
        g["is_weekend"] = (g["dow"] >= 5).astype(int)

        # Target lag features (t-1..t-W)
        for k in range(1, WINDOW + 1):
            g[f"lag_sp_{k}"] = g[TARGET_COL].shift(k)

        # Gap features (days between records)
        g["gap_days"] = g[DATE_COL].diff().dt.days
        for k in range(1, WINDOW + 1):
            g[f"gap_{k}"] = g["gap_days"].shift(k - 1)

        # Behavior lag1 (t-1)
        for c in BEHAVIOR_COLS:
            if c in g.columns:
                g[f"lag1_{c}"] = g[c].shift(1)
            else:
                g[f"lag1_{c}"] = 0.0

        # Rolling stats on stress level
        sp_shift = g[TARGET_COL].shift(1)
        g["sp_mean"] = sp_shift.rolling(WINDOW).mean()
        g["sp_std"]  = sp_shift.rolling(WINDOW).std().fillna(0.0)
        g["sp_min"]  = sp_shift.rolling(WINDOW).min()
        g["sp_max"]  = sp_shift.rolling(WINDOW).max()

        g["count_high"] = (sp_shift >= 1).rolling(WINDOW).sum()
        g["count_low"]  = (sp_shift == 0).rolling(WINDOW).sum()

        # High streak
        high = (sp_shift >= 1).astype(int).fillna(0).astype(int).tolist()
        streak, cur = [], 0
        for v in high:
            cur = cur + 1 if v == 1 else 0
            streak.append(cur)
        g["streak_high"] = streak

        # Transitions
        diff = (sp_shift != sp_shift.shift(1)).astype(int)
        g["transitions"] = diff.rolling(WINDOW).sum()

        rows.append(g)

    if not rows:
        return pd.DataFrame()
        
    feat = pd.concat(rows, ignore_index=True)
    
    # Feature columns
    feature_cols = (
        ["dow", "is_weekend"]
        + [f"lag_sp_{k}" for k in range(1, WINDOW + 1)]
        + [f"gap_{k}" for k in range(1, WINDOW + 1)]
        + [
            "sp_mean", "sp_std", "sp_min", "sp_max",
            "count_high", "count_low",
            "streak_high", "transitions",
        ]
    )
    # Add behavior lags
    for c in BEHAVIOR_COLS:
        if f"lag1_{c}" in feat.columns:
            feature_cols.append(f"lag1_{c}")
            
    # Keep target for evaluation
    final_cols = list(set(feature_cols)) + [TARGET_COL]
    
    # Drop rows with NaNs
    feat = feat.dropna(subset=feature_cols).reset_index(drop=True)
    
    # Ensure all columns exist
    for col in final_cols:
        if col not in feat.columns:
            feat[col] = 0  # Add missing columns with default value
    
    return feat[final_cols]




def _log_dataset_details(dataset_path: Path, artifact_subdir: str = "dataset") -> None:
    df = pd.read_csv(dataset_path)
    mlflow.log_param("dataset_rows", int(df.shape[0]))
    mlflow.log_param("dataset_columns", int(df.shape[1]))

    overview = {
        "shape": {"rows": int(df.shape[0]), "columns": int(df.shape[1])},
        "columns": df.columns.tolist(),
        "dtypes": {k: str(v) for k, v in df.dtypes.items()},
        "missing_values": {k: int(v) for k, v in df.isna().sum().items()},
        "describe": df.describe(include="all").transpose().fillna("").to_dict(),
    }
    mlflow.log_dict(overview, f"{artifact_subdir}/overview.json")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        df.head(30).to_csv(tmp / "head.csv", index=False)
        df.describe(include="all").transpose().to_csv(tmp / "describe.csv")
        info_path = tmp / "info.txt"
        with info_path.open("w", encoding="utf-8") as info_file:
            df.info(buf=info_file)
        mlflow.log_artifacts(str(tmp), artifact_path=artifact_subdir)


def _log_notebook_details(executed_nb_path: Path, artifact_subdir: str = "notebook") -> None:
    notebook = nbformat.read(str(executed_nb_path), as_version=4)

    mime_extension = {
        "text/plain": "txt",
        "text/html": "html",
        "text/markdown": "md",
        "text/latex": "tex",
        "application/javascript": "js",
        "application/json": "json",
        "application/vnd.plotly.v1+json": "plotly.json",
        "application/vnd.dataresource+json": "dataresource.json",
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/svg+xml": "svg",
    }

    def _write_text(value: Any, output_path: Path) -> None:
        if isinstance(value, list):
            output_path.write_text("\n".join(str(item) for item in value), encoding="utf-8")
        else:
            output_path.write_text(str(value), encoding="utf-8")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        report_lines = [f"# Notebook output report: {executed_nb_path.name}", ""]
        output_index_payload = []

        for idx, cell in enumerate(notebook.cells, start=1):
            cell_dir = tmp / f"cell_{idx:03d}"
            cell_dir.mkdir(parents=True, exist_ok=True)

            source_ext = "py" if cell.cell_type == "code" else "md"
            (cell_dir / f"source.{source_ext}").write_text(cell.get("source", ""), encoding="utf-8")

            report_lines.append(f"## Cell {idx} ({cell.cell_type})")
            report_lines.append("```python" if cell.cell_type == "code" else "```markdown")
            report_lines.append(cell.get("source", ""))
            report_lines.append("```")

            outputs = cell.get("outputs", [])
            output_index_payload.append({
                "cell_index": idx,
                "cell_type": cell.cell_type,
                "output_count": len(outputs),
            })

            for out_idx, output in enumerate(outputs, start=1):
                output_type = output.get("output_type", "unknown")
                output_dir = cell_dir / f"output_{out_idx:02d}_{output_type}"
                output_dir.mkdir(parents=True, exist_ok=True)

                (output_dir / "raw.json").write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
                report_lines.append(f"### Output {out_idx}: {output_type}")

                if output_type == "stream":
                    text_value = output.get("text", "")
                    _write_text(text_value, output_dir / "stream.txt")
                    report_lines.append("```")
                    report_lines.append("\n".join(text_value) if isinstance(text_value, list) else str(text_value))
                    report_lines.append("```")
                    continue

                if output_type == "error":
                    traceback_value = output.get("traceback", [])
                    _write_text(traceback_value, output_dir / "traceback.txt")
                    (output_dir / "ename.txt").write_text(str(output.get("ename", "")), encoding="utf-8")
                    (output_dir / "evalue.txt").write_text(str(output.get("evalue", "")), encoding="utf-8")
                    report_lines.append("```")
                    report_lines.extend(traceback_value)
                    report_lines.append("```")
                    continue

                data_bundle = output.get("data", {})
                metadata_bundle = output.get("metadata", {})

                if metadata_bundle:
                    (output_dir / "metadata.json").write_text(
                        json.dumps(metadata_bundle, indent=2, ensure_ascii=False),
                        encoding="utf-8",
                    )

                for mime_type, value in data_bundle.items():
                    safe_mime = "".join(ch if ch.isalnum() or ch in {".", "_", "-"} else "_" for ch in mime_type)
                    extension = mime_extension.get(mime_type, "txt")
                    out_file = output_dir / f"data_{safe_mime}.{extension}"

                    if mime_type in {"image/png", "image/jpeg"}:
                        binary_value = "".join(value) if isinstance(value, list) else str(value)
                        out_file.write_bytes(base64.b64decode(binary_value))
                    elif isinstance(value, (dict, list)):
                        out_file.write_text(json.dumps(value, indent=2, ensure_ascii=False), encoding="utf-8")
                    else:
                        _write_text(value, out_file)

                    if mime_type == "text/plain":
                        report_lines.append("```")
                        report_lines.append("\n".join(value) if isinstance(value, list) else str(value))
                        report_lines.append("```")

            report_lines.append("")

        (tmp / "output_index.json").write_text(
            json.dumps(output_index_payload, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        (tmp / "notebook_report.md").write_text("\n".join(report_lines), encoding="utf-8")
        mlflow.log_artifacts(str(tmp), artifact_path=artifact_subdir)
def _is_due(state: MLState, now: datetime) -> bool:
    return should_retrain_global(
        last_trained_at=state.global_state.get("last_trained_at"),
        now=now,
        interval_days=GLOBAL_INTERVAL_DAYS,
    )


def _write_meta(data_hash: str, trained_at: str, run_id: str, metrics: Dict[str, float]) -> None:
    META_OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "created_at": trained_at,
        "trained_at": trained_at,
        "version": "global-forecast-v1",
        "horizon_days": FORECAST_HORIZON_DAYS,
        "features": ["lag_sp_*", "gap_*", "dow", "behavior_lag_features"],
        "metrics": metrics,
        "mlflow_run_id": run_id,
        "data_hash": data_hash,
        "git_sha": os.getenv("GITHUB_SHA") or os.getenv("GIT_SHA") or "",
    }
    META_OUT.write_text(json.dumps(payload, indent=2, sort_keys=True))


def train_global(force: bool) -> bool:
    state = MLState.load(STATE_PATH)
    now = datetime.now(timezone.utc)
    if not force and not _is_due(state, now):
        mlflow.set_tracking_uri("file:" + str(REPO_ROOT / "mlruns"))
        mlflow.set_experiment("Global Stress Forecast")
        with mlflow.start_run(run_name="global_skip"):
            mlflow.set_tag("skipped_due_interval", "true")
            mlflow.log_param("interval_days", GLOBAL_INTERVAL_DAYS)
            mlflow.log_param("force", force)
        print("Global training skipped: last run is within 60 days.")
        return False

    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

    data_hash = _sha256(DATASET_PATH)
    print("DATASET_PATH :", DATASET_PATH)
    print("DATA_HASH    :", data_hash)
    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    executed_nb_path = _execute_notebook(
        NOTEBOOK_PATH,
        {
            "data_source": "csv",
            "dataset_path": str(DATASET_PATH),
            "output_path": str(MODEL_OUT),
            "metrics_output_path": TEMP_LOG_NAME, # Use the constant here
            "enable_eda": True, # FORCE EDA
        },
        timeout_seconds=1800,
    )
    if not MODEL_OUT.exists():
        raise FileNotFoundError(f"Global model output not created: {MODEL_OUT}")

    # MLflow logging
    mlflow.set_tracking_uri("file:" + str(REPO_ROOT / "mlruns"))
    mlflow.set_experiment("Global Stress Forecast")

    run_metrics: Dict[str, float] = {}
    with mlflow.start_run() as run: # Capture the run object
        mlflow.log_param("interval_days", GLOBAL_INTERVAL_DAYS)
        mlflow.log_param("horizon_days", FORECAST_HORIZON_DAYS)
        mlflow.log_param("data_hash", data_hash)
        mlflow.log_param("force", force)
        _log_dataset_details(DATASET_PATH, artifact_subdir="dataset")

        # Log model artifact (old way, kept for compatibility if needed)
        # mlflow.log_artifact(str(MODEL_OUT))

        _cleanup_log(REPO_ROOT / TEMP_LOG_NAME)

        # --- MLflow Logging & Verification ---

        # 1. Log training dataset
        try:
            df = pd.read_csv(DATASET_PATH)
            training_ds = mlflow.data.from_pandas(df, name="Global_Stress_Training", targets=TARGET_COL)
            mlflow.log_input(training_ds, context="training")
            print("Logged training dataset to MLflow.")
        except Exception as e:
            print(f"Warning: Could not log training dataset: {e}")

        # 2. Log Model Artifact
        if MODEL_OUT.exists():
            payload = joblib.load(MODEL_OUT)
            model = payload.get("pipe") if isinstance(payload, dict) else payload
            
            if model is None:
                print("Warning: Could not extract model from payload (key 'pipe' not found).")
            else:
                try:
                    eval_data = _prepare_eval_data_global(df)
                    if not eval_data.empty:
                        sample_X = eval_data.drop(columns=[TARGET_COL]).head(5)
                        sample_y = model.predict(sample_X)
                        signature = infer_signature(sample_X, sample_y)
                        
                        mlflow.sklearn.log_model(
                            sk_model=model,
                            artifact_path="model",
                            signature=signature,
                            registered_model_name="Global_Stress_Forecast"
                        )
                        print("Model logged and registered as 'Global_Stress_Forecast'.")

                        # 3. Evaluate to link metrics and dataset in UI
                        eval_dataset = mlflow.data.from_pandas(
                            eval_data.sample(min(100, len(eval_data))), 
                            name="Global_Stress_Evaluation", 
                            targets=TARGET_COL
                        )
                        model_uri = f"runs:/{run.info.run_id}/model"
                        mlflow.evaluate(
                            model=model_uri,
                            data=eval_dataset,
                            targets=None, # Already specified in Dataset
                            model_type="classifier"
                        )
                        print("mlflow.evaluate() completed successfully.")
                    else:
                        print("Warning: Evaluation data is empty, skipping mlflow.evaluate().")
                except Exception as e:
                    print(f"Warning: Evaluation or Logging failed: {e}")
        else:
            print(f"Error: Model file {MODEL_OUT} not found!")

        print("Global Forecast Training and MLflow logging finished.")

        # Check for metrics.json (generated in notebook directory or root)
        # Notebook execution CWD is set to NOTEBOOK_PATH.parent, so "metrics.json" is there.
        metrics_file = NOTEBOOK_PATH.parent / TEMP_LOG_NAME
        if not metrics_file.exists():
            # Fallback: check current directory just in case
            metrics_file = Path(TEMP_LOG_NAME)

        if metrics_file.exists():
            try:
                metrics = json.loads(metrics_file.read_text())
                
                # Separate metrics (numeric) and params/tags (strings/others)
                numeric_metrics = {k: v for k, v in metrics.items() if isinstance(v, (int, float))}
                
                # Log string values as params or tags if useful
                for k, v in metrics.items():
                    if isinstance(v, str):
                        mlflow.log_param(k, v)
                    elif isinstance(v, dict):
                        mlflow.log_param(k, str(v)) # Log dicts as string params
                
                if numeric_metrics:
                    mlflow.log_metrics(numeric_metrics)
                    run_metrics.update({k: float(v) for k, v in numeric_metrics.items()})
                    print(f"MLFLOW: Successfully logged metrics from {metrics_file.name}: {list(numeric_metrics.keys())}")
                
                _cleanup_log(metrics_file) # Cleanup using the helper
            except Exception as e:
                print(f"Failed to log metrics: {e}")

        # Log the executed notebook with EDA + detailed per-cell outputs
        try:
           mlflow.log_artifact(str(executed_nb_path), artifact_path="notebook")
           _log_notebook_details(executed_nb_path, artifact_subdir="notebook/details")
           print(f"MLFLOW: Logged executed notebook: {executed_nb_path}")
           executed_nb_path.unlink() # Cleanup after logging
        except Exception as e:
           print(f"Failed to log executed notebook: {e}")

    trained_at = utc_now_iso()
    state.global_state["last_trained_at"] = trained_at
    state.global_state["data_hash"] = data_hash
    state.save(STATE_PATH)
    _write_meta(data_hash, trained_at, run.info.run_id, run_metrics)
    print("Global training completed.")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Train global forecast model with gating.")
    parser.add_argument("--force", action="store_true", help="Run training regardless of 60-day gate.")
    args = parser.parse_args()
    train_global(force=args.force)


if __name__ == "__main__":
    main()
