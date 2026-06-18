"""Age and life-stage gating helpers.

Gate matrix (all gates are computed at request time from birth_date/marital_status,
never stored as flags, so they auto-update when the user's profile changes):

  0–5   (infant)  : health/family only
  6–17  (minor)   : add education; no career/love/marriage/wealth
  18–49 married   : career/wealth/health; marriage → Family Fortune reframe
  18–49 single    : everything
  50+   (senior)  : everything except marriage timing
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


# ── Age-band thresholds ──────────────────────────────────────────────────────

EDUCATION_LOWER_AGE = 6    # under-6: education/study windows not applicable
CAREER_LOWER_AGE = 18      # under-18: career predictions not applicable
MARRIAGE_UPPER_AGE = 50    # 50+: marriage timing not culturally applicable (Tamil/Indian)


def is_young_child(age: int) -> bool:
    """True for ages 0–5 — health/family only."""
    return age < EDUCATION_LOWER_AGE


def is_past_prime_marriage_age(age: int) -> bool:
    """True for 50+ — marriage timing redirected to companionship/spirituality."""
    return age >= MARRIAGE_UPPER_AGE


def is_married_settled(marital_status: str | None) -> bool:
    """True when the profile is actively in a marriage — section becomes Family Fortune."""
    return (marital_status or "").strip().lower() == "married"


# Statuses that are actively looking for marriage/love — show marriage fortune with
# contextual framing (second marriage / new chapter / healing).
REMARRIAGE_SEEKING_STATUSES: frozenset[str] = frozenset({"divorced", "widowed", "breakup"})


def is_seeking_marriage(marital_status: str | None) -> bool:
    """True for divorced/widowed/breakup — eligible for marriage fortune, contextually framed."""
    return (marital_status or "").strip().lower() in REMARRIAGE_SEEKING_STATUSES


# ── Life Mode blocking ───────────────────────────────────────────────────────

# Modes a minor (6–17) is never allowed to select.
MINOR_BLOCKED_MODES: frozenset[str] = frozenset({"LOVE", "MARRIAGE"})

# Additional modes blocked for young children (0–5) on top of MINOR_BLOCKED_MODES.
_INFANT_EXTRA_BLOCKED: frozenset[str] = frozenset({"CAREER", "STUDY", "WEALTH"})

# LifeEventWindow.event_type values filtered out for minors (Feature 5).
MINOR_BLOCKED_LIFE_EVENT_TYPES: frozenset[str] = frozenset({"MARRIAGE"})


def get_blocked_life_modes(age: int, marital_status: str | None) -> frozenset[str]:
    """Return the complete set of life modes blocked for this profile."""
    blocked: set[str] = set()

    if age < 18:
        blocked |= MINOR_BLOCKED_MODES
    if age < EDUCATION_LOWER_AGE:
        blocked |= _INFANT_EXTRA_BLOCKED
    if is_married_settled(marital_status):
        blocked |= {"LOVE", "MARRIAGE"}
    if is_past_prime_marriage_age(age):
        blocked.add("MARRIAGE")

    return frozenset(blocked)


# ── Ask Vinaadi keyword redirects ───────────────────────────────────────────

# Minors (< 18): love / marriage topic redirect.
MINOR_REDIRECT_KEYWORDS: tuple[str, ...] = (
    "marriage", "marry", "wedding", "spouse", "husband", "wife",
    "love", "romance", "romantic", "girlfriend", "boyfriend", "dating",
    "திருமணம்", "கல்யாணம்", "காதல்", "கணவன்", "மனைவி",
)

# Minors (< 18): career topic redirect.
CAREER_REDIRECT_KEYWORDS: tuple[str, ...] = (
    "job", "career", "work", "employment", "salary", "promotion",
    "business", "office", "interview", "resign",
    "வேலை", "தொழில்", "வியாபாரம்", "சம்பளம்", "நேர்காணல்",
)

# Young children (< 6): study / education topic redirect.
STUDY_REDIRECT_KEYWORDS: tuple[str, ...] = (
    "study", "studies", "school", "college", "education", "exam",
    "degree", "university", "class", "grade",
    "படிப்பு", "பள்ளி", "கல்லூரி", "தேர்வு", "கல்வி", "பல்கலைக்கழகம்",
)

# Married users: marriage-TIMING intent keywords (harmony questions are still OK).
MARRIED_TIMING_REDIRECT_KEYWORDS: tuple[str, ...] = (
    "when will i marry", "when will i get married", "marriage date", "marriage time",
    "when marriage", "will i marry", "get married", "find a partner",
    "எப்போது திருமணம்", "திருமணம் எப்போது", "கல்யாணம் எப்போது",
    "எப்போது கல்யாணம்", "திருமணம் ஆகுமா", "கல்யாணம் ஆகுமா",
)

# 50+ users: same love/marriage keywords as minor redirect.
SENIOR_MARRIAGE_REDIRECT_KEYWORDS = MINOR_REDIRECT_KEYWORDS
