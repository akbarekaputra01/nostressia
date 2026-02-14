from datetime import date, timedelta

import numpy as np
import pandas as pd
import pytest

from app.models.stress_log_model import StressLevel
from app.models.user_model import User
from app.services.forecast_service import _normalize_forecast_payload, build_global_forecast_payload
from app.services.global_forecast_service import GlobalForecastService
from app.services.personalized_forecast_service import PersonalizedForecastService
from app.schemas.stress_schema import EligibilityResponse
from app.utils.hashing import hash_password


def _create_user(db_session):
    user = User(
        name="Forecast User",
        username="forecast",
        email="forecast@example.com",
        password=hash_password("Password123!"),
        gender="unspecified",
        user_dob=date(2000, 1, 1),
        is_verified=True,
        streak=0,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _create_logs(db_session, user_id, days=4):
    base_date = date(2024, 1, 1)
    for offset in range(days):
        log = StressLevel(
            user_id=user_id,
            date=base_date + timedelta(days=offset),
            stress_level=1 if offset % 2 == 0 else 0,
            gpa=3.0,
            extracurricular_hour_per_day=1.0,
            physical_activity_hour_per_day=1.0,
            sleep_hour_per_day=7.0,
            study_hour_per_day=3.0,
            social_hour_per_day=2.0,
            emoji=1,
            is_restored=False,
        )
        db_session.add(log)
    db_session.commit()


def test_forecast_payload_helpers():
    raw = {
        "forecast_date": "2024-01-01",
        "chance_percent": 12.5,
        "prediction_label": "LowRisk",
        "prediction_binary": 0,
        "model_type": "global_markov",
    }
    normalized = _normalize_forecast_payload(raw)
    assert normalized["forecastDate"] == "2024-01-01"

    eligibility = EligibilityResponse(
        user_id=1,
        eligible=True,
        streak=60,
        required_streak=7,
        restore_used=0,
        restore_remaining=3,
        restore_limit=3,
        missing=0,
        note="Eligible",
    )
    payload = build_global_forecast_payload(eligibility, raw)
    assert payload["eligibility"]["eligible"] is True


def test_global_forecast_service_prediction(db_session):
    user = _create_user(db_session)
    _create_logs(db_session, user.user_id)

    service = GlobalForecastService()
    artifact = {
        "type": "global_markov",
        "probs": np.ones((2, 7, 2)) * 0.6,
        "thr": 0.5,
        "meta": {"window": 2},
    }

    result = service.predict_next_day_for_user_with_artifact(db_session, user.user_id, artifact)
    assert result["user_id"] == user.user_id
    assert result["model_type"] == "global_markov"


def test_global_forecast_helpers():
    service = GlobalForecastService()
    assert service._resolve_model_type({"pipe": object(), "probs": object()}) == "global_blend_model"
    assert service._resolve_model_type({"pipe": object()}) == "global_ml_model"
    assert service._resolve_model_type({"probs": object()}) == "global_markov"

    feature_cols = service._resolve_feature_cols(["sleep"], 2, {})
    assert "lag1_sleep" in feature_cols

    df = pd.DataFrame({"fallback": [1]})
    resolved = service._ensure_column_alias(df, "expected", ["fallback"])
    assert "expected" in resolved.columns

    assert service.get_required_history_days_from_artifact({"meta": {"window": 3}}) == 3
    assert service.get_required_history_days_from_artifact({"meta": {"window": "bad"}}) is None


def test_personalized_forecast_service_prediction(db_session):
    user = _create_user(db_session)
    _create_logs(db_session, user.user_id)

    service = PersonalizedForecastService()
    artifact = {
        "type": "markov_user",
        "probs_by_user": {user.user_id: np.ones((2, 7, 2)) * 0.7},
        "thr": {user.user_id: 0.5},
    }
    bundle = {"artifact": artifact, "meta": {"window": 2}}

    result = service.predict_next_day_for_user_with_artifact(db_session, user.user_id, bundle)
    assert result["model_type"] == "markov_user"


def test_forecast_artifact_helpers(monkeypatch):
    global_service = GlobalForecastService()
    personalized_service = PersonalizedForecastService()

    path = global_service._artifact_path()
    assert path.endswith("global_forecast.joblib")

    personalized_path = personalized_service._artifact_path()
    assert personalized_path.endswith("personalized_forecast.joblib")

    monkeypatch.setattr("app.services.global_forecast_service.os.path.exists", lambda *_: True)
    monkeypatch.setattr(
        personalized_service,
        "_load_artifact_for_user",
        lambda *_: {"artifact": {"type": "markov_user", "probs_by_user": {1: object()}}},
    )
    assert global_service.artifact_exists() is True
    assert personalized_service.artifact_exists_for_user(1) is True


def test_personalized_artifact_exists_for_user_false_when_user_missing(monkeypatch):
    service = PersonalizedForecastService()
    monkeypatch.setattr("app.services.personalized_forecast_service.os.path.exists", lambda *_: True)
    monkeypatch.setattr(
        service,
        "_load_artifact_for_user",
        lambda *_: {"artifact": {"type": "markov_user", "probs_by_user": {5: object()}}},
    )
    assert service.artifact_exists_for_user(1) is False


def test_personalized_load_artifact_for_user_reloads_when_file_changes(monkeypatch):
    service = PersonalizedForecastService()
    mtimes = iter([100.0, 101.0])
    loads = iter([
        {"artifact": {"type": "markov_user", "probs_by_user": {5: object()}}},
        {"artifact": {"type": "markov_user", "probs_by_user": {1: object()}}},
    ])

    monkeypatch.setattr(service, "_artifact_path", lambda: "/tmp/personalized_forecast.joblib")
    monkeypatch.setattr(
        "app.services.personalized_forecast_service.os.path.getmtime",
        lambda *_: next(mtimes),
    )
    monkeypatch.setattr(
        "app.services.global_forecast_service.joblib.load",
        lambda *_: next(loads),
    )
    monkeypatch.setattr(
        "app.services.global_forecast_service.os.path.exists",
        lambda *_: True,
    )

    assert service.artifact_exists_for_user(1) is False
    assert service.artifact_exists_for_user(1) is True


def test_get_global_forecast_for_user_prefers_personalized_when_streak_60(monkeypatch):
    eligibility = EligibilityResponse(
        user_id=1,
        eligible=True,
        streak=60,
        required_streak=7,
        restore_used=0,
        restore_remaining=3,
        restore_limit=3,
        missing=0,
        note="Eligible",
    )

    monkeypatch.setattr(
        "app.services.forecast_service.personalized_forecast_service.artifact_exists_for_user",
        lambda *_: True,
    )
    monkeypatch.setattr(
        "app.services.forecast_service.personalized_forecast_service.predict_next_day_for_user",
        lambda *_: {
            "user_id": 1,
            "forecast_date": "2024-01-01",
            "probability": 0.2,
            "chance_percent": 20.0,
            "threshold": 0.5,
            "prediction_binary": 0,
            "prediction_label": "LowRisk",
            "model_type": "markov_user",
        },
    )

    from app.services.forecast_service import get_global_forecast_for_user

    payload = get_global_forecast_for_user(user_id=1, eligibility=eligibility, db=None)
    assert payload["forecast"]["modelType"] == "markov_user"


def test_get_global_forecast_for_user_uses_global_for_sub60_streak(monkeypatch):
    eligibility = EligibilityResponse(
        user_id=1,
        eligible=True,
        streak=59,
        required_streak=7,
        restore_used=0,
        restore_remaining=3,
        restore_limit=3,
        missing=0,
        note="Eligible",
    )

    monkeypatch.setattr(
        "app.services.forecast_service.personalized_forecast_service.artifact_exists_for_user",
        lambda *_: True,
    )
    monkeypatch.setattr(
        "app.services.forecast_service.global_forecast_service.predict_next_day_for_user",
        lambda *_: {
            "user_id": 1,
            "forecast_date": "2024-01-01",
            "probability": 0.4,
            "chance_percent": 40.0,
            "threshold": 0.5,
            "prediction_binary": 0,
            "prediction_label": "LowRisk",
            "model_type": "global_markov",
        },
    )

    from app.services.forecast_service import get_global_forecast_for_user

    payload = get_global_forecast_for_user(user_id=1, eligibility=eligibility, db=None)
    assert payload["forecast"]["modelType"] == "global_markov"
