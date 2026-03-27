import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

from app.config.settings import get_settings


def _setup_logger() -> logging.Logger:
    settings = get_settings()

    log = logging.getLogger("app")
    log.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))

    # Console handler with colour-friendly format
    # Use UTF-8 stream to avoid UnicodeEncodeError on Windows (cp1252)
    utf8_stdout = open(sys.stdout.fileno(), mode="w", encoding="utf-8", closefd=False)
    console = logging.StreamHandler(utf8_stdout)
    console.setLevel(logging.DEBUG)
    console_fmt = logging.Formatter(
        "%(asctime)s [%(levelname)s]: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console.setFormatter(console_fmt)
    log.addHandler(console)

    # File handlers (rotating to prevent unbounded growth)
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    file_fmt = logging.Formatter(
        '{"time": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}',
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Error log — 5 MB per file, keep 3 backups
    error_handler = RotatingFileHandler(
        log_dir / "error.log", encoding="utf-8", maxBytes=5_000_000, backupCount=3,
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_fmt)
    log.addHandler(error_handler)

    # Combined log — 10 MB per file, keep 5 backups
    combined_handler = RotatingFileHandler(
        log_dir / "combined.log", encoding="utf-8", maxBytes=10_000_000, backupCount=5,
    )
    combined_handler.setLevel(logging.DEBUG)
    combined_handler.setFormatter(file_fmt)
    log.addHandler(combined_handler)

    return log


logger = _setup_logger()
