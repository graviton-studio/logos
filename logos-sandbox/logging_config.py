import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get log level from environment variable, default to INFO
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
VALID_LOG_LEVELS = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL,
}

# Default format for logs
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logger(name: str) -> logging.Logger:
    """
    Set up and return a logger with the given name.

    Args:
        name: Name of the logger, typically __name__ from the calling module

    Returns:
        Configured logger instance
    """
    # Create logger
    logger = logging.getLogger(name)

    # Set level based on environment variable or default
    level = VALID_LOG_LEVELS.get(LOG_LEVEL, logging.INFO)
    logger.setLevel(level)

    # Only add handlers if none exist (prevents duplicate handlers)
    if not logger.handlers:
        # Create console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(level)

        # Create formatter
        formatter = logging.Formatter(LOG_FORMAT, DATE_FORMAT)
        console_handler.setFormatter(formatter)

        # Add handler to logger
        logger.addHandler(console_handler)

    return logger


# Create root logger
root_logger = setup_logger("agent_workflow")
