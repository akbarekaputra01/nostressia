import logging
import os
from datetime import date, timedelta
from typing import Any, Dict, List

import requests
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.stress_log_model import StressLevel

logger = logging.getLogger(__name__)

DATA_SOURCE_DB = "db"
DATA_SOURCE_API = "api"


def _resolve_data_source() -> str:
    return os.getenv("DATA_SOURCE", DATA_SOURCE_DB).lower()


def _resolve_backend_base_url() -> str | None:
    return os.getenv("BACKEND_BASE_URL")


def _resolve_internal_token() -> str | None:
    return os.getenv("INTERNAL_TOKEN")


def _api_headers() -> Dict[str, str]:
    token = _resolve_internal_token()
    return {"X-Internal-Token": token} if token else {}


def fetch_global_training_rows(
    db: Session | None,
    days_limit: int | None = None,
    data_source: str | None = None,
) -> List[Dict[str, Any]]:
    source = (data_source or _resolve_data_source()).lower()
    if source == DATA_SOURCE_DB:
        if db is None:
            raise RuntimeError("DB session is required to load global data from the database.")
        query = db.query(StressLevel)
        if days_limit:
            start_date = date.today() - timedelta(days=int(days_limit))
            query = query.filter(StressLevel.date >= start_date)
        rows = query.order_by(StressLevel.user_id, StressLevel.date).all()
        return [_row_to_payload(row) for row in rows]

    if source == DATA_SOURCE_API:
        base_url = _resolve_backend_base_url()
        if not base_url:
            raise RuntimeError("BACKEND_BASE_URL is not set for loading global data via the API.")
        url = f"{base_url.rstrip('/')}/api/ml/training-data/global"
        params = {"days_limit": int(days_limit)} if days_limit else {}
        resp = requests.get(url, headers=_api_headers(), params=params, timeout=30)
        resp.raise_for_status()
        return resp.json().get("data", [])

    raise ValueError(f"Unknown data_source: {source}")


def fetch_personalized_training_rows(
    db: Session | None,
    user_id: int,
    limit: int = 60,
    data_source: str | None = None,
) -> List[Dict[str, Any]]:
    source = (data_source or _resolve_data_source()).lower()
    if source == DATA_SOURCE_DB:
        if db is None:
            raise RuntimeError("DB session is required to load personalized data from the database.")
        rows = (
            db.query(StressLevel)
            .filter(StressLevel.user_id == user_id)
            .order_by(desc(StressLevel.date))
            .limit(int(limit))
            .all()
        )
        rows_sorted = sorted(rows, key=lambda item: item.date)
        return [_row_to_payload(row) for row in rows_sorted]

    if source == DATA_SOURCE_API:
        base_url = _resolve_backend_base_url()
        if not base_url:
            raise RuntimeError("BACKEND_BASE_URL is not set for loading personalized data via the API.")
        url = f"{base_url.rstrip('/')}/api/ml/training-data/personalized"
        params = {"userId": int(user_id), "limit": int(limit)}
        resp = requests.get(url, headers=_api_headers(), params=params, timeout=30)
        resp.raise_for_status()
        return resp.json().get("data", [])

    raise ValueError(f"Unknown data_source: {source}")


def _row_to_payload(row: StressLevel) -> Dict[str, Any]:
    return {
        "user_id": row.user_id,
        "date": row.date.isoformat() if row.date else None,
        "stress_level": row.stress_level,
        "gpa": row.gpa,
        "extracurricular_hour_per_day": row.extracurricular_hour_per_day,
        "physical_activity_hour_per_day": row.physical_activity_hour_per_day,
        "sleep_hour_per_day": row.sleep_hour_per_day,
        "study_hour_per_day": row.study_hour_per_day,
        "social_hour_per_day": row.social_hour_per_day,
        "emoji": row.emoji,
        "is_restored": row.is_restored,
    }
