import os

from app.services.global_forecast_service import GlobalForecastService


class PersonalizedForecastService(GlobalForecastService):
    def _artifact_path(self) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        return os.path.join(base_dir, "models_ml", "personalized_forecast.joblib")


personalized_forecast_service = PersonalizedForecastService()
