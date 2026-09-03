"""Integration golden tests for the degree-based strength-score seam (audit T1/T2).

These guard the P0 bug documented in
docs/THIRUKANITHAM_DEGREE_ADHIPATHI_AUDIT_2026-07.md: the composite
`strength_score` was silently dropped at the yoga/dosham engine boundary,
collapsing every planet to a uniform 50 in production. That killed the
strength-gated rules (Lakshmi, Daridra, Putra-Sarpa, Badhaka).

Unit tests pass a proper `planet_scores` dict directly to the detectors, so
they never caught the regression — only the integration seam was broken. These
tests exercise that seam:

  * the public `detect_yogas_and_doshams` boundary (rasi-only planet map +
    `planet_scores_in`), and
  * the real production call site `_build_yoga_dosham_insights` in
    `app/services/_chart_build.py`.
"""
from __future__ import annotations

import pytest

from app.calculations.yogas import detect_yogas_and_doshams
from app.schemas.charts import PlanetPosition
from app.services._chart_build import _build_yoga_dosham_insights

# Mesha (Aries) Lagna, rasi 1.
#   Lagna lord  = MARS    (lord of rasi 1)
#   9th lord    = JUPITER (lord of rasi 9)   -> Lakshmi Yoga gate
#   Badhaka     = SATURN  (movable lagna -> 11th house -> rasi 11 lord)
_LAGNA_RASI = 1
_MOON_RASI = 4

# Rasi-only placements (the shape production hands to the yoga engine).
_PLANETS_RASI: dict[str, int] = {
    "SUN": 5,
    "MOON": _MOON_RASI,
    "MARS": 1,      # lagna lord in house 1
    "MERCURY": 6,
    "JUPITER": 9,   # 9th lord in its own trikona house (house 9 from lagna)
    "VENUS": 7,
    "SATURN": 1,    # badhaka lord occupying house 1 -> badhaka active
    "RAHU": 3,
    "KETU": 9,
}

# Real degree-derived composite scores: the qualifying planets are strong.
_STRONG_SCORES: dict[str, int] = {
    "SUN": 50,
    "MOON": 50,
    "MARS": 72,     # strong lagna lord
    "MERCURY": 50,
    "JUPITER": 74,  # strong 9th lord
    "VENUS": 50,
    "SATURN": 70,   # strong badhaka lord
    "RAHU": 50,
    "KETU": 50,
}


def _yoga(yogas, name):
    return next(y for y in yogas if y.name == name)


def _dosham(doshams, name):
    return next(d for d in doshams if d.name == name)


@pytest.mark.no_db
def test_lakshmi_yoga_fires_when_real_scores_threaded():
    """With real strong scores threaded in, Lakshmi Yoga can be present."""
    yogas, _doshams, _ = detect_yogas_and_doshams(
        _PLANETS_RASI,
        lagna_rasi=_LAGNA_RASI,
        moon_rasi=_MOON_RASI,
        planet_scores_in=_STRONG_SCORES,
    )
    assert _yoga(yogas, "LAKSHMI_YOGA").is_present is True


@pytest.mark.no_db
def test_lakshmi_yoga_cannot_fire_without_scores_regression_marker():
    """Rasi-only map with no scores -> uniform 50 -> Lakshmi can never fire.

    This documents the *old* broken behaviour and pins the exact seam: the fix
    is that production now passes `planet_scores_in`, not that the fallback
    changed.
    """
    yogas, _doshams, _ = detect_yogas_and_doshams(
        _PLANETS_RASI,
        lagna_rasi=_LAGNA_RASI,
        moon_rasi=_MOON_RASI,
    )
    assert _yoga(yogas, "LAKSHMI_YOGA").is_present is False


@pytest.mark.no_db
def test_badhaka_lord_strong_cancellation_triggers_with_real_scores():
    """A strong badhaka lord yields the `badhaka_lord_strong` nivarthi."""
    yogas, doshams, _ = detect_yogas_and_doshams(
        _PLANETS_RASI,
        lagna_rasi=_LAGNA_RASI,
        moon_rasi=_MOON_RASI,
        current_maha_lord="SATURN",
        planet_scores_in=_STRONG_SCORES,
    )
    badhaka = _dosham(doshams, "BADHAKA_DOSHAM")
    assert badhaka.is_present is True
    assert "badhaka_lord_strong" in badhaka.cancellation_factors


@pytest.mark.no_db
def test_badhaka_lord_strong_cancellation_dead_without_scores():
    """Without threaded scores the strong-lord nivarthi can never trigger."""
    _yogas, doshams, _ = detect_yogas_and_doshams(
        _PLANETS_RASI,
        lagna_rasi=_LAGNA_RASI,
        moon_rasi=_MOON_RASI,
        current_maha_lord="SATURN",
    )
    badhaka = _dosham(doshams, "BADHAKA_DOSHAM")
    assert "badhaka_lord_strong" not in badhaka.cancellation_factors


# ── Real production call-site guard ───────────────────────────────────────────
# 30° per rasi; place each planet mid-sign. absolute_longitude = (rasi-1)*30 + 15.


def _planet(graha: str, rasi: int, score: int) -> PlanetPosition:
    longitude = (rasi - 1) * 30.0 + 15.0
    return PlanetPosition(
        graha=graha,
        rasiName=str(rasi),
        absoluteLongitude=longitude,
        rasi=rasi,
        degreeInRasi=15.0,
        nakshatra=1,
        nakshatraName="",
        pada=1,
        houseFromLagna=((rasi - _LAGNA_RASI) % 12) + 1,
        speedDegPerDay=1.0,
        isRetrograde=False,
        isCombust=False,
        d9Rasi=rasi,
        isVargottama=False,
        showRetrogradeBadge=False,
        strengthScore=score,
    )


@pytest.mark.no_db
def test_chart_build_threads_strength_scores_into_yoga_engine():
    """End-to-end: `_build_yoga_dosham_insights` must pass real scores through.

    Guards the actual call site the audit flagged — that `_chart_build` wires
    `planet_scores` into `detect_yogas_and_doshams`, not just into
    `yoga_activation_score`.
    """
    planets = [_planet(g, r, _STRONG_SCORES[g]) for g, r in _PLANETS_RASI.items()]
    # Arbitrary but valid birth epoch (JD); dasha lords are derived internally
    # and Lakshmi Yoga does not depend on them.
    birth_jd = 2451545.0  # 2000-01-01 12:00 UTC
    yogas, _doshams, _cautions = _build_yoga_dosham_insights(
        planets,
        lagna_rasi=_LAGNA_RASI,
        moon_rasi=_MOON_RASI,
        birth_jd=birth_jd,
    )
    lakshmi = next(y for y in yogas if y.name == "LAKSHMI_YOGA")
    assert lakshmi.is_present is True
