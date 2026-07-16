"""M-5 (docs/ASTROLOGY_FULL_CODE_AUDIT_2026-07-16.md): the tithi rule's final
fallthrough used to grant every unclassified tithi — including Prathama,
which classically opens the paksha and is excluded from most muhurtha
lists — a blanket "favourable" verdict. Locks the corrected, explicit
AUSPICIOUS set against every tithi 1-30."""
from __future__ import annotations

import pytest

from app.calculations.activity_timing_rules import (
    _AUSPICIOUS_TITHIS,
    _EKADASI_TITHIS,
    _HEAVY_TITHIS,
    _POURNAMI,
    _RIKTA_TITHIS,
    _assess_tithi,
)

pytestmark = pytest.mark.no_db

# Tithis the docstring's AUSPICIOUS list excludes, once Rikta/Heavy/Ekadasi/
# Pournami are also excluded — must read NEUTRAL, never SUPPORTS.
_UNCLASSIFIED_NEUTRAL_TITHIS = {1, 18, 25, 27, 28}


def test_auspicious_set_matches_documented_thirteen_tithis():
    assert _AUSPICIOUS_TITHIS == {2, 3, 5, 6, 7, 10, 12, 13, 16, 17, 20, 21, 22}


def test_every_tithi_1_to_30_is_classified_exactly_once():
    all_tithis = set(range(1, 31))
    classified = (
        _RIKTA_TITHIS | _HEAVY_TITHIS | _EKADASI_TITHIS | _POURNAMI | _AUSPICIOUS_TITHIS
    )
    assert classified | _UNCLASSIFIED_NEUTRAL_TITHIS == all_tithis
    # No tithi double-counted across groups.
    groups = [_RIKTA_TITHIS, _HEAVY_TITHIS, _EKADASI_TITHIS, _POURNAMI, _AUSPICIOUS_TITHIS]
    for i, a in enumerate(groups):
        for b in groups[i + 1:]:
            assert not (a & b)


def test_prathama_returns_neutral_for_business_start():
    signal = _assess_tithi("business_start", 1)
    assert signal.alignment == "NEUTRAL"


@pytest.mark.parametrize("tithi_number", sorted(_UNCLASSIFIED_NEUTRAL_TITHIS))
def test_unclassified_tithis_read_neutral_not_supports(tithi_number: int):
    signal = _assess_tithi("business_start", tithi_number)
    assert signal.alignment == "NEUTRAL"


@pytest.mark.parametrize("tithi_number", sorted(_AUSPICIOUS_TITHIS))
def test_auspicious_tithis_read_supports(tithi_number: int):
    signal = _assess_tithi("business_start", tithi_number)
    assert signal.alignment == "SUPPORTS"
