from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import importlib.util
import sys

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


ml_state_module = _load_module("ml_state_module", SCRIPTS_DIR / "ml_state.py")
train_global_module = _load_module("train_global_module", SCRIPTS_DIR / "train_global.py")
train_personalized_module = _load_module("train_personalized_module", SCRIPTS_DIR / "train_personalized.py")

MLState = ml_state_module.MLState
should_retrain_global = ml_state_module.should_retrain_global


def test_ml_state_save_is_atomic_and_round_trip(tmp_path: Path):
    state_path = tmp_path / "state" / ".ml_state.json"
    state = MLState()
    state.global_state["last_trained_at"] = "2025-01-01T00:00:00+00:00"
    state.personalized["users"] = {"1": {"last_trained_milestone": 60}}

    state.save(state_path)

    assert state_path.exists()
    assert not state_path.with_suffix(state_path.suffix + ".tmp").exists()

    loaded = MLState.load(state_path)
    assert loaded.global_state["last_trained_at"] == "2025-01-01T00:00:00+00:00"
    assert loaded.personalized["users"]["1"]["last_trained_milestone"] == 60


def test_should_retrain_global_respects_interval():
    now = datetime(2026, 1, 31, tzinfo=timezone.utc)
    assert should_retrain_global(None, now, interval_days=60)
    assert should_retrain_global("invalid-timestamp", now, interval_days=60)
    assert not should_retrain_global("2026-01-01T00:00:00+00:00", now, interval_days=60)
    assert should_retrain_global("2025-11-01T00:00:00+00:00", now, interval_days=60)


def test_global_is_due_delegates_to_state_timestamp():
    state = MLState()
    state.global_state["last_trained_at"] = "2026-01-01T00:00:00+00:00"
    now = datetime(2026, 1, 31, tzinfo=timezone.utc)

    assert not train_global_module._is_due(state, now)


def test_collect_candidates_filters_by_milestone_and_state():
    milestone = train_personalized_module.MILESTONE_INTERVAL
    start = pd.Timestamp("2026-01-01")
    user_1_dates = [(start + pd.Timedelta(days=idx)).strftime("%Y-%m-%d") for idx in range(milestone)]

    df = pd.DataFrame(
        {
            "user_id": [1] * milestone + [2] * 5,
            "date": user_1_dates
            + [
                "2026-01-01",
                "2026-01-02",
                "2026-01-03",
                "2026-01-04",
                "2026-01-05",
            ],
        }
    )

    state = MLState()
    candidates = train_personalized_module._collect_candidates(df, state, force_user_id=None)
    assert [candidate["user_id"] for candidate in candidates] == [1]
    assert candidates[0]["milestone"] == milestone

    state.personalized["users"] = {
        "1": {
            "last_trained_milestone": milestone,
            "streak_start_date": "2026-01-01",
        }
    }
    filtered = train_personalized_module._collect_candidates(df, state, force_user_id=None)
    assert filtered == []


def test_collect_candidates_force_mode_bypasses_milestone_gate():
    df = pd.DataFrame(
        {
            "user_id": [3] * 3,
            "date": ["2026-01-01", "2026-01-02", "2026-01-03"],
        }
    )
    state = MLState()

    forced = train_personalized_module._collect_candidates(df, state, force_user_id=3)
    assert forced and forced[0]["milestone"] == 3


def test_ml_state_load_invalid_json_raises_clear_error(tmp_path: Path):
    state_path = tmp_path / ".ml_state.json"
    state_path.write_text("{invalid", encoding="utf-8")

    try:
        MLState.load(state_path)
    except RuntimeError as error:
        assert "Invalid ML state JSON" in str(error)
    else:
        raise AssertionError("Expected RuntimeError for invalid state file.")
