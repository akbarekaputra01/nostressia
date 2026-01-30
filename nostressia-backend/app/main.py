"""FastAPI application entry point."""

import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect
from sqlalchemy.exc import SQLAlchemyError

from app.api.api_router import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.models import register_models
from app.routes.root_route import router as root_router
from app.services.notification_scheduler import (
    start_notification_scheduler,
    stop_notification_scheduler,
)

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    # Register models so metadata contains all tables.
    register_models()

    # Upload folder
    upload_root = Path(__file__).resolve().parent.parent / "uploads"
    upload_root.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=upload_root), name="uploads")

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # HTTP exception handler
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.detail if isinstance(exc.detail, str) else "Request failed",
                "data": exc.detail if not isinstance(exc.detail, str) else None,
            },
        )

    # Validation exception handler
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "message": "Validation error",
                "data": exc.errors(),
            },
        )

    # STARTUP
    @app.on_event("startup")
    def on_startup() -> None:
        logger.info("FastAPI startup")

        # 1) Create all tables (including push_subscriptions) if missing.
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables ensured (create_all).")

        # 2) Sanity check for the users table.
        try:
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            logger.info("DB tables: %s", tables)

            if "users" not in tables:
                message = "Startup check failed: table 'users' not found."
                logger.error(message)
                raise RuntimeError(message)

            user_columns = {column["name"] for column in inspector.get_columns("users")}
            logger.info("Users columns: %s", sorted(list(user_columns)))

            if "username" not in user_columns:
                message = (
                    "Startup check failed: column 'users.username' not found. "
                    "Ensure database migrations have been applied."
                )
                logger.error(message)
                raise RuntimeError(message)

        except SQLAlchemyError as exc:
            logger.exception("Startup check failed due to database error.")
            raise RuntimeError("Startup check failed due to database error.") from exc

        # 3) Start scheduler
        logger.info("Starting notification scheduler.")
        app.state.notification_scheduler = start_notification_scheduler()
        logger.info("Notification scheduler started.")

    # SHUTDOWN
    @app.on_event("shutdown")
    def on_shutdown() -> None:
        logger.info("FastAPI shutdown")
        stop_notification_scheduler(getattr(app.state, "notification_scheduler", None))
        logger.info("Notification scheduler stopped.")

    # Routers
    app.include_router(root_router)
    app.include_router(api_router, prefix=settings.api_prefix)

    return app


app = create_app()
