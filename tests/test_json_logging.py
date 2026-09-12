"""Regression tests for the structured request logging contract (P2-7a)."""
from __future__ import annotations

import io
import json
import logging

from app.core.json_logging import JsonLogFormatter


def _capture_access_log() -> tuple[logging.Logger, logging.Handler, io.StringIO]:
    stream = io.StringIO()
    handler = logging.StreamHandler(stream)
    handler.setFormatter(JsonLogFormatter())
    access_logger = logging.getLogger("jothidam.access")
    access_logger.addHandler(handler)
    access_logger.setLevel(logging.INFO)
    return access_logger, handler, stream


def test_request_log_is_valid_json_with_correlation_fields(raw_client):
    access_logger, handler, stream = _capture_access_log()
    try:
        response = raw_client.get("/health")
    finally:
        access_logger.removeHandler(handler)

    assert response.status_code == 200
    entries = [json.loads(line) for line in stream.getvalue().splitlines() if line]
    request = next(entry for entry in entries if entry["message"] == "request")
    assert request["request_id"] == response.headers["X-Request-ID"]
    assert request["path"] == "/health"
    assert request["status"] == 200
    assert isinstance(request["duration_ms"], float)


def test_json_formatter_escapes_quotes_and_newlines_and_redacts_sensitive_values():
    logger = logging.Logger("tests.json_logging")
    stream = io.StringIO()
    handler = logging.StreamHandler(stream)
    handler.setFormatter(JsonLogFormatter())
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    try:
        try:
            raise RuntimeError('database said "no"\nwith a second line')
        except RuntimeError:
            logger.exception(
                'Failed for synthetic@example.test using Bearer secret-token',
                extra={
                    "token": "secret-token",
                    "lat": 12.3456,
                    "lon": 78.9012,
                    "notification": {"body": "private notification text"},
                },
            )
    finally:
        logger.removeHandler(handler)

    entry = json.loads(stream.getvalue())
    serialized = json.dumps(entry)
    assert entry["token"] == "[REDACTED]"
    assert entry["lat"] == "[REDACTED]"
    assert entry["lon"] == "[REDACTED]"
    assert entry["notification"]["body"] == "[REDACTED]"
    assert "synthetic@example.test" not in serialized
    assert "secret-token" not in serialized
    assert 'database said "no"' in entry["exception"]
