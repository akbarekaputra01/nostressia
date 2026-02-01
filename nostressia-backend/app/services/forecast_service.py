from app.schemas.stress_schema import EligibilityResponse
from app.services.global_forecast_service import global_forecast_service
from app.services.model_registry_service import model_registry_service
from app.services.personalized_forecast_service import personalized_forecast_service


def _normalize_forecast_payload(raw_forecast: dict) -> dict:
    chance_percent = raw_forecast.get("chance_percent", raw_forecast.get("chancePercent"))
    if chance_percent is None and "probability" in raw_forecast:
        chance_percent = round(float(raw_forecast["probability"]) * 100, 2)

    return {
        **raw_forecast,
        "forecastDate": raw_forecast.get("forecast_date") or raw_forecast.get("forecastDate"),
        "chancePercent": chance_percent,
        "predictionLabel": raw_forecast.get("prediction_label") or raw_forecast.get("predictionLabel"),
        "predictionBinary": raw_forecast.get("prediction_binary") or raw_forecast.get("predictionBinary"),
        "modelType": raw_forecast.get("model_type") or raw_forecast.get("modelType"),
    }


def build_global_forecast_payload(eligibility: EligibilityResponse, forecast: dict) -> dict:
    return {
        "forecast": _normalize_forecast_payload(forecast),
        "eligibility": eligibility.model_dump(by_alias=True),
    }


def get_global_forecast_for_user(user_id: int, eligibility: EligibilityResponse, db) -> dict:
    personalized_model = model_registry_service.get_active_personalized_model(db, user_id)
    if personalized_model:
        artifact = model_registry_service.load_artifact(personalized_model.artifact_url)
        forecast = personalized_forecast_service.predict_next_day_for_user_with_artifact(
            db, user_id, artifact
        )
        return build_global_forecast_payload(eligibility, forecast)

    global_model = model_registry_service.get_active_global_model(db)
    if global_model:
        artifact = model_registry_service.load_artifact(global_model.artifact_url)
        forecast = global_forecast_service.predict_next_day_for_user_with_artifact(
            db, user_id, artifact
        )
        return build_global_forecast_payload(eligibility, forecast)

    forecast = global_forecast_service.predict_next_day_for_user(db, user_id)
    return build_global_forecast_payload(eligibility, forecast)
