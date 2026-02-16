import logging
from datetime import date, timedelta

from app.models.stress_log_model import StressLevel
from app.schemas.stress_schema import EligibilityResponse
from fastapi import HTTPException

from app.services.global_forecast_service import global_forecast_service
from app.services.personalized_forecast_service import personalized_forecast_service

PERSONALIZED_STREAK_THRESHOLD = 60
logger = logging.getLogger(__name__)


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




def _build_rule_based_fallback_forecast(db, user_id: int) -> dict:
    recent_logs = (
        db.query(StressLevel)
        .filter(StressLevel.user_id == user_id)
        .order_by(StressLevel.date.desc())
        .limit(7)
        .all()
    )

    if not recent_logs:
        raise HTTPException(
            status_code=503,
            detail="Global forecast is temporarily unavailable and no history exists for fallback.",
        )

    recent_logs = list(reversed(recent_logs))
    highs = [1 if log.stress_level >= 1 else 0 for log in recent_logs]
    last_high = highs[-1]
    high_ratio = sum(highs) / len(highs)

    probability = min(max((0.6 * last_high) + (0.4 * high_ratio), 0.05), 0.95)
    threshold = 0.5
    prediction_binary = int(probability >= threshold)
    prediction_label = "HighRisk" if prediction_binary == 1 else "LowRisk"

    last_date = recent_logs[-1].date
    forecast_date = (last_date + timedelta(days=1)).isoformat() if last_date else (date.today() + timedelta(days=1)).isoformat()

    return {
        "user_id": user_id,
        "forecast_date": forecast_date,
        "probability": float(probability),
        "chance_percent": round(float(probability) * 100, 2),
        "threshold": threshold,
        "prediction_binary": prediction_binary,
        "prediction_label": prediction_label,
        "model_type": "global_rule_based_fallback",
    }

def build_global_forecast_payload(eligibility: EligibilityResponse, forecast: dict) -> dict:
    return {
        "forecast": _normalize_forecast_payload(forecast),
        "eligibility": eligibility.model_dump(by_alias=True),
    }


def get_global_forecast_for_user(user_id: int, eligibility: EligibilityResponse, db) -> dict:
    should_use_personalized = eligibility.streak >= PERSONALIZED_STREAK_THRESHOLD
    logger.info(
        "Forecast routing | user_id=%s | streak=%s | should_use_personalized=%s",
        user_id,
        eligibility.streak,
        should_use_personalized,
    )

    if should_use_personalized and personalized_forecast_service.artifact_exists_for_user(user_id):
        try:
            logger.info("Forecast routing | user_id=%s | selected=personalized", user_id)
            forecast = personalized_forecast_service.predict_next_day_for_user(db, user_id)
            return build_global_forecast_payload(eligibility, forecast)
        except HTTPException as exc:
            logger.warning(
                "Forecast routing | user_id=%s | personalized_failed status=%s detail=%s | fallback=global",
                user_id,
                exc.status_code,
                exc.detail,
            )

    if should_use_personalized:
        logger.info(
            "Forecast routing | user_id=%s | selected=global_after_personalized_check",
            user_id,
        )
    else:
        logger.info("Forecast routing | user_id=%s | selected=global", user_id)

    try:
        forecast = global_forecast_service.predict_next_day_for_user(db, user_id)
    except HTTPException as exc:
        if exc.status_code != 503:
            raise
        logger.warning(
            "Forecast routing | user_id=%s | global_unavailable status=%s | fallback=rule_based",
            user_id,
            exc.status_code,
        )
        forecast = _build_rule_based_fallback_forecast(db, user_id)

    return build_global_forecast_payload(eligibility, forecast)
