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

from app.calculations.chart_strength import d9_dignity_label
from app.schemas.charts import PlanetPosition
from app.services.chart_explanation_service import _build_bhava_section

pytestmark = pytest.mark.no_db

_ROOT_WEB = Path(__file__).resolve().parent.parent / "web" / "components"


def _planet(
    graha: str,
    rasi: int,
    lagna_rasi: int = 1,
    strength: int = 50,
    d9_rasi: int | None = None,
) -> PlanetPosition:
    # Defaults to the Rasi sign (vargottama) so existing fixtures are unchanged; pass
    # `d9_rasi` explicitly where a test needs the two vargas to differ.
    d9 = rasi if d9_rasi is None else d9_rasi
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
        d9_rasi=d9,
        # Derived, never hand-typed: a fixture that pairs a navamsa sign with a
        # dignity it cannot carry states a rule the engine does not hold.
        d9_dignity=d9_dignity_label(graha, d9),
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

# ── Bhava palan reaches the response (2026-09-28) ──────────────────────────────
#
# The verdict/why/conduct triple is assembled in `_build_bhava_section`, so these
# assert it is actually ON the schema object a surface receives — not merely that
# the calculation module works, which tests/test_bhava_palan.py already covers.


def test_every_house_carries_a_verdict_and_conduct():
    planets = [_planet("SATURN", 10), _planet("SUN", 1), _planet("VENUS", 7, strength=29)]
    section = _build_bhava_section(planets, lagna_rasi=1)

    for bhava in section.bhavas:
        assert bhava.verdict in {"SUPPORTED", "MIXED", "NEEDS_CARE"}, bhava.house
        assert bhava.polarity in {"DIRECT", "UPACHAYA", "INVERTED"}, bhava.house
        # Both languages, always — an English-only payload strands every Tamil
        # reader, and the audit harness pins its account to lang "en" so nothing
        # else in CI would notice.
        for field in (bhava.band_word, bhava.house_label, bhava.framing, bhava.why):
            assert field is not None, f"house {bhava.house} missing a palan field"
            assert field.ta and field.en
        assert len(bhava.lean_on) >= 1
        assert len(bhava.go_slowly_with) >= 1
        for item in bhava.lean_on + bhava.go_slowly_with:
            assert item.ta and item.en


def test_dusthana_polarity_and_notes_are_wired_through():
    section = _build_bhava_section([_planet("SUN", 1)], lagna_rasi=1)
    by_house = {b.house: b for b in section.bhavas}

    for house in (6, 8, 12):
        assert by_house[house].polarity == "INVERTED"
        # The line that stops a green chip on a low house looking like a bug.
        assert by_house[house].polarity_note is not None
    for house in (3, 11):
        assert by_house[house].polarity == "UPACHAYA"
        assert by_house[house].polarity_note is not None
    for house in (1, 7, 10):
        assert by_house[house].polarity_note is None


def test_the_eighth_house_label_avoids_the_longevity_register():
    """ஆயுள் ஸ்தானம் is the almanac name and is deliberately NOT used — it invites
    exactly the longevity question this product permanently refuses."""
    section = _build_bhava_section([_planet("SUN", 1)], lagna_rasi=1)
    eighth = next(b for b in section.bhavas if b.house == 8)
    assert eighth.house_label is not None
    assert "ஆயுள்" not in eighth.house_label.ta


def test_a_weak_seventh_lord_does_not_produce_a_supported_seventh():
    """The defect that motivated the whole panel, asserted at the seam.

    Mesha lagna: the 7th is Thulam, its lord Venus. Venus weak and placed away
    from the 7th, with Saturn's 10th drishti landing on the empty 7th, must not
    band SUPPORTED — which is exactly what the old UI dot showed, because it read
    only the lord's score and ignored the aspect.
    """
    planets = [_planet("VENUS", 3, strength=22), _planet("SATURN", 10), _planet("SUN", 1)]
    section = _build_bhava_section(planets, lagna_rasi=1)
    seventh = next(b for b in section.bhavas if b.house == 7)

    assert seventh.occupants == []
    assert "SATURN" in seventh.aspecting_planets
    assert seventh.verdict != "SUPPORTED", (
        f"an empty, Saturn-aspected 7th with a weak lord banded {seventh.verdict}"
    )
    # And the reason must name a graha, so the reader can check it on the chart.
    assert seventh.why is not None
    assert any(n in seventh.why.en for n in ("Venus", "Saturn"))


# ── The Navamsa must actually reach the why-line ────────────────────────────────
#
# Every test of the clause itself lives in tests/test_bhava_palan.py and hands
# `build_palan` a D9 map directly, so all of them stay green if this wiring is
# dropped. This is the only check that `_build_bhava_section` really passes one.


def test_the_navamsa_reaches_the_bhava_why_line(monkeypatch):
    """Capture what the section hands down, rather than asserting on rendered copy.

    Asserting on the sentence would pass for the wrong reason: three of the four
    neecha bhanga routes are Rasi-side and produce a clause with no Navamsa involved.

    Discriminating by construction — every planet's D9 sign differs from its Rasi
    sign, so this fails if the map is dropped (KeyError), if it is never passed
    (None), or if `planets_rasi` is passed in its place.
    """
    seen: list[dict] = []
    import app.services.chart_explanation_service as svc

    real = svc.build_palan

    def spy(*args, **kwargs):
        seen.append(dict(kwargs))
        return real(*args, **kwargs)

    monkeypatch.setattr(svc, "build_palan", spy)

    planets = [
        _planet("SUN", 1, d9_rasi=5),
        _planet("VENUS", 6, d9_rasi=11),
        _planet("SATURN", 9, d9_rasi=2),
    ]
    rasi_map = {"SUN": 1, "VENUS": 6, "SATURN": 9}
    d9_map = {"SUN": 5, "VENUS": 11, "SATURN": 2}

    _build_bhava_section(planets, lagna_rasi=1, d9_lagna_rasi=4)

    assert len(seen) == 12
    for kwargs in seen:
        assert kwargs["d9_lagna_rasi"] == 4
        assert kwargs["d9_rasi"] == d9_map
        assert kwargs["d9_rasi"] != rasi_map


def test_the_navamsa_is_absent_rather_than_guessed_when_not_supplied(monkeypatch):
    """Omitting the D9 lagna must pass None down, never a stand-in.

    `lord_dignity_of` falls back to sign-level D9 dignity when the D9 lagna is unknown,
    which is a different (weaker) bhanga test — substituting the Rasi lagna here would
    silently answer a question the caller did not ask.
    """
    seen: list[dict] = []
    import app.services.chart_explanation_service as svc

    real = svc.build_palan

    def spy(*args, **kwargs):
        seen.append(dict(kwargs))
        return real(*args, **kwargs)

    monkeypatch.setattr(svc, "build_palan", spy)
    _build_bhava_section([_planet("SUN", 1, d9_rasi=5)], lagna_rasi=1)

    assert seen and all(kwargs["d9_lagna_rasi"] is None for kwargs in seen)


def test_the_bhava_band_does_not_move_when_the_navamsa_does(monkeypatch):
    """The clause explains the number; it must not change it (ruling Q5).

    `compute_bhava_bala` feeds the live Life Areas score, so a reading panel that
    shifted a band would move every user's numbers for a copy change.
    """
    planets_a = [_planet("SUN", 1, d9_rasi=5), _planet("VENUS", 6, d9_rasi=11)]
    planets_b = [_planet("SUN", 1, d9_rasi=9), _planet("VENUS", 6, d9_rasi=3)]

    a = _build_bhava_section(planets_a, lagna_rasi=1, d9_lagna_rasi=4)
    b = _build_bhava_section(planets_b, lagna_rasi=1, d9_lagna_rasi=10)

    assert [x.bhava_bala for x in a.bhavas] == [x.bhava_bala for x in b.bhavas]
    assert [x.verdict for x in a.bhavas] == [x.verdict for x in b.bhavas]
