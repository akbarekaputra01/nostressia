import logging

from app.core.logging import configure_logging


def test_configure_logging_sets_level_once():
    root_logger = logging.getLogger()
    original_handlers = list(root_logger.handlers)
    original_level = root_logger.level

    try:
        root_logger.handlers = []
        root_logger.setLevel(logging.WARNING)

        configure_logging("DEBUG")
        assert root_logger.handlers, "Expected logging to configure handlers"
        assert root_logger.level == logging.DEBUG

        handler_count = len(root_logger.handlers)
        configure_logging("INFO")
        assert len(root_logger.handlers) == handler_count
    finally:
        root_logger.handlers = original_handlers
        root_logger.setLevel(original_level)
