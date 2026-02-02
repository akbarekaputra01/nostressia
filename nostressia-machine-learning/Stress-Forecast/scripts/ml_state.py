from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict


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
        path.write_text(json.dumps(self.dump(), indent=2, sort_keys=True))


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
