import logging
import math
from pathlib import Path
from typing import Dict, Iterable, Optional

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = BASE_DIR / "models_ml" / "current_stress.joblib"


class MLServiceError(RuntimeError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class StressModelService:
    REQUIRED_INPUT_KEYS = {
        "study_hours",
        "extracurricular_hours",
        "sleep_hours",
        "social_hours",
        "physical_hours",
        "gpa",
    }

    def __init__(self):
        self.pipeline = None
        self.feature_names = None
        self._ensure_logistic_regression_defaults()
        self.load_model()

    def _ensure_logistic_regression_defaults(self) -> None:
        if not hasattr(LogisticRegression, "multi_class"):
            LogisticRegression.multi_class = "auto"

    def _coerce_logistic_regression(self, estimator, seen=None) -> None:
        if estimator is None:
            return

        if seen is None:
            seen = set()

        estimator_id = id(estimator)
        if estimator_id in seen:
            return
        seen.add(estimator_id)

        if isinstance(estimator, dict):
            for value in estimator.values():
                self._coerce_logistic_regression(value, seen=seen)
            return

        if isinstance(estimator, (list, tuple, set)):
            for value in estimator:
                self._coerce_logistic_regression(value, seen=seen)
            return

        is_logistic_regression = isinstance(estimator, LogisticRegression) or (
            estimator.__class__.__name__ == "LogisticRegression"
        )
        if is_logistic_regression:
            self._ensure_logistic_regression_defaults()
            if not hasattr(estimator, "multi_class"):
                estimator.multi_class = "auto"
            return

        if isinstance(estimator, Pipeline) or hasattr(estimator, "steps"):
            for _, step in estimator.steps:
                self._coerce_logistic_regression(step, seen=seen)
            return

        if hasattr(estimator, "named_steps"):
            self._coerce_logistic_regression(estimator.named_steps, seen=seen)

        if hasattr(estimator, "transformers"):
            for _, transformer, _ in estimator.transformers:
                if transformer in {"drop", "passthrough"}:
                    continue
                self._coerce_logistic_regression(transformer, seen=seen)

        if hasattr(estimator, "estimator"):
            self._coerce_logistic_regression(estimator.estimator, seen=seen)

        if hasattr(estimator, "estimator_"):
            self._coerce_logistic_regression(estimator.estimator_, seen=seen)

        if hasattr(estimator, "base_estimator"):
            self._coerce_logistic_regression(estimator.base_estimator, seen=seen)

        if hasattr(estimator, "classifier"):
            self._coerce_logistic_regression(estimator.classifier, seen=seen)

        if hasattr(estimator, "model"):
            self._coerce_logistic_regression(estimator.model, seen=seen)

        if hasattr(estimator, "__dict__"):
            for value in estimator.__dict__.values():
                self._coerce_logistic_regression(value, seen=seen)

    def load_model(self):
        logger.info("Loading ML model from %s", MODEL_PATH)

        if not MODEL_PATH.exists():
            logger.warning("Model file not found. Ensure the artifact exists.")
            return

        try:
            data = joblib.load(MODEL_PATH)

            if isinstance(data, dict):
                self.pipeline = data.get("pipeline")
                self.feature_names = data.get("feature_names")
            else:
                self.pipeline = data

            if self.pipeline is None:
                logger.error("Model artifact loaded but pipeline is missing.")
                return

            self._coerce_logistic_regression(self.pipeline)
            logger.info("ML model loaded successfully.")
        except Exception:
            logger.exception("Failed to load the ML model.")

    def _calculate_academic_performance_encoded(self, gpa):
        if gpa >= 3.5:
            category = "Excellent"
        elif 3.0 <= gpa < 3.5:
            category = "Good"
        elif 2.0 <= gpa < 3.0:
            category = "Fair"
        else:
            category = "Poor"

        mapping = {"Poor": 0, "Fair": 1, "Good": 2, "Excellent": 3}
        return mapping.get(category, 0)

    def _ensure_numeric_input(self, input_data: Dict[str, float], keys: Iterable[str]) -> None:
        missing_keys = [key for key in keys if key not in input_data]
        if missing_keys:
            raise MLServiceError(
                code="invalid_input",
                message=f"Missing required features: {', '.join(sorted(missing_keys))}.",
            )

        for key in keys:
            value = input_data[key]
            if not isinstance(value, (int, float)) or not math.isfinite(float(value)):
                raise MLServiceError(
                    code="invalid_input",
                    message=f"Invalid numeric value for feature '{key}'.",
                )

    def predict_stress_or_raise(self, input_data: dict) -> str:
        if not self.pipeline:
            logger.error("Prediction requested before the model was ready.")
            raise MLServiceError(
                code="model_not_ready",
                message="Stress prediction model is not available right now.",
            )

        self._ensure_numeric_input(input_data, self.REQUIRED_INPUT_KEYS)

        try:
            gpa = float(input_data["gpa"])
            academic_encoded = self._calculate_academic_performance_encoded(gpa)

            df = pd.DataFrame(
                [
                    {
                        "Study_Hours_Per_Day": input_data["study_hours"],
                        "Extracurricular_Hours_Per_Day": input_data["extracurricular_hours"],
                        "Sleep_Hours_Per_Day": input_data["sleep_hours"],
                        "Social_Hours_Per_Day": input_data["social_hours"],
                        "Physical_Activity_Hours_Per_Day": input_data["physical_hours"],
                        "GPA": gpa,
                        "Academic_Performance_Encoded": academic_encoded,
                    }
                ]
            )

            if self.feature_names:
                df = df[self.feature_names]

            self._coerce_logistic_regression(self.pipeline)
            prediction_idx = self.pipeline.predict(df)[0]
            label_map = {0: "Low", 1: "Moderate", 2: "High"}
            return label_map.get(prediction_idx, "Unknown")

        except MLServiceError:
            raise
        except Exception as exc:
            logger.exception("Prediction failed.", exc_info=exc)
            raise MLServiceError(
                code="prediction_failed",
                message="An error occurred in the stress prediction model.",
            ) from exc

    def predict_stress(self, input_data: dict) -> str:
        try:
            return self.predict_stress_or_raise(input_data)
        except MLServiceError as exc:
            if exc.code == "model_not_ready":
                return "Error: Model not ready"
            return "Error: Prediction failed"


ml_service = StressModelService()
