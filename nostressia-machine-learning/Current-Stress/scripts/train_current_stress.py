
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
        
        current_context = "notebook_start"

        for idx, cell in enumerate(notebook.cells, start=1):
            # Update context if markdown cell with header/text
            if cell.cell_type == "markdown":
                source = cell.get("source", "").strip()
                if source:
                    # Take first line, remove markdown headers, limit length
                    first_line = source.split('\n')[0].lstrip('#').strip()
                    if first_line:
                        # Sanitize: alphanumeric only, spaces to underscores
                        safe_context = "".join(c if c.isalnum() else "_" for c in first_line)
                        safe_context = "_".join(filter(None, safe_context.split("_")))
                        if safe_context:
                            current_context = safe_context[:60] # Reasonable length limit

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
                "context": current_context,
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

                # Track used names for the 'notebook/images' folder to prevent overwrites
                # Since we process sequentially, a simple dict is enough
                # Key: base_name, Value: count
                
                # We need a scope for this counter. Since _log_notebook_details is the scope, 
                # we should initialize it outside the loop.
                # However, this tool only replaces a block. I will inject the initialization here
                # by checking if it exists in locals(), or improved logic:
                if 'image_name_counter' not in locals():
                    image_name_counter = {}

                for mime_type, value in data_bundle.items():
                    safe_mime = "".join(ch if ch.isalnum() or ch in {".", "_", "-"} else "_" for ch in mime_type)
                    extension = mime_extension.get(mime_type, "txt")
                    
                    # 1. Clean filename for the specific output folder (no dedupe needed here as folders are unique)
                    # User wants: "Load_and_Explore_Dataset.html"
                    # We still need to handle if multiple outputs of same type exist in same cell
                    # But usually they don't. If they do, we can append out_idx?
                    # Let's try to be as clean as possible.
                    
                    base_name = current_context
                    filename = f"{base_name}.{extension}"
                    
                    # Check if file exists in THIS output dir? No, output dir is new.
                    # But what if mime_type A and B both map to .txt? 
                    # Rare. But let's stick to the cleanest name request.
                    
                    out_file = output_dir / filename
                    
                    # If we somehow have collision inside the specific output folder (unlikely), 
                    # we might overwrite, which is acceptable for "cleanest" request or we can append.
                    # For now, stick to the request.

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
                    
                    # 2. Log image artifacts to 'notebook/images' with DEDUPLICATION
                    if mime_type in {"image/png", "image/jpeg", "image/svg+xml"}:
                         # Deduplicate base_name for the global images folder
                         count = image_name_counter.get(base_name, 0)
                         image_name_counter[base_name] = count + 1
                         
                         if count == 0:
                             image_filename = f"{base_name}.{extension}"
                         else:
                             image_filename = f"{base_name}_{count + 1}.{extension}"
                             
                         mlflow.log_artifact(str(out_file), artifact_path=f"{artifact_subdir}/images/{image_filename}")


            report_lines.append("")

        (tmp / "output_index.json").write_text(
            json.dumps(output_index_payload, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        (tmp / "notebook_report.md").write_text("\n".join(report_lines), encoding="utf-8")
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
    # Use simplified URI format "file:D:/..." as requested (replace backslashes with forward slashes)
    tracking_uri = "file:" + str(REPO_ROOT / "mlruns").replace("\\", "/")
    mlflow.set_tracking_uri(tracking_uri)
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
                
        # Log Dataset
        # Try to find the dataset to log it as input
        # Correct path based on directory structure: nostressia-machine-learning/Current-Stress/datasets/raw/student_lifestyle_dataset.csv
        dataset_path = Path("nostressia-machine-learning/Current-Stress/datasets/raw/student_lifestyle_dataset.csv")
        if dataset_path.exists():
            try:
                df = pd.read_csv(dataset_path)
                ds = mlflow.data.from_pandas(df, source=str(dataset_path), name="Student_Lifestyle")
                mlflow.log_input(ds, context="training")
                print(f"Logged dataset input: {dataset_path.name}")
            except Exception as e:
                print(f"Failed to log input dataset: {e}")
        else:
            print(f"WARNING: Dataset not found at {dataset_path}, skipping log_input.")

        # Log Model Artifacts if created
        if MODEL_OUT_ML.exists():
            # Log as a generic artifact (file)
            mlflow.log_artifact(str(MODEL_OUT_ML))
            print(f"Logged model artifact: {MODEL_OUT_ML.name}")
            
            # ALSO Log as an MLflow Model (to appear in 'Models' column with schema)
            try:
                import joblib
                from mlflow.models import infer_signature
                
                
                model_payload = joblib.load(MODEL_OUT_ML)
                
                # Check if payload is a dict (standard in this repo) or direct model
                if isinstance(model_payload, dict):
                    # Try to find the actual estimator key. Common keys: 'model', 'pipeline', 'estimator'
                    if 'model' in model_payload:
                        model = model_payload['model']
                    elif 'pipeline' in model_payload:
                        model = model_payload['pipeline']
                    elif 'estimator' in model_payload:
                        model = model_payload['estimator']
                    else:
                        # Fallback: maybe the dict itself IS the model (unlikely) or key is unknown
                        print(f"Warning: Loaded artifact is a dict with keys {list(model_payload.keys())}, but could not identify model key. Using payload as is.")
                        model = model_payload
                else:
                    model = model_payload
                
                signature = None
                input_example = None
                
                # Check if we have the dataset loaded
                if 'df' in locals():
                    # Take a small sample as input example
                    input_example = df.head(1)
                    try:
                        # Attempt to infer signature by predicting (requires model to accept raw input)
                        # If model is a pipeline, this works. If not, it might fail.
                        if hasattr(model, 'predict'):
                            prediction = model.predict(input_example)
                            signature = infer_signature(input_example, prediction)
                            print("Inferred model signature successfully.")
                        else:
                            print(f"Warning: Model object type {type(model)} does not have 'predict' method.")
                    except Exception as e:
                        print(f"Warning: Could not infer model signature (features might differ): {e}")
                    except Exception as e:
                        print(f"Warning: Could not infer model signature (features might differ): {e}")
                        # Even if prediction fails, logging input_example is helpful
                        
                # --- Log training dataset as input to populate 'Dataset' section in Run Details ---
                try:
                    if 'df' in locals() and df is not None:
                        training_dataset = mlflow.data.from_pandas(
                            df, 
                            name="Student_Lifestyle_Training",
                            targets="Stress_Level"
                        )
                        mlflow.log_input(training_dataset, context="training")
                        print("Logged training dataset to MLflow.")
                except Exception as e:
                    print(f"Warning: Could not log training dataset: {e}")
                
                # Log model and register
                mlflow.sklearn.log_model(
                    sk_model=model,
                    artifact_path="model",
                    input_example=input_example,
                    signature=signature,
                    serialization_format="cloudpickle",
                    registered_model_name="Current_Stress"
                )
                print("Logged sklearn model and registered as 'Current_Stress'.")


                # --- NEW: Evaluate to populate 'Dataset' in Model Registry ---
                # The 'Dataset' column in Registry view often requires an Evaluation run.
                try:
                    model_uri = f"runs:/{run.info.run_id}/model"
                    
                    # Create evaluation data with proper preprocessing
                    # CRITICAL: Must match the preprocessing used during training
                    if 'df' in locals():
                         eval_data = df.head(50).copy()  # Use top 50 rows for quick eval
                         
                         # Apply the same GPA encoding transformation used in training
                         # From notebook: Low: GPA < 2.5, Medium: 2.5 <= GPA < 3.5, High: GPA >= 3.5
                         # The pipeline has RobustScaler which requires numeric features
                         if 'GPA' in eval_data.columns:
                             # Create categorical bins
                             academic_perf = pd.cut(
                                 eval_data['GPA'],
                                 bins=[0, 2.5, 3.5, 4.0],
                                 labels=['Low', 'Medium', 'High'],
                                 include_lowest=True
                             )
                             # Convert to numeric labels (Low=0, Medium=1, High=2)
                             label_map = {'Low': 0, 'Medium': 1, 'High': 2}
                             eval_data['Academic_Performance_Encoded'] = academic_perf.map(label_map).astype(int)
                         
                         # Also encode Stress_Level target if it's present and string type
                         if 'Stress_Level' in eval_data.columns and eval_data['Stress_Level'].dtype == 'object':
                             stress_map = {'Low': 0, 'Moderate': 1, 'High': 2}
                             eval_data['Stress_Level'] = eval_data['Stress_Level'].map(stress_map)
                         
                         # Drop only Student_ID
                         if 'Student_ID' in eval_data.columns:
                             eval_data = eval_data.drop(columns=['Student_ID'])
                         
                         print("Running mlflow.evaluate() to populate Model Registry dataset column...")
                         
                         # Convert to MLflow Dataset with name
                         eval_dataset = mlflow.data.from_pandas(eval_data, name="Student_Lifestyle_Eval", targets="Stress_Level")
                         
                         mlflow.evaluate(
                            model=model_uri,
                            data=eval_dataset,
                            model_type="classifier",
                            evaluators="default" 
                         )
                         print("mlflow.evaluate() completed.")
                except Exception as eval_e:
                     print(f"Warning: mlflow.evaluate() failed (Registry dataset column might remain empty): {eval_e}")

            except Exception as e:
                print(f"Failed to log model using mlflow.sklearn: {e}")
            
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
