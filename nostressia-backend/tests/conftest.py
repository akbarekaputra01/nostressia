import os
import sys
from pathlib import Path
from unittest.mock import MagicMock


# This allows testing the app even if data science libs are missing (e.g. Python 3.14 environment)
mock_modules = [
    "joblib", "numpy", "pandas", "scipy", "sklearn", "sklearn.linear_model", 
    "sklearn.preprocessing", "sklearn.pipeline", "sklearn.metrics", 
    "sklearn.model_selection", "sklearn.ensemble", "sklearn.tree", "papermill",
    "sib_api_v3_sdk", "sib_api_v3_sdk.rest", "app.services.ml_service",
    "azure", "azure.core", "azure.core.exceptions", "azure.storage", "azure.storage.blob",
    "pywebpush", "pytz", "apscheduler", "apscheduler.schedulers", 
    "apscheduler.schedulers.background", "apscheduler.triggers", 
    "apscheduler.triggers.cron", "apscheduler.jobstores", "apscheduler.jobstores.base"
]
for mod_name in mock_modules:
    sys.modules[mod_name] = MagicMock()
---------------------------------------

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("DB_USER", "test")
os.environ.setdefault("DB_PASSWORD", "test")
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_NAME", "nostressia_test")
os.environ.setdefault("BREVO_API_KEY", "test")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
# Import app AFTER mocks are in place
from app.main import create_app
from app.models import register_models


@pytest.fixture(scope="session")
def engine():
    # Ensure all models are registered
    register_models()
    engine = create_engine(
        "sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture()
def db_session(engine):
    connection = engine.connect()
    transaction = connection.begin()
    session_local = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = session_local()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    app = create_app()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)
