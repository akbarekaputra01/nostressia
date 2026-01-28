from pathlib import Path


def test_current_stress_artifacts_present():
    artifact_paths = [
        Path("Current-Stress/models/current_stress_pipeline.joblib"),
        Path("Current-Stress/models/current_stress_model.joblib"),
    ]
    for path in artifact_paths:
        assert path.exists(), f"Missing artifact: {path}"
        assert path.stat().st_size > 0, f"Empty artifact: {path}"


def test_stress_forecast_artifacts_present():
    artifact_paths = [
        Path("Stress-Forecast/models/global_forecast.joblib"),
        Path("Stress-Forecast/models/personalized_forecast.joblib"),
    ]
    for path in artifact_paths:
        assert path.exists(), f"Missing artifact: {path}"
        assert path.stat().st_size > 0, f"Empty artifact: {path}"
