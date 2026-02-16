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
```bash
python -m venv .venv
source .venv/bin/activate
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

## Menjalankan Training
Jalankan dari folder `nostressia-machine-learning`.

### Current stress
```bash
python Current-Stress/scripts/train_current_stress.py
```

### Global forecast
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

## MLflow
Tracking lokal disimpan di `mlruns/`.

Menjalankan UI:
```bash
mlflow ui
```
Lalu buka `http://127.0.0.1:5000`.

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
