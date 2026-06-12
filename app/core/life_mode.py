"""Life Mode constants — Feature 2 (Life Mode Intent Picker).

Life Mode is the user's declared current focus. It is stored on
``user_preferences.life_mode`` and is distinct from ``users.user_mode`` (the
dashboard complexity mode).
"""
from __future__ import annotations

from app.core.age_gate import MINOR_BLOCKED_MODES

ALL_LIFE_MODES: set[str] = {
    "STUDY", "CAREER", "LOVE", "MARRIAGE", "FAMILY",
    "WEALTH", "HEALTH", "SPIRITUALITY", "REMEDIES", "BALANCED",
}

# Modes a minor (age < 18) is allowed to select.
MINOR_ALLOWED_MODES: set[str] = ALL_LIFE_MODES - MINOR_BLOCKED_MODES

DEFAULT_LIFE_MODE = "BALANCED"

# Re-show the picker if the mode was set more than this many days ago.
LIFE_MODE_STALE_DAYS = 30


def is_valid_mode(mode: str) -> bool:
    return mode in ALL_LIFE_MODES
