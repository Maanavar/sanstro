"""Unit tests for the life-propensity engine (Chances & Cautions).

No DB needed — the engine is pure over a PropensityChartInput.
"""
from __future__ import annotations

import re
from datetime import date

import pytest

pytestmark = pytest.mark.no_db


@pytest.fixture(autouse=True, scope="session")
def require_db():  # noqa: F811 — shadows conftest require_db; no DB needed
    return


from app.calculations.propensities import PlanetView, PropensityChartInput
from app.services.propensity_models import PropensityTier
from app.services.propensity_service import assess_propensities


def _mk(planets: dict[str, PlanetView], *, age: int = 30, lagna: int = 1,
        dasha: set[str] | None = None, yogas: set[str] | None = None,
        doshams: set[str] | None = None, sat_house: int | None = None,
        sade_sati: bool = False,
        vargas: dict[str, dict[str, int]] | None = None,
        transit_house_by_planet: dict[str, int] | None = None,
        sav_bindus: dict[int, int] | None = None,
        current_antardasha_start: date | None = None,
        current_antardasha_end: date | None = None) -> PropensityChartInput:
    return PropensityChartInput(
        lagna_rasi=lagna,
        planets=planets,
        active_dasha_lords=frozenset(dasha or set()),
        maha_lord=next(iter(dasha or {""}), ""),
        antar_lord="",
        yogas_present=frozenset(yogas or set()),
        doshams_active=frozenset(doshams or set()),
        age=age,
        sade_sati_active=sade_sati,
        saturn_transit_house=sat_house,
        vargas=vargas or {},
        transit_house_by_planet=transit_house_by_planet or {},
        sav_bindus=sav_bindus or {},
        current_antardasha_start=current_antardasha_start,
        current_antardasha_end=current_antardasha_end,
    )


# A neutral Mesha-lagna spread reused across tests.
def _base() -> dict[str, PlanetView]:
    return {
        "SUN": PlanetView(1, 1, 1, strength=55),
        "MOON": PlanetView(2, 2, 2, strength=55),
        "MARS": PlanetView(3, 3, 3, strength=55),
        "MERCURY": PlanetView(4, 4, 4, strength=55),
        "JUPITER": PlanetView(5, 5, 5, strength=55),
        "VENUS": PlanetView(6, 6, 6, strength=55),
        "SATURN": PlanetView(7, 7, 7, strength=55),
        "RAHU": PlanetView(8, 8, 8, strength=50),
        "KETU": PlanetView(2, 2, 2, strength=50),
    }


def test_returns_all_cards():
    bundle = assess_propensities(_mk(_base()))
    assert len(bundle.results) == 41
    keys = {r.key for r in bundle.results}
    assert {"love", "higher_education", "government_job", "emotional_load", "resilience_watch"} <= keys
    assert "degree_interruption_watch" in keys
    # Phase 3
    assert {
        "marriage_harmony", "business_partnership_fit", "foreign_settlement",
        "income_growth", "savings_capacity", "inheritance_lean",
        "litigation_season", "debt_watch", "competitive_edge", "swabhava_profile",
    } <= keys
    # Phase 4 (P2-2) — Career depth / Wealth / Property / Marriage timing tranche
    assert {
        "promotion_recognition", "entrepreneurial_timing", "workplace_conflict",
        "skill_mastery", "career_networking_influence", "career_change_success",
        "property_acquisition", "property_investment_timing", "ancestral_property_stability",
        "windfall_gains", "speculative_risk",
        "early_marriage_readiness", "marriage_delay_watch", "spousal_support_strength",
    } <= keys
    # P2-3 — Foreign/PR + Litigation sub-topics
    assert {"pr_immigration_prospects", "legal_outcome_favor", "contract_dispute_risk"} <= keys


def test_every_caution_card_carries_a_disclaimer():
    """Authoring safeguard (plan Part 6): breadth must not outrun the tone
    lint — a CAUTION-tier card with no disclaimer is a malformed card."""
    from app.services.propensity_service import _REGISTRY

    for spec in _REGISTRY:
        if spec.tier is PropensityTier.CAUTION:
            assert spec.disclaimer is not None, f"{spec.key} (CAUTION) must carry a disclaimer"


def test_levels_are_ordinal_never_percentage():
    bundle = assess_propensities(_mk(_base()))
    for r in bundle.results:
        # No card may surface a numeric percentage in the level string (D2).
        assert not any(ch.isdigit() for ch in r.level)


def test_sensitive_cards_carry_disclaimer_and_no_death_language():
    bundle = assess_propensities(_mk(_base()))
    sensitive = {"emotional_load", "loneliness", "accident_care", "child_timing", "resilience_watch"}
    # Word-boundary match so "upskill" doesn't trip on "kill", etc.
    banned = re.compile(r"\b(death|die|dies|died|dying|fatal|fatally|kill|kills|killed|suicide)\b")
    for r in bundle.results:
        if r.key in sensitive:
            assert r.disclaimer is not None, f"{r.key} must carry a disclaimer"
        blob = " ".join(
            [r.summary.en] + [f.detail.en for f in r.factors] + [h.en for h in r.what_helps]
        ).lower()
        assert not banned.search(blob), f"{r.key} used banned mortality language"


def test_emotional_load_shows_support_resources():
    r = next(x for x in assess_propensities(_mk(_base())).results if x.key == "emotional_load")
    assert r.show_support_resources is True


def test_strong_venus_and_fifth_support_lifts_love():
    planets = _base()
    # Venus exalted (Meenam=12) in the 5th house; benefic Jupiter aspecting 5th
    planets["VENUS"] = PlanetView(rasi=12, house=5, d9_rasi=12, strength=85)
    planets["JUPITER"] = PlanetView(rasi=9, house=9, d9_rasi=9, strength=80)  # 9th aspects 5th
    bundle = assess_propensities(_mk(planets, dasha={"VENUS"}))
    love = next(r for r in bundle.results if r.key == "love")
    assert love.tier is PropensityTier.CHANCE
    assert love.level in {"STRONG", "PROMISING"}
    assert love.window_note is not None  # Venus dasha active


def test_native_tamil_review_corrections_locked():
    """Native-Tamil review pass (C-4, 2026-07-14) corrected 14 propensity Tamil
    strings. Lock them at source level — most render only for specific charts, so
    an assertion on the module text is the robust regression guard. If a string is
    intentionally re-reworded later, update this test in the same change."""
    import inspect

    from app.calculations import propensities
    from app.services import propensity_service

    prop_src = inspect.getsource(propensities)
    svc_src = inspect.getsource(propensity_service)

    # Old wordings that must never come back (keyed to the review table).
    banned = [
        "சடே சதி",                    # #1/#2 — Hindi name; TN uses ஏழரை சனி
        "மதிப்புகளை பகிரும்",          # #3 — English calque
        "இணை ஆலோசனை",                 # #4 — unparseable coinage
        "பிடிவாதம் எல்லை",            # #5 — grammatically stranded
        "காதல் காலம் சாதகம்",          # #6 — clumsy
        "தூரம்/தாமதம் உணர்வு",         # #7 — தாமதம் = delay, wrong sense
        "செல்லுபடியாகும் — உங்கள்",     # #8 — "valid" like currency
        "பகிரப்பட்ட நேரம்",            # #9 — calque
        "சிரமமான வீட்டில்",            # #10 — standardise on கஷ்ட வீடு
        "பாபக் கிரகம்",               # #11 — sandhi
        "சனி மேலோங்கல்",              # #12 — lost the "over Mars" contrast
        "காலஅட்டவணை",                # #13 — missing space
        "குடியுரிமை",                 # #14 — citizenship, not PR
    ]
    for bad in banned:
        assert bad not in prop_src, f"banned Tamil wording resurfaced in propensities.py: {bad}"
        assert bad not in svc_src, f"banned Tamil wording resurfaced in propensity_service.py: {bad}"

    # Corrected wordings that must be present.
    assert "ஏழரை சனி காலம் — வேலையில் நிலைமாற்றம்" in prop_src
    assert "ஏழரை சனி காலம் — உணர்வு சுமை" in prop_src
    assert "தம்பதியர் ஆலோசனை" in prop_src
    assert "உறுதி பிடிவாதமாக மாறலாம்" in prop_src
    assert "தூரம்/விலகல் உணர்வு" in prop_src
    assert "கஷ்ட வீட்டில்" in prop_src
    assert "பாப கிரகம் — உறவில் அழுத்தம்" in prop_src
    assert "செவ்வாயை விட சனி வலு" in prop_src
    assert "கால அட்டவணை உதவும்" in prop_src
    assert "நிரந்தர குடியிருப்பு" in prop_src
    assert "நிரந்தர குடியிருப்பு (PR) வாய்ப்பு" in svc_src


def test_moon_saturn_raises_emotional_load_care():
    planets = _base()
    # Moon conjunct Saturn in the 8th — classic heavy-mind signature
    planets["MOON"] = PlanetView(rasi=8, house=8, d9_rasi=8, strength=35)
    planets["SATURN"] = PlanetView(rasi=8, house=8, d9_rasi=8, strength=60)
    bundle = assess_propensities(_mk(planets, sade_sati=True))
    load = next(r for r in bundle.results if r.key == "emotional_load")
    assert load.tier is PropensityTier.CAUTION
    assert load.level in {"WATCHFUL", "EXTRA_CARE"}


def test_age_gating_defers_adult_areas_for_a_child():
    bundle = assess_propensities(_mk(_base(), age=7))
    deferred = {r.key for r in bundle.results if r.deferred}
    assert {"love", "government_job", "child_timing"} <= deferred
    # every deferred card gives a gentle reason, not a blank
    for r in bundle.results:
        if r.deferred:
            assert r.deferred_reason is not None


def test_career_mode_is_directional():
    planets = _base()
    # strong Mars + 11th lord for enterprise lean
    planets["MARS"] = PlanetView(rasi=1, house=1, d9_rasi=1, strength=80)
    bundle = assess_propensities(_mk(planets))
    cm = next(r for r in bundle.results if r.key == "career_mode")
    assert cm.level in {"ENTERPRISE_LEANING", "SALARIED_LEANING", "BALANCED", "QUIET"}
    # its factors must never be rendered as a red "caution"
    assert all(f.status in {"SUPPORT", "NEUTRAL"} for f in cm.factors)


def test_quiet_when_no_signal():
    # An empty planet set → evaluators find nothing → QUIET, not a false denial (D3).
    bundle = assess_propensities(_mk({}))
    quiet = [r for r in bundle.results if r.level == "QUIET"]
    assert len(quiet) >= 5


# ── Phase 1: divisional-chart (varga) corroboration ──────────────────────────
# Each golden case is a hand-verified chart where the *same* D1 planet spread
# grades one way on its own and a different way once the domain varga is read —
# proving the varga vote (and only the varga vote) moved the outcome. A varga
# LAGNA of 1 (Mesha) makes each varga house-number equal its rasi-number, so the
# placements below read directly (planet in rasi 5 → 5th house of that varga).

def _level(planets, key, *, vargas=None, **kw):
    bundle = assess_propensities(_mk(planets, vargas=vargas, **kw))
    return next(r for r in bundle.results if r.key == key).level


def test_afflicted_d7_softens_children_timing():
    """Rasi already flags a delay (5th lord in a dusthana); the Saptamsa (D7)
    does not redeem it — malefic on the D7 5th and a debilitated Jupiter there —
    so the caution deepens WATCHFUL → EXTRA_CARE. Varga corroborates, never alone."""
    planets = {
        "SUN": PlanetView(rasi=8, house=8, d9_rasi=8),      # 5th lord (Simha=Sun) in dusthana
        "MOON": PlanetView(rasi=10, house=10, d9_rasi=10),
        "MARS": PlanetView(rasi=11, house=11, d9_rasi=11),
        "MERCURY": PlanetView(rasi=2, house=2, d9_rasi=2),
        "JUPITER": PlanetView(rasi=3, house=3, d9_rasi=3, strength=50),  # neutral, not aspecting 5th
        "VENUS": PlanetView(rasi=12, house=12, d9_rasi=12),
        "SATURN": PlanetView(rasi=7, house=7, d9_rasi=7),
        "RAHU": PlanetView(rasi=6, house=6, d9_rasi=6),
        "KETU": PlanetView(rasi=12, house=12, d9_rasi=12),
    }
    # Afflicted Saptamsa: Saturn (malefic) on the D7 5th, Jupiter debilitated (rasi 10).
    d7 = {"LAGNA": 1, "SATURN": 5, "JUPITER": 10, "MERCURY": 2, "VENUS": 3,
          "MOON": 8, "SUN": 9, "MARS": 6, "RAHU": 7, "KETU": 1}

    assert _level(planets, "child_timing") == "WATCHFUL"
    assert _level(planets, "child_timing", vargas={"D7": d7}) == "EXTRA_CARE"


def test_blessed_d7_eases_children_timing():
    """Same anxious Rasi read, but a blessed Saptamsa (benefic on the D7 5th,
    exalted Jupiter) mitigates the concern WATCHFUL → STEADY."""
    planets = {
        "SUN": PlanetView(rasi=8, house=8, d9_rasi=8),      # 5th lord in dusthana
        "MOON": PlanetView(rasi=10, house=10, d9_rasi=10),
        "MARS": PlanetView(rasi=11, house=11, d9_rasi=11),
        "MERCURY": PlanetView(rasi=2, house=2, d9_rasi=2),
        "JUPITER": PlanetView(rasi=3, house=3, d9_rasi=3, strength=50),
        "VENUS": PlanetView(rasi=12, house=12, d9_rasi=12),
        "SATURN": PlanetView(rasi=7, house=7, d9_rasi=7),
        "RAHU": PlanetView(rasi=6, house=6, d9_rasi=6),
        "KETU": PlanetView(rasi=12, house=12, d9_rasi=12),
    }
    # Blessed Saptamsa: Venus (benefic) on the D7 5th, Jupiter exalted (rasi 4), no malefic on the 5th.
    d7 = {"LAGNA": 1, "VENUS": 5, "JUPITER": 4, "SUN": 6, "MARS": 7, "SATURN": 9,
          "RAHU": 8, "KETU": 2, "MERCURY": 10, "MOON": 12}

    assert _level(planets, "child_timing") == "WATCHFUL"
    assert _level(planets, "child_timing", vargas={"D7": d7}) == "STEADY"


def test_d24_lifts_higher_education_to_strong():
    """A promising Rasi read (strong Jupiter + benefic-supported 5th) becomes
    STRONG once the education varga (D24) confirms it — strong Jupiter & Mercury
    and a clean D24 5th. The varga adds the third supporting vote."""
    # Mithuna lagna (3) so the 9th lord is Saturn, not Jupiter — keeps the base at
    # exactly two supports (jupiter_strong + fifth_support), i.e. PROMISING.
    planets = {
        "JUPITER": PlanetView(rasi=4, house=2, d9_rasi=4, strength=70),   # exalted → strong
        "VENUS": PlanetView(rasi=7, house=5, d9_rasi=7),                  # benefic on the 5th
        "MERCURY": PlanetView(rasi=1, house=11, d9_rasi=1, strength=50),  # neutral, not strong
        "SUN": PlanetView(rasi=5, house=3, d9_rasi=5),
        "MOON": PlanetView(rasi=6, house=4, d9_rasi=6),
        "MARS": PlanetView(rasi=8, house=6, d9_rasi=8),
        "SATURN": PlanetView(rasi=12, house=10, d9_rasi=12),             # 9th lord, not strong
        "RAHU": PlanetView(rasi=9, house=7, d9_rasi=9),
        "KETU": PlanetView(rasi=3, house=1, d9_rasi=3),
    }
    d24 = {"LAGNA": 1, "VENUS": 5, "JUPITER": 4, "MERCURY": 6, "SUN": 6,
           "MARS": 7, "SATURN": 9, "RAHU": 8, "KETU": 2, "MOON": 12}

    assert _level(planets, "higher_education", lagna=3) == "PROMISING"
    assert _level(planets, "higher_education", lagna=3, vargas={"D24": d24}) == "STRONG"


def test_d10_lifts_government_job_to_strong():
    """A promising authority read (strong Sun in the 10th) becomes STRONG once
    the career varga (D10) confirms it — strong Sun and a clean D10 10th."""
    # Vrischika lagna (8): the 10th house is Simha (rasi 5), so an own-sign Sun
    # sits strong in the 10th — sun_strong + sun_tenth, i.e. PROMISING.
    planets = {
        "SUN": PlanetView(rasi=5, house=10, d9_rasi=5),      # own sign, in the 10th
        "MOON": PlanetView(rasi=1, house=6, d9_rasi=1),      # 9th lord, not strong
        "SATURN": PlanetView(rasi=3, house=8, d9_rasi=3),    # not strong, not in the 6th
        "MARS": PlanetView(rasi=6, house=11, d9_rasi=6),
        "MERCURY": PlanetView(rasi=7, house=12, d9_rasi=7),
        "JUPITER": PlanetView(rasi=9, house=2, d9_rasi=9),
        "VENUS": PlanetView(rasi=10, house=3, d9_rasi=10),
        "RAHU": PlanetView(rasi=12, house=5, d9_rasi=12),
        "KETU": PlanetView(rasi=6, house=11, d9_rasi=6),
    }
    d10 = {"LAGNA": 1, "SUN": 1, "JUPITER": 10, "MARS": 6, "SATURN": 9,
           "RAHU": 5, "KETU": 11, "MERCURY": 2, "VENUS": 3, "MOON": 12}

    assert _level(planets, "government_job", lagna=8) == "PROMISING"
    assert _level(planets, "government_job", lagna=8, vargas={"D10": d10}) == "STRONG"


def test_afflicted_d10_deepens_job_disruption_watch():
    """A Sade-Sati work-watch (WATCHFUL) deepens to EXTRA_CARE when the career
    varga (D10) is itself unsettled — malefic on the D10 10th and a debilitated
    10th-lord-of-D10."""
    planets = {
        "SUN": PlanetView(rasi=5, house=5, d9_rasi=5),
        "MOON": PlanetView(rasi=6, house=6, d9_rasi=6),
        "MARS": PlanetView(rasi=2, house=2, d9_rasi=2),
        "MERCURY": PlanetView(rasi=7, house=7, d9_rasi=7),
        "JUPITER": PlanetView(rasi=9, house=9, d9_rasi=9),
        "VENUS": PlanetView(rasi=11, house=11, d9_rasi=11),
        "SATURN": PlanetView(rasi=3, house=3, d9_rasi=3),   # 10th/11th lord, not strong, clean
        "RAHU": PlanetView(rasi=12, house=12, d9_rasi=12),
        "KETU": PlanetView(rasi=6, house=6, d9_rasi=6),
    }
    # D10 10th (rasi 10) holds Mars with no benefic; Saturn (lord of the D10 10th)
    # sits debilitated in rasi 1 → the varga confirms instability.
    d10 = {"LAGNA": 1, "MARS": 10, "SATURN": 1, "JUPITER": 9, "VENUS": 3,
           "MERCURY": 5, "MOON": 12, "SUN": 6, "RAHU": 7, "KETU": 1}

    assert _level(planets, "job_disruption", sade_sati=True) == "WATCHFUL"
    assert _level(planets, "job_disruption", sade_sati=True, vargas={"D10": d10}) == "EXTRA_CARE"


def test_career_mode_ignores_d10_direction_by_design():
    """career_mode reads career *direction*, which the Dasamsa does not classically
    resolve — so its verdict must be identical with and without a D10 in hand
    (astrologer decision 2026-07-12; see eval_career_mode)."""
    planets = {
        "MARS": PlanetView(rasi=1, house=1, d9_rasi=1, strength=80),
        "RAHU": PlanetView(rasi=3, house=3, d9_rasi=3),
        "SATURN": PlanetView(rasi=6, house=6, d9_rasi=6),
        "SUN": PlanetView(rasi=5, house=5, d9_rasi=5),
        "MOON": PlanetView(rasi=4, house=4, d9_rasi=4),
        "MERCURY": PlanetView(rasi=2, house=2, d9_rasi=2),
        "JUPITER": PlanetView(rasi=9, house=9, d9_rasi=9),
        "VENUS": PlanetView(rasi=7, house=7, d9_rasi=7),
        "KETU": PlanetView(rasi=9, house=9, d9_rasi=9),
    }
    d10 = {"LAGNA": 1, "MARS": 10, "SATURN": 3, "SUN": 1, "MOON": 12,
           "MERCURY": 2, "JUPITER": 9, "VENUS": 5, "RAHU": 7, "KETU": 11}

    assert _level(planets, "career_mode") == _level(planets, "career_mode", vargas={"D10": d10})


def test_varga_never_creates_a_signal_on_a_quiet_chart():
    """Doctrine D3: a varga vote corroborates an existing D1 read and must never
    manufacture one. With no planets the chart is QUIET, and an afflicted D7 in
    hand leaves it QUIET — the vote is gated behind an existing signal."""
    d7 = {"LAGNA": 1, "SATURN": 5, "JUPITER": 10}
    assert _level({}, "child_timing") == "QUIET"
    assert _level({}, "child_timing", vargas={"D7": d7}) == "QUIET"


# ── Phase 2: real timing (bhukti ∩ gochara ∩ SAV bindus) ─────────────────────
# Each golden case hand-verifies the three gates behind timing_window_start/end:
# (1) the boolean window (a dasha match) must already have fired — Phase 2 only
# narrows it, never invents one; (2) the transiting karaka must contact the
# topic's house (gochara); (3) the topic house's own rasi must carry at least
# one Sarvashtakavarga bindu right now (never a zero-bindu transit).

def _gov_job_planets() -> dict[str, PlanetView]:
    """Sun, own sign (Simha), in the 10th house (lagna=8) — PROMISING on its own
    (sun_strong + sun_tenth, no cautions); lord of the 10th is Sun itself, so a
    Sun dasha both grades the card and fires its boolean window. Reused across
    the Phase-2 timing golden cases below with only the new transit/SAV/bhukti
    inputs varying."""
    return {
        "SUN": PlanetView(rasi=5, house=10, d9_rasi=5),
        "MOON": PlanetView(rasi=1, house=6, d9_rasi=1),
        "SATURN": PlanetView(rasi=3, house=8, d9_rasi=3),
        "MARS": PlanetView(rasi=6, house=11, d9_rasi=6),
        "MERCURY": PlanetView(rasi=7, house=12, d9_rasi=7),
        "JUPITER": PlanetView(rasi=9, house=2, d9_rasi=9),
        "VENUS": PlanetView(rasi=10, house=3, d9_rasi=10),
        "RAHU": PlanetView(rasi=12, house=5, d9_rasi=12),
        "KETU": PlanetView(rasi=6, house=11, d9_rasi=6),
    }


def test_timing_window_lands_inside_the_bhukti_span_when_all_three_gates_clear():
    """government_job (house=10, karaka=SUN): Sun's own-dasha already fires the
    boolean window. With Sun ALSO transiting the 10th (gochara) and a non-zero
    Sarvashtakavarga bindu count on the 10th's rasi, the window narrows to real
    dates — clipped to never start before "today", never past the bhukti's own
    end."""
    chart = _mk(
        _gov_job_planets(), lagna=8, dasha={"SUN"},
        transit_house_by_planet={"SUN": 10},
        sav_bindus={5: 30},  # rasi of the 10th house when lagna=8
        current_antardasha_start=date(2020, 1, 1),
        current_antardasha_end=date(2030, 6, 15),
    )
    bundle = assess_propensities(chart, as_of=date(2026, 3, 1))
    r = next(x for x in bundle.results if x.key == "government_job")
    assert r.level == "PROMISING"
    assert r.window_note is not None
    assert r.timing_window_start == date(2026, 3, 1)
    assert r.timing_window_end == date(2030, 6, 15)


def test_timing_window_suppressed_when_karaka_transit_misses_the_house():
    """Same chart and bhukti span as above, but Sun is currently transiting the
    3rd house — it neither occupies nor aspects the 10th, so gochara does not
    corroborate. The boolean window still fires (dasha is unchanged); only the
    concrete dates are withheld."""
    chart = _mk(
        _gov_job_planets(), lagna=8, dasha={"SUN"},
        transit_house_by_planet={"SUN": 3},
        sav_bindus={5: 30},
        current_antardasha_start=date(2020, 1, 1),
        current_antardasha_end=date(2030, 6, 15),
    )
    bundle = assess_propensities(chart, as_of=date(2026, 3, 1))
    r = next(x for x in bundle.results if x.key == "government_job")
    assert r.window_note is not None
    assert r.timing_window_start is None
    assert r.timing_window_end is None


def test_timing_window_suppressed_in_a_zero_bindu_transit():
    """Same chart and bhukti span, and Sun does transit the 10th (gochara
    clears) — but the 10th's rasi carries zero Sarvashtakavarga bindus right
    now. Doctrine: never a window inside a zero-bindu transit."""
    chart = _mk(
        _gov_job_planets(), lagna=8, dasha={"SUN"},
        transit_house_by_planet={"SUN": 10},
        sav_bindus={5: 0},
        current_antardasha_start=date(2020, 1, 1),
        current_antardasha_end=date(2030, 6, 15),
    )
    bundle = assess_propensities(chart, as_of=date(2026, 3, 1))
    r = next(x for x in bundle.results if x.key == "government_job")
    assert r.window_note is not None
    assert r.timing_window_start is None
    assert r.timing_window_end is None


def test_timing_window_also_narrows_a_caution_tier_watch_season():
    """resilience_watch (house=8, karaka=SATURN): Saturn conjunct Rahu in the
    8th is a classical severe-change signature (eighth_pressure + node_saturn
    cautions), and a Saturn dasha fires the boolean window. With Saturn
    transiting the 8th (gochara) and a non-zero SAV bindu count there, the
    CAUTION-tier card narrows to dates exactly as the CHANCE-tier one does —
    the eligibility rule is just con > 0 instead of pro >= con."""
    planets = _base()
    planets["SATURN"] = PlanetView(rasi=8, house=8, d9_rasi=8, strength=55)
    # RAHU already sits at house 8 in _base() — conjunct with Saturn.
    chart = _mk(
        planets, dasha={"SATURN"},
        transit_house_by_planet={"SATURN": 8},
        sav_bindus={8: 15},  # rasi of the 8th house when lagna=1
        current_antardasha_start=date(2024, 1, 1),
        current_antardasha_end=date(2028, 1, 1),
    )
    bundle = assess_propensities(chart, as_of=date(2026, 6, 1))
    r = next(x for x in bundle.results if x.key == "resilience_watch")
    assert r.level == "EXTRA_CARE"
    assert r.window_note is not None
    assert r.timing_window_start == date(2026, 6, 1)
    assert r.timing_window_end == date(2028, 1, 1)


# ── Phase 3: dark-house evaluators (marriage/partnership, foreign, wealth, ──
# Bhava-6, Swabhava). Golden cases target the two novel wiring pieces: the
# Hora (D2) wealth vote (a new technique, not the generic 12-house
# varga_domain_vote — see _Reader.hora_wealth_vote) and the D12 vote for
# foreign_settlement (confirming the existing varga_domain_vote machinery
# extends cleanly to a 12th new topic, same pattern as D7/D10/D24 in Phase 1).

def test_hora_confirms_income_growth_to_strong():
    """11th lord (Saturn, own-sign) + strong Jupiter give a PROMISING base
    (2 supports). A Hora (D2) chart where Jupiter/Venus sit in Chandra Hora
    and Saturn (malefic) sits in Surya Hora is the classical Ubhayachara
    wealth pattern — it should lift the card to STRONG."""
    planets = {
        "SUN": PlanetView(rasi=2, house=2, d9_rasi=2),
        "MOON": PlanetView(rasi=3, house=3, d9_rasi=3),
        "MARS": PlanetView(rasi=4, house=4, d9_rasi=4),
        "MERCURY": PlanetView(rasi=6, house=6, d9_rasi=6),
        "JUPITER": PlanetView(rasi=9, house=9, d9_rasi=9, strength=70),   # own sign (9,12) -> strong
        "VENUS": PlanetView(rasi=7, house=7, d9_rasi=7),
        "SATURN": PlanetView(rasi=11, house=11, d9_rasi=11, strength=55),  # own sign (10,11) -> strong; 11th lord
        "RAHU": PlanetView(rasi=8, house=8, d9_rasi=8),
        "KETU": PlanetView(rasi=10, house=10, d9_rasi=10),
    }
    d2_support = {"JUPITER": 4, "VENUS": 4, "SATURN": 5,
                  "SUN": 5, "MOON": 4, "MARS": 5, "MERCURY": 4, "RAHU": 5, "KETU": 4}

    assert _level(planets, "income_growth") == "PROMISING"
    assert _level(planets, "income_growth", vargas={"D2": d2_support}) == "STRONG"


def test_hora_softens_savings_capacity():
    """A Dhana yoga plus Mercury (2nd lord, aspecting its own house) gives a
    PROMISING base, but Mercury is debilitated (afflicted). A Hora (D2)
    chart where all three wealth karakas land in Surya Hora is the inverse
    of the auspicious pattern — it should soften the card to MIXED."""
    planets = {
        "SUN": PlanetView(rasi=1, house=9, d9_rasi=1),
        "MOON": PlanetView(rasi=2, house=10, d9_rasi=2),
        "MARS": PlanetView(rasi=3, house=11, d9_rasi=3),
        "MERCURY": PlanetView(rasi=12, house=8, d9_rasi=12, strength=30),  # debilitated (2nd lord)
        "JUPITER": PlanetView(rasi=7, house=3, d9_rasi=7, strength=50),   # neutral
        "VENUS": PlanetView(rasi=9, house=5, d9_rasi=9, strength=50),     # neutral
        "SATURN": PlanetView(rasi=6, house=6, d9_rasi=6),
        "RAHU": PlanetView(rasi=10, house=6, d9_rasi=10),
        "KETU": PlanetView(rasi=4, house=12, d9_rasi=4),
    }
    d2_caution = {"JUPITER": 5, "VENUS": 5, "MERCURY": 5,
                  "SUN": 4, "MOON": 4, "MARS": 4, "SATURN": 4, "RAHU": 4, "KETU": 4}

    assert _level(planets, "savings_capacity", lagna=5, yogas={"DHANA_YOGA"}) == "PROMISING"
    assert _level(planets, "savings_capacity", lagna=5, yogas={"DHANA_YOGA"},
                  vargas={"D2": d2_caution}) == "MIXED"


def test_d12_confirms_foreign_settlement_to_strong():
    """Rahu occupying the 12th plus its lord (Jupiter, since Lagna=Mesha
    puts Meenam in the 12th) in a travel-linked house give a PROMISING
    base. A D12 chart with a benefic on its 12th and a strong Saturn
    should lift the card to STRONG — the same varga_domain_vote machinery
    already proven for D7/D10/D24 in Phase 1, now on a 12th topic."""
    planets = {
        "SUN": PlanetView(rasi=2, house=2, d9_rasi=2),
        "MOON": PlanetView(rasi=3, house=3, d9_rasi=3),
        "MARS": PlanetView(rasi=4, house=4, d9_rasi=4),
        "MERCURY": PlanetView(rasi=5, house=5, d9_rasi=5),
        "JUPITER": PlanetView(rasi=9, house=9, d9_rasi=9, strength=50),  # 12th lord, travel house
        "VENUS": PlanetView(rasi=7, house=7, d9_rasi=7),
        "SATURN": PlanetView(rasi=6, house=6, d9_rasi=6),
        "RAHU": PlanetView(rasi=12, house=12, d9_rasi=12),
        "KETU": PlanetView(rasi=8, house=8, d9_rasi=8),
    }
    d12 = {"LAGNA": 1, "JUPITER": 12, "SATURN": 10,
           "SUN": 1, "MOON": 2, "MARS": 3, "MERCURY": 4, "VENUS": 5, "RAHU": 6, "KETU": 7}

    assert _level(planets, "foreign_settlement") == "PROMISING"
    assert _level(planets, "foreign_settlement", vargas={"D12": d12}) == "STRONG"


def test_swabhava_profile_is_always_present_never_quiet():
    """The PROFILE tier is descriptive, not graded — it must always render,
    even on a chart with no planets at all (unlike every CHANCE/CAUTION
    card, which correctly goes QUIET on empty input)."""
    bundle = assess_propensities(_mk({}))
    r = next(x for x in bundle.results if x.key == "swabhava_profile")
    assert r.tier is PropensityTier.PROFILE
    assert r.level == "PROFILE"
    assert len(r.factors) >= 1
    assert all(f.status == "NEUTRAL" for f in r.factors)


def test_swabhava_profile_reads_lagna_moon_mercury():
    bundle = assess_propensities(_mk(_base()))
    r = next(x for x in bundle.results if x.key == "swabhava_profile")
    keys = {f.key for f in r.factors}
    assert "lagna_element" in keys


def test_phase3_categories_present():
    bundle = assess_propensities(_mk(_base()))
    cats = {r.category.value for r in bundle.results}
    assert {"MARRIAGE", "WEALTH", "LIFE_PATH"} <= cats


def test_timing_window_absent_without_a_boolean_window_or_as_of():
    """No dasha touch → the boolean window itself never fires, so Phase 2 has
    nothing to narrow — even with a fully favourable transit/SAV/bhukti input."""
    chart = _mk(
        _gov_job_planets(), lagna=8, dasha=set(),
        transit_house_by_planet={"SUN": 10},
        sav_bindus={5: 30},
        current_antardasha_start=date(2020, 1, 1),
        current_antardasha_end=date(2030, 6, 15),
    )
    bundle = assess_propensities(chart, as_of=date(2026, 3, 1))
    r = next(x for x in bundle.results if x.key == "government_job")
    assert r.window_note is None
    assert r.timing_window_start is None
    assert r.timing_window_end is None


# ── Phase 4 (P2-2): Career depth / Wealth / Property / Marriage timing tranche

def test_p22_categories_present():
    bundle = assess_propensities(_mk(_base()))
    new_career = {"promotion_recognition", "entrepreneurial_timing", "workplace_conflict",
                  "skill_mastery", "career_networking_influence", "career_change_success"}
    new_wealth = {"property_acquisition", "property_investment_timing", "ancestral_property_stability",
                  "windfall_gains", "speculative_risk"}
    new_marriage = {"early_marriage_readiness", "marriage_delay_watch", "spousal_support_strength"}
    by_key = {r.key: r for r in bundle.results}
    for key in new_career:
        assert by_key[key].category.value == "CAREER", key
    for key in new_wealth:
        assert by_key[key].category.value == "WEALTH", key
    for key in new_marriage:
        assert by_key[key].category.value == "MARRIAGE", key


def test_d4_confirms_property_acquisition_to_strong():
    """A promising Rasi read (benefic Venus in the 4th + own-sign Mars) becomes
    STRONG once the property varga (D4/Chaturthamsa) confirms it — a clean
    benefic 4th and both karakas (Mars, Venus) in their own sign there."""
    planets = {
        "SUN": PlanetView(rasi=9, house=9, d9_rasi=9),
        "MOON": PlanetView(rasi=3, house=3, d9_rasi=3),                  # 4th lord, neutral (not exalted-2/own-4)
        "MARS": PlanetView(rasi=1, house=1, d9_rasi=1, strength=80),     # own sign -> strong
        "MERCURY": PlanetView(rasi=6, house=6, d9_rasi=6),
        "JUPITER": PlanetView(rasi=9, house=9, d9_rasi=9, strength=50),
        "VENUS": PlanetView(rasi=4, house=4, d9_rasi=4, strength=50),    # benefic occupying the 4th
        "SATURN": PlanetView(rasi=11, house=11, d9_rasi=11),
        "RAHU": PlanetView(rasi=12, house=12, d9_rasi=12),
        "KETU": PlanetView(rasi=6, house=6, d9_rasi=6),
    }
    d4 = {"LAGNA": 1, "JUPITER": 4, "MARS": 8, "VENUS": 7,
          "SUN": 9, "MOON": 3, "MERCURY": 6, "SATURN": 11, "RAHU": 12, "KETU": 9}

    assert _level(planets, "property_acquisition") == "PROMISING"
    assert _level(planets, "property_acquisition", vargas={"D4": d4}) == "STRONG"


def test_hora_confirms_property_investment_timing_to_strong():
    """A promising base (benefic Jupiter in the 11th + strong Venus) becomes
    STRONG once the Hora (D2) wealth-nature vote confirms it — the same
    Ubhayachara auspicious pattern proven for income_growth in Phase 3."""
    planets = {
        "SUN": PlanetView(rasi=9, house=9, d9_rasi=9),
        "MOON": PlanetView(rasi=2, house=2, d9_rasi=2),                  # 4th lord
        "MARS": PlanetView(rasi=8, house=8, d9_rasi=8),
        "MERCURY": PlanetView(rasi=6, house=6, d9_rasi=6),
        "JUPITER": PlanetView(rasi=11, house=11, d9_rasi=11, strength=50),  # benefic occupying the 11th
        "VENUS": PlanetView(rasi=7, house=7, d9_rasi=7, strength=70),    # own sign + strength -> strong
        "SATURN": PlanetView(rasi=11, house=11, d9_rasi=11, strength=55),  # 11th lord, own sign, unafflicted
        "RAHU": PlanetView(rasi=3, house=3, d9_rasi=3),
        "KETU": PlanetView(rasi=9, house=9, d9_rasi=9),
    }
    d2_support = {"JUPITER": 4, "VENUS": 4, "SATURN": 5,
                  "SUN": 5, "MOON": 4, "MARS": 5, "MERCURY": 4, "RAHU": 5, "KETU": 4}

    assert _level(planets, "property_investment_timing") == "PROMISING"
    assert _level(planets, "property_investment_timing", vargas={"D2": d2_support}) == "STRONG"


def test_early_marriage_readiness_and_marriage_delay_watch_read_a_strong_seventh():
    """A strong, unafflicted Venus and a well-placed 7th lord should lift the
    chance-tier reading while leaving the mirror caution card quiet on risk
    factors — proving the two P2-2 marriage-timing cards read the same
    evidence from opposite tiers without contradicting each other."""
    planets = _base()
    planets["VENUS"] = PlanetView(rasi=2, house=2, d9_rasi=2, strength=75)  # own sign, strong, unafflicted
    # 7th lord of lagna=1 is VENUS itself (Thula=7 owned by Venus); place VENUS
    # (acting as its own 7th lord) in a benefic kendra house (2), well outside DUSTHANA.
    bundle = assess_propensities(_mk(planets, dasha={"VENUS"}))
    readiness = next(r for r in bundle.results if r.key == "early_marriage_readiness")
    delay = next(r for r in bundle.results if r.key == "marriage_delay_watch")
    assert readiness.tier is PropensityTier.CHANCE
    assert readiness.level in {"STRONG", "PROMISING"}
    assert delay.level in {"STEADY", "QUIET"}


def test_marriage_delay_watch_flags_seventh_lord_in_dusthana():
    """The 7th lord sitting in a dusthana (8th house) is the classical
    delay-proneness signature — marriage_delay_watch must surface it as a
    real caution, never silence (D3)."""
    planets = _base()
    # Lagna=1 -> 7th lord is VENUS (Thula). Place Venus in the 8th (dusthana).
    planets["VENUS"] = PlanetView(rasi=8, house=8, d9_rasi=8, strength=30)
    bundle = assess_propensities(_mk(planets))
    delay = next(r for r in bundle.results if r.key == "marriage_delay_watch")
    assert delay.tier is PropensityTier.CAUTION
    assert delay.level in {"WATCHFUL", "EXTRA_CARE"}


# ── Marital-status gating: married → drop the marriage-TIMING cards ───────────

def test_married_drops_marriage_timing_and_romance_but_keeps_harmony():
    """A settled marriage retires the two marriage-TIMING cards AND the Bhava-5
    new-romance chance (an "affair-chance" card is wrong for a married native),
    while the harmony / partnership / spousal-support cards stay."""
    bundle = assess_propensities(_mk(_base()), marital_status="married")
    keys = {r.key for r in bundle.results}
    assert "early_marriage_readiness" not in keys
    assert "marriage_delay_watch" not in keys
    assert "love" not in keys
    # The relationship story still speaks — harmony, partnership, spousal support,
    # and the general strain-watch (which applies to any bond).
    assert {"marriage_harmony", "business_partnership_fit",
            "spousal_support_strength", "relationship_strain"} <= keys


def test_retired_drops_active_job_cards_but_keeps_venture_and_skills():
    """Retirement retires the cards that presuppose an ongoing job/career
    striving, while a second-innings venture, skill-mastery, and networking —
    which retirees genuinely pursue — stay on."""
    bundle = assess_propensities(_mk(_base(), age=63), employment_type="retired")
    keys = {r.key for r in bundle.results}
    dropped = {"career_mode", "government_job", "job_disruption", "competitive_edge",
               "promotion_recognition", "workplace_conflict", "career_change_success"}
    assert dropped.isdisjoint(keys)
    assert {"entrepreneurial_timing", "skill_mastery", "career_networking_influence"} <= keys


def test_non_retired_keeps_all_career_cards():
    bundle = assess_propensities(_mk(_base()), employment_type="employed_salaried")
    keys = {r.key for r in bundle.results}
    assert {"career_mode", "government_job", "job_disruption",
            "promotion_recognition", "workplace_conflict"} <= keys


def test_higher_education_capped_for_seniors():
    """higher_education now carries an age_max (45) so a 70-year-old sees it
    soft-deferred, not as a live 'higher-education chance'."""
    card = next(r for r in assess_propensities(_mk(_base(), age=70)).results
                if r.key == "higher_education")
    assert card.deferred is True


@pytest.mark.parametrize("status", [None, "single", "divorced", "widowed", "breakup"])
def test_non_married_statuses_keep_marriage_timing_cards(status):
    """Only an active marriage gates the timing cards — single keeps them, and
    divorced/widowed/breakup are seeking marriage again, so they keep them too."""
    bundle = assess_propensities(_mk(_base()), marital_status=status)
    keys = {r.key for r in bundle.results}
    assert {"early_marriage_readiness", "marriage_delay_watch"} <= keys


# ── Degree-interruption (higher-education continuity) ─────────────────────────

def test_degree_interruption_is_education_caution_with_disclaimer():
    card = next(r for r in assess_propensities(_mk(_base())).results
                if r.key == "degree_interruption_watch")
    assert card.category.value == "EDUCATION"
    assert card.tier is PropensityTier.CAUTION
    assert card.disclaimer is not None


def test_degree_interruption_flags_afflicted_ninth():
    """Malefics loading the 9th house of higher study (Saturn there, Rahu there)
    with the vidya-karaka Jupiter also pressured is the classic degree-
    discontinuity signature — it must surface, never stay silent (D3)."""
    planets = _base()
    # Lagna=1 (Mesha) → 9th house is rasi 9 (Dhanus). Load it with malefics and
    # pressure Jupiter so the higher-study path reads as at-risk.
    planets["SATURN"] = PlanetView(rasi=9, house=9, d9_rasi=9, strength=35)
    planets["RAHU"] = PlanetView(rasi=9, house=9, d9_rasi=9, strength=40)
    planets["JUPITER"] = PlanetView(rasi=6, house=6, d9_rasi=6, strength=30)  # dusthana → afflicted
    card = next(r for r in assess_propensities(_mk(planets)).results
                if r.key == "degree_interruption_watch")
    assert card.level in {"WATCHFUL", "EXTRA_CARE"}


def test_degree_interruption_stays_calm_on_a_protected_ninth():
    """A strong, benefic-supported 9th with a strong Jupiter should not
    manufacture a caution — a clean higher-study path reads STEADY/QUIET."""
    planets = _base()
    planets["JUPITER"] = PlanetView(rasi=9, house=9, d9_rasi=9, strength=80)  # benefic in the 9th, strong
    card = next(r for r in assess_propensities(_mk(planets)).results
                if r.key == "degree_interruption_watch")
    assert card.level in {"STEADY", "QUIET"}
