
import os
import base64
import sys
import subprocess
import nbformat
import mlflow
import pandas as pd
import pprint
import json
import time # Added for latency measurement injection references
import tempfile
from pathlib import Path
from typing import Dict, Any
from nbconvert.preprocessors import ExecutePreprocessor
from datetime import datetime

# Define Paths (Absolute to be safe)
SCRIPT_DIR = Path(__file__).resolve().parent
NOTEBOOK_DIR = SCRIPT_DIR.parent / "notebooks"
NOTEBOOK_PATH = NOTEBOOK_DIR / "current_stress.ipynb"
REPO_ROOT = SCRIPT_DIR.parent.parent.parent
DATASET_PATH = REPO_ROOT / "nostressia-machine-learning" / "Current-Stress" / "datasets" / "raw" / "student_lifestyle_dataset.csv"
MODEL_OUT_ML = REPO_ROOT / "nostressia-machine-learning" / "Current-Stress" / "models" / "current_stress.joblib"
MODEL_OUT_BE = REPO_ROOT / "nostressia-backend" / "app" / "models_ml" / "current_stress.joblib"

def _execute_notebook(notebook_path: Path, parameters: Dict[str, Any], timeout_seconds: int, kernel_name: str = "python3") -> Path:
    print(f"Executing notebook: {notebook_path} with kernel: {kernel_name}")
    notebook = nbformat.read(str(notebook_path), as_version=4)
    
    # Inject parameters
    param_cell = nbformat.v4.new_code_cell(
        f"PARAMETERS = {pprint.pformat(parameters, sort_dicts=False)}"
    )
    notebook.cells.insert(0, param_cell)
    
    # Inject Latency & Metrics Measurement Cell
    latency_code = """
import time
import numpy as np
import json
from pathlib import Path
# seaborn import check omitted here, relying on notebook's own imports
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

try:
    print("DEBUG: Starting Current Stress latency & metrics injection...")
    
    target_model = None
    target_data = None
    target_labels = None
    
    # Look for pipeline_model and X_test from the notebook context
    if 'pipeline_model' in locals():
        target_model = pipeline_model
        print("DEBUG: Found pipeline_model")
        
    if 'X_test' in locals():
        target_data = X_test
        print("DEBUG: Found X_test")
        
    if 'y_test' in locals():
        target_labels = y_test
        print("DEBUG: Found y_test")
        
    metrics = {}

    if target_model is not None and target_data is not None:
        print(f"DEBUG: Measuring latency on {len(target_data)} samples...")
        latencies = []
        
        # Warmup
        try:
            target_model.predict(target_data.iloc[[0]])
        except Exception as e:
            print(f"DEBUG: Warmup failed: {e}")
            pass

        # Measure
        n_measure = min(200, len(target_data))
        for i in range(n_measure):
            sample = target_data.iloc[[i]]
            start = time.perf_counter()
            target_model.predict(sample)
            end = time.perf_counter()
            latencies.append((end - start) * 1000) # ms
            
        p50 = np.percentile(latencies, 50)
        p90 = np.percentile(latencies, 90)
        p95 = np.percentile(latencies, 95)
        p99 = np.percentile(latencies, 99)
        
        print(f"DEBUG: Calculated latency metrics: p50={p50:.4f}, p99={p99:.4f}")
        
        metrics["latency_p50"] = p50
        metrics["latency_p90"] = p90
        metrics["latency_p95"] = p95
        metrics["latency_p99"] = p99
        
    # Calculate Classification Metrics if labels are available
    if target_model is not None and target_data is not None and target_labels is not None:
        print("DEBUG: Calculating classification metrics...")
        try:
            y_pred = target_model.predict(target_data)
            
            # Using weighted average for multi-class metrics (defaulting to weighted as it's common)
            acc = accuracy_score(target_labels, y_pred)
            f1 = f1_score(target_labels, y_pred, average='weighted')
            prec = precision_score(target_labels, y_pred, average='weighted')
            rec = recall_score(target_labels, y_pred, average='weighted')
            
            metrics["accuracy"] = acc
            metrics["f1_score"] = f1
            metrics["precision"] = prec
            metrics["recall"] = rec
            
            print(f"DEBUG: Classification metrics: acc={acc:.4f}, f1={f1:.4f}")
        except Exception as e:
            print(f"DEBUG: Failed to calculate classification metrics: {e}")
    
    # Save metrics to json
    # Check if metrics_output_path is injected via parameters
    out_path = Path("metrics.json")
    if 'metrics_output_path' in locals() and metrics_output_path:
         out_path = Path(metrics_output_path)
         
    if metrics:
        out_path.write_text(json.dumps(metrics))
        print(f"All metrics saved to {out_path}")
    else:
        print("DEBUG: No metrics to save.")

except Exception as e:
    print(f"Metric injection failed: {e}")
    import traceback
    traceback.print_exc()
"""
    latency_cell = nbformat.v4.new_code_cell(latency_code)
    notebook.cells.append(latency_cell)
    
    # Execute
    # Use the specified kernel (which should match the current env)
    executor = ExecutePreprocessor(timeout=timeout_seconds, kernel_name=kernel_name, allow_errors=True)
    try:
        executor.preprocess(notebook, {"metadata": {"path": str(notebook_path.parent)}})
    except Exception as e:
        print(f"Notebook execution failed (partially?): {e}")
        
    # Save executed notebook
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    executed_path = notebook_path.parent / f"executed_{notebook_path.stem}_{timestamp}.ipynb"
    with executed_path.open("w", encoding="utf-8") as f:
        nbformat.write(notebook, f)
        
    print(f"Executed notebook saved to: {executed_path}")
    return executed_path

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
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        report_lines = [f"# Notebook output report: {executed_nb_path.name}", ""]

        for idx, cell in enumerate(notebook.cells, start=1):
            report_lines.append(f"## Cell {idx} ({cell.cell_type})")
            report_lines.append("```python" if cell.cell_type == "code" else "```markdown")
            report_lines.append(cell.get("source", ""))
            report_lines.append("```")

            for out_idx, output in enumerate(cell.get("outputs", []), start=1):
                output_type = output.get("output_type", "unknown")
                report_lines.append(f"### Output {out_idx}: {output_type}")

                if output_type == "stream":
                    report_lines.append("```")
                    report_lines.append(output.get("text", ""))
                    report_lines.append("```")
                elif output_type in {"display_data", "execute_result"}:
                    data = output.get("data", {})
                    text_plain = data.get("text/plain")
                    if text_plain:
                        report_lines.append("```")
                        report_lines.append("\n".join(text_plain) if isinstance(text_plain, list) else str(text_plain))
                        report_lines.append("```")
                    image_b64 = data.get("image/png")
                    if image_b64:
                        image_path = tmp / f"cell_{idx:03d}_out_{out_idx:02d}.png"
                        image_path.write_bytes(base64.b64decode(image_b64))
                    html_output = data.get("text/html")
                    if html_output:
                        html_path = tmp / f"cell_{idx:03d}_out_{out_idx:02d}.html"
                        html_body = "\n".join(html_output) if isinstance(html_output, list) else str(html_output)
                        html_path.write_text(html_body, encoding="utf-8")
                elif output_type == "error":
                    report_lines.append("```")
                    report_lines.extend(output.get("traceback", []))
                    report_lines.append("```")

            report_lines.append("")

        report_path = tmp / "notebook_report.md"
        report_path.write_text("\n".join(report_lines), encoding="utf-8")
        mlflow.log_artifacts(str(tmp), artifact_path=artifact_subdir)


def train_current_stress():
    print("Starting Current Stress Training via Notebook Execution...")
    
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")
        
    # Ensure directories
    MODEL_OUT_ML.parent.mkdir(parents=True, exist_ok=True)
    MODEL_OUT_BE.parent.mkdir(parents=True, exist_ok=True)
    
    # --- KERNEL SETUP ---
    # Register the current python environment as a kernel to ensure nbconvert uses the right dependencies (seaborn, etc.)
    kernel_name = "nostressia_current_env"
    print(f"Registering local jupyter kernel '{kernel_name}' pointing to {sys.executable}...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "ipykernel", "install", 
            "--user", 
            "--name", kernel_name, 
            "--display-name", "Nostressia Training Env"
        ])
    except Exception as e:
        print(f"Warning: Failed to install local kernel: {e}. Defaulting to 'python3'.")
        kernel_name = "python3"

    # Execute Notebook
    executed_nb_path = _execute_notebook(
        NOTEBOOK_PATH,
        {
            "dataset_path": str(DATASET_PATH),
            "model_out_ml": str(MODEL_OUT_ML),
            "model_out_be": str(MODEL_OUT_BE),
            "metrics_output_path": "metrics.json",
            "enable_eda": True, # FORCE EDA
        },
        timeout_seconds=1800,
        kernel_name=kernel_name
    )
    
    # MLflow Logging
    mlflow.set_tracking_uri("file:" + str(REPO_ROOT / "mlruns"))
    mlflow.set_experiment("Current Stress Model")
    
    with mlflow.start_run() as run:
        print(f"MLflow run started: {run.info.run_id}")
        _log_dataset_details(DATASET_PATH, artifact_subdir="dataset")

        # Log executed notebook (EDA + Training Logs + detail outputs)
        mlflow.log_artifact(str(executed_nb_path), artifact_path="notebook")
        _log_notebook_details(executed_nb_path, artifact_subdir="notebook/details")
        print(f"Logged executed notebook: {executed_nb_path.name}")
        
        # Check for metrics generated by notebook injection
        metrics_file = NOTEBOOK_PATH.parent / "metrics.json"
        if not metrics_file.exists():
             metrics_file = Path("metrics.json")
             
        if metrics_file.exists():
            try:
                metrics = json.loads(metrics_file.read_text())
                
                # Separate metrics
                numeric_metrics = {}
                for k, v in metrics.items():
                    if isinstance(v, (int, float)):
                        numeric_metrics[k] = float(v)
                    else:
                        print(f"Skipping non-numeric metric {k}: {v}")
                
                if numeric_metrics:
                    # Robust logging using client
                    client = mlflow.tracking.MlflowClient()
                    for k, v in numeric_metrics.items():
                        client.log_metric(run.info.run_id, k, v)
                    
                    print(f"Logged numeric metrics: {list(numeric_metrics.keys())}")
                
                metrics_file.unlink()
            except Exception as e:
                print(f"Failed to load/log metrics: {e}")
        else:
            print("WARNING: metrics.json not found! Metrics were NOT logged.")
                
        # Log Model Artifacts if created
        if MODEL_OUT_ML.exists():
            mlflow.log_artifact(str(MODEL_OUT_ML))
            print(f"Logged model artifact: {MODEL_OUT_ML.name}")
            
        # Clean up executed notebook
        max_retries = 3
        for i in range(max_retries):
            try:
                if executed_nb_path.exists():
                    executed_nb_path.unlink()
                print("Detailed execution log cleaned up from local (saved in MLflow).")
                break
            except PermissionError:
                if i < max_retries - 1:
                    print(f"PermissionError deleting file, retrying in 1s... ({i+1}/{max_retries})")
                    time.sleep(1)
                else:
                    print(f"Failed to delete {executed_nb_path} after retries. You may delete it manually.")

if __name__ == "__main__":
    train_current_stress()
