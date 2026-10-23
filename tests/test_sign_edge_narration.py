"""Sign-edge grahas: Baladi avastha line, directional sandhi, Lagna-edge note.

Started from a popular write-up about Saturn at 0.94° Meenam that got two
things wrong in a way a reader cannot catch: it called the stage "Bala (infant)"
— the odd-sign order, applied to an even sign — and it said the graha "carries
over" the previous house's results, which a whole-sign chart does not do. Each
test pins the engine's answer to one of those, for every graha and edge.
"""
from __future__ import annotations

import pytest

from app.calculations import lagna_edge
from app.calculations.astro import navamsa_rasi_from_degree
from app.calculations.chart_strength import (
    SANDHI_PENALTY,
    _avastha_multiplier,
    _dignity_score,
    compute_strength_breakdown,
    d9_dignity_label,
    explain_natal_planet_score,
)
from app.calculations.display_names import rasi_en
from app.schemas.charts import PlanetPosition
from app.services.chart_explanation_service import (
    _avastha_facet_value,
    _functional_context_en,
    _functional_context_ta,
    _planet_condition_states,
    _planet_facets,
)

MESHAM, KUMBAM, MEENAM = 1, 11, 12


def _planet(graha: str, rasi: int, degree: float, *, retro: bool = False) -> PlanetPosition:
    return PlanetPosition(
        graha=graha,
        rasiName="Synthetic",
        absoluteLongitude=(rasi - 1) * 30 + degree,
        rasi=rasi,
        degreeInRasi=degree,
        nakshatra=25,
        nakshatraName="Poorattathi",
        pada=4,
        houseFromLagna=12,
        speedDegPerDay=-0.05 if retro else 0.05,
        isRetrograde=retro,
        isCombust=False,
        d9Rasi=4,
        d9Dignity=d9_dignity_label(graha, 4),
        isVargottama=False,
        showRetrogradeBadge=retro,
        strengthScore=40,
    )


def _sandhi_en(planet: PlanetPosition) -> str | None:
    states = _planet_condition_states(
        planet, minor=False, war_opponent=None, war_lost=False, war_separation=0.0
    )
    return next((s.en for s in states if s.key == "sandhi"), None)


# ── Baladi avastha ───────────────────────────────────────────────────────────


@pytest.mark.no_db
def test_first_degree_of_an_even_sign_is_mrita_not_bala() -> None:
    value, tone = _avastha_facet_value(_planet("SATURN", MEENAM, 0.94))
    assert value is not None
    assert value.en.startswith("Mrita")
    assert "even sign" in value.en and "0°–6°" in value.en
    assert "மிருத" in value.ta
    assert tone == "CAUTION"


@pytest.mark.no_db
def test_first_degree_of_an_odd_sign_is_bala() -> None:
    value, tone = _avastha_facet_value(_planet("SATURN", MESHAM, 0.94))
    assert value is not None and value.en.startswith("Bala")
    assert "odd sign" in value.en
    assert tone == "NEUTRAL"


@pytest.mark.no_db
@pytest.mark.parametrize("rasi", range(1, 13))
def test_middle_band_is_yuva_in_every_sign(rasi: int) -> None:
    value, tone = _avastha_facet_value(_planet("JUPITER", rasi, 15.0))
    assert value is not None and value.en.startswith("Yuva")
    assert tone == "BOOST"


@pytest.mark.no_db
@pytest.mark.parametrize("graha", ["RAHU", "KETU", "MANDHI"])
def test_no_avastha_line_for_nodes_or_mandhi(graha: str) -> None:
    assert _avastha_facet_value(_planet(graha, MEENAM, 0.94)) == (None, "NEUTRAL")


@pytest.mark.no_db
def test_avastha_facet_sits_directly_under_strength() -> None:
    fn = "DUSTHANA"
    facets = _planet_facets(
        _planet("SATURN", MEENAM, 0.94),
        "NEUTRAL_SIGN",
        fn,
        current_role=None,
        dasha_chain_ta="x",
        dasha_chain_en="x",
        fn_context_ta=_functional_context_ta(fn),
        fn_context_en=_functional_context_en(fn),
        transit_contact_text=None,
        condition_states=[],
        co_tenants=[],
        owned_houses=[],
    )
    keys = [f.key for f in facets]
    assert keys[keys.index("strength") + 1] == "avastha"


# ── Directional sandhi ──────────────────────────────────────────────────────


@pytest.mark.no_db
def test_direct_graha_at_zero_degrees_has_just_arrived_from_the_previous_sign() -> None:
    en = _sandhi_en(_planet("SATURN", MEENAM, 0.94))
    assert en is not None
    assert "just crossed from Kumbam into Meenam" in en
    # The claim the write-up got wrong: no carry-over to the previous house.
    # Wording per ruling Q3 — "only from", never "fully" (which read as
    # "undiminished strength" and contradicted the edge penalty).
    assert "only from Meenam" in en
    assert "never moves it into Kumbam" in en
    assert "fully" not in en


@pytest.mark.no_db
def test_retrograde_graha_at_zero_degrees_is_about_to_slip_back() -> None:
    en = _sandhi_en(_planet("SATURN", MEENAM, 0.94, retro=True))
    assert en is not None and "leaving Meenam for Kumbam" in en


@pytest.mark.no_db
def test_direct_graha_at_the_end_of_meenam_heads_into_mesham() -> None:
    en = _sandhi_en(_planet("MARS", MEENAM, 29.6))
    assert en is not None and "leaving Meenam for Mesham" in en


@pytest.mark.no_db
def test_nodes_move_backwards_even_without_a_retrograde_flag() -> None:
    en = _sandhi_en(_planet("RAHU", MESHAM, 0.5))
    assert en is not None and "leaving Mesham for Meenam" in en
    en = _sandhi_en(_planet("KETU", KUMBAM, 29.5))
    assert en is not None and "just crossed from Meenam into Kumbam" in en


@pytest.mark.no_db
@pytest.mark.parametrize("degree", [1.01, 15.0, 28.99])
def test_no_sandhi_away_from_the_edge(degree: float) -> None:
    assert _sandhi_en(_planet("SATURN", MEENAM, degree)) is None


# ── Lagna edge ───────────────────────────────────────────────────────────────

_RATE = 0.25  # deg per minute — a sign rising in two hours


@pytest.fixture
def linear_lagna(monkeypatch: pytest.MonkeyPatch):
    """A Lagna that advances _RATE degrees per minute from wherever it starts."""

    def install(start_longitude: float) -> float:
        jd0 = 2460000.5

        def fake(jd: float, _lat: float, _lon: float) -> float:
            return (start_longitude + (jd - jd0) * 1440.0 * _RATE) % 360.0

        monkeypatch.setattr(lagna_edge, "calculate_lagna_degree", fake)
        return jd0

    return install


@pytest.mark.no_db
def test_lagna_half_a_degree_into_meenam_names_kumbam_and_the_minutes(linear_lagna) -> None:
    jd = linear_lagna(330.5)
    note = lagna_edge.lagna_edge_note(330.5, jd, 13.0, 80.0)
    assert note is not None
    ta, en = note
    assert "Meenam" in en and "Kumbam" in en and "2 minutes earlier" in en
    assert "மீனம்" in ta and "கும்பம்" in ta


@pytest.mark.no_db
def test_lagna_at_the_end_of_meenam_wraps_to_mesham(linear_lagna) -> None:
    jd = linear_lagna(359.8)
    note = lagna_edge.lagna_edge_note(359.8, jd, 13.0, 80.0)
    assert note is not None and "Mesham" in note[1] and "1 minute later" in note[1]


@pytest.mark.no_db
def test_mid_sign_lagna_gets_no_note(linear_lagna) -> None:
    jd = linear_lagna(345.0)
    assert lagna_edge.lagna_edge_note(345.0, jd, 13.0, 80.0) is None


@pytest.mark.no_db
def test_recorded_confidence_widens_the_window(linear_lagna) -> None:
    # 10° in = 40 minutes from the boundary: outside 5 min, inside ±60 min.
    jd = linear_lagna(340.0)
    assert lagna_edge.lagna_edge_note(340.0, jd, 13.0, 80.0) is None
    assert lagna_edge.lagna_edge_note(340.0, jd, 13.0, 80.0, confidence_minutes=60) is not None


@pytest.mark.no_db
def test_profile_without_a_place_gets_no_note() -> None:
    class _Profile:
        birth_latitude = None
        birth_longitude = None

    assert lagna_edge.lagna_edge_note_for_profile(330.5, 2460000.5, _Profile()) is None


# ── Scorer: ruling Q1 (one fact, one penalty) and Q2 (nodes exempt) ─────────

_SEVEN = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")
_HOUSE_STRENGTHS = {80.0, 75.0, 65.0, 55.0, 25.0, 50.0}


def _terms(graha: str, longitude: float):
    rasi = int(longitude // 30) + 1
    _, terms = explain_natal_planet_score(graha, rasi, longitude, 1, 200.0, False)
    return {t.key: t for t in terms}


@pytest.mark.no_db
@pytest.mark.parametrize("graha", _SEVEN)
@pytest.mark.parametrize("rasi", range(1, 13))
@pytest.mark.parametrize("edge", [0.4, 29.6])
def test_sign_edge_charges_the_larger_penalty_never_both(graha: str, rasi: int, edge: float) -> None:
    longitude = (rasi - 1) * 30 + edge
    dignity = _dignity_score(graha, rasi, longitude, None)
    baladi_cost = dignity * (1.0 - _avastha_multiplier(longitude, rasi, graha)) * 0.60 * 0.30
    terms = _terms(graha, longitude)
    sandhi = terms["sandhi"]
    avastha = _avastha_multiplier(longitude, rasi, graha)

    def implied_house_strength(applied_avastha: float) -> float:
        # sthana pts = (dignity * avastha * 0.60 + house_strength * 0.40) * 0.30
        return round((terms["sthana"].points - dignity * applied_avastha * 0.18) / 0.12, 6)

    if SANDHI_PENALTY > baladi_cost:
        # Edge penalty wins and REPLACES the avastha scaling (sthana at 1.0).
        assert sandhi.points == -SANDHI_PENALTY
        assert implied_house_strength(1.0) in _HOUSE_STRENGTHS
    else:
        assert implied_house_strength(avastha) in _HOUSE_STRENGTHS
        # Baladi already costs more: no -8 on top, and the row says why.
        assert sandhi.points == 0.0
        assert (sandhi.detail_key, sandhi.detail_value) == ("absorbed_by", "baladi")


@pytest.mark.no_db
def test_exalted_mrita_graha_keeps_baladi_and_drops_the_flat_eight() -> None:
    # Moon exalted in Rishabam (even sign), 0.4° in: Mrita, dignity 100 →
    # Baladi cost 13.5 > 8, so the -8 is absorbed. Before the ruling it paid both.
    sandhi = _terms("MOON", 30.4)["sandhi"]
    assert sandhi.points == 0.0


@pytest.mark.no_db
@pytest.mark.parametrize("node", ["RAHU", "KETU"])
@pytest.mark.parametrize("degree", [0.5, 3.0, 9.0, 15.0, 21.0, 27.0, 29.5])
def test_nodes_have_no_baladi_in_the_scorer(node: str, degree: float) -> None:
    longitude = 11 * 30 + degree
    assert _avastha_multiplier(longitude, 12, node) == 1.0
    breakdown = compute_strength_breakdown(node, 12, longitude, 1, True)
    assert breakdown["baladi"] == "NEUTRAL"


# ── Lagna edge: ruling Q4 tiers and the Navamsa Lagna ──────────────────────


@pytest.mark.no_db
def test_lagna_ten_minutes_from_the_edge_gets_the_soft_note(linear_lagna) -> None:
    jd = linear_lagna(332.5)  # 2.5° in at 0.25°/min = 10 minutes from Kumbam
    note = lagna_edge.lagna_edge_note(332.5, jd, 13.0, 80.0)
    assert note is not None
    assert "about 10 minutes earlier" in note[1]
    assert "rounded to 5 or 15 minutes" in note[1]
    assert "precise birth time" not in note[1]


@pytest.mark.no_db
def test_lagna_twenty_minutes_from_the_edge_gets_no_note(linear_lagna) -> None:
    jd = linear_lagna(335.0)  # 5° in = 20 min back, 25° = 100 min forward: both > 15
    assert lagna_edge.lagna_edge_note(335.0, jd, 13.0, 80.0) is None


@pytest.mark.no_db
def test_navamsa_lagna_change_inside_five_minutes_is_named(linear_lagna) -> None:
    # 331.0°: D9 boundary at 330° + 3°20' = 333.333°, and 330° behind. 1° back
    # at 0.25°/min = 4 min to the previous navamsa.
    jd = linear_lagna(331.0)
    note = lagna_edge.navamsa_lagna_edge_note(331.0, jd, 13.0, 80.0)
    assert note is not None
    before = navamsa_rasi_from_degree(329.9)
    assert "Navamsa (D9) Lagna" in note[1]
    assert "about 4 minutes earlier" in note[1]
    assert rasi_en(before) in note[1]


@pytest.mark.no_db
def test_navamsa_lagna_mid_segment_gets_no_note(linear_lagna) -> None:
    # Middle of the navamsa 330°-333°20': 1.67° from each edge = 6.7 min > 5.
    jd = linear_lagna(331.6667)
    assert lagna_edge.navamsa_lagna_edge_note(331.6667, jd, 13.0, 80.0) is None
