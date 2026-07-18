"""Per-house (bhava) life-area reading.

The chart explanation's drishti list is planet-to-planet only. That means an
EMPTY house under a full aspect — an unoccupied 7th receiving Saturn's 10th
drishti, say — appeared nowhere in the reading, even though "what about my
marriage / career" is the question users actually bring and the aspect onto an
empty house is exactly how a jyotishi answers it. Raised in the 2026-07-18
astrologer review; `_build_bhava_section` closes it.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from app.services.chart_explanation_service import _build_bhava_section
from app.schemas.charts import PlanetPosition

pytestmark = pytest.mark.no_db

_ROOT_WEB = Path(__file__).resolve().parent.parent / "web" / "components"


def _planet(graha: str, rasi: int, lagna_rasi: int = 1, strength: int = 50) -> PlanetPosition:
    return PlanetPosition(
        graha=graha,
        rasi_name=f"Rasi{rasi}",
        absolute_longitude=(rasi - 1) * 30.0 + 15.0,
        rasi=rasi,
        degree_in_rasi=15.0,
        nakshatra=1,
        nakshatra_name="Ashwini",
        pada=1,
        house_from_lagna=((rasi - lagna_rasi) % 12) + 1,
        speed_deg_per_day=1.0,
        is_retrograde=False,
        is_combust=False,
        d9_rasi=rasi,
        is_vargottama=False,
        show_retrograde_badge=False,
        strength_score=strength,
    )


def test_every_house_is_reported_even_when_empty():
    section = _build_bhava_section([_planet("SUN", 1)], lagna_rasi=1)
    assert [b.house for b in section.bhavas] == list(range(1, 13))


def test_empty_house_under_aspect_names_the_aspecting_planet():
    """The case the section exists for.

    Mesha lagna. Saturn sits in the 10th house (Magaram, rasi 10) and nothing
    occupies the 7th (Thulam, rasi 7). Saturn's special 10th aspect from rasi 10
    lands on rasi 7 — so the marriage house is empty but aspected by Saturn, and
    the reading must say so rather than falling silent.
    """
    planets = [_planet("SATURN", 10), _planet("SUN", 1)]
    section = _build_bhava_section(planets, lagna_rasi=1)

    seventh = next(b for b in section.bhavas if b.house == 7)
    assert seventh.occupants == [], "the 7th should be empty in this fixture"
    assert "SATURN" in seventh.aspecting_planets, (
        "Saturn's 10th aspect from rasi 10 falls on rasi 7 and must be reported "
        f"— got {seventh.aspecting_planets}"
    )
    assert "Saturn" in seventh.explanation.en
    assert seventh.explanation.ta, "Tamil reading must not be empty"


def test_house_reports_its_lord_and_where_that_lord_sits():
    # Mesha lagna: the 7th house is Thulam, lord Venus. Put Venus in rasi 4
    # (Kadagam), which is the 4th house from a Mesha lagna.
    planets = [_planet("VENUS", 4), _planet("SUN", 1)]
    section = _build_bhava_section(planets, lagna_rasi=1)

    seventh = next(b for b in section.bhavas if b.house == 7)
    assert seventh.lord == "VENUS"
    assert seventh.lord_house == 4


def test_occupants_are_reported_and_not_double_counted_as_aspects():
    """A planet in a house occupies it; it does not also 'aspect' it."""
    planets = [_planet("MARS", 1), _planet("SUN", 1)]
    section = _build_bhava_section(planets, lagna_rasi=1)

    first = next(b for b in section.bhavas if b.house == 1)
    assert set(first.occupants) == {"MARS", "SUN"}
    assert "MARS" not in first.aspecting_planets
    assert "SUN" not in first.aspecting_planets


def test_occupant_and_aspect_verbs_agree_with_count_in_both_languages():
    """Tamil grahas take the honorific and inflect for count; so does English.

    The Tamil originally used the neuter singular "அமர்ந்துள்ளது" regardless of
    how many planets sat in the house, and English said "occupies" for a list of
    several. Corrected in the native-Tamil review pass (2026-07-18).
    """
    # Two planets in the Lagna -> plural on both sides.
    two = _build_bhava_section([_planet("MARS", 1), _planet("SUN", 1)], lagna_rasi=1)
    first = next(b for b in two.bhavas if b.house == 1)
    assert "அமர்ந்துள்ளனர்" in first.explanation.ta
    assert "occupy it." in first.explanation.en

    # One planet in the Lagna -> singular honorific on both sides.
    one = _build_bhava_section([_planet("MARS", 1)], lagna_rasi=1)
    first_one = next(b for b in one.bhavas if b.house == 1)
    assert "அமர்ந்துள்ளார்" in first_one.explanation.ta
    assert "occupies it." in first_one.explanation.en

    # Single aspecting planet -> singular honorific "பார்க்கிறார்".
    # Jupiter in rasi 9 throws its 5th aspect onto rasi 1 (Mesha lagna).
    aspect_one = _build_bhava_section([_planet("JUPITER", 9)], lagna_rasi=1)
    lagna = next(b for b in aspect_one.bhavas if b.house == 1)
    assert lagna.aspecting_planets == ["JUPITER"]
    assert "பார்க்கிறார்" in lagna.explanation.ta


def test_no_dative_suffix_or_bindu_transliteration_regressions():
    """Guard two Tamil corrections that are easy to silently undo.

    - The Ashtakavarga line must not inflect a graha name with a hardcoded
      dative ("சனிவுக்கு" is wrong; only u-final names take வுக்கு).
    - "விந்து" must not return as the word for an Ashtakavarga dot — in modern
      Tamil it reads primarily as "semen". The term is "பரல்".

    Checked against the web component because that is where the string lives.
    """
    panel = (
        _ROOT_WEB / "dashboard-chart-explanation.tsx"
    ).read_text(encoding="utf-8")
    # Only look at the rendered template literals, not the explanatory comment
    # that names the rejected forms on purpose.
    rendered = "\n".join(
        line for line in panel.splitlines() if "அஷ்டகவர்க்கம்" in line
    )
    assert rendered, "Ashtakavarga Tamil line not found — did it move?"
    assert "வுக்கு" not in rendered, "a hardcoded dative suffix is back in the bindu line"
    assert "விந்து" not in rendered, "விந்து returned; the term should be பரல்"
    assert "பரல்" in rendered


def test_lagna_itself_surfaces_aspects_onto_it():
    """Aspects onto the Lagna were invisible before — it rarely holds a planet.

    Mesha lagna. Jupiter in rasi 9 (Dhanusu) throws its 5th aspect onto rasi 1.
    """
    planets = [_planet("JUPITER", 9)]
    section = _build_bhava_section(planets, lagna_rasi=1)

    first = next(b for b in section.bhavas if b.house == 1)
    assert first.occupants == []
    assert "JUPITER" in first.aspecting_planets
