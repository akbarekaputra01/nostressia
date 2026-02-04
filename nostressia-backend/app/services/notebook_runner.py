import json
import logging
import os
from pathlib import Path
from typing import Any, Dict

import papermill as pm

logger = logging.getLogger(__name__)


def run_notebook(
    notebook_path: str,
    parameters: Dict[str, Any],
    executed_output_path: str,
    env: Dict[str, str] | None = None,
) -> None:
    """Run notebook headless via papermill, saving executed notebook to disk."""
    notebook = Path(notebook_path).resolve()
    output = Path(executed_output_path).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    original_cwd = Path.cwd()
    original_env = os.environ.copy()
    if env:
        os.environ.update({k: str(v) for k, v in env.items()})

    try:
        os.chdir(notebook.parent)
        pm.execute_notebook(
            notebook_path=str(notebook),
            output_path=str(output),
            parameters=parameters,
            log_output=True,
        )
    finally:
        os.chdir(original_cwd)
        os.environ.clear()
        os.environ.update(original_env)


def validate_joblib_output(joblib_path: str) -> None:
    """Ensure joblib artifact exists and is non-empty."""
    artifact = Path(joblib_path)
    if not artifact.exists():
        raise FileNotFoundError(f"Model artifact not found: {artifact}")
    if artifact.stat().st_size <= 0:
        raise ValueError(f"Model artifact is empty: {artifact}")


def read_metrics_json(metrics_path: str | None) -> Dict[str, Any] | None:
    if not metrics_path:
        return None
    metrics_file = Path(metrics_path)
    if not metrics_file.exists():
        return None
    try:
        return json.loads(metrics_file.read_text())
    except json.JSONDecodeError:
        logger.warning("Failed to parse metrics JSON at %s", metrics_path)
        return None
