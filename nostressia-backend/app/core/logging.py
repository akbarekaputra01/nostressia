"""Logging configuration helpers."""

import logging
from typing import Optional


def configure_logging(level: Optional[str] = None) -> None:
    """Configure root logging once with a consistent format."""
    root_logger = logging.getLogger()
    if root_logger.handlers:
        return

    resolved_level = logging.INFO
    if level:
        resolved_level = getattr(logging, level.upper(), logging.INFO)

    logging.basicConfig(
        level=resolved_level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
