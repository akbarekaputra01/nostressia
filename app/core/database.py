"""Database configuration and session helpers."""
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    echo=False,
    pool_size=2,
    max_overflow=0,
    pool_recycle=1800,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Yield a database session that is properly closed after use."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
