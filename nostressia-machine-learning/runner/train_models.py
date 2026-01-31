import argparse
import json
import os
from datetime import date
from pathlib import Path
from typing import Optional

import nbformat
import pandas as pd
from nbconvert.preprocessors import ExecutePreprocessor
from sqlalchemy import create_engine, text


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_TIMEOUT_SECONDS = 600


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
        raise RuntimeError("Database credentials are required for training.")
    return f"mysql+mysqlconnector://{user}:{password}@{host}:{port}/{name}"


def _fetch_training_data(
    mode: str,
    user_id: Optional[int],
    milestone: Optional[int],
    output_dir: Path,
) -> Path:
    engine = create_engine(_build_database_url())
    if mode == "personalized":
        if not user_id or not milestone:
            raise ValueError("Personalized training requires user_id and milestone.")
        query = text(
            """
            SELECT *
            FROM stress_levels
            WHERE user_id = :user_id
            ORDER BY date DESC
            LIMIT :limit_value
            """
        )
        df = pd.read_sql(query, engine, params={"user_id": user_id, "limit_value": milestone})
        if df.empty or len(df) < milestone:
            raise RuntimeError("Not enough stress history for the personalized milestone.")
        df["date"] = pd.to_datetime(df["date"]).dt.date
        df_sorted = df.sort_values("date")
        date_values = df_sorted["date"].tolist()
        if date_values[-1] != date.today():
            raise RuntimeError("Personalized training data must end on the current day.")
        for previous, current in zip(date_values, date_values[1:]):
            if (current - previous).days != 1:
                raise RuntimeError("Personalized training data must be consecutive.")
        dataset_path = output_dir / f"personalized_training_user_{user_id}.csv"
        df_sorted.to_csv(dataset_path, index=False)
        return dataset_path

    df = pd.read_sql("SELECT * FROM stress_levels", engine)
    if df.empty:
        raise RuntimeError("Global training requires stress history.")
    dataset_path = output_dir / "global_training_data.csv"
    df.to_csv(dataset_path, index=False)
    return dataset_path


def _execute_notebook(notebook_path: Path, parameters: dict, timeout_seconds: int) -> None:
    notebook = nbformat.read(str(notebook_path), as_version=4)
    param_cell = nbformat.v4.new_code_cell(
        "PARAMETERS = " + json.dumps(parameters, default=str)
    )
    notebook.cells.insert(0, param_cell)
    executor = ExecutePreprocessor(timeout=timeout_seconds, kernel_name="python3")
    executor.preprocess(notebook, {"metadata": {"path": str(notebook_path.parent)}})


def _resolve_notebook(mode: str) -> Path:
    if mode == "personalized":
        return ROOT / "nostressia-machine-learning" / "Stress-Forecast" / "notebooks" / "personalized_forecast.ipynb"
    return ROOT / "nostressia-machine-learning" / "Stress-Forecast" / "notebooks" / "global_forecast.ipynb"


def _resolve_default_artifact(mode: str) -> Path:
    if mode == "personalized":
        return ROOT / "nostressia-machine-learning" / "Stress-Forecast" / "models" / "personalized_forecast.joblib"
    return ROOT / "nostressia-machine-learning" / "Stress-Forecast" / "models" / "global_forecast.joblib"


def run_training(mode: str, user_id: Optional[int], milestone: Optional[int], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    data_dir = output_path.parent / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    training_data_path = _fetch_training_data(mode, user_id, milestone, data_dir)

    notebook_path = _resolve_notebook(mode)
    parameters = {
        "mode": mode,
        "user_id": user_id,
        "milestone": milestone,
        "training_data_path": str(training_data_path),
        "output_path": str(output_path),
    }
    _execute_notebook(notebook_path, parameters, DEFAULT_TIMEOUT_SECONDS)

    if output_path.exists():
        return
    default_artifact = _resolve_default_artifact(mode)
    if default_artifact.exists():
        output_path.write_bytes(default_artifact.read_bytes())
        return
    raise FileNotFoundError("The training output artifact was not created.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run notebook-driven model training.")
    parser.add_argument("--mode", choices=["global", "personalized"], required=True)
    parser.add_argument("--user-id", type=int)
    parser.add_argument("--milestone", type=int)
    parser.add_argument("--output-path", required=True)
    args = parser.parse_args()

    run_training(
        mode=args.mode,
        user_id=args.user_id,
        milestone=args.milestone,
        output_path=Path(args.output_path),
    )


if __name__ == "__main__":
    main()
