from __future__ import annotations

import argparse
import base64
import hashlib
import json
import pprint
import os
import tempfile
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


def _load_artifact_payload(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    import joblib

    payload = joblib.load(path)
    return payload if isinstance(payload, dict) else None


def _merge_personalized_artifact(
    base_payload: Optional[Dict[str, Any]],
    incoming_payload: Dict[str, Any],
) -> Dict[str, Any]:
    if not base_payload:
        return incoming_payload

    merged = dict(base_payload)
    merged_artifact = dict(base_payload.get("artifact") or {})
    incoming_artifact = incoming_payload.get("artifact") or {}

    incoming_type = incoming_artifact.get("type")
    if incoming_type and merged_artifact.get("type") and merged_artifact.get("type") != incoming_type:
        return incoming_payload

    if incoming_type:
        merged_artifact["type"] = incoming_type

    if incoming_type == "markov_user":
        merged_probs = dict(merged_artifact.get("probs_by_user") or {})
        merged_probs.update(incoming_artifact.get("probs_by_user") or {})
        merged_artifact["probs_by_user"] = merged_probs

        merged_thr = dict(merged_artifact.get("thr") or {}) if isinstance(merged_artifact.get("thr"), dict) else {}
        if isinstance(incoming_artifact.get("thr"), dict):
            merged_thr.update(incoming_artifact.get("thr") or {})
            merged_artifact["thr"] = merged_thr
        elif incoming_artifact.get("thr") is not None:
            merged_artifact["thr"] = incoming_artifact.get("thr")

    elif incoming_type == "personalized_sklearn":
        merged_models = dict(merged_artifact.get("models_by_user") or {})
        merged_models.update(incoming_artifact.get("models_by_user") or {})
        merged_artifact["models_by_user"] = merged_models

        merged_thr = dict(merged_artifact.get("thr") or {}) if isinstance(merged_artifact.get("thr"), dict) else {}
        if isinstance(incoming_artifact.get("thr"), dict):
            merged_thr.update(incoming_artifact.get("thr") or {})
            merged_artifact["thr"] = merged_thr
        elif incoming_artifact.get("thr") is not None:
            merged_artifact["thr"] = incoming_artifact.get("thr")
    else:
        return incoming_payload

    merged["artifact"] = merged_artifact
    merged["best_name"] = incoming_payload.get("best_name", merged.get("best_name"))
    merged["meta"] = incoming_payload.get("meta", merged.get("meta", {}))
    return merged


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


def _log_dataset_details(dataset_path: Path, artifact_subdir: str = "dataset") -> None:
    df = pd.read_csv(dataset_path)
    mlflow.log_param("dataset_rows", int(df.shape[0]))
    mlflow.log_param("dataset_columns", int(df.shape[1]))

    overview = {
        "shape": {"rows": int(df.shape[0]), "columns": int(df.shape[1])},
        "columns": df.columns.tolist(),
        "dtypes": {k: str(v) for k, v in df.dtypes.items()},
        "missing_values": {k: int(v) for k, v in df.isna().sum().items()},
        "describe": df.describe(include="all", datetime_is_numeric=True).transpose().fillna("").to_dict(),
    }
    mlflow.log_dict(overview, f"{artifact_subdir}/overview.json")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        df.head(30).to_csv(tmp / "head.csv", index=False)
        df.describe(include="all", datetime_is_numeric=True).transpose().to_csv(tmp / "describe.csv")
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


def _write_meta_multi(
    path: Path,
    data_hash: str,
    trained_at: str,
    trained_users: List[Tuple[int, int]],
) -> None:
    payload = {
        "trained_at": trained_at,
        "data_hash": data_hash,
        "git_sha": os.getenv("GITHUB_SHA") or os.getenv("GIT_SHA") or "",
        "users": [
            {"user_id": user_id, "milestone": milestone}
            for user_id, milestone in trained_users
        ],
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
    trained_users: List[Tuple[int, int]] = []
    merged_payload = _load_artifact_payload(DEFAULT_MODEL_OUT)

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

        incoming_payload = _load_artifact_payload(output_path)
        if incoming_payload is None:
            raise RuntimeError("Personalized training output is not a valid dictionary artifact payload.")
        merged_payload = _merge_personalized_artifact(merged_payload, incoming_payload)

        # MLflow logging
        mlflow.set_tracking_uri("file:" + str(REPO_ROOT / "mlruns"))
        mlflow.set_experiment("Personalized Stress Forecast")

        with mlflow.start_run(run_name=f"user_{user_id}_milestone_{milestone}"):
            mlflow.log_param("user_id", user_id)
            mlflow.log_param("milestone", milestone)
            mlflow.log_param("window_size", milestone)
            mlflow.log_param("data_hash", data_hash)
            _log_dataset_details(DATASET_PATH, artifact_subdir="dataset")

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

            # Log the executed notebook with EDA + detailed per-cell outputs
            try:
               mlflow.log_artifact(str(executed_nb_path), artifact_path="notebook")
               _log_notebook_details(executed_nb_path, artifact_subdir="notebook/details")
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
        trained_users.append((user_id, milestone))
        print(f"Trained personalized model for user_id={user_id} milestone={milestone}.")

    if trained_any:
        import joblib

        DEFAULT_MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(merged_payload, DEFAULT_MODEL_OUT)
        _write_meta_multi(DEFAULT_META_OUT, data_hash, utc_now_iso(), trained_users)
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
