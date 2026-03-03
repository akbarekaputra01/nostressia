import pytest
from fastapi import Body, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import Settings
from app.core import database as db_module
from app import main as main_module
from app.main import create_app


def test_settings_db_port_parsing_and_database_url(monkeypatch):
    # setenv overwrites the real values from .env (env vars have higher priority than .env file)
    monkeypatch.setenv("DATABASE_URL", "")
    monkeypatch.setenv("DB_PORT", "")
    monkeypatch.setenv("DB_USER", "user")
    monkeypatch.setenv("DB_PASSWORD", "pass")
    monkeypatch.setenv("DB_HOST", "localhost")
    monkeypatch.setenv("DB_NAME", "nostressia")
    settings = Settings(
        db_user="user",
        db_password="pass",
        db_host="localhost",
        db_name="nostressia",
        brevo_api_key="brevo",
        jwt_secret="very-secret-token",
        db_port=None,
        database_url_override=None,
    )
    assert settings.db_port == 3306
    assert (
        settings.database_url
        == "mysql+mysqlconnector://user:pass@localhost:3306/nostressia"
    )

    settings_blank_port = Settings(
        db_user="user",
        db_password="pass",
        db_host="localhost",
        db_name="nostressia",
        brevo_api_key="brevo",
        jwt_secret="very-secret-token",
        db_port="",
        database_url_override=None,
    )
    assert settings_blank_port.db_port == 3306

    monkeypatch.setenv("DATABASE_URL", "sqlite:///override.db")
    settings_override = Settings(
        db_user="user",
        db_password="pass",
        db_host="localhost",
        db_name="nostressia",
        brevo_api_key="brevo",
        jwt_secret="very-secret-token",
    )
    assert settings_override.database_url == "sqlite:///override.db"


def test_get_db_closes_session(monkeypatch):
    closed = {"value": False}

    class DummySession:
        def close(self):
            closed["value"] = True

    monkeypatch.setattr(db_module, "SessionLocal", lambda: DummySession())
    generator = db_module.get_db()
    session = next(generator)
    assert isinstance(session, DummySession)
    generator.close()
    assert closed["value"] is True


def test_app_startup_and_shutdown(monkeypatch):
    started = {"value": False}
    stopped = {"value": False}

    class FakeScheduler:
        def __init__(self):
            self.running = True

        def shutdown(self, wait=False):
            self.running = False

    def fake_start_scheduler():
        started["value"] = True
        return FakeScheduler()

    def fake_stop_scheduler(_scheduler):
        stopped["value"] = True

    class FakeInspector:
        def get_table_names(self):
            return ["users"]

        def get_columns(self, _):
            return [{"name": "username"}, {"name": "streak"}]

    def fake_create_all(*_args, **_kwargs):
        return None

    monkeypatch.setattr(main_module, "start_notification_scheduler", fake_start_scheduler)
    monkeypatch.setattr(main_module, "stop_notification_scheduler", fake_stop_scheduler)
    monkeypatch.setattr(main_module, "inspect", lambda _engine: FakeInspector())
    monkeypatch.setattr(main_module.Base.metadata, "create_all", fake_create_all)

    app = create_app()
    with TestClient(app):
        pass

    assert started["value"] is True
    assert stopped["value"] is True


def test_settings_rejects_weak_jwt_secret():
    with pytest.raises(ValueError, match="JWT_SECRET must be changed from the default placeholder"):
        Settings(
            db_user="user",
            db_password="pass",
            db_host="localhost",
            db_name="nostressia",
            brevo_api_key="brevo",
            JWT_SECRET="change-me",
        )

    with pytest.raises(ValueError, match="at least 8 characters"):
        Settings(
            db_user="user",
            db_password="pass",
            db_host="localhost",
            db_name="nostressia",
            brevo_api_key="brevo",
            JWT_SECRET="short",
        )


def test_settings_allows_missing_brevo_api_key(monkeypatch):
    monkeypatch.setenv("BREVO_API_KEY", "")
    settings = Settings(
        db_user="user",
        db_password="pass",
        db_host="localhost",
        db_name="nostressia",
        jwt_secret="very-secret-token",
        brevo_api_key="",
    )

    assert settings.brevo_api_key == ""


def test_lifespan_fails_when_users_table_missing(monkeypatch):
    class FakeInspector:
        def get_table_names(self):
            return []

    monkeypatch.setattr(main_module, "inspect", lambda _engine: FakeInspector())
    monkeypatch.setattr(main_module.Base.metadata, "create_all", lambda *_args, **_kwargs: None)

    app = create_app()
    with pytest.raises(RuntimeError, match="table 'users' not found"):
        with TestClient(app):
            pass


@pytest.mark.parametrize(
    "columns,expected_message",
    [
        ([{"name": "streak"}], "column 'users.username' not found"),
        ([{"name": "username"}], "column 'users.streak' not found"),
    ],
)
def test_lifespan_fails_when_required_user_columns_missing(
    monkeypatch,
    columns,
    expected_message,
):
    class FakeInspector:
        def get_table_names(self):
            return ["users"]

        def get_columns(self, _table_name):
            return columns

    monkeypatch.setattr(main_module, "inspect", lambda _engine: FakeInspector())
    monkeypatch.setattr(main_module.Base.metadata, "create_all", lambda *_args, **_kwargs: None)

    app = create_app()
    with pytest.raises(RuntimeError, match=expected_message):
        with TestClient(app):
            pass


def test_lifespan_wraps_sqlalchemy_error(monkeypatch):
    monkeypatch.setattr(main_module.Base.metadata, "create_all", lambda *_args, **_kwargs: None)

    def raise_sqlalchemy_error(_engine):
        raise SQLAlchemyError("boom")

    monkeypatch.setattr(main_module, "inspect", raise_sqlalchemy_error)

    app = create_app()
    with pytest.raises(RuntimeError, match="due to database error"):
        with TestClient(app):
            pass


def test_http_exception_handlers_and_validation(monkeypatch):
    monkeypatch.setattr(main_module, "start_notification_scheduler", lambda: object())
    monkeypatch.setattr(main_module, "stop_notification_scheduler", lambda _scheduler: None)

    class FakeInspector:
        def get_table_names(self):
            return ["users"]

        def get_columns(self, _):
            return [{"name": "username"}, {"name": "streak"}]

    monkeypatch.setattr(main_module, "inspect", lambda _engine: FakeInspector())
    monkeypatch.setattr(main_module.Base.metadata, "create_all", lambda *_args, **_kwargs: None)

    app = create_app()

    @app.get("/__test/http-detail-dict")
    async def raise_http_dict():
        raise HTTPException(status_code=400, detail={"code": "bad"})

    @app.get("/__test/http-detail-list")
    async def raise_http_list():
        raise HTTPException(status_code=401, detail=[{"code": "unauthorized"}])

    @app.post("/__test/validation")
    async def expects_name(name: str = Body(..., embed=True)):
        return {"name": name}

    with TestClient(app) as client:
        http_dict_response = client.get("/__test/http-detail-dict")
        assert http_dict_response.status_code == 400
        assert http_dict_response.json()["message"] == "Request failed"
        assert http_dict_response.json()["errors"] == [{"code": "bad"}]

        http_list_response = client.get("/__test/http-detail-list")
        assert http_list_response.status_code == 401
        assert http_list_response.json()["errors"] == [{"code": "unauthorized"}]

        validation_response = client.post("/__test/validation", json={})
        assert validation_response.status_code == 422
        assert validation_response.json()["message"] == "Validation error"
        assert validation_response.json()["errors"]


def test_create_app_enables_metrics_when_env_true(monkeypatch):
    monkeypatch.setenv("ENABLE_METRICS", "true")

    class DummyInstrumentator:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

        def instrument(self, app):
            app.state.instrument_called = True
            app.state.instrumentator_kwargs = self.kwargs
            return self

        def expose(self, app, **kwargs):
            app.state.expose_called = kwargs
            return self

    monkeypatch.setattr(main_module, "Instrumentator", DummyInstrumentator)

    app = create_app()
    assert app.state.instrument_called is True
    assert app.state.instrumentator_kwargs["env_var_name"] == "ENABLE_METRICS"
    assert app.state.expose_called["endpoint"] == "/metrics"
