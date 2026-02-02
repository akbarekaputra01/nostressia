import pandas as pd

from app.services.ml_service import StressModelService


def test_load_model_missing_file(monkeypatch):
    monkeypatch.setattr("app.services.ml_service.os.path.exists", lambda *_: False)
    service = StressModelService()
    assert service.pipeline is None


def test_load_model_from_joblib(monkeypatch):
    class DummyPipeline:
        def predict(self, _df):
            return [2]

    monkeypatch.setattr("app.services.ml_service.os.path.exists", lambda *_: True)
    monkeypatch.setattr("app.services.ml_service.joblib.load", lambda *_: {"pipeline": DummyPipeline()})

    service = StressModelService()
    assert service.pipeline is not None


def test_predict_stress_handles_missing_pipeline(monkeypatch):
    monkeypatch.setattr("app.services.ml_service.os.path.exists", lambda *_: False)
    service = StressModelService()
    service.pipeline = None

    result = service.predict_stress(
        {
            "study_hours": 1,
            "extracurricular_hours": 1,
            "sleep_hours": 7,
            "social_hours": 2,
            "physical_hours": 1,
            "gpa": 3.0,
        }
    )
    assert result.startswith("Error")


def test_predict_stress_with_pipeline(monkeypatch):
    class DummyPipeline:
        def predict(self, df):
            assert isinstance(df, pd.DataFrame)
            return [2]

    monkeypatch.setattr("app.services.ml_service.os.path.exists", lambda *_: False)
    service = StressModelService()
    service.pipeline = DummyPipeline()
    service.feature_names = None

    result = service.predict_stress(
        {
            "study_hours": 1,
            "extracurricular_hours": 1,
            "sleep_hours": 7,
            "social_hours": 2,
            "physical_hours": 1,
            "gpa": 3.6,
        }
    )

    assert result == "High"


def test_academic_performance_encoding(monkeypatch):
    monkeypatch.setattr("app.services.ml_service.os.path.exists", lambda *_: False)
    service = StressModelService()
    assert service._calculate_academic_performance_encoded(3.6) == 3
    assert service._calculate_academic_performance_encoded(3.2) == 2
    assert service._calculate_academic_performance_encoded(2.5) == 1
    assert service._calculate_academic_performance_encoded(1.9) == 0
