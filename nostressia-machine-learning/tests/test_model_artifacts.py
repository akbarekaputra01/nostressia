from pathlib import Path

import joblib


def test_current_stress_artifacts_present_and_loadable():
    artifact_paths = [
        Path("Current-Stress/models/current_stress.joblib")
    ]
    for path in artifact_paths:
        assert path.exists(), f"Missing artifact: {path}"
        assert path.stat().st_size > 0, f"Empty artifact: {path}"
        payload = joblib.load(path)
        assert isinstance(payload, dict), f"Unexpected payload type for {path}: {type(payload)}"


def test_stress_forecast_artifacts_present_and_loadable():
    artifact_paths = [
        Path("Stress-Forecast/models/global_forecast.joblib"),
        Path("Stress-Forecast/models/personalized_forecast.joblib"),
    ]
    for path in artifact_paths:
        assert path.exists(), f"Missing artifact: {path}"
        assert path.stat().st_size > 0, f"Empty artifact: {path}"
        payload = joblib.load(path)
        assert isinstance(payload, dict), f"Unexpected payload type for {path}: {type(payload)}"
