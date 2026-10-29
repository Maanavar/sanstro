"""AAU-07 / AAU-20 (ruled 2026-10-29): one answer to "is today good for
beginning ordinary new work?"

On 14 days of 2026 the calendar's நல்ல நாள் badge said good while the PDF and
push said caution: three hand-typed star lists, read on two different stars.
Everything now reads `day_quality`. Synthetic only: no person, no birth data.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path

import pytest

from app.calculations.day_quality import (
    FIT_STARS,
    NEUTRAL_STARS,
    STAR_CLASS,
    UNFIT_STARS,
    day_quality,
    star_fitness,
)
from app.calculations.panchangam import SUBHA_NAKSHATRA_NUMBERS, compute_daily_panchangam, day_quality_for
from app.data.marriage_muhurta_rules import MARRIAGE_NAKSHATRA_ALLOWED

pytestmark = pytest.mark.no_db

CHENNAI = (13.0827, 80.2707, "Asia/Kolkata")
MADURAI = (9.9252, 78.1198, "Asia/Kolkata")
MAGAM, MOOLAM, SADHAYAM = 10, 19, 24


# ── B. The seven classes ────────────────────────────────────────────────────

def test_every_star_has_exactly_one_class() -> None:
    assert sorted(STAR_CLASS) == list(range(1, 28))
    assert FIT_STARS | NEUTRAL_STARS | UNFIT_STARS == set(range(1, 28))
    assert (len(FIT_STARS), len(NEUTRAL_STARS), len(UNFIT_STARS)) == (16, 2, 9)


def test_magam_and_moolam_are_unfit_for_ordinary_work_but_stay_marriage_stars() -> None:
    assert star_fitness(MAGAM) == star_fitness(MOOLAM) == "UNFIT"
    assert {MAGAM, MOOLAM} <= set(MARRIAGE_NAKSHATRA_ALLOWED)


def test_sadhayam_is_fit_and_the_general_list_is_the_class_table() -> None:
    assert star_fitness(SADHAYAM) == "FIT"
    assert SUBHA_NAKSHATRA_NUMBERS == FIT_STARS


# ── C. The daytime star, and the split ──────────────────────────────────────

@dataclass(frozen=True)
class _Span:
    number: int
    start: datetime
    end: datetime


_SUNRISE = datetime(2026, 1, 1, 6, 30)
_SUNSET = datetime(2026, 1, 1, 18, 0)


def _spans(*cuts: tuple[int, int, int]) -> list[_Span]:
    """(star, start hour, end hour) on 1 Jan 2026."""
    base = datetime(2026, 1, 1)
    return [_Span(star, base + timedelta(hours=a), base + timedelta(hours=b)) for star, a, b in cuts]


def test_the_night_does_not_count() -> None:
    # Bharani holds 22:00 to the next sunrise (most of the 24 hours); Rohini
    # holds the whole daytime.
    spans = _spans((4, 6, 20), (2, 20, 30))
    quality = day_quality(spans, _SUNRISE, _SUNSET, fallback_star=4)
    assert (quality.verdict_star, quality.verdict, quality.split) == (4, "GOOD", None)


def test_a_daytime_change_into_another_column_is_a_split_with_its_time() -> None:
    spans = _spans((8, 6, 13), (9, 13, 30))  # Poosam until 13:00, then Ayilyam
    quality = day_quality(spans, _SUNRISE, _SUNSET, fallback_star=8)
    assert quality.verdict == "GOOD"  # Poosam holds 6.5 h of 11.5
    assert quality.split is not None
    assert (quality.split.change_at.hour, quality.split.before, quality.split.after) == (13, "GOOD", "CAUTION")


def test_a_change_within_one_column_is_not_a_split() -> None:
    spans = _spans((4, 6, 12), (5, 12, 30))  # Rohini then Mirugaseeridam, both fit
    assert day_quality(spans, _SUNRISE, _SUNSET, fallback_star=4).split is None


def test_a_block_lowers_good_to_neutral_and_never_to_caution() -> None:
    good = _spans((4, 6, 30))
    bad = _spans((2, 6, 30))
    assert day_quality(good, _SUNRISE, _SUNSET, fallback_star=4, block_reason="Tuesday").verdict == "NEUTRAL"
    assert day_quality(bad, _SUNRISE, _SUNSET, fallback_star=2, block_reason="Tuesday").verdict == "CAUTION"


# ── Acceptance: the surfaces cannot disagree ────────────────────────────────

# The audit's 14 days (Chennai, 2026), with the verdict this ruling gives.
# The seven Magam/Moolam days were "good" on the badge; the seven transition
# days now follow the daytime star and carry the change time.
_PINNED = {
    "2026-04-26": ("CAUTION", False), "2026-07-17": ("CAUTION", False), "2026-10-07": ("CAUTION", False),
    "2026-01-16": ("CAUTION", False), "2026-04-08": ("CAUTION", False), "2026-06-29": ("CAUTION", False),
    "2026-12-10": ("CAUTION", False),
    "2026-01-05": ("GOOD", True), "2026-03-01": ("CAUTION", True), "2026-11-29": ("CAUTION", True),
    "2026-02-22": ("GOOD", True), "2026-06-12": ("CAUTION", True), "2026-10-26": ("GOOD", True),
    "2026-12-20": ("GOOD", True),
}


@pytest.mark.parametrize("day", sorted(_PINNED))
def test_the_audits_fourteen_days(day: str) -> None:
    snapshot = compute_daily_panchangam(date.fromisoformat(day), *CHENNAI)
    quality = day_quality_for(snapshot)
    verdict, split = _PINNED[day]
    assert quality.verdict == verdict
    assert (quality.split is not None) == split
    assert snapshot.is_subha_muhurtham == (verdict == "GOOD")


@pytest.mark.parametrize(("place", "step"), [(CHENNAI, 1), (MADURAI, 5)])
def test_the_badge_and_the_shared_verdict_never_disagree(place: tuple[float, float, str], step: int) -> None:
    """Every day of 2026 at Chennai, every fifth at Madurai. Blind spot: once
    both read one module this cannot fail; it proves the wiring, and the source
    gate below is what keeps a second copy from coming back."""
    day = date(2026, 1, 1)
    while day.year == 2026:
        snapshot = compute_daily_panchangam(day, *place)
        assert snapshot.is_subha_muhurtham == day_quality_for(snapshot).is_good, day
        day += timedelta(days=step)


_ROOT = Path(__file__).resolve().parent.parent


@pytest.mark.parametrize(
    "path",
    ["app/services/pdf_export_service.py", "app/services/daily_push_cron.py", "app/services/daily_guidance_service.py"],
)
def test_no_general_verdict_reads_its_own_star(path: str) -> None:
    """Source gate: the PDF, the push and Today name the day's star through
    `day_quality_for`, never the 24-hour dominant star or a star list of their
    own. Run on the pre-AAU-07 code, all three fail."""
    source = (_ROOT / path).read_text(encoding="utf-8")
    assert "dominant_nakshatra_number" not in source
    assert "AUSPICIOUS_DAILY_NAKSHATRAS" not in source
    assert "day_quality_for(" in source
