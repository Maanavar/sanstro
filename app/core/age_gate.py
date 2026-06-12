"""Age-gating helpers — Feature 5 (Under-18 content gating).

Age is computed from `birth_profile.birth_date_local` at request time and never stored
as a flag (see GROWTH_FEATURES.md key decision #1). A user auto-upgrades the moment they
turn 18 with no manual intervention.
"""
from __future__ import annotations

from datetime import date


def compute_age(birth_date: date, *, as_of: date | None = None) -> int:
    today = as_of or date.today()
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )


def is_minor(birth_date: date, *, as_of: date | None = None) -> bool:
    return compute_age(birth_date, as_of=as_of) < 18


# Life Modes hidden from minors (Feature 2 picker).
MINOR_BLOCKED_MODES = {"LOVE", "MARRIAGE"}

# LifeEventWindow.event_type values filtered out for minors (Feature 5).
# Matches the Literal in app/schemas/life_events.py.
MINOR_BLOCKED_LIFE_EVENT_TYPES = {"MARRIAGE"}

# Substrings that, in a minor's Ask Vinaadi question, trigger a safe redirect.
MINOR_REDIRECT_KEYWORDS = (
    "marriage", "marry", "wedding", "spouse", "husband", "wife",
    "love", "romance", "romantic", "girlfriend", "boyfriend", "dating",
    "திருமணம்", "கல்யாணம்", "காதல்", "கணவன்", "மனைவி",
)
