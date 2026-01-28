import logging
import os

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)

# Resolve absolute paths for model artifacts.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models_ml", "current_stress_pipeline.joblib")

class StressModelService:
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
        
        if not os.path.exists(MODEL_PATH):
            logger.warning("Model file not found. Ensure the artifact exists.")
            return

        try:
            data = joblib.load(MODEL_PATH)
            
            # Unpack dictionary artifacts.
            if isinstance(data, dict):
                self.pipeline = data.get("pipeline")
                self.feature_names = data.get("feature_names")
            else:
                self.pipeline = data

            self._coerce_logistic_regression(self.pipeline)
            
            logger.info("ML model loaded successfully.")
        except Exception as exc:
            logger.exception("Failed to load the ML model: %s", exc)

    # Keep feature engineering aligned with the notebook workflow.
    def _calculate_academic_performance_encoded(self, gpa):
        # 1. Categorize performance (aligned with the notebook logic).
        if gpa >= 3.5:
            category = "Excellent"
        elif 3.0 <= gpa < 3.5:
            category = "Good"
        elif 2.0 <= gpa < 3.0:
            category = "Fair"
        else:
            category = "Poor"
        
        # 2. Map to numeric encoding (aligned with the notebook mapping).
        mapping = {"Poor": 0, "Fair": 1, "Good": 2, "Excellent": 3}
        return mapping.get(category, 0)

    def predict_stress(self, input_data: dict) -> str:
        if not self.pipeline:
            logger.error("Prediction requested before the model was ready.")
            return "Error: Model not ready"

        try:
            # Feature engineering.
            gpa = input_data["gpa"]
            # Reuse the notebook-aligned helper.
            academic_encoded = self._calculate_academic_performance_encoded(gpa)

            # Build the inference DataFrame.
            df = pd.DataFrame(
                [
                    {
                        "Study_Hours_Per_Day": input_data["study_hours"],
                        "Extracurricular_Hours_Per_Day": input_data[
                            "extracurricular_hours"
                        ],
                        "Sleep_Hours_Per_Day": input_data["sleep_hours"],
                        "Social_Hours_Per_Day": input_data["social_hours"],
                        "Physical_Activity_Hours_Per_Day": input_data[
                            "physical_hours"
                        ],
                        "GPA": gpa,
                        "Academic_Performance_Encoded": academic_encoded,
                    }
                ]
            )

            if self.feature_names:
                df = df[self.feature_names]

            self._coerce_logistic_regression(self.pipeline)

            # Predict
            prediction_idx = self.pipeline.predict(df)[0]
            label_map = {0: "Low", 1: "Moderate", 2: "High"}
            
            return label_map.get(prediction_idx, "Unknown")

        except Exception as exc:
            logger.exception("Prediction failed: %s", exc)
            return f"Error: {str(exc)}"

ml_service = StressModelService()
