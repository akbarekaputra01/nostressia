# Nostressia Machine Learning

## Overview
This folder contains notebook-driven workflows for current stress classification and stress forecasting. The backend consumes the generated `.joblib` artifacts and does not retrain models at runtime.

## Notebook Inventory
- **Current-Stress/notebooks/**: Training and evaluation for current stress classification.
- **Stress-Forecast/notebooks/**: Global and personalized forecasting pipelines.

## Dataset Expectations and Schema
### Current Stress (Raw)
`Current-Stress/datasets/raw/student_lifestyle_dataset.csv`
Expected columns:
`Student_ID`, `Study_Hours_Per_Day`, `Extracurricular_Hours_Per_Day`,
`Sleep_Hours_Per_Day`, `Social_Hours_Per_Day`, `Physical_Activity_Hours_Per_Day`,
`GPA`, `Stress_Level`.

### Current Stress (Preprocessed)
`Current-Stress/datasets/preprocessed/student_lifestyle_dataset_preprocessed.csv`
Expected columns include:
`Stress_Level_Encoded` and `Academic_Performance_Encoded`.

### Stress Forecast
`Stress-Forecast/datasets/stress_forecast.csv`
Expected columns include:
`stress_level_id`, `user_id`, `date`, `stress_level`, `gpa`,
`extracurricular_hour_per_day`, `physical_activity_hour_per_day`,
`sleep_hour_per_day`, `study_hour_per_day`, `social_hour_per_day`, `emoji`,
`is_restored`, `created_at`.

## Model Artifacts
- `Current-Stress/models/current_stress_pipeline.joblib`
- `Current-Stress/models/current_stress_model.joblib`
- `nostressia-backend/app/models_ml/global_forecast.joblib`
- `nostressia-backend/app/models_ml/personalized_forecast.joblib`
- `nostressia-backend/app/models_ml/personalized/{user_id}.joblib` (per-user personalized artifacts)

These artifacts are loaded by the backend services for prediction. Personalized models
are stored per user with a fallback to `personalized_forecast.joblib`.

## GPA Imputation
Missing GPA values should be filled using the latest known GPA per user. The helper
in `imputation.py` mirrors the production rule and is used in tests to keep the
notebooks aligned with the backend/FE behavior.

## Running Notebooks
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Launch Jupyter:
   ```bash
   jupyter lab
   ```
3. Open the notebooks from the `Current-Stress/notebooks/` or `Stress-Forecast/notebooks/` folders.

## Refreshing the Stress Forecast Dataset
To regenerate `Stress-Forecast/datasets/stress_forecast.csv` from the realtime database:
```bash
python Stress-Forecast/scripts/refresh_dataset.py
```
This logs row count, date range, SHA256 hash, and refresh timestamp.

## Headless Training (Global & Personalized)
Global training (respects the 60-day gate):
```bash
python Stress-Forecast/scripts/train_global.py
```

Personalized training (detects 60/120/180… streak milestones and writes per-user artifacts):
```bash
python Stress-Forecast/scripts/train_personalized.py --update-default
```
The scripts write `.meta.json` sidecars next to the model artifacts with `trained_at`,
`data_hash`, and `git_sha`.

## Testing Guide
### Dataset + Artifact Checks
Run from the `nostressia-machine-learning` folder:
```bash
pytest
```

### Optional Notebook Validation (nbval)
If you want to validate notebooks in CI, use nbval:
```bash
pytest --nbval Current-Stress/notebooks Stress-Forecast/notebooks
```

Notebook validation is optional and may take longer to run depending on the environment.
