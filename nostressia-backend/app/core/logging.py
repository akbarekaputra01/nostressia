"""Logging configuration helpers."""

import logging
import sys
from typing import Optional

from app.core.config import settings

def configure_logging(level: Optional[str] = None) -> None:
    """
    Configure root logging. 
    Uses simple text format for development.
    """
    resolved_level = logging.INFO
    if level:
        try:
            resolved_level = getattr(logging, level.upper())
        except AttributeError:
            pass

    # Basic config with stdout handler
    logging.basicConfig(
        level=resolved_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True, # Overwrite any existing config
    )
    
    # Silence noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
