"""Runtime-editable feature flags stored in process memory."""
from __future__ import annotations

from typing import Any

from app.core.config import get_settings


def _defaults() -> dict[str, Any]:
    settings = get_settings()
    return {
        "enable_admin_data_delete": bool(settings.enable_admin_data_delete),
        "ask_vinaadi_daily_limit": int(settings.ask_vinaadi_daily_limit),
        "enable_push_notifications": True,
        "maintenance_mode": False,
        "max_birth_profiles_per_user": 10,
    }


_overrides: dict[str, Any] = {}


def get_flag(name: str) -> Any:
    defaults = _defaults()
    if name in _overrides:
        return _overrides[name]
    return defaults.get(name)


def set_flag(name: str, value: Any) -> None:
    defaults = _defaults()
    if name not in defaults:
        raise ValueError(f"Unknown flag: {name}")
    _overrides[name] = value


def reset_flag(name: str) -> None:
    _overrides.pop(name, None)


def all_flags() -> dict[str, dict[str, Any]]:
    defaults = _defaults()
    return {
        name: {
            "name": name,
            "value": get_flag(name),
            "default": default,
            "overridden": name in _overrides,
        }
        for name, default in defaults.items()
    }
