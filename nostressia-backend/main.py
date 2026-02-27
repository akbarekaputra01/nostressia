import os

from app.main import app

__all__ = ["app"]


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    reload_enabled = _env_bool("UVICORN_RELOAD", default=False)

    uvicorn.run("main:app", host=host, port=port, reload=reload_enabled)
