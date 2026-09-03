"""JSON log formatting with central privacy redaction.

Logs are consumed by machines in production, so serialising the record through
``json.dumps`` is safer than interpolating a JSON-looking format string. Keeping
redaction here makes it apply to every logger rather than relying on each caller
to remember the privacy rules.
"""
from __future__ import annotations

import json
import logging
import re
from collections.abc import Mapping
from typing import Any

_STANDARD_LOG_RECORD_FIELDS = frozenset(logging.makeLogRecord({}).__dict__)
_SENSITIVE_KEY_PARTS = frozenset(
    {
        "authorization",
        "email",
        "latitude",
        "longitude",
        "lat",
        "lon",
        "password",
        "secret",
        "token",
    }
)
_NOTIFICATION_TEXT_KEYS = frozenset({"body", "notification_body", "notification_text", "text"})
_EMAIL_RE = re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b")
_BEARER_RE = re.compile(r"(?i)\bbearer\s+[A-Za-z0-9._~+/=-]+")
_REDACTED = "[REDACTED]"


def _is_sensitive_key(key: str) -> bool:
    normalized = key.lower().replace("-", "_")
    parts = set(normalized.split("_"))
    return bool(parts & _SENSITIVE_KEY_PARTS) or normalized in _NOTIFICATION_TEXT_KEYS


def _redact_text(value: str) -> str:
    value = _BEARER_RE.sub("Bearer [REDACTED]", value)
    return _EMAIL_RE.sub(_REDACTED, value)


def _redact(value: Any, *, key: str | None = None) -> Any:
    if key is not None and _is_sensitive_key(key):
        return _REDACTED
    if isinstance(value, str):
        return _redact_text(value)
    if isinstance(value, Mapping):
        return {str(item_key): _redact(item_value, key=str(item_key)) for item_key, item_value in value.items()}
    if isinstance(value, list | tuple | set | frozenset):
        return [_redact(item) for item in value]
    return value


class JsonLogFormatter(logging.Formatter):
    """Emit valid JSON while preserving structured ``extra=`` fields."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "time": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": _redact_text(record.getMessage()),
        }
        for key, value in record.__dict__.items():
            if key not in _STANDARD_LOG_RECORD_FIELDS:
                payload[key] = _redact(value, key=key)
        if record.exc_info:
            payload["exception"] = _redact_text(self.formatException(record.exc_info))
        return json.dumps(payload, ensure_ascii=False, default=str, separators=(",", ":"))
