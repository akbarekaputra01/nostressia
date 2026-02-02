import json

import pytest

from app.services import notebook_runner


def test_run_notebook_restores_env(tmp_path, monkeypatch):
    notebook = tmp_path / "nb.ipynb"
    notebook.write_text("{}")
    output = tmp_path / "out" / "executed.ipynb"

    captured = {}

    def fake_execute_notebook(**kwargs):
        captured.update(kwargs)

    monkeypatch.setattr(notebook_runner.pm, "execute_notebook", fake_execute_notebook)

    notebook_runner.run_notebook(
        notebook_path=str(notebook),
        parameters={"value": 1},
        executed_output_path=str(output),
        env={"CUSTOM_ENV": "1"},
    )

    assert captured["parameters"]["value"] == 1
    assert output.exists() is False


def test_validate_joblib_output(tmp_path):
    missing = tmp_path / "missing.joblib"
    with pytest.raises(FileNotFoundError):
        notebook_runner.validate_joblib_output(str(missing))

    empty = tmp_path / "empty.joblib"
    empty.write_text("")
    with pytest.raises(ValueError):
        notebook_runner.validate_joblib_output(str(empty))

    ok_file = tmp_path / "ok.joblib"
    ok_file.write_text("data")
    notebook_runner.validate_joblib_output(str(ok_file))


def test_read_metrics_json(tmp_path, caplog):
    assert notebook_runner.read_metrics_json(None) is None

    missing = tmp_path / "missing.json"
    assert notebook_runner.read_metrics_json(str(missing)) is None

    invalid = tmp_path / "invalid.json"
    invalid.write_text("not-json")
    assert notebook_runner.read_metrics_json(str(invalid)) is None

    valid = tmp_path / "valid.json"
    valid.write_text(json.dumps({"accuracy": 0.9}))
    assert notebook_runner.read_metrics_json(str(valid)) == {"accuracy": 0.9}
