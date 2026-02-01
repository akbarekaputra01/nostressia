import io
import logging
from typing import Any, Optional

import joblib
import requests
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.model_registry_model import ModelRegistry
from app.services.global_forecast_service import global_forecast_service

logger = logging.getLogger(__name__)


class ModelRegistryService:
    def __init__(self) -> None:
        self._artifact_cache: dict[str, Any] = {}

    def get_active_global_model(self, db: Session) -> Optional[ModelRegistry]:
        return (
            db.query(ModelRegistry)
            .filter(ModelRegistry.model_type == "global", ModelRegistry.is_active.is_(True))
            .order_by(desc(ModelRegistry.trained_at), desc(ModelRegistry.model_id))
            .first()
        )

    def get_active_personalized_model(
        self, db: Session, user_id: int
    ) -> Optional[ModelRegistry]:
        return (
            db.query(ModelRegistry)
            .filter(
                ModelRegistry.model_type == "personalized",
                ModelRegistry.user_id == user_id,
                ModelRegistry.is_active.is_(True),
            )
            .order_by(desc(ModelRegistry.trained_at), desc(ModelRegistry.model_id))
            .first()
        )

    def load_artifact(self, artifact_url: str) -> Any:
        if artifact_url in self._artifact_cache:
            return self._artifact_cache[artifact_url]

        logger.info("Downloading model artifact from %s", artifact_url)
        response = requests.get(artifact_url, timeout=60)
        response.raise_for_status()
        artifact = joblib.load(io.BytesIO(response.content))
        self._artifact_cache[artifact_url] = artifact
        return artifact

    def get_required_history_days(self, db: Session) -> Optional[int]:
        active_model = self.get_active_global_model(db)
        if not active_model:
            return None
        try:
            artifact = self.load_artifact(active_model.artifact_url)
        except Exception as exc:
            logger.warning("Failed to load global artifact for history days: %s", exc)
            return None

        return global_forecast_service.get_required_history_days_from_artifact(artifact)


model_registry_service = ModelRegistryService()
