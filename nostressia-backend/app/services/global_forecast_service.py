import os
from datetime import timedelta
from typing import Any, Dict, List, Optional

import joblib
import pandas as pd
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.stress_log_model import StressLevel


class GlobalForecastService:
    def __init__(self) -> None:
        self._artifact: Dict[str, Any] = {}
        self._artifact_loaded = False

    def _artifact_path(self) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        return os.path.join(base_dir, "models_ml", "global_forecast.joblib")

    def _load_artifact(self) -> Dict[str, Any]:
        if self._artifact_loaded:
            return self._artifact

        artifact_path = self._artifact_path()
        if not os.path.exists(artifact_path):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Model artifact tidak ditemukan: {artifact_path}",
            )

        try:
            self._artifact = joblib.load(artifact_path)
            self._artifact_loaded = True
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Gagal memuat model artifact: {exc}",
            ) from exc

        return self._artifact

    # ✅ Python 3.9 compatible (tidak pakai `int | None`)
    def get_required_history_days(self) -> Optional[int]:
        artifact_path = self._artifact_path()
        if not os.path.exists(artifact_path):
            return None

        try:
            artifact = self._load_artifact()
        except Exception:
            return None

        meta = artifact.get("meta", {}) if isinstance(artifact, dict) else {}
        try:
            window = int(meta.get("window", 0))
        except (TypeError, ValueError):
            return None

        if window <= 0:
            return None

        return window + 1

    def _build_feature_frame(
        self,
        df: pd.DataFrame,
        date_col: str,
        user_col: str,
        target_col: str,
        window: int,
        behavior_cols: List[str],
        feature_cols: List[str],
    ) -> pd.DataFrame:
        rows: List[pd.DataFrame] = []

        for _, group in df.groupby(user_col):
            group = group.sort_values(date_col).reset_index(drop=True)

            group["dow"] = group[date_col].dt.dayofweek.astype(int)
            group["is_weekend"] = (group["dow"] >= 5).astype(int)

            for k in range(1, window + 1):
                group[f"lag_sp_{k}"] = group[target_col].shift(k)

            if behavior_cols:
                for col in behavior_cols:
                    if col in group.columns:
                        group[f"lag1_{col}"] = group[col].shift(1)
                    else:
                        group[f"lag1_{col}"] = pd.NA

            sp_shift = group[target_col].shift(1)

            group["sp_mean"] = sp_shift.rolling(window).mean()
            group["sp_std"] = sp_shift.rolling(window).std().fillna(0.0)
            group["sp_min"] = sp_shift.rolling(window).min()
            group["sp_max"] = sp_shift.rolling(window).max()

            group["count_high"] = (sp_shift >= 1).rolling(window).sum()
            group["count_low"] = (sp_shift == 0).rolling(window).sum()

            high = (sp_shift >= 1).astype(int).fillna(0).astype(int).tolist()
            streak, current = [], 0
            for value in high:
                current = current + 1 if value == 1 else 0
                streak.append(current)
            group["streak_high"] = streak

            diff = (sp_shift != sp_shift.shift(1)).astype(int)
            group["transitions"] = diff.rolling(window).sum()

            rows.append(group)

        feat = pd.concat(rows, ignore_index=True)
        feat["y_bin"] = (feat[target_col] >= 1).astype(int)

        available_cols = [col for col in feature_cols if col in feat.columns]
        feat = feat.dropna(subset=available_cols + ["y_bin"]).reset_index(drop=True)
        return feat

    def _resolve_feature_cols(
        self, behavior_cols: List[str], window: int, meta: Dict[str, Any]
    ) -> List[str]:
        feature_cols = meta.get("feature_cols")
        if isinstance(feature_cols, list) and feature_cols:
            return feature_cols

        cols = (
            ["dow", "is_weekend"]
            + [f"lag_sp_{k}" for k in range(1, window + 1)]
            + [
                "sp_mean",
                "sp_std",
                "sp_min",
                "sp_max",
                "count_high",
                "count_low",
                "streak_high",
                "transitions",
            ]
        )
        for col in behavior_cols:
            cols.append(f"lag1_{col}")
        return cols

    def _markov_proba(self, probs: Any, row: pd.Series) -> float:
        prev_high = int(row["lag_sp_1"] >= 1)
        dow = int(row["dow"])
        return float(probs[prev_high, dow, 1])

    def predict_next_day_for_user(self, db: Session, user_id: int) -> Dict[str, Any]:
        artifact = self._load_artifact()
        meta = artifact.get("meta", {})

        date_col = meta.get("date_col", "date")
        # default diset konsisten dengan records (user_id)
        user_col = meta.get("user_col", "user_id")
        target_col = meta.get("target_col", "stress_level")
        window = int(meta.get("window", 3))
        behavior_cols = meta.get("behavior_cols") or []
        feature_cols = self._resolve_feature_cols(behavior_cols, window, meta)

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
                    "Histori stress belum cukup untuk prediksi. "
                    f"Minimal {window + 1} hari data diperlukan."
                ),
            )

        records: List[Dict[str, Any]] = []
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

        # ✅ Guard: kalau meta user_col beda (mis. "userID"), tetap sediakan kolomnya
        if user_col not in df.columns and "user_id" in df.columns:
            df[user_col] = df["user_id"]

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

        last_row = feat.sort_values([user_col, date_col]).tail(1).iloc[0]
        last_date = pd.to_datetime(last_row[date_col]).date()
        forecast_date = last_date + timedelta(days=1)

        model_type = artifact.get("type", "unknown")
        print(
            "📌 GlobalForecast",
            "| rows=",
            len(df),
            "| last_date=",
            last_date.isoformat(),
            "| model_type=",
            model_type,
        )

        input_df = pd.DataFrame([last_row])
        for col in feature_cols:
            if col not in input_df.columns:
                input_df[col] = pd.NA

        if model_type == "global_markov":
            probs = artifact.get("probs")
            if probs is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Artifact markov tidak memiliki probabilities.",
                )
            threshold = float(artifact.get("thr", 0.5))
            probability = self._markov_proba(probs, last_row)

        elif model_type == "global_ml_model":
            pipe = artifact.get("pipe")
            if pipe is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Artifact ML tidak memiliki pipeline.",
                )
            threshold = float(artifact.get("thr", 0.5))
            probability = float(pipe.predict_proba(input_df[feature_cols])[:, 1][0])

        elif model_type == "global_blend_model":
            pipe = artifact.get("pipe")
            probs = artifact.get("markov_probs")
            if pipe is None or probs is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Artifact blend tidak lengkap.",
                )
            threshold = float(artifact.get("thr", 0.5))
            alpha = float(artifact.get("alpha", 0.5))
            p_ml = float(pipe.predict_proba(input_df[feature_cols])[:, 1][0])
            p_mk = self._markov_proba(probs, last_row)
            probability = alpha * p_ml + (1.0 - alpha) * p_mk

        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Tipe model tidak dikenali: {model_type}",
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
            "model_type": model_type,
        }


global_forecast_service = GlobalForecastService()
