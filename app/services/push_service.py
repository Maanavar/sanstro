"""Compatibility wrapper for direct admin-triggered push sends."""
from __future__ import annotations

from app.services.fcm_service import send_push


def send_push_to_token(token: str, *, title: str, message: str) -> bool:
    return send_push(token, title, message)
