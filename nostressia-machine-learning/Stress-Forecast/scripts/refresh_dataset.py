from __future__ import annotations

import argparse
import hashlib
import os
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OUTPUT = (
    REPO_ROOT / "nostressia-machine-learning" / "Stress-Forecast" / "datasets" / "stress_forecast.csv"
)


def _build_database_url() -> str:
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        return database_url
    user = os.environ.get("DB_USER")
    password = os.environ.get("DB_PASSWORD")
    host = os.environ.get("DB_HOST")
    port = os.environ.get("DB_PORT", "3306")
    name = os.environ.get("DB_NAME")
    if not all([user, password, host, name]):
        raise RuntimeError(
            "REALTIME_SOURCE_NOT_CONFIGURED: set DATABASE_URL or DB_* env vars to refresh dataset."
        )
    return f"mysql+mysqlconnector://{user}:{password}@{host}:{port}/{name}"


def _sha256(path: Path) -> str:
    sha = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            sha.update(chunk)
    return sha.hexdigest()


def _log_dataset_info(df: pd.DataFrame, path: Path) -> None:
    date_col = "date" if "date" in df.columns else None
    min_date = df[date_col].min() if date_col else None
    max_date = df[date_col].max() if date_col else None
    print("DATASET_PATH :", path)
    print("ROWS         :", len(df))
    if min_date is not None and max_date is not None:
        print("DATE_RANGE   :", min_date, "->", max_date)
    print("REFRESHED_AT :", datetime.now(timezone.utc).isoformat())


def refresh_dataset(output_path: Path) -> str:
    engine = create_engine(_build_database_url())
    query = text(
        """
        SELECT
            stress_level_id,
            user_id,
            date,
            stress_level,
            gpa,
            extracurricular_hour_per_day,
            physical_activity_hour_per_day,
            sleep_hour_per_day,
            study_hour_per_day,
            social_hour_per_day,
            emoji,
            is_restored,
            created_at
        FROM stress_levels
        ORDER BY user_id, date
        """
    )
    with engine.connect() as conn:
        df = pd.read_sql(query, conn)

    if df.empty:
        raise RuntimeError("No rows returned from stress_levels; cannot refresh dataset.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    dataset_hash = _sha256(output_path)
    _log_dataset_info(df, output_path)
    print("SHA256       :", dataset_hash)
    return dataset_hash


def main() -> None:
    parser = argparse.ArgumentParser(description="Refresh stress_forecast.csv from realtime data.")
    parser.add_argument("--output-path", default=str(DEFAULT_OUTPUT))
    args = parser.parse_args()

    output_path = Path(args.output_path)
    try:
        refresh_dataset(output_path)
    except RuntimeError as exc:
        if output_path.exists():
            df = pd.read_csv(output_path)
            _log_dataset_info(df, output_path)
            print("SHA256       :", _sha256(output_path))
        raise


if __name__ == "__main__":
    main()
