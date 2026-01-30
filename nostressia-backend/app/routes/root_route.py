"""Root and healthcheck routes."""

from fastapi import APIRouter

router = APIRouter(tags=["Root"])


@router.get("/")
def root():
    """Root endpoint to confirm the API is running."""
    return {"status": "ok", "message": "Nostressia API is running"}


@router.get("/health")
def health():
    """Healthcheck endpoint for uptime monitoring."""
    return {"status": "ok"}
