from pathlib import Path

import pandas as pd
import pytest

from _artifact_loader import load_artifact_or_skip


CURRENT_STRESS_MODEL_PATH = Path("Current-Stress/models/current_stress.joblib")
GLOBAL_FORECAST_MODEL_PATH = Path("Stress-Forecast/models/global_forecast.joblib")


def test_current_stress_model_loads_and_predicts_shape():
    payload = load_artifact_or_skip(CURRENT_STRESS_MODEL_PATH)
    model = payload["pipeline"]
    feature_names = payload["feature_names"]

    sample = pd.DataFrame(
        [
            {
                "Study_Hours_Per_Day": 5.0,
                "Extracurricular_Hours_Per_Day": 1.0,
                "Sleep_Hours_Per_Day": 7.0,
                "Social_Hours_Per_Day": 2.0,
                "Physical_Activity_Hours_Per_Day": 1.0,
                "GPA": 3.4,
                "Academic_Performance_Encoded": 1,
            }
        ]
    )

    prediction = model.predict(sample)
    probabilities = model.predict_proba(sample)

    assert len(feature_names) == sample.shape[1]
    assert prediction.shape == (1,)
    assert probabilities.shape[0] == 1


def test_current_stress_predict_raises_for_missing_feature():
    payload = load_artifact_or_skip(CURRENT_STRESS_MODEL_PATH)
    model = payload["pipeline"]

    invalid_sample = pd.DataFrame(
        [
            {
                "Study_Hours_Per_Day": 5.0,
                "Extracurricular_Hours_Per_Day": 1.0,
                "Sleep_Hours_Per_Day": 7.0,
                "Social_Hours_Per_Day": 2.0,
                "Physical_Activity_Hours_Per_Day": 1.0,
                "GPA": 3.4,
            }
        ]
    )

    with pytest.raises(ValueError, match="feature names should match"):
        model.predict(invalid_sample)


def test_global_forecast_model_loads_and_predicts_binary_output():
    payload = load_artifact_or_skip(GLOBAL_FORECAST_MODEL_PATH)
    pipeline = payload["pipe"]
    feature_columns = payload["meta"]["feature_cols"]

    row = {
        key: ("Mon" if key == "dow" else 0.0)
        for key in feature_columns
    }

    sample = pd.DataFrame([row])
    prediction = pipeline.predict(sample)
    probabilities = pipeline.predict_proba(sample)

    assert prediction.shape == (1,)
    assert int(prediction[0]) in {0, 1}
    assert probabilities.shape == (1, 2)


def test_global_forecast_rejects_invalid_feature_type():
    payload = load_artifact_or_skip(GLOBAL_FORECAST_MODEL_PATH)
    pipeline = payload["pipe"]
    feature_columns = payload["meta"]["feature_cols"]

    row = {
        key: ("Mon" if key == "dow" else 0.0)
        for key in feature_columns
    }
    row["lag_sp_1"] = "not-a-number"

    sample = pd.DataFrame([row])

    with pytest.raises(ValueError):
        pipeline.predict(sample)
