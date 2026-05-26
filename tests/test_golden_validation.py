"""Sprint 9 golden regression tests — locks all 139 QA cases.

Every case from run_golden_validation() is locked here as a pytest test.
If any calculation changes break a case, this file catches the regression.
"""
from __future__ import annotations

from datetime import datetime

import pytest

from app.calculations.astro import local_datetime_to_utc, utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_sidereal_planets
from app.services.qa_service import run_golden_validation


@pytest.fixture(scope="module")
def golden_result():
    return run_golden_validation()


def _get_module(golden_result, module_name: str):
    for mod in golden_result.modules:
        if mod.module == module_name:
            return mod
    pytest.fail(f"Module '{module_name}' not found in golden validation result")


def _assert_all_cases(mod):
    failures = [c for c in mod.cases if not c.passed]
    if failures:
        lines = [f"  [{c.test_id}] {c.description}: expected={c.expected!r}, actual={c.actual!r}" for c in failures]
        pytest.fail(f"Module '{mod.module}' has {len(failures)} failing case(s):\n" + "\n".join(lines))


# ── Category 1: UTC conversion ─────────────────────────────────────────────


def test_utc_conversion_all_pass(golden_result):
    mod = _get_module(golden_result, "utc_conversion")
    assert mod.passed + mod.failed == 6, "Expected 6 cases in utc_conversion"
    _assert_all_cases(mod)


# ── Category 2: Rasi boundary ──────────────────────────────────────────────


def test_rasi_boundary_all_pass(golden_result):
    mod = _get_module(golden_result, "rasi_boundary")
    assert mod.passed + mod.failed == 12, "Expected 12 cases in rasi_boundary"
    _assert_all_cases(mod)


# ── Category 3: Nakshatra boundary ────────────────────────────────────────


def test_nakshatra_boundary_all_pass(golden_result):
    mod = _get_module(golden_result, "nakshatra_boundary")
    assert mod.passed + mod.failed == 12, "Expected 12 cases in nakshatra_boundary"
    _assert_all_cases(mod)


# ── Category 4: Navamsa D9 ────────────────────────────────────────────────


def test_navamsa_d9_all_pass(golden_result):
    mod = _get_module(golden_result, "navamsa_d9")
    assert mod.passed + mod.failed == 9, "Expected 9 cases in navamsa_d9"
    _assert_all_cases(mod)


# ── Category 5: Vargottama ────────────────────────────────────────────────


def test_vargottama_all_pass(golden_result):
    mod = _get_module(golden_result, "vargottama")
    assert mod.passed + mod.failed == 7, "Expected 7 cases in vargottama"
    _assert_all_cases(mod)


# ── Category 6: Dasha balance ─────────────────────────────────────────────


def test_dasha_balance_all_pass(golden_result):
    mod = _get_module(golden_result, "dasha_balance")
    assert mod.passed + mod.failed == 12, "Expected 12 cases in dasha_balance"
    _assert_all_cases(mod)


# ── Category 7: Panchangam timing ────────────────────────────────────────


def test_panchangam_timing_all_pass(golden_result):
    mod = _get_module(golden_result, "panchangam_timing")
    assert mod.passed + mod.failed == 13, "Expected 13 cases in panchangam_timing"
    _assert_all_cases(mod)


# ── Category 8: Sani cycle ───────────────────────────────────────────────


def test_sani_cycle_all_pass(golden_result):
    mod = _get_module(golden_result, "sani_cycle")
    assert mod.passed + mod.failed == 13, "Expected 13 cases in sani_cycle"
    _assert_all_cases(mod)


# ── Category 9: Chandrashtama ────────────────────────────────────────────


def test_chandrashtama_all_pass(golden_result):
    mod = _get_module(golden_result, "chandrashtama")
    assert mod.passed + mod.failed == 12, "Expected 12 cases in chandrashtama"
    _assert_all_cases(mod)


# ── Category 10: Family aggregation ──────────────────────────────────────


def test_family_aggregation_all_pass(golden_result):
    mod = _get_module(golden_result, "family_aggregation")
    assert mod.passed + mod.failed == 13, "Expected 13 cases in family_aggregation"
    _assert_all_cases(mod)


# ── Bonus: Safety text ───────────────────────────────────────────────────


def test_safety_text_all_pass(golden_result):
    mod = _get_module(golden_result, "safety_text")
    assert mod.passed + mod.failed == 30, "Expected 30 cases in safety_text"
    _assert_all_cases(mod)


# ── Total gate ───────────────────────────────────────────────────────────


def test_total_cases_count(golden_result):
    total = sum(m.passed + m.failed for m in golden_result.modules)
    assert total == 139, f"Expected 139 total golden cases, got {total}"


def test_zero_failures(golden_result):
    """Master gate: every golden case must pass."""
    if golden_result.total_failed > 0:
        lines = []
        for mod in golden_result.modules:
            for c in mod.cases:
                if not c.passed:
                    lines.append(f"  [{mod.module}/{c.test_id}] {c.description}: expected={c.expected!r}, actual={c.actual!r}")
        pytest.fail(f"{golden_result.total_failed} golden case(s) failed:\n" + "\n".join(lines))


def test_t003_cross_verify_reference_chart_all_9_planets_within_point1_degree():
    dt_utc = local_datetime_to_utc(datetime(1993, 3, 15, 8, 15), "Asia/Kolkata")
    jd = utc_datetime_to_julian_day(dt_utc)
    snap = calculate_sidereal_planets(jd)

    expected = {
        "SUN": 330.76342508,
        "MOON": 240.01137891,
        "MARS": 79.07542605,
        "MERCURY": 319.35056099,
        "JUPITER": 167.96021694,
        "VENUS": 355.97203864,
        "SATURN": 301.07930470,
        "RAHU": 232.78702194,
        "KETU": 52.78702194,
    }

    for planet, expected_longitude in expected.items():
        actual = snap.bodies[planet].absolute_longitude
        assert actual == pytest.approx(expected_longitude, abs=0.1), (
            f"{planet} mismatch: expected {expected_longitude}, actual {actual}"
        )
