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
