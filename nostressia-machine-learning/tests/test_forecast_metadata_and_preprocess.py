from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = ROOT / "Stress-Forecast" / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))


def _load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


train_global_module = _load_module("train_global_meta_module", SCRIPTS_DIR / "train_global.py")
train_personalized_module = _load_module(
    "train_personalized_meta_module", SCRIPTS_DIR / "train_personalized.py"
)


def test_write_meta_multi_includes_run_ids(tmp_path: Path):
    output_meta = tmp_path / "personalized.meta.json"

    train_personalized_module._write_meta_multi(
        path=output_meta,
        data_hash="abc123",
        trained_at="2026-01-01T00:00:00+00:00",
        trained_users=[(10, 7), (11, 14)],
        run_ids=["run-a", "run-b", "run-b"],
    )

    payload = json.loads(output_meta.read_text(encoding="utf-8"))
    assert payload["mlflow_run_id"] == "run-b"
    assert payload["mlflow_run_ids"] == ["run-a", "run-b"]
    assert payload["horizon_days"] == train_personalized_module.WINDOW
    assert payload["users"] == [
        {"user_id": 10, "milestone": 7},
        {"user_id": 11, "milestone": 14},
    ]


def test_prepare_eval_data_global_returns_empty_if_required_columns_missing():
    raw = pd.DataFrame(
        {
            "date": ["2026-01-01", "2026-01-02"],
            "stress_level": [0, 1],
        }
    )

    transformed = train_global_module._prepare_eval_data_global(raw)
    assert transformed.empty


def test_prepare_eval_data_global_contains_target_and_features_for_valid_input():
    dates = pd.date_range("2026-01-01", periods=12, freq="D")
    raw = pd.DataFrame(
        {
            "user_id": [1] * len(dates),
            "date": dates.astype(str),
            "stress_level": [0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0],
            "extracurricular_hour_per_day": [1.0] * len(dates),
            "physical_activity_hour_per_day": [1.5] * len(dates),
            "sleep_hour_per_day": [7.0] * len(dates),
            "study_hour_per_day": [4.0] * len(dates),
            "social_hour_per_day": [2.0] * len(dates),
        }
    )

    transformed = train_global_module._prepare_eval_data_global(raw)
    assert not transformed.empty
    assert "stress_level" in transformed.columns
    assert "lag_sp_1" in transformed.columns
