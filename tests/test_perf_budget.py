"""Performance budget tests for the top-5 hot calculation paths.

Each test asserts that a single call completes within its time budget.
Budgets are conservative to avoid flakiness on slow CI machines while
still catching genuine regressions (e.g. an O(n²) loop being introduced).

Run with: pytest tests/test_perf_budget.py -v
"""
from __future__ import annotations

import time
from datetime import date

import pytest

# ── shared fixture data ────────────────────────────────────────────────────────
# Jul 22 1991, 06:30 IST → JD ≈ 2448459.771  (classic Vinaadi test chart)
_BIRTH_JD = 2448459.771
_MOON_LONGITUDE = 155.3  # Kanya rasi, mid-nakshatra

_NATAL_RASI_MAP = {
    "SUN": 3,
    "MOON": 6,
    "MARS": 7,
    "MERCURY": 3,
    "JUPITER": 5,
    "VENUS": 2,
    "SATURN": 9,
    "RAHU": 11,
    "KETU": 5,
    "LAGNA": 1,
}

_PLANET_MAP = {k: v for k, v in _NATAL_RASI_MAP.items() if k != "LAGNA"}


# ── helper ─────────────────────────────────────────────────────────────────────

def _elapsed(fn, *args, **kwargs) -> float:
    t0 = time.perf_counter()
    fn(*args, **kwargs)
    return time.perf_counter() - t0


# ── 1. Swiss Ephemeris — calculate_sidereal_planets ───────────────────────────

@pytest.mark.no_db
def test_perf_calculate_sidereal_planets():
    """Full Swiss Ephemeris planet calculation must complete within 500 ms."""
    from app.calculations.ephemeris import calculate_sidereal_planets

    budget_s = 0.5
    elapsed = _elapsed(calculate_sidereal_planets, _BIRTH_JD)
    assert elapsed < budget_s, (
        f"calculate_sidereal_planets took {elapsed:.3f}s, budget is {budget_s}s"
    )


# ── 2. Yoga + Dosham rule engine — detect_yogas_and_doshams ──────────────────

@pytest.mark.no_db
def test_perf_detect_yogas_and_doshams():
    """Full yoga/dosham detection must complete within 300 ms."""
    from app.calculations.yogas import detect_yogas_and_doshams

    budget_s = 0.3
    elapsed = _elapsed(
        detect_yogas_and_doshams,
        _PLANET_MAP,
        lagna_rasi=1,
        moon_rasi=6,
    )
    assert elapsed < budget_s, (
        f"detect_yogas_and_doshams took {elapsed:.3f}s, budget is {budget_s}s"
    )


# ── 3. Vimshottari timeline — calculate_vimshottari_timeline ─────────────────

@pytest.mark.no_db
def test_perf_calculate_vimshottari_timeline():
    """Vimshottari dasha timeline must compute within 100 ms."""
    from app.calculations.dasha import calculate_vimshottari_timeline

    budget_s = 0.1
    elapsed = _elapsed(
        calculate_vimshottari_timeline,
        _BIRTH_JD,
        _MOON_LONGITUDE,
        _BIRTH_JD + 12000,  # as_of_jd ~33 years after birth
    )
    assert elapsed < budget_s, (
        f"calculate_vimshottari_timeline took {elapsed:.3f}s, budget is {budget_s}s"
    )


# ── 4. Ashtakavarga matrix — compute_bhinnashtakavarga ───────────────────────

@pytest.mark.no_db
def test_perf_compute_bhinnashtakavarga():
    """Bhinnashtakavarga matrix must compute within 50 ms."""
    from app.calculations.ashtakavarga import compute_bhinnashtakavarga

    budget_s = 0.05
    elapsed = _elapsed(compute_bhinnashtakavarga, _NATAL_RASI_MAP)
    assert elapsed < budget_s, (
        f"compute_bhinnashtakavarga took {elapsed:.3f}s, budget is {budget_s}s"
    )


# ── 5. Daily panchangam — calculate_daily_panchangam ─────────────────────────

@pytest.mark.no_db
def test_perf_calculate_daily_panchangam():
    """Daily panchangam (no cache, no DB) must complete within 1 s."""
    from app.calculations.panchangam import calculate_daily_panchangam

    budget_s = 1.0
    elapsed = _elapsed(
        calculate_daily_panchangam,
        date(1991, 7, 22),
        13.0827,   # Chennai latitude
        80.2707,   # Chennai longitude
        "Asia/Kolkata",
        session=None,
        use_cache=False,
    )
    assert elapsed < budget_s, (
        f"calculate_daily_panchangam took {elapsed:.3f}s, budget is {budget_s}s"
    )
