# Nostressia Machine Learning

## Ringkasan
Folder ini berisi pipeline machine learning untuk fitur **Stress Insights**:
- **Current stress classification** (`Current-Stress/`)
- **Stress forecasting** global dan personalized (`Stress-Forecast/`)

Training dijalankan melalui script Python yang mengeksekusi notebook menggunakan `nbconvert` + `ExecutePreprocessor`.

### Business Logic Interval Training
- **Global forecast**: Retrain setiap 60 hari
- **Personalized forecast**: Retrain ketika user mencapai milestone 60 hari atau kelipatannya (60, 120, 180, ...)

### User Access Rules
- **Streak >= 7 hari**: User dapat menggunakan **Global Forecast**
- **Streak >= 60 hari**: User dapat menggunakan **Personalized Forecast**

## Setup Environment
**Prerequisite**: Python 3.10 is required.

```bash
# Create venv (Ensure Python 3.10)
# Windows (if multiple versions installed):
py -3.10 -m venv .venv
# Linux / Mac / Default Windows:
python3.10 -m venv .venv
# OR if python 3.10 is your default:
python -m venv .venv

# Activate venv
# Windows (Git Bash):
source .venv/Scripts/activate
# Windows (Command Prompt):
.venv\Scripts\activate.bat
# Linux / Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Struktur Penting
- `Current-Stress/scripts/train_current_stress.py`
- `Stress-Forecast/scripts/train_global.py`
- `Stress-Forecast/scripts/train_personalized.py`
- `Stress-Forecast/scripts/ml_state.py` (state gating)

## Dataset dan Skema
### Current stress
- Raw: `Current-Stress/datasets/raw/student_lifestyle_dataset.csv`
- Preprocessed: `Current-Stress/datasets/preprocessed/student_lifestyle_dataset_preprocessed.csv`

Kolom inti untuk inference current stress:
`Study_Hours_Per_Day`, `Extracurricular_Hours_Per_Day`, `Sleep_Hours_Per_Day`,
`Social_Hours_Per_Day`, `Physical_Activity_Hours_Per_Day`, `GPA`, `Academic_Performance_Encoded`.

### Forecast
- `Stress-Forecast/datasets/stress_forecast.csv`

Kolom inti:
`stress_level_id`, `user_id`, `date`, `stress_level`, `gpa`,
`extracurricular_hour_per_day`, `physical_activity_hour_per_day`,
`sleep_hour_per_day`, `study_hour_per_day`, `social_hour_per_day`, `emoji`,
`is_restored`, `created_at`.

## Automated Training (Production)

Produksi menggunakan **GitHub Actions** untuk training otomatis (Background/Offline Training).

| Model | Workflow | Trigger |
|-------|----------|---------|
| **Global Forecast** | `global-training-worker.yml` | Setiap hari 00:00 UTC. Script mengecek interval 60 hari. |
| **Personalized Forecast** | `personalized-training-worker.yml` | Setiap hari 00:00 UTC. Script mengecek milestone user (60, 120, ... hari). |
| **Current Stress** | - | **Manual**. Tidak ada otomatisasi saat ini. |

## Manual Training (Development & Testing)
Gunakan command ini untuk reproduksi lokal, debugging, atau memaksa update (force).
Jalankan dari folder `nostressia-machine-learning`.

### Current stress (Manual Only)
```bash
python Current-Stress/scripts/train_current_stress.py
```

### Global forecast (Dev/Force)
```bash
python Stress-Forecast/scripts/train_global.py
```
Tambahkan `--force` untuk bypass interval retrain 60 hari.

### Personalized forecast
```bash
python Stress-Forecast/scripts/train_personalized.py
```
Script ini hanya akan melatih user yang telah mencapai milestone 60 hari (60, 120, 180, ...).

Force user tertentu untuk testing:
```bash
python Stress-Forecast/scripts/train_personalized.py --force-user-id 123
```


### Generate 8 EDA plots (Current Stress + Forecast)
```bash
python scripts/generate_eda_plots.py
```
Output default akan tersimpan di folder `eda_plots/`.

## MLflow
Tracking lokal disimpan di `mlruns/` dan menggunakan **MLflow 3.9.0**.

Menjalankan UI:
```bash
mlflow ui
```
Lalu buka `http://127.0.0.1:5000`.

Verifikasi versi MLflow lokal:
```bash
python -c "import mlflow; print(mlflow.__version__)"
```
Output harus `3.9.0`.

## Output Artefak untuk Backend
Artefak utama ditulis ke:
- `nostressia-backend/app/models_ml/current_stress.joblib`
- `nostressia-backend/app/models_ml/global_forecast.joblib`
- `nostressia-backend/app/models_ml/personalized_forecast.joblib`
- sidecar metadata forecast:
  - `nostressia-backend/app/models_ml/global_forecast.meta.json`
  - `nostressia-backend/app/models_ml/personalized_forecast.meta.json`

Field minimum metadata forecast:
- `created_at`, `version`, `features`, `horizon_days`, `data_hash`
- `mlflow_run_id` (dan `mlflow_run_ids` untuk personalized multi-user run)
- ringkasan `metrics` untuk global forecast

State gating disimpan di root repo:
- `.ml_state.json`

## Menjalankan Test
```bash
pytest -q
```

Cakupan utama test:
- load artifact `.joblib`
- validasi schema dataset
- contract inference / error input invalid
- helper imputation GPA
- gating/state (`.ml_state.json`, due/skip logic, kandidat personalized)

## Troubleshooting
- **`No module named ipykernel` / notebook gagal dieksekusi**
  - Pastikan dependensi terpasang dari `requirements.txt`.
- **Notebook training error saat dieksekusi script**
  - Script akan melempar error yang menyertakan path `executed_*.ipynb`; buka file tersebut untuk melihat sel yang gagal.
- **`Dataset not found` saat training**
  - Jalankan command dari folder `nostressia-machine-learning`.
- **MLflow UI kosong**
  - Pastikan training sudah dijalankan dan folder `mlruns/` terbentuk.
