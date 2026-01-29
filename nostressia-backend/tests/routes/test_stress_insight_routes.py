from datetime import date

from app.models.user_model import User
from app.schemas.stress_schema import EligibilityResponse, GlobalForecastPayload, GlobalForecastResult
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
    monkeypatch.setattr("app.routes.stress_insight_route.ml_service.predict_stress", lambda *_: "Low")

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
    monkeypatch.setattr("app.routes.stress_insight_route.ml_service.predict_stress", lambda *_: "Error")

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


def test_global_forecast_requires_eligibility(client, db_session, monkeypatch):
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
            restore_limit=3,
            missing=6,
            note="Not enough logs",
        ),
    )

    response = client.get(
        "/api/stress/global-forecast",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_global_forecast_success(client, db_session, monkeypatch):
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

    response = client.get(
        "/api/stress/global-forecast",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["forecast"]["predictionLabel"] == "Low"
