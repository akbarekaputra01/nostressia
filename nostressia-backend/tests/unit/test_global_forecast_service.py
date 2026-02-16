import sys

from app.services.global_forecast_service import GlobalForecastService


def test_resolve_model_type_prefers_explicit_type():
    service = GlobalForecastService()
    assert service._resolve_model_type({"type": "global_markov"}) == "global_markov"


def test_resolve_model_type_detects_pipe():
    service = GlobalForecastService()
    assert service._resolve_model_type({"pipe": object()}) == "global_ml_model"


def test_resolve_model_type_detects_markov():
    service = GlobalForecastService()
    assert service._resolve_model_type({"probs": [[[]]]}) == "global_markov"


def test_load_artifact_with_compat_retries_on_legacy_loss(monkeypatch):
    service = GlobalForecastService()
    state = {"attempts": 0}

    def fake_load(_):
        state["attempts"] += 1
        if state["attempts"] == 1:
            raise ModuleNotFoundError("No module named '_loss'", name="_loss")
        return {"ok": True}

    monkeypatch.setattr("app.services.global_forecast_service.joblib.load", fake_load)
    monkeypatch.delitem(sys.modules, "_loss", raising=False)

    loaded = service._load_artifact_with_compat("dummy.joblib")

    assert loaded == {"ok": True}
    assert state["attempts"] == 2
    assert "_loss" in sys.modules
