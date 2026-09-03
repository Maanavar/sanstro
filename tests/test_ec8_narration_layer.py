"""EC-8 narration-layer regressions.

Every test here pins a defect that was found by reading the app's own output on
a real chart and tracing it back to the code — not a hypothetical. The common
shape of all of them: the ENGINE already computed the fact, and the narration
layer either dropped it, mis-keyed it, or addressed it to the wrong reader.
Guarding the bridge is the point; the calculations are covered elsewhere.
"""
from __future__ import annotations

from dataclasses import dataclass

import pytest

from app.calculations.chart_strength import (
    detect_planetary_wars,
    explain_natal_planet_score,
)
from app.schemas.charts import PlanetPosition, PlanetScoreTerm
from app.services.age_phase_service import (
    STAGE_ADULT,
    STAGE_CHILD,
    STAGE_INFANT,
    life_stage,
)
from app.services.chart_explanation_service import (
    _functional_context_en,
    _functional_context_ta,
    _house_theme,
    _natal_remedy_text,
    _planet_condition_states,
    _planet_facets,
    _planet_transit_contacts,
    _score_breakdown,
    _synthesis_facet_value,
)


@dataclass(frozen=True)
class _Body:
    """Minimal stand-in for an ephemeris body — only `rasi` is read."""

    graha: str
    rasi: int
    is_retrograde: bool = False


def _planet(
    graha: str,
    *,
    house: int = 1,
    rasi: int = 1,
    d9_rasi: int = 1,
    degree: float = 5.0,
    combust: bool = False,
    retro: bool = False,
    cazimi: bool = False,
    vargottama: bool = False,
    score_terms: list[PlanetScoreTerm] | None = None,
) -> PlanetPosition:
    return PlanetPosition(
        graha=graha,
        rasiName="Mesham",
        absoluteLongitude=(rasi - 1) * 30 + degree,
        rasi=rasi,
        degreeInRasi=degree,
        nakshatra=8,
        nakshatraName="Pusam",
        pada=2,
        houseFromLagna=house,
        speedDegPerDay=1.0,
        isRetrograde=retro,
        isCombust=combust,
        isCazimi=cazimi,
        d9Rasi=d9_rasi,
        isVargottama=vargottama,
        showRetrogradeBadge=retro,
        strengthScore=55,
        scoreTerms=score_terms or [],
    )


def _states(planet: PlanetPosition, **kwargs):
    return _planet_condition_states(
        planet,
        minor=kwargs.pop("minor", False),
        war_opponent=kwargs.pop("war_opponent", None),
        war_lost=kwargs.pop("war_lost", False),
        war_separation=kwargs.pop("war_separation", 0.0),
    )


def _facets(planet: PlanetPosition, *, stage: str = STAGE_ADULT, **kwargs):
    fn = kwargs.pop("fn", "KENDRA")
    return _planet_facets(
        planet,
        kwargs.pop("dignity", "OWN_SIGN"),
        fn,
        current_role=None,
        dasha_chain_ta="சுக்கிரன் மகாதசை",
        dasha_chain_en="Venus Mahadasha",
        fn_context_ta=_functional_context_ta(fn),
        fn_context_en=_functional_context_en(fn),
        transit_contact_text=None,
        condition_states=kwargs.pop("condition_states", None) or _states(planet),
        co_tenants=kwargs.pop("co_tenants", None) or [],
        owned_houses=kwargs.pop("owned_houses", None) or [],
        stage=stage,
    )


def _by_key(facets, key: str):
    return next((f for f in facets if f.key == key), None)


# ── P0-1 · transit contacts ─────────────────────────────────────────────────


@pytest.mark.no_db
def test_transit_over_own_natal_sign_is_reported() -> None:
    """The bug: `if source == natal_planet.graha: continue` silently deleted a
    graha returning to its own natal sign — the single most significant transit
    a chart can carry. Transiting Guru sitting exactly on natal Guru produced NO
    transit line, while a remote Mars aspect elsewhere produced one.
    """
    natal_jupiter = _planet("JUPITER", house=4, rasi=4)
    transits = {"JUPITER": _Body("JUPITER", 4)}
    contacts = _planet_transit_contacts(natal_jupiter, transits)
    assert [c.signal_type for c in contacts] == ["TRANSIT_RETURN"]


@pytest.mark.no_db
def test_return_outranks_a_competing_aspect() -> None:
    """A Sani return must not be hidden behind a Guru drishti. The old code
    reported whichever contact came first in source order."""
    natal_saturn = _planet("SATURN", house=12, rasi=12)
    transits = {
        "SATURN": _Body("SATURN", 12),   # return
        "JUPITER": _Body("JUPITER", 4),  # 9th-house drishti onto rasi 12
    }
    contacts = _planet_transit_contacts(natal_saturn, transits)
    assert contacts[0].signal_type == "TRANSIT_RETURN"
    assert contacts[0].source == "SATURN"


@pytest.mark.no_db
def test_conjunction_outranks_aspect() -> None:
    natal_moon = _planet("MOON", house=1, rasi=1)
    transits = {
        "MARS": _Body("MARS", 1),      # conjunction
        "SATURN": _Body("SATURN", 4),  # 10th drishti onto rasi 1
    }
    contacts = _planet_transit_contacts(natal_moon, transits)
    assert [c.source for c in contacts] == ["MARS", "SATURN"]


@pytest.mark.no_db
def test_nodal_drishti_ranks_last_but_a_nodal_conjunction_does_not() -> None:
    """The demotion targets the nodes' WIDE 5/7/9 drishti, which lands on most
    of the chart and crowds out contacts that actually decide a period. Rahu
    physically sitting on a natal graha is not that — a nodal gochara over a
    planet is a first-order transit in Tamil practice, so it keeps conjunction
    rank. Demoting it too would have replaced one silent omission with another.
    """
    natal_moon = _planet("MOON", house=1, rasi=1)

    # Wide drishti case: Rahu aspects rasi 1 from rasi 9 (5th-house drishti).
    aspect_only = _planet_transit_contacts(
        natal_moon, {"RAHU": _Body("RAHU", 9), "SATURN": _Body("SATURN", 4)}
    )
    assert [c.source for c in aspect_only] == ["SATURN", "RAHU"]

    # Conjunction case: Rahu is ON the natal Moon and keeps conjunction rank.
    conjunct = _planet_transit_contacts(
        natal_moon, {"RAHU": _Body("RAHU", 1), "SATURN": _Body("SATURN", 4)}
    )
    assert [c.source for c in conjunct] == ["RAHU", "SATURN"]


@pytest.mark.no_db
def test_trivially_true_nodal_opposition_is_suppressed() -> None:
    """Rahu and Ketu are 180° apart in BOTH the natal and the transit frame, so
    "transiting Ketu opposes your natal Rahu" fires exactly when the Rahu return
    fires and tells the reader nothing new. Presented as a finding it reads as
    insight; it is arithmetic.
    """
    natal_rahu = _planet("RAHU", house=11, rasi=11)
    transits = {
        "RAHU": _Body("RAHU", 11),  # return
        "KETU": _Body("KETU", 5),   # 7th from rasi 11 — always true alongside it
    }
    contacts = _planet_transit_contacts(natal_rahu, transits)
    assert [c.source for c in contacts] == ["RAHU"]


@pytest.mark.no_db
def test_a_genuine_aspect_still_reports() -> None:
    """Regression guard for the suppression above: a real contact with no
    conjunction anywhere must survive."""
    natal_moon = _planet("MOON", house=1, rasi=1)
    contacts = _planet_transit_contacts(natal_moon, {"JUPITER": _Body("JUPITER", 7)})
    assert len(contacts) == 1
    assert contacts[0].source == "JUPITER"
    assert contacts[0].signal_type == "TRANSIT_ASPECT_7TH"


# ── P0-2 · graha yuddham narration ──────────────────────────────────────────


@pytest.mark.no_db
def test_planetary_war_is_narrated_not_just_scored() -> None:
    """Detection and the -15 have existed for months; the reader was never told.
    A hole in a score with no stated cause is what makes a number look arbitrary.
    """
    mercury = _planet("MERCURY", house=7, rasi=7, degree=28.24)
    states = _states(mercury, war_opponent="VENUS", war_lost=True, war_separation=0.72)
    keys = [s.key for s in states]
    assert "planetary_war" in keys
    war = next(s for s in states if s.key == "planetary_war")
    assert "0.72" in war.en
    assert "Venus" in war.en
    assert war.ta.strip() and "0.72" in war.ta


@pytest.mark.no_db
def test_war_detection_and_narration_read_the_same_source() -> None:
    """The sentence and the -15 must never disagree about who lost. Both come
    from detect_planetary_wars, so this pins the contract rather than a value."""
    wars = detect_planetary_wars({"MERCURY": 208.24, "VENUS": 208.96})
    assert wars == {"MERCURY": "VENUS"}
    _, terms = explain_natal_planet_score(
        "MERCURY", 7, 208.24, 1, 100.0, False, planetary_wars=wars
    )
    war_term = next(t for t in terms if t.key == "planetary_war")
    assert war_term.points == -15.0
    assert war_term.detail_value == "VENUS"


# ── P0-4 · age gating ───────────────────────────────────────────────────────


@pytest.mark.no_db
def test_infant_house_themes_drop_career_and_income_framing() -> None:
    """An eight-month-old's chart was returned discussing her public standing at
    work and her income. The signification is unchanged; the surface it lands on
    is not a life she has."""
    adult_10 = _house_theme(10, STAGE_ADULT).en
    infant_10 = _house_theme(10, STAGE_INFANT).en
    assert "career" in adult_10
    assert "career" not in infant_10
    assert "aptitude" in infant_10

    infant_2 = _house_theme(2, STAGE_CHILD).en
    assert "money base" not in infant_2


@pytest.mark.no_db
def test_minor_condition_copy_drops_direct_adult_instructions() -> None:
    """"re-read an important message before sending it" was served verbatim on an
    infant's Mercury card. The astrology is right; the recipient does not exist."""
    mercury = _planet("MERCURY", house=3, rasi=3, combust=True)
    adult = _states(mercury, minor=False)
    child = _states(mercury, minor=True)
    adult_text = " ".join(s.en for s in adult)
    child_text = " ".join(s.en for s in child)
    assert "re-read an important message" in adult_text
    assert "re-read an important message" not in child_text
    # Still says the same astrological thing about the graha.
    assert "learning" in child_text or "speech" in child_text


@pytest.mark.no_db
def test_remedies_for_a_minor_address_the_parents() -> None:
    """A sesame-oil lamp instruction has no valid recipient on an infant chart."""
    adult = _natal_remedy_text("SATURN", STAGE_ADULT)
    child = _natal_remedy_text("SATURN", STAGE_INFANT)
    assert adult is not None and child is not None
    assert child.en.startswith("Parents may offer:")
    assert not adult.en.startswith("Parents may offer:")


@pytest.mark.no_db
def test_life_stage_boundaries() -> None:
    assert life_stage(0) == STAGE_INFANT
    assert life_stage(2) == STAGE_INFANT
    assert life_stage(3) == STAGE_CHILD
    assert life_stage(12) == STAGE_CHILD
    assert life_stage(13) == "TEEN"
    assert life_stage(18) == STAGE_ADULT
    assert life_stage(60) == "ELDER"


# ── P0-5 · remedy keying ────────────────────────────────────────────────────


@pytest.mark.no_db
def test_remedy_is_keyed_to_the_natal_graha_not_the_transit() -> None:
    """The facet used to carry the TRANSITING planet's remedy, so Moon, Mars and
    Saturn all showed the same Thursday/Vishnu/yellow line whenever transiting
    Guru touched them — labelled as each planet's own traditional support, and
    silently changing as the sky moved."""
    saturn = _natal_remedy_text("SATURN", STAGE_ADULT)
    moon = _natal_remedy_text("MOON", STAGE_ADULT)
    assert saturn is not None and moon is not None
    assert saturn.en != moon.en
    assert "Saturday" in saturn.en
    assert "Monday" in moon.en


@pytest.mark.no_db
def test_remedy_facet_is_stable_regardless_of_transits() -> None:
    """The same natal Saturn under two different skies must show one remedy."""
    saturn = _planet("SATURN", house=12, rasi=12)
    guru_sky = _facets(saturn)
    sevvai_sky = _facets(saturn)
    assert _by_key(guru_sky, "remedy").value.en == _by_key(sevvai_sky, "remedy").value.en
    assert "Saturn" in _by_key(guru_sky, "remedy").value.en


# ── P1-1 / P1-2 · composition and contradiction ─────────────────────────────


@pytest.mark.no_db
def test_conditions_compose_instead_of_one_winning() -> None:
    """The old chain returned the FIRST matching condition and discarded the
    rest, so a combust AND retrograde Mercury never mentioned its retrogression
    — which the score had already acted on."""
    mercury = _planet("MERCURY", house=7, rasi=7, combust=True, retro=True)
    keys = [s.key for s in _states(mercury)]
    assert "combust" in keys
    assert "retrograde" in keys


@pytest.mark.no_db
def test_sandhi_is_narrated_not_only_scored() -> None:
    """-8 has been charged at the sign edge since long before it was ever said
    out loud. It is frequently the whole reason a dignified graha lands
    mid-scale, which is exactly what made the number look wrong."""
    edge = _planet("JUPITER", house=4, rasi=4, degree=0.62)
    middle = _planet("JUPITER", house=4, rasi=4, degree=15.0)
    assert "sandhi" in [s.key for s in _states(edge)]
    assert "sandhi" not in [s.key for s in _states(middle)]


@pytest.mark.no_db
def test_cazimi_still_suppresses_combustion() -> None:
    """Composition must not undo a genuine exclusion — cazimi and combustion are
    mutually exclusive by definition, not merely co-occurring."""
    mercury = _planet("MERCURY", house=3, rasi=3, combust=True, cazimi=True)
    keys = [s.key for s in _states(mercury)]
    assert "cazimi" in keys
    assert "combust" not in keys


@pytest.mark.no_db
def test_contradiction_is_synthesised_not_averaged() -> None:
    """Own sign + combust + 8th house + D9 exalted are four facts. The reading is
    the sentence that puts them in tension — "strong, but restrained, and here is
    where it comes out" — rather than a fact list averaged to "moderate"."""
    mars = _planet("MARS", house=8, rasi=8, d9_rasi=10, combust=True)
    states = _states(mars)
    value, _tone = _synthesis_facet_value(mars, "OWN_SIGN", states)
    assert value is not None
    text = value.en
    assert "but" in text, "no contradiction was named"
    assert "own sign" in text
    assert "combustion" in text
    # The template must offer an outlet, not just name the tension and stop.
    assert "depth, endurance and transformation" in text
    assert value.ta.strip()


@pytest.mark.no_db
def test_no_synthesis_line_when_nothing_is_in_tension() -> None:
    """The synthesis facet must stay silent on a plain placement rather than
    manufacture a contradiction."""
    venus = _planet("VENUS", house=2, rasi=2, d9_rasi=3, degree=15.0)
    value, _ = _synthesis_facet_value(venus, "OWN_SIGN", _states(venus))
    assert value is None


# ── P1-3 · score explainability ─────────────────────────────────────────────


@pytest.mark.no_db
@pytest.mark.parametrize(
    ("graha", "rasi", "longitude", "kwargs"),
    [
        ("JUPITER", 4, 90.62, {"d9_rasi": 4, "is_vargottama": True}),
        ("MERCURY", 7, 208.24, {"d9_rasi": 3}),
        ("MARS", 8, 208.78, {"d9_rasi": 10}),
        ("SATURN", 12, 330.94, {"d9_rasi": 7}),
        ("SUN", 8, 197.0, {"d9_rasi": 1}),
    ],
)
def test_score_terms_always_sum_to_the_published_score(
    graha: str, rasi: int, longitude: float, kwargs: dict
) -> None:
    """A breakdown that does not add up is worse than no breakdown. The `clamp`
    term exists to absorb rounding and the 10/95 limit so this holds by
    construction rather than by luck."""
    score, terms = explain_natal_planet_score(
        graha, rasi, longitude, 1, 197.0, False, **kwargs
    )
    assert round(sum(t.points for t in terms)) == score


@pytest.mark.no_db
def test_score_breakdown_is_bilingual_and_labelled() -> None:
    """The engine owns the arithmetic and machine keys; every row must reach the
    reader with copy in both languages — no raw enum leaking through."""
    _, terms = explain_natal_planet_score(
        "MERCURY", 7, 208.24, 1, 197.0, False, d9_rasi=3
    )
    planet = _planet(
        "MERCURY",
        score_terms=[
            PlanetScoreTerm(
                key=t.key,
                points=t.points,
                detail_key=t.detail_key,
                detail_value=t.detail_value,
            )
            for t in terms
        ],
    )
    rows = _score_breakdown(planet)
    assert rows, "no breakdown produced"
    for row in rows:
        assert row.label.ta.strip() and row.label.en.strip(), f"{row.key} unlabelled"
        assert row.key not in row.label.en or row.key == row.label.en, (
            f"{row.key} label looks like a raw key"
        )
        if row.detail is not None:
            assert row.detail.ta.strip() and row.detail.en.strip()


@pytest.mark.no_db
def test_breakdown_still_sums_through_the_live_synthesis_pass() -> None:
    """`holistic_strength_synthesis` is ON in production, and it OVERWRITES
    strength_score after the base pass. If its four relational deltas were not
    appended, every published breakdown would quietly stop matching the number
    printed beside it — the exact failure the breakdown exists to prevent.

    Runs the real build path with a clearly synthetic identity.
    """
    from datetime import date, time

    from app.services._chart_build import _chart_response_from_profile

    class _SyntheticProfile:
        birth_profile_id = None
        display_name = "Synthetic Test Subject"
        birth_date_local = date(2025, 11, 4)
        birth_time_local = time(9, 20)
        birth_latitude = 13.0827
        birth_longitude = 80.2707
        birth_timezone = "Asia/Kolkata"
        birth_city = "Chennai"
        birth_state = "Tamil Nadu"
        birth_country = "India"
        birth_place = "Chennai, Tamil Nadu, India"
        gender = None
        gender_for_traditional_rules = None
        birth_time_accuracy = "exact"
        deleted_at = None
        relationship = None
        notes = None
        created_at = None
        updated_at = None

    response = _chart_response_from_profile(_SyntheticProfile(), "v1")
    scored = [p for p in response.data.planets if p.score_terms]
    assert scored, "no planet carried score terms"
    for planet in scored:
        total = sum(term.points for term in planet.score_terms)
        assert round(total) == planet.strength_score, (
            f"{planet.graha} breakdown sums to {total} but publishes "
            f"{planet.strength_score}"
        )
        # One residual row, not one per pass — two rows with the same label only
        # make sense added together, which is not what a reader does.
        assert [t.key for t in planet.score_terms].count("clamp") <= 1


@pytest.mark.no_db
def test_jupiter_exalted_vargottama_shows_why_it_is_not_90() -> None:
    """The reviewer's exact complaint: an exalted, vargottama Jupiter scores in
    the fifties and the reader has no way to discover why. The sandhi term is
    the answer and it must be visible."""
    score, terms = explain_natal_planet_score(
        "JUPITER", 4, 90.62, 1, 197.0, True, d9_rasi=4, is_vargottama=True
    )
    keys = {t.key for t in terms}
    assert "sandhi" in keys
    assert "vargottama" in keys
    assert score < 90


# ── P1-4 · lord-in-house synthesis ──────────────────────────────────────────


@pytest.mark.no_db
def test_lordship_and_placement_are_joined() -> None:
    """The card stated lordship and placement as two separate facts and never
    made the bhavat-bhavam join a jyotishi makes first."""
    sun = _planet("SUN", house=8, rasi=8)
    facets = _facets(sun, owned_houses=[5])
    lordship = _by_key(facets, "lordship")
    assert lordship is not None
    assert "5th" in lordship.value.en
    assert "8th" in lordship.value.en
    assert "children" in lordship.value.en or "learning" in lordship.value.en
    assert lordship.value.ta.strip()


@pytest.mark.no_db
def test_nodes_get_no_lordship_line() -> None:
    """Rahu and Ketu own no rasi. Asserting a lordship Parashari does not grant
    them is the same error the functional-nature copy was corrected for."""
    for node in ("RAHU", "KETU"):
        facets = _facets(_planet(node, house=5, rasi=5), owned_houses=[])
        assert _by_key(facets, "lordship") is None


@pytest.mark.no_db
def test_co_tenants_surface_on_the_planet_card() -> None:
    """Sun+Mars in the 8th and Mercury+Venus in the 7th are a chart's defining
    structures. They were computed chart-wide and never reached either
    participant's own card."""
    sun = _planet("SUN", house=8, rasi=8)
    facets = _facets(sun, co_tenants=["MARS"])
    company = _by_key(facets, "company")
    assert company is not None
    assert "Mars" in company.value.en
    assert company.value.ta.strip()
