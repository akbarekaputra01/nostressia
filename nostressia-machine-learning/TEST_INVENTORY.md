# Nostressia Machine Learning Test Inventory

Checklist of notebook workflows, preprocessing expectations, and tests.

## Notebook Inventory
- [x] `Current-Stress/notebooks/current_stress.ipynb` — validated via schema tests in `tests/test_data_schema.py`
- [x] `Current-Stress/notebooks/current_stress_pipeline.ipynb` — validated via artifact checks in `tests/test_model_artifacts.py`
- [x] `Current-Stress/notebooks/predict.ipynb` — validated via artifact checks in `tests/test_model_artifacts.py`
- [x] `Current-Stress/notebooks/predict_pipeline.ipynb` — validated via artifact checks in `tests/test_model_artifacts.py`
- [x] `Stress-Forecast/notebooks/global_forecast.ipynb` — validated via schema tests in `tests/test_data_schema.py`
- [x] `Stress-Forecast/notebooks/personalized_forecast.ipynb` — validated via schema tests in `tests/test_data_schema.py`

## Preprocessing / Imputation Logic
- [x] GPA imputation uses latest known GPA per user (`imputation.py`) — `tests/test_imputation.py`

## Dataset Schema Expectations
- [x] Current stress raw schema — `tests/test_data_schema.py`
- [x] Current stress preprocessed schema — `tests/test_data_schema.py`
- [x] Stress forecast schema — `tests/test_data_schema.py`

## Model Artifacts
- [x] Current stress pipeline/model artifacts — `tests/test_model_artifacts.py`
- [x] Stress forecast artifacts — `tests/test_model_artifacts.py`
