from datetime import date

from app.models.user_model import User
from app.schemas.response_schema import APIResponse
from app.schemas.stress_schema import EligibilityResponse, GlobalForecastPayload, GlobalForecastResult
from app.services.ml_service import MLServiceError
from app.utils.hashing import hash_password
from app.utils.jwt_handler import create_access_token


def _create_user(db_session):
    user = User(
        name="Insight User",
        username="insightuser",
        email="insight@example.com",
        password=hash_password("Password123!"),
        gender="unspecified",
        user_dob=date(2000, 1, 1),
        is_verified=True,
        streak=7,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_predict_current_stress_success(client, monkeypatch):
    monkeypatch.setattr("app.routes.stress_insight_route.ml_service.predict_stress_or_raise", lambda *_: "Low")

    response = client.post(
        "/api/stress/current",
        json={
            "studyHours": 4,
            "extracurricularHours": 1,
            "sleepHours": 7,
            "socialHours": 2,
            "physicalHours": 1,
            "gpa": 3.5,
        },
    )

    assert response.status_code == 200
    assert response.json()["data"]["result"] == "Low"


def test_predict_current_stress_error(client, monkeypatch):
    monkeypatch.setattr("app.routes.stress_insight_route.ml_service.predict_stress_or_raise", lambda *_: (_ for _ in ()).throw(MLServiceError("prediction_failed", "An error occurred in the stress prediction model.")))

    response = client.post(
        "/api/stress/current",
        json={
            "studyHours": 4,
            "extracurricularHours": 1,
            "sleepHours": 7,
            "socialHours": 2,
            "physicalHours": 1,
            "gpa": 3.5,
        },
    )

    assert response.status_code == 500


def test_predict_current_stress_model_not_ready(client, monkeypatch):
    monkeypatch.setattr(
        "app.routes.stress_insight_route.ml_service.predict_stress_or_raise",
        lambda *_: (_ for _ in ()).throw(MLServiceError("model_not_ready", "Stress prediction model is not available right now.")),
    )

    response = client.post(
        "/api/stress/current",
        json={
            "studyHours": 4,
            "extracurricularHours": 1,
            "sleepHours": 7,
            "socialHours": 2,
            "physicalHours": 1,
            "gpa": 3.5,
        },
    )

    assert response.status_code == 503
    assert response.json()["message"] == "Stress prediction model is not available right now."


def test_predict_current_stress_rejects_total_daily_hours_above_24(client):
    response = client.post(
        "/api/stress/current",
        json={
            "studyHours": 10,
            "extracurricularHours": 5,
            "sleepHours": 8,
            "socialHours": 2,
            "physicalHours": 1,
            "gpa": 3.5,
        },
    )

    assert response.status_code == 422
    assert (
        "Total daily activity hours cannot exceed 24 hours."
        in response.json()["message"]
    )


def test_predict_current_stress_invalid_input_error(client, monkeypatch):
    monkeypatch.setattr(
        "app.routes.stress_insight_route.ml_service.predict_stress_or_raise",
        lambda *_: (_ for _ in ()).throw(MLServiceError("invalid_input", "Invalid numeric value for feature 'gpa'.")),
    )

    response = client.post(
        "/api/stress/current",
        json={
            "studyHours": 4,
            "extracurricularHours": 1,
            "sleepHours": 7,
            "socialHours": 2,
            "physicalHours": 1,
            "gpa": 3.5,
        },
    )

    assert response.status_code == 422
    assert response.json()["message"] == "Invalid numeric value for feature 'gpa'."


def test_forecast_requires_eligibility(client, db_session, monkeypatch):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    monkeypatch.setattr(
        "app.routes.stress_insight_route.stress_service.check_global_eligibility",
        lambda *_: EligibilityResponse(
            user_id=user.user_id,
            eligible=False,
            streak=1,
            required_streak=7,
            restore_used=0,
            restore_remaining=3,
            restore_limit=3,
            missing=6,
            note="Not enough logs",
        ),
    )

    response = client.get("/api/stress/forecast", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
    payload = response.json()
    assert payload["errors"][0]["code"] == "FORECAST_NOT_ELIGIBLE"
    assert payload["data"] is None


def test_forecast_success(client, db_session, monkeypatch):
    user = _create_user(db_session)
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )

    eligibility = EligibilityResponse(
        user_id=user.user_id,
        eligible=True,
        streak=7,
        required_streak=7,
        restore_used=0,
        restore_remaining=3,
        restore_limit=3,
        missing=0,
        note="Eligible",
    )

    monkeypatch.setattr(
        "app.routes.stress_insight_route.stress_service.check_global_eligibility",
        lambda *_: eligibility,
    )

    forecast_payload = GlobalForecastPayload(
        forecast=GlobalForecastResult(
            user_id=user.user_id,
            forecast_date="2024-01-01",
            probability=0.1,
            chance_percent=10.0,
            threshold=0.5,
            prediction_binary=0,
            prediction_label="Low",
            model_type="global_markov",
        ),
        eligibility=eligibility,
    )

    monkeypatch.setattr(
        "app.routes.stress_insight_route.forecast_service.get_global_forecast_for_user",
        lambda *_: forecast_payload,
    )

    response = client.get("/api/stress/forecast", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    APIResponse[GlobalForecastPayload].model_validate(response.json())
    assert response.json()["data"]["forecast"]["predictionLabel"] == "Low"
