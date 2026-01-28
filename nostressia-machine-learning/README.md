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
- `Stress-Forecast/models/global_forecast.joblib`
- `Stress-Forecast/models/personalized_forecast.joblib`

These artifacts are loaded by the backend services for prediction.

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
