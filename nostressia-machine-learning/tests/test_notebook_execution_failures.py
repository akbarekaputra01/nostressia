from __future__ import annotations

from pathlib import Path
import importlib.util
import sys

import nbformat
import pytest


ROOT = Path(__file__).resolve().parents[1]


def _load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


current_module = _load_module(
    "train_current_stress_test_module",
    ROOT / "Current-Stress" / "scripts" / "train_current_stress.py",
)

global_module = _load_module(
    "train_global_test_module",
    ROOT / "Stress-Forecast" / "scripts" / "train_global.py",
)

personalized_module = _load_module(
    "train_personalized_test_module",
    ROOT / "Stress-Forecast" / "scripts" / "train_personalized.py",
)


@pytest.mark.parametrize(
    ("module", "expected_message"),
    [
        (current_module, "current stress"),
        (global_module, "global forecast"),
        (personalized_module, "personalized forecast"),
    ],
)
def test_execute_notebook_raises_clear_error_when_preprocessor_fails(monkeypatch, tmp_path: Path, module, expected_message: str):
    notebook_path = tmp_path / "test_notebook.ipynb"
    notebook = nbformat.v4.new_notebook(cells=[nbformat.v4.new_code_cell("print('ok')")])
    nbformat.write(notebook, notebook_path)

    class DummyPreprocessor:
        def __init__(self, *args, **kwargs):
            pass

        def preprocess(self, notebook, resources):
            raise RuntimeError("boom")

    monkeypatch.setattr(module, "ExecutePreprocessor", DummyPreprocessor)

    with pytest.raises(RuntimeError, match=expected_message):
        module._execute_notebook(notebook_path, parameters={}, timeout_seconds=1)

    executed_files = list(notebook_path.parent.glob("executed_test_notebook_*.ipynb"))
    assert executed_files
