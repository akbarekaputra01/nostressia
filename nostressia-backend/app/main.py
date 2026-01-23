import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import inspect
from sqlalchemy.exc import SQLAlchemyError

from app.api.api_router import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.models import register_models

logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    register_models()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

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

    @app.on_event("startup")
    def on_startup() -> None:
        Base.metadata.create_all(bind=engine)

        try:
            inspector = inspect(engine)
            if "users" not in inspector.get_table_names():
                message = "Startup check failed: table 'users' not found."
                logger.error(message)
                raise RuntimeError(message)

            user_columns = {column["name"] for column in inspector.get_columns("users")}
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

    app.include_router(api_router, prefix=settings.api_prefix)

    return app

app = create_app()
