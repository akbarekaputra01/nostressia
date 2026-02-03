"""Database configuration and session helpers."""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings

def _build_engine():
    database_url = settings.database_url
    if database_url.startswith("sqlite"):
        engine_kwargs = {"connect_args": {"check_same_thread": False}, "future": True}
        if ":memory:" in database_url:
            engine_kwargs["poolclass"] = StaticPool
        return create_engine(database_url, **engine_kwargs)
    return create_engine(
        database_url,
        echo=False,
        pool_size=2,
        max_overflow=0,
        pool_recycle=1800,
        pool_pre_ping=True,
        future=True,
    )


engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
