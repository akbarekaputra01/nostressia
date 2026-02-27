import importlib
import runpy
import sys
import types


def test_env_bool_parsing(monkeypatch):
    main_module = importlib.import_module("main")

    monkeypatch.delenv("FEATURE_FLAG", raising=False)
    assert main_module._env_bool("FEATURE_FLAG", default=True) is True
    assert main_module._env_bool("FEATURE_FLAG", default=False) is False

    monkeypatch.setenv("FEATURE_FLAG", "  TrUe ")
    assert main_module._env_bool("FEATURE_FLAG") is True

    monkeypatch.setenv("FEATURE_FLAG", "no")
    assert main_module._env_bool("FEATURE_FLAG") is False


def test_main_entrypoint_uses_host_port_and_reload(monkeypatch):
    fake_app_main = types.ModuleType("app.main")
    fake_app_main.app = object()
    monkeypatch.setitem(sys.modules, "app.main", fake_app_main)

    captured = {}

    def fake_run(target, host, port, reload):
        captured["target"] = target
        captured["host"] = host
        captured["port"] = port
        captured["reload"] = reload

    fake_uvicorn = types.ModuleType("uvicorn")
    fake_uvicorn.run = fake_run
    monkeypatch.setitem(sys.modules, "uvicorn", fake_uvicorn)

    monkeypatch.setenv("HOST", "0.0.0.0")
    monkeypatch.setenv("PORT", "9000")
    monkeypatch.setenv("UVICORN_RELOAD", "yes")

    sys.modules.pop("main", None)
    runpy.run_module("main", run_name="__main__")

    assert captured == {
        "target": "main:app",
        "host": "0.0.0.0",
        "port": 9000,
        "reload": True,
    }
