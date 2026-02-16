from __future__ import annotations

import argparse
import base64
import hashlib
import json
import pprint
import os
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict

import mlflow
import pandas as pd

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
    
    executor = ExecutePreprocessor(timeout=timeout_seconds, kernel_name="python3", allow_errors=True)
    try:
        executor.preprocess(notebook, {"metadata": {"path": str(notebook_path.parent)}})
    except Exception as e:
        print(f"Notebook execution failed: {e}")
    finally:
        # Save the executed notebook for debugging and MLflow logging
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
    executed_nb_path = _execute_notebook(
        NOTEBOOK_PATH,
        {
            "data_source": "csv",
            "dataset_path": str(DATASET_PATH),
            "output_path": str(MODEL_OUT),
            "metrics_output_path": "metrics.json",
            "enable_eda": True, # FORCE EDA
        },
        timeout_seconds=1800,
    )
    if not MODEL_OUT.exists():
        raise FileNotFoundError(f"Global model output not created: {MODEL_OUT}")

    # MLflow logging
    mlflow.set_tracking_uri("file:" + str(REPO_ROOT / "mlruns"))
    mlflow.set_experiment("Global Stress Forecast")

    with mlflow.start_run():
        mlflow.log_param("interval_days", GLOBAL_INTERVAL_DAYS)
        mlflow.log_param("data_hash", data_hash)
        mlflow.log_param("force", force)
        _log_dataset_details(DATASET_PATH, artifact_subdir="dataset")

        # Log model artifact
        mlflow.log_artifact(str(MODEL_OUT))

        # Check for metrics.json (generated in notebook directory or root)
        # Notebook execution CWD is set to NOTEBOOK_PATH.parent, so "metrics.json" is there.
        metrics_file = NOTEBOOK_PATH.parent / "metrics.json"
        if not metrics_file.exists():
            # Fallback: check current directory just in case
            metrics_file = Path("metrics.json")

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
                    print(f"MLFLOW: Successfully logged metrics from {metrics_file.name}: {list(numeric_metrics.keys())}")
                
                metrics_file.unlink() # Cleanup
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
