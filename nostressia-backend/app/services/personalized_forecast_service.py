import os
from datetime import timedelta
from typing import Any, Dict

import pandas as pd
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.stress_log_model import StressLevel
from app.services.global_forecast_service import GlobalForecastService


class PersonalizedForecastService(GlobalForecastService):
    def _artifact_path(self) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        return os.path.join(base_dir, "models_ml", "personalized_forecast.joblib")

    def _markov_proba_user(self, probs: Any, row: pd.Series) -> float:
        prev_high = int(row["lag_sp_1"] >= 1)
        dow = int(row["dow"])
        return float(probs[prev_high, dow, 1])

    def predict_next_day_for_user(self, db: Session, user_id: int) -> Dict[str, Any]:
        bundle = self._load_artifact()
        artifact = bundle.get("artifact", bundle) if isinstance(bundle, dict) else bundle
        meta = bundle.get("meta", {}) if isinstance(bundle, dict) else {}

        date_col = meta.get("date_col", "date")
        user_col = meta.get("user_col", "user_id")
        target_col = meta.get("target_col", "stress_level")
        window = int(meta.get("window", 3))
        behavior_cols = meta.get("behavior_cols") or []
        feature_cols = self._resolve_feature_cols(behavior_cols, window, meta)
        use_user_id_feature = bool(meta.get("use_user_id_feature", False))
        if use_user_id_feature:
            feature_cols = [user_col] + feature_cols

        logs = (
            db.query(StressLevel)
            .filter(StressLevel.user_id == user_id)
            .order_by(StressLevel.date.asc())
            .all()
        )

        if len(logs) < window + 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Histori stress belum cukup untuk prediksi personalized. "
                    f"Minimal {window + 1} hari data diperlukan."
                ),
            )

        records = []
        for log in logs:
            records.append(
                {
                    "user_id": log.user_id,
                    "date": log.date,
                    "stress_level": log.stress_level,
                    "gpa": log.gpa,
                    "extracurricular_hour_per_day": log.extracurricular_hour_per_day,
                    "physical_activity_hour_per_day": log.physical_activity_hour_per_day,
                    "sleep_hour_per_day": log.sleep_hour_per_day,
                    "study_hour_per_day": log.study_hour_per_day,
                    "social_hour_per_day": log.social_hour_per_day,
                }
            )

        df = pd.DataFrame(records)

        if user_col not in df.columns and "user_id" in df.columns:
            df[user_col] = df["user_id"]

        if date_col not in df.columns:
            df = self._ensure_column_alias(
                df,
                date_col,
                [self._snake_case(date_col)],
            )

        if target_col not in df.columns:
            df = self._ensure_column_alias(
                df,
                target_col,
                ["stress_level", self._snake_case(target_col)],
            )

        if behavior_cols:
            for behavior_col in behavior_cols:
                df = self._ensure_column_alias(
                    df,
                    behavior_col,
                    [self._snake_case(behavior_col)],
                )

        if date_col not in df.columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Kolom tanggal '{date_col}' tidak ditemukan pada data user.",
            )
        if target_col not in df.columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Kolom target '{target_col}' tidak ditemukan pada data user.",
            )
        if user_col not in df.columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Kolom user '{user_col}' tidak ditemukan pada data user.",
            )

        df[date_col] = pd.to_datetime(df[date_col], errors="raise")
        df = df.sort_values([user_col, date_col]).reset_index(drop=True)

        feat = self._build_feature_frame(
            df,
            date_col,
            user_col,
            target_col,
            window,
            behavior_cols,
            feature_cols,
        )

        if feat.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Histori stress belum cukup untuk membuat fitur prediksi. "
                    f"Pastikan minimal {window + 1} hari data tersedia."
                ),
            )

        user_feat = feat[feat[user_col] == user_id]
        if user_feat.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Model personalized tidak menemukan fitur untuk user.",
            )

        last_row = user_feat.sort_values([user_col, date_col]).tail(1).iloc[0]
        last_date = pd.to_datetime(last_row[date_col]).date()
        forecast_date = last_date + timedelta(days=1)

        art_type = artifact.get("type", "")
        threshold_obj = artifact.get("thr", 0.5)

        if art_type == "markov_user":
            probs_by_user = artifact.get("probs_by_user")
            if probs_by_user is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Artifact markov_user tidak lengkap.",
                )
            probs = probs_by_user.get(user_id)
            if probs is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Model personalized markov belum tersedia untuk user.",
                )
            probability = self._markov_proba_user(probs, last_row)
            threshold = float(threshold_obj.get(user_id, 0.5)) if isinstance(
                threshold_obj, dict
            ) else float(threshold_obj)

        elif art_type == "personalized_sklearn":
            models_by_user = artifact.get("models_by_user")
            if models_by_user is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Artifact personalized tidak memiliki model per user.",
                )
            pipe = models_by_user.get(user_id)
            if pipe is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Model personalized belum tersedia untuk user.",
                )
            input_df = pd.DataFrame([last_row])[feature_cols]
            probability = float(pipe.predict_proba(input_df)[:, 1][0])
            threshold = float(threshold_obj.get(user_id, 0.5)) if isinstance(
                threshold_obj, dict
            ) else float(threshold_obj)

        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Tipe model personalized tidak dikenali: {art_type}",
            )

        prediction_binary = int(probability >= threshold)
        prediction_label = "HighRisk" if prediction_binary == 1 else "LowRisk"

        return {
            "user_id": user_id,
            "forecast_date": forecast_date.isoformat(),
            "probability": float(probability),
            "chance_percent": round(float(probability) * 100, 2),
            "threshold": float(threshold),
            "prediction_binary": prediction_binary,
            "prediction_label": prediction_label,
            "model_type": art_type,
        }


personalized_forecast_service = PersonalizedForecastService()
