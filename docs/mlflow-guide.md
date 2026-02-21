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

This remains the default and simplest way to open MLflow UI.

### Access the Dashboard
Open your web browser and go to:
[http://127.0.0.1:5000](http://127.0.0.1:5000)


### If UI keeps loading forever (especially on Windows)
If terminal output says `Uvicorn running on http://127.0.0.1:5000` but browser only spins, usually one of these causes applies:

1. **Backend mismatch**: if your `mlflow ui` defaults to `sqlite:///mlflow.db` while training logs to `file:./mlruns`, start UI with explicit backend/registry URI.
2. **Host mismatch**: open exactly `http://127.0.0.1:5000` (not random hostname/URL).
3. **Worker/process issue** on Windows: force single worker (`--workers 1`).
4. **Port/process conflict**: stop old MLflow process first, then keep using the same default port `5000` (avoid confusion with multiple ports).

Fallback command (only when needed):

```bash
mlflow ui --backend-store-uri file:./mlruns --registry-store-uri file:./mlruns --workers 1 --port 5000
```

Then open `http://127.0.0.1:5000`.

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


## 3. Reset MLflow (Biar Benar-Benar Bersih Seperti Belum Pernah Training)

Kalau kamu ingin **mulai dari nol** (experiment, run, artifact, dan versi model registry tidak loncat), lakukan reset storage MLflow, bukan hanya delete dari UI.

1. **Stop MLflow UI** (kalau sedang jalan).
2. Dari root project, hapus storage MLflow lokal:

```bash
rm -rf mlruns
```

> Windows PowerShell:
```powershell
Remove-Item -Recurse -Force .\mlruns
```

3. (Opsional, kalau kamu pakai backend DB MLflow terpisah seperti sqlite) hapus juga file DB tracking-nya, contoh:

```bash
rm -f mlflow.db
```

> Windows PowerShell:
```powershell
Remove-Item -Force .\mlflow.db
```

4. Jalankan lagi training script dan `mlflow ui`.

### Kenapa versi model bisa loncat walau sudah dihapus di UI?
Delete di UI biasanya **soft-delete** (masuk trash / metadata masih ada), jadi counter versi model registry tetap lanjut.
Dengan menghapus folder `mlruns` (dan DB tracking jika ada), semua metadata di-reset total sehingga numbering mulai lagi dari awal.

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
