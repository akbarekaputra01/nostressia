import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core import database as db_module
from app import main as main_module
from app.main import create_app


def test_settings_db_port_parsing_and_database_url(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
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

    settings_override = Settings(
        db_user="user",
        db_password="pass",
        db_host="localhost",
        db_name="nostressia",
        brevo_api_key="brevo",
        jwt_secret="very-secret-token",
        database_url_override="sqlite:///override.db",
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
