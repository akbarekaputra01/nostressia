# MLflow Training & Visualization Guide

This guide explains how to run the training scripts for Nostressia models and view the results in the MLflow UI.

## Fresh Clone Quickstart (MLflow 3.9.0)

If you just cloned the repository, use these steps first.

### Linux / macOS
```bash
git clone <repo-url>
cd nostressia
python3.10 -m venv .venv
source .venv/bin/activate
pip install -r nostressia-machine-learning/requirements.txt
python -c "import mlflow; print(mlflow.__version__)"
```
Expected output: `3.9.0`

### Windows (PowerShell)
```powershell
git clone <repo-url>
cd nostressia
py -3.10 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r nostressia-machine-learning/requirements.txt
python -c "import mlflow; print(mlflow.__version__)"
```
Expected output: `3.9.0`

## Prerequisites

Ensure you are in the project root directory and your Python virtual environment is activated.

```powershell
d:
cd \projects\nostressia
.venv\Scripts\Activate.ps1  # If this fails or `python` still points to global, see troubleshooting below.
# Recommended: Install dependencies first to ensure everything is ready
.venv\Scripts\pip install -r nostressia-machine-learning/requirements.txt
```

## 1. Running Training Scripts

### Global Stress Forecast
Trains the global forecasting model. Use `--force` to bypass the 60-day retraining interval check.

```bash
python nostressia-machine-learning/Stress-Forecast/scripts/train_global.py --force
```

### Personalized Stress Forecast
Trains personalized models for eligible users (based on streak milestones).

```bash
python nostressia-machine-learning/Stress-Forecast/scripts/train_personalized.py
```
*Options:*
- `--force-user-id <ID>`: Force training for a specific user.
- `--force-window-size <SIZE>`: Override the window size (days) for the forced training.

### Current Stress Classification
Trains the current stress classification model using the student lifestyle dataset.

```bash
python nostressia-machine-learning/Current-Stress/scripts/train_current_stress.py
```
*Note:* This script attempts to register a local Jupyter kernel `nostressia_current_env`. If it fails, it defaults to `python3`. Ensure your environment has `ipykernel` installed.

## 2. Viewing Results in MLflow UI

All training scripts log their metrics, parameters, and artifacts (including executed notebooks) to the local `mlruns` directory using MLflow 3.9.0.

### Start the UI Server
Run the following command from the project root:

```bash
mlflow ui
```

### Access the Dashboard
Open your web browser and go to:
[http://127.0.0.1:5000](http://127.0.0.1:5000)

### What You Will See
- **Experiments**: grouped by model type (e.g., "Global Stress Forecast", "Personalized Stress Forecast", "Current Stress Model").
- **Runs**: List of individual training runs with timestamps.
- **Metrics**: Click on a run to see performance metrics (e.g., RMSE, accuracy, latency).
- **Artifacts**: View the actual model files (`.joblib`) and the **executed notebook** (`.ipynb` converted to HTML/Markdown) which contains charts and EDA from the run.

### Quick Verification Checklist
After running one training script, verify these points in MLflow UI:
1. Experiment name appears (`Global Stress Forecast`, `Personalized Stress Forecast`, or `Current Stress Model`).
2. A new run row appears with a recent timestamp.
3. `Parameters` and `Metrics` are populated.
4. Under `Artifacts`, you can open model artifacts and notebook outputs.

If no run appears, re-run training from project root and ensure `mlruns/` is created there.

### Troubleshooting
If you see `ModuleNotFoundError` or other missing package errors, you are likely using the wrong Python environment.

**For PowerShell / CMD:**
```powershell
.venv\Scripts\python.exe nostressia-machine-learning/Current-Stress/scripts/train_current_stress.py
```

**For Git Bash / WSL:**
```bash
# Use forward slashes
./.venv/Scripts/python.exe nostressia-machine-learning/Current-Stress/scripts/train_current_stress.py
```
*Tip:* You can also run `source .venv/Scripts/activate` (Bash) or `.venv\Scripts\Activate.ps1` (PowerShell) before running `python ...`.
