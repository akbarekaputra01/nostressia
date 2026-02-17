import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import inspect
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.api_router import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.logging import configure_logging
from app.models import register_models
from app.routes.root_route import router as root_router
from app.services.notification_scheduler import (
    start_notification_scheduler,
    stop_notification_scheduler,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
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

        if "streak" not in user_columns:
            message = (
                "Startup check failed: column 'users.streak' not found. "
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

    try:
        yield
    finally:
        logger.info("FastAPI shutdown")
        stop_notification_scheduler(getattr(app.state, "notification_scheduler", None))
        logger.info("Notification scheduler stopped.")


def create_app() -> FastAPI:
    configure_logging(settings.log_level)
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

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
        detail = exc.detail
        is_message = isinstance(detail, str)
        errors = None
        if not is_message:
            errors = detail if isinstance(detail, list) else [detail]
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": detail if is_message else "Request failed",
                "data": None,
                "errors": errors,
                "meta": None,
            },
        )

    # Starlette HTTP exception handler (e.g., 404 from missing routes)
    @app.exception_handler(StarletteHTTPException)
    async def starlette_exception_handler(
        request: Request,
        exc: StarletteHTTPException,
    ):
        detail = exc.detail
        is_message = isinstance(detail, str)
        errors = None
        if not is_message:
            errors = detail if isinstance(detail, list) else [detail]
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": detail if is_message else "Request failed",
                "data": None,
                "errors": errors,
                "meta": None,
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
                "data": None,
                "errors": exc.errors(),
                "meta": None,
            },
        )

    # Routers
    app.include_router(root_router)
    app.include_router(api_router, prefix=settings.api_prefix)

    # Prometheus metrics endpoint (/metrics)
    enable_metrics = os.getenv("ENABLE_METRICS", "false").lower() == "true"
    logger.info(f"ENABLE_METRICS environment variable: {os.getenv('ENABLE_METRICS')}")
    logger.info(f"Parsed ENABLE_METRICS: {enable_metrics}")

    if enable_metrics:
        logger.info("Initializing Prometheus Instrumentator...")
        Instrumentator(
            should_group_status_codes=True,
            should_ignore_untemplated=True,
            should_respect_env_var=True,
            env_var_name="ENABLE_METRICS",
        ).instrument(app).expose(app, include_in_schema=False, endpoint="/metrics")
        logger.info("Prometheus Instrumentator initialized and exposed at /metrics")
    else:
        logger.info("Prometheus metrics DISABLED")

    return app


app = create_app()
