"""Phase 4 (PR-3) — calibration kernel + outcome grading rules.

Pure unit tests: the aggregation kernel takes projected rows, and the
grading helper is exercised on in-memory PredictionLog instances.
"""
from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

import pytest

from app.models.prediction_log import PredictionLog
from app.reasoning.calibration import GradedPrediction, build_calibration_report
from app.services.prediction_log_service import (
    BLOCKED_MISS_HORIZON_DAYS,
    NEAR_MARGIN_DAYS,
    _grade_row,
    scenario_to_area,
)

pytestmark = pytest.mark.no_db


# ── Grading rules (join side) ─────────────────────────────────────────────────

def _row(
    band: str,
    window_start: date | None = None,
    window_end: date | None = None,
    created: date = date(2026, 1, 1),
) -> PredictionLog:
    return PredictionLog(
        band=band,
        window_start=window_start,
        window_end=window_end,
        created_at=datetime(created.year, created.month, created.day, tzinfo=UTC),
    )


def test_event_inside_window_is_hit():
    row = _row("LIKELY", date(2026, 3, 1), date(2026, 3, 31))
    assert _grade_row(row, date(2026, 3, 15)) == "HIT"
    assert _grade_row(row, date(2026, 3, 1)) == "HIT"    # inclusive edges
    assert _grade_row(row, date(2026, 3, 31)) == "HIT"


def test_event_near_window_is_near():
    row = _row("LIKELY", date(2026, 3, 1), date(2026, 3, 31))
    assert _grade_row(row, date(2026, 3, 31) + timedelta(days=NEAR_MARGIN_DAYS)) == "NEAR"
    assert _grade_row(row, date(2026, 3, 1) - timedelta(days=NEAR_MARGIN_DAYS)) == "NEAR"


def test_event_far_from_window_stays_open():
    row = _row("LIKELY", date(2026, 3, 1), date(2026, 3, 31))
    far = date(2026, 3, 31) + timedelta(days=NEAR_MARGIN_DAYS + 1)
    assert _grade_row(row, far) is None


def test_blocked_claim_contradicted_within_horizon_is_miss():
    row = _row("BLOCKED", created=date(2026, 1, 1))
    assert _grade_row(row, date(2026, 6, 1)) == "MISS"
    # An event that predates the claim does not falsify a forward claim.
    assert _grade_row(row, date(2025, 12, 1)) is None
    # Beyond the horizon the claim is not contradicted.
    beyond = date(2026, 1, 1) + timedelta(days=BLOCKED_MISS_HORIZON_DAYS + 1)
    assert _grade_row(row, beyond) is None


def test_silent_claims_nothing_and_is_never_graded():
    # D3: SILENT is an epistemic limit, not a prediction — no grade either way.
    row = _row("SILENT", created=date(2026, 1, 1))
    assert _grade_row(row, date(2026, 2, 1)) is None


def test_windowless_positive_claim_is_not_graded():
    assert _grade_row(_row("STRONG"), date(2026, 2, 1)) is None


# ── Aggregation kernel ────────────────────────────────────────────────────────

def _seeded_rows() -> list[GradedPrediction]:
    """Synthetic dataset: marriage STRONG 2 hit / 1 near / 1 miss, plus noise."""
    rows = []
    rows += [GradedPrediction("MARRIAGE", "STRONG", "HIT", "VENUS")] * 2
    rows += [GradedPrediction("MARRIAGE", "STRONG", "NEAR", "VENUS")]
    rows += [GradedPrediction("MARRIAGE", "STRONG", "MISS", "SATURN")]
    rows += [GradedPrediction("CAREER", "LIKELY", "HIT", "SATURN")]
    rows += [GradedPrediction("CAREER", "LIKELY", None, "SATURN")] * 3   # still open
    rows += [GradedPrediction("HEALTH", "MIXED", "HIT", None)]           # no dasha lord
    return rows


def test_report_totals_split_open_vs_graded():
    report = build_calibration_report(_seeded_rows())
    assert report.total_logged == 9
    assert report.total_open == 3
    assert report.total_graded == 6


def test_report_area_band_buckets_and_hit_rate():
    report = build_calibration_report(_seeded_rows())
    buckets = {b.key: b for b in report.by_area_band}
    marriage = buckets["MARRIAGE/STRONG"]
    assert (marriage.hit, marriage.near, marriage.miss, marriage.n) == (2, 1, 1, 4)
    assert marriage.hit_rate == 0.5
    # Open rows are excluded from buckets: CAREER/LIKELY counts only the graded hit.
    assert buckets["CAREER/LIKELY"].n == 1
    # Largest bucket sorts first.
    assert report.by_area_band[0].key == "MARRIAGE/STRONG"


def test_report_dasha_lord_buckets_skip_rows_without_lord():
    report = build_calibration_report(_seeded_rows())
    lords = {b.key: b for b in report.by_dasha_lord}
    assert set(lords) == {"VENUS", "SATURN"}
    assert (lords["VENUS"].hit, lords["VENUS"].near, lords["VENUS"].miss) == (2, 1, 0)
    assert (lords["SATURN"].hit, lords["SATURN"].miss) == (1, 1)


def test_empty_report_is_all_zero():
    report = build_calibration_report([])
    assert report.total_logged == 0
    assert report.by_area_band == []
    assert report.by_dasha_lord == []


def test_empty_bucket_hit_rate_is_none():
    from app.reasoning.calibration import CalibrationBucket
    assert CalibrationBucket(key="X").hit_rate is None


# ── Scenario → canonical area mapping ─────────────────────────────────────────

def test_scenario_to_area_covers_all_whatif_scenarios():
    from app.schemas.whatif import VALID_SCENARIOS
    for scenario in VALID_SCENARIOS:
        area = scenario_to_area(scenario)
        assert area and area == area.upper()
    assert scenario_to_area("marriage") == "MARRIAGE"
    assert scenario_to_area("job_change") == "CAREER"
    assert scenario_to_area("unknown_key") == "OTHER"


def test_p23_new_scenarios_map_to_existing_life_areas():
    """foreign_settlement/litigation (P2-3 whatif parity) must map to the
    life_areas_service areas that already exist for them (docs/
    PREDICTION_TAXONOMY.md §1/§5), not a fresh or missing bucket."""
    assert scenario_to_area("foreign_settlement") == "FOREIGN"
    assert scenario_to_area("litigation") == "LITIGATION"


def test_whatif_scenario_dicts_have_no_missing_keys():
    """Every VALID_SCENARIOS key must resolve in each of whatif_service's
    scenario-keyed dicts — a KeyError here would only surface at request time
    for whichever scenario the caller happened to pick."""
    from app.schemas.whatif import VALID_SCENARIOS
    from app.services.whatif_service import (
        _DASHA_SCENARIO_SCORE,
        _SCENARIO_KARAKA,
        _SCENARIO_LABEL_EN,
        _SCENARIO_LABEL_TA,
        _SCENARIO_NATAL_HOUSES,
    )
    for scenario in VALID_SCENARIOS:
        assert scenario in _SCENARIO_KARAKA, scenario
        assert scenario in _SCENARIO_NATAL_HOUSES, scenario
        assert scenario in _DASHA_SCENARIO_SCORE, scenario
        assert scenario in _SCENARIO_LABEL_TA, scenario
        assert scenario in _SCENARIO_LABEL_EN, scenario
        assert set(_DASHA_SCENARIO_SCORE[scenario]) == {
            "SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU",
        }, scenario
