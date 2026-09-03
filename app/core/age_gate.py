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


MINOR_AGE = 18  # under this age: a minor (Tamil/Indian legal majority)


def is_minor(birth_date: date, *, as_of: date | None = None) -> bool:
    return compute_age(birth_date, as_of=as_of) < MINOR_AGE


def is_minor_age(age: int) -> bool:
    """Same as is_minor, but for callers that already have an int age
    rather than a birth_date (e.g. propensities, already computed once
    per request)."""
    return age < MINOR_AGE


# ── Age-band thresholds ──────────────────────────────────────────────────────

EDUCATION_LOWER_AGE = 6    # under-6: education/study windows not applicable
CAREER_LOWER_AGE = 18      # under-18: career predictions not applicable
MARRIAGE_UPPER_AGE = 50    # 50+: marriage timing not culturally applicable (Tamil/Indian)

# Traditional Tamil convention: Sevvai (Chevvai) Dosham's marriage-matching
# severity is treated as naturally softened — not fully cancelled — once the
# native crosses this age. Applied as an interpretive overlay at scoring time,
# not baked into the natal dosham calculation itself (which must stay age-independent).
SEVVAI_DOSHAM_SOFTENING_AGE = 28


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

# Minors (< 18): wellbeing/fertility/health topic redirect (P1-2, D11 hard
# gate) — mirrors propensity_service's WELLBEING/CAUTION hard-suppress so
# Ask Vinaadi doesn't answer in free text what the propensity cards
# deliberately withhold from the same viewer.
WELLBEING_REDIRECT_KEYWORDS: tuple[str, ...] = (
    "pregnant", "pregnancy", "conceive", "conception", "fertility", "child birth",
    "have a baby", "have children", "accident", "self harm", "suicide", "depression",
    "depressed", "lonely", "loneliness", "mental health", "anxiety",
    "கர்ப்பம்", "குழந்தை பேறு", "விபத்து", "மனச்சோர்வு", "தனிமை", "பதற்றம்",
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


# ── Gate 1: age-banded house re-signification (locus-shift) ─────────────────
#
# Classical house significations are not static labels — a house's *locus*
# (whose life it primarily describes) shifts with age and marital status.
# While the native is young and financially/domestically dependent on their
# family of origin, family-linked houses (2nd, 4th, 10th) are read through
# that family's life. Once the native crosses LOCUS_SHIFT_AGE, or marries
# (which is treated as establishing an independent household regardless of
# age), the same houses re-signify to describe the native's own life instead.
#
# This runs ahead of (and is independent from) the maturation/floor gates in
# get_blocked_life_modes above — it changes *what a house means*, not whether
# a life mode is shown at all.

LOCUS_SHIFT_AGE = 21

# House -> (family-of-origin signification, self signification)
FAMILY_LOCUS_HOUSES: dict[int, tuple[str, str]] = {
    2: ("family_wealth", "own_wealth"),          # 2nd: family's finances -> own finances/savings
    4: ("parental_home", "own_home"),            # 4th: mother/parental home -> own home/domestic life
    10: ("family_reputation", "own_career_reputation"),  # 10th: family's standing -> own career/public standing
}


def get_house_locus(house_number: int, age: int, marital_status: str | None = None) -> str:
    """Return 'family' or 'self' — whose life a family-linked house's
    signification currently describes (Gate-1 re-signification).

    Houses outside FAMILY_LOCUS_HOUSES are unaffected and always read as 'self'.
    """
    if house_number not in FAMILY_LOCUS_HOUSES:
        return "self"
    if is_married_settled(marital_status):
        return "self"
    return "self" if age >= LOCUS_SHIFT_AGE else "family"


def get_resignified_house_meaning(house_number: int, age: int, marital_status: str | None = None) -> str | None:
    """Return the signification key for a family-linked house given the
    current locus, or None if the house isn't subject to locus-shift."""
    meanings = FAMILY_LOCUS_HOUSES.get(house_number)
    if meanings is None:
        return None
    family_meaning, self_meaning = meanings
    return family_meaning if get_house_locus(house_number, age, marital_status) == "family" else self_meaning
