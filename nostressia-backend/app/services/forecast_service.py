from app.schemas.stress_schema import EligibilityResponse
from fastapi import HTTPException

from app.services.global_forecast_service import global_forecast_service
from app.services.personalized_forecast_service import personalized_forecast_service


def _first_not_none(*values: object) -> object:
    for value in values:
        if value is not None:
            return value
    return None


def _normalize_forecast_payload(raw_forecast: dict) -> dict:
    chance_percent = _first_not_none(
        raw_forecast.get("chance_percent"),
        raw_forecast.get("chancePercent"),
    )
    if chance_percent is None and "probability" in raw_forecast:
        chance_percent = round(float(raw_forecast["probability"]) * 100, 2)

    return {
        "userId": _first_not_none(
            raw_forecast.get("user_id"),
            raw_forecast.get("userId"),
        ),
        "forecastDate": _first_not_none(
            raw_forecast.get("forecast_date"),
            raw_forecast.get("forecastDate"),
        ),
        "probability": _first_not_none(
            raw_forecast.get("probability"),
            raw_forecast.get("probability"),
        ),
        "chancePercent": chance_percent,
        "threshold": _first_not_none(
            raw_forecast.get("threshold"),
            raw_forecast.get("threshold"),
        ),
        "predictionBinary": _first_not_none(
            raw_forecast.get("prediction_binary"),
            raw_forecast.get("predictionBinary"),
        ),
        "predictionLabel": _first_not_none(
            raw_forecast.get("prediction_label"),
            raw_forecast.get("predictionLabel"),
        ),
        "modelType": _first_not_none(
            raw_forecast.get("model_type"),
            raw_forecast.get("modelType"),
        ),
    }


def build_global_forecast_payload(eligibility: EligibilityResponse, forecast: dict) -> dict:
    return {
        "forecast": _normalize_forecast_payload(forecast),
        "eligibility": eligibility.model_dump(by_alias=True),
    }


def get_global_forecast_for_user(user_id: int, eligibility: EligibilityResponse, db) -> dict:
    if personalized_forecast_service.artifact_exists_for_user(user_id):
        try:
            forecast = personalized_forecast_service.predict_next_day_for_user(db, user_id)
            return build_global_forecast_payload(eligibility, forecast)
        except HTTPException:
            pass

    forecast = global_forecast_service.predict_next_day_for_user(db, user_id)
    return build_global_forecast_payload(eligibility, forecast)
