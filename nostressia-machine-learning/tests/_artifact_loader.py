from __future__ import annotations

from pathlib import Path

import joblib
import pytest


def load_artifact_or_skip(path: Path):
    try:
        return joblib.load(path)
    except (ModuleNotFoundError, ValueError) as exc:
        message = str(exc)
        known_compat_issue = (
            "No module named '_loss'" in message
            or "No module named 'numpy._core.numeric'" in message
            or "not a known BitGenerator module" in message
            or "state is not a legacy MT19937 state" in message
        )
        if known_compat_issue:
            pytest.skip(f"Skipping due to model serialization incompatibility: {exc}")
        raise
