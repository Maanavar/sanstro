"""Phase 0 kernel primitives — full branch coverage on verdict.py."""
import pytest

from app.reasoning.verdict import (
    Band,
    BiText,
    Verdict,
    band_rank,
    band_to_legacy_confidence,
    cap_band,
)

pytestmark = pytest.mark.no_db


def test_ordinal_ranking_is_total_and_ordered():
    order = [Band.BLOCKED, Band.SILENT, Band.WEAK, Band.MIXED, Band.LIKELY, Band.STRONG]
    ranks = [band_rank(b) for b in order]
    assert ranks == sorted(ranks)
    assert len(set(ranks)) == len(order)  # every band has a distinct rank
    assert band_rank(Band.STRONG) > band_rank(Band.LIKELY) > band_rank(Band.MIXED)
    assert band_rank(Band.SILENT) > band_rank(Band.BLOCKED)


def test_cap_band_clamps_only_above_ceiling():
    assert cap_band(Band.STRONG, Band.LIKELY) is Band.LIKELY
    assert cap_band(Band.LIKELY, Band.LIKELY) is Band.LIKELY
    assert cap_band(Band.MIXED, Band.LIKELY) is Band.MIXED
    assert cap_band(Band.WEAK, Band.LIKELY) is Band.WEAK


def test_cap_band_never_touches_epistemic_states():
    # BLOCKED/SILENT are epistemic states, not intensities (D3).
    assert cap_band(Band.BLOCKED, Band.LIKELY) is Band.BLOCKED
    assert cap_band(Band.SILENT, Band.LIKELY) is Band.SILENT


def test_legacy_mapping_covers_every_band():
    expected = {
        Band.STRONG: "HIGH",
        Band.LIKELY: "HIGH",
        Band.MIXED: "MEDIUM",
        Band.WEAK: "LOW",
        Band.BLOCKED: "LOW",
        Band.SILENT: "LOW",
    }
    for band in Band:
        assert band_to_legacy_confidence(band) == expected[band]


def test_verdict_dataclass_holds_reason_and_windows():
    v = Verdict(
        band=Band.LIKELY,
        promise_passed=True,
        reason=BiText(ta="காரணம்", en="reason"),
    )
    assert v.band is Band.LIKELY
    assert v.promise_passed is True
    assert v.reason.en == "reason"
    assert v.timing_window_start is None and v.timing_window_end is None
