from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict


GLOBAL_RETRAIN_INTERVAL_DAYS = 60


@dataclass
class MLState:
    global_state: Dict[str, Any] = field(default_factory=lambda: {"last_trained_at": None, "data_hash": None})
    personalized: Dict[str, Any] = field(default_factory=lambda: {"users": {}})

    @classmethod
    def load(cls, path: Path) -> "MLState":
        if not path.exists():
            return cls()
        payload = json.loads(path.read_text())
        return cls(
            global_state=payload.get("global", {"last_trained_at": None, "data_hash": None}),
            personalized=payload.get("personalized", {"users": {}}),
        )

    def dump(self) -> Dict[str, Any]:
        return {"global": self.global_state, "personalized": self.personalized}

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = path.with_suffix(path.suffix + ".tmp")
        temp_path.write_text(json.dumps(self.dump(), indent=2, sort_keys=True))
        temp_path.replace(path)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def should_retrain_global(last_trained_at: str | None, now: datetime, interval_days: int = GLOBAL_RETRAIN_INTERVAL_DAYS) -> bool:
    if not last_trained_at:
        return True

    try:
        last_dt = datetime.fromisoformat(last_trained_at)
    except ValueError:
        return True

    if last_dt.tzinfo is None:
        last_dt = last_dt.replace(tzinfo=timezone.utc)

    return now - last_dt >= timedelta(days=interval_days)
