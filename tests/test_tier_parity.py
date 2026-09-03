"""CI guard: ensures tier_limits.py and packages/shared/src/constants/tiers.ts stay in sync.

Parses the TypeScript file with regex (no Node runtime required) and compares
key numeric/boolean limits against the Python source of truth.
"""
from __future__ import annotations

import math
import re
from pathlib import Path

import pytest

pytestmark = pytest.mark.no_db

TS_PATH = Path(__file__).resolve().parents[1] / "packages/shared/src/constants/tiers.ts"


# ---------------------------------------------------------------------------
# TS parser helpers
# ---------------------------------------------------------------------------

def _extract_tier_block(ts_text: str, tier: str) -> str:
    """Return the text of the object literal for a given tier name."""
    # Match e.g. `  guest: {` then capture until the matching closing `},`
    pattern = rf"{re.escape(tier)}:\s*\{{"
    m = re.search(pattern, ts_text)
    assert m, f"Tier '{tier}' not found in {TS_PATH}"
    start = m.end()
    depth = 1
    i = start
    while i < len(ts_text) and depth > 0:
        if ts_text[i] == "{":
            depth += 1
        elif ts_text[i] == "}":
            depth -= 1
        i += 1
    return ts_text[start : i - 1]


def _parse_int_or_null_or_infinity(block: str, key: str) -> int | float | None:
    m = re.search(rf"{re.escape(key)}:\s*(Infinity|null|-?\d+)", block)
    assert m, f"Key '{key}' not found in tier block"
    val = m.group(1)
    if val == "Infinity":
        return math.inf
    if val == "null":
        return None
    return int(val)


def _parse_bool(block: str, key: str) -> bool:
    m = re.search(rf"{re.escape(key)}:\s*(true|false)", block)
    assert m, f"Key '{key}' not found in tier block"
    return m.group(1) == "true"


def _parse_string(block: str, key: str) -> str:
    m = re.search(rf'{re.escape(key)}:\s*"([^"]+)"', block)
    assert m, f"Key '{key}' not found in tier block"
    return m.group(1)


# ---------------------------------------------------------------------------
# Parse both files once
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def ts_limits() -> dict[str, dict]:
    ts_text = TS_PATH.read_text(encoding="utf-8")
    result = {}
    for tier in ("guest", "registered", "premium"):
        block = _extract_tier_block(ts_text, tier)
        result[tier] = {
            "birthProfilesMax":               _parse_int_or_null_or_infinity(block, "birthProfilesMax"),
            "familyVaultProfilesMax":         _parse_int_or_null_or_infinity(block, "familyVaultProfilesMax"),
            "goalsMax":                       _parse_int_or_null_or_infinity(block, "goalsMax"),
            "rasiPalanWindowDays":            _parse_int_or_null_or_infinity(block, "rasiPalanWindowDays"),
            "askVinaadiDailyLimit":           _parse_int_or_null_or_infinity(block, "askVinaadiDailyLimit"),
            "askVinaadiMonthlyLimit":         _parse_int_or_null_or_infinity(block, "askVinaadiMonthlyLimit"),
            "askVinaadiTopUpEnabled":         _parse_bool(block, "askVinaadiTopUpEnabled"),
            "dashaDepth":                     _parse_string(block, "dashaDepth"),
            "detailedReportsMonthlyIncluded": _parse_int_or_null_or_infinity(block, "detailedReportsMonthlyIncluded"),
            "poruthamReportsMonthlyIncluded": _parse_int_or_null_or_infinity(block, "poruthamReportsMonthlyIncluded"),
            "adsEnabled":                     _parse_bool(block, "adsEnabled"),
            "annualWrappedEnabled":           _parse_bool(block, "annualWrappedEnabled"),
            "annualWrappedShareEnabled":      _parse_bool(block, "annualWrappedShareEnabled"),
            "journalEnabled":                 _parse_bool(block, "journalEnabled"),
            "streakEnabled":                  _parse_bool(block, "streakEnabled"),
            "pushNotificationsEnabled":       _parse_bool(block, "pushNotificationsEnabled"),
            "varshaphalaEnabled":             _parse_bool(block, "varshaphalaEnabled"),
            "vargasEnabled":                  _parse_bool(block, "vargasEnabled"),
            "synastryEnabled":                _parse_bool(block, "synastryEnabled"),
            "retrospectiveEnabled":           _parse_bool(block, "retrospectiveEnabled"),
            "remediesEnabled":                _parse_bool(block, "remediesEnabled"),
            "lifeEventLogEnabled":            _parse_bool(block, "lifeEventLogEnabled"),
            "birthTimeRectificationEnabled":  _parse_bool(block, "birthTimeRectificationEnabled"),
            "lifeAreaHistoryEnabled":         _parse_bool(block, "lifeAreaHistoryEnabled"),
            "payPerUseEnabled":               _parse_bool(block, "payPerUseEnabled"),
        }
    return result


@pytest.fixture(scope="module")
def py_limits() -> dict[str, dict]:
    from app.core.tier_limits import TIER_LIMITS
    result = {}
    for tier_name, lim in TIER_LIMITS.items():
        result[tier_name] = {
            "birthProfilesMax":               lim.birth_profiles_max,
            "familyVaultProfilesMax":         lim.family_vault_profiles_max,
            "goalsMax":                       lim.goals_max,
            "rasiPalanWindowDays":            lim.rasi_palan_window_days,
            "askVinaadiDailyLimit":           lim.ask_vinaadi_daily_limit,
            "askVinaadiMonthlyLimit":         lim.ask_vinaadi_monthly_limit,
            "askVinaadiTopUpEnabled":         lim.ask_vinaadi_topup_enabled,
            "dashaDepth":                     lim.dasha_depth,
            "detailedReportsMonthlyIncluded": lim.detailed_reports_monthly_included,
            "poruthamReportsMonthlyIncluded": lim.porutham_reports_monthly_included,
            "adsEnabled":                     lim.ads_enabled,
            "annualWrappedEnabled":           lim.annual_wrapped_enabled,
            "annualWrappedShareEnabled":      lim.annual_wrapped_share_enabled,
            "journalEnabled":                 lim.journal_enabled,
            "streakEnabled":                  lim.streak_enabled,
            "pushNotificationsEnabled":       lim.push_notifications_enabled,
            "varshaphalaEnabled":             lim.varshaphala_enabled,
            "vargasEnabled":                  lim.vargas_enabled,
            "synastryEnabled":                lim.synastry_enabled,
            "retrospectiveEnabled":           lim.retrospective_enabled,
            "remediesEnabled":                lim.remedies_enabled,
            "lifeEventLogEnabled":            lim.life_event_log_enabled,
            "birthTimeRectificationEnabled":  lim.birth_time_rectification_enabled,
            "lifeAreaHistoryEnabled":         lim.life_area_history_enabled,
            "payPerUseEnabled":               lim.pay_per_use_enabled,
        }
    return result


# ---------------------------------------------------------------------------
# Parity tests — one per tier
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("tier", ["guest", "registered", "premium"])
def test_tier_limits_python_ts_parity(tier: str, ts_limits: dict, py_limits: dict) -> None:
    ts = ts_limits[tier]
    py = py_limits[tier]
    mismatches = []
    for key, ts_val in ts.items():
        py_val = py[key]
        if ts_val != py_val:
            mismatches.append(f"  {key}: TS={ts_val!r}  PY={py_val!r}")
    assert not mismatches, (
        f"Tier '{tier}' has {len(mismatches)} mismatch(es) between "
        f"tier_limits.py and tiers.ts:\n" + "\n".join(mismatches)
    )


def test_guest_ask_vinaadi_daily_limit_is_2(ts_limits: dict, py_limits: dict) -> None:
    assert py_limits["guest"]["askVinaadiDailyLimit"] == 2
    assert ts_limits["guest"]["askVinaadiDailyLimit"] == 2


def test_registered_rasi_palan_window_is_7(ts_limits: dict, py_limits: dict) -> None:
    assert py_limits["registered"]["rasiPalanWindowDays"] == 7
    assert ts_limits["registered"]["rasiPalanWindowDays"] == 7


def test_registered_ask_vinaadi_daily_limit_is_7(ts_limits: dict, py_limits: dict) -> None:
    assert py_limits["registered"]["askVinaadiDailyLimit"] == 7
    assert ts_limits["registered"]["askVinaadiDailyLimit"] == 7


def test_premium_reports_included(ts_limits: dict, py_limits: dict) -> None:
    assert py_limits["premium"]["detailedReportsMonthlyIncluded"] == 5
    assert ts_limits["premium"]["detailedReportsMonthlyIncluded"] == 5
    assert py_limits["premium"]["poruthamReportsMonthlyIncluded"] == 3
    assert ts_limits["premium"]["poruthamReportsMonthlyIncluded"] == 3


def test_premium_birth_profiles_unlimited(ts_limits: dict, py_limits: dict) -> None:
    assert py_limits["premium"]["birthProfilesMax"] == math.inf
    assert ts_limits["premium"]["birthProfilesMax"] == math.inf


def test_no_limit_message_hardcodes_a_number_the_tiers_do_not_back() -> None:
    """A cap message must get its number from the tier table, not from prose.

    The shared RESOURCE_LIMIT_EXCEEDED entry read "You have reached the maximum
    number of birth profiles (10)" while the registered tier's actual cap was 3
    and premium's was unlimited — so the only users who ever saw that sentence
    were told a limit more than three times the one that had just stopped them,
    and were invited to "delete unused profiles to make room" when deleting one
    would buy them a single slot back out of a claimed ten.

    The two sibling caps (goals_service, family_vault_service) both interpolate
    their real figure; this one was the outlier. The rule the guard encodes is
    the general one: no number in the shared error catalogue, because a number
    there cannot know which tier is reading it.
    """
    import re

    from app.core.error_codes import ERROR_MESSAGES

    offenders = [
        f"{code}: {info['user_message']}"
        for code, info in ERROR_MESSAGES.items()
        if re.search(r"\(\s*\d+\s*\)|\b\d+\b", info["user_message"])
    ]

    assert not offenders, (
        "error-catalogue messages carrying a literal number. The catalogue is "
        "shared across tiers and cannot know the caller's limit — interpolate it "
        "at the call site instead:\n" + "\n".join(offenders)
    )
