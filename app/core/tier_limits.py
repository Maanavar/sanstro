"""Tier limits — single source of truth for backend feature gating.

Keep these values in sync with packages/shared/src/constants/tiers.ts.
All numeric Infinity values are represented as math.inf here.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, replace
from typing import Literal

Tier = Literal["guest", "registered", "premium"]
DashaDepth = Literal["none", "current_only", "full"]


@dataclass(frozen=True)
class TierLimits:
    birth_profiles_max: float          # math.inf = unlimited
    family_vault_profiles_max: int
    goals_max: float                   # math.inf = unlimited
    rasi_palan_window_days: int        # 0 = today only
    ask_vinaadi_daily_limit: int | None   # None = use monthly instead
    ask_vinaadi_monthly_limit: int | None # None = use daily instead
    ask_vinaadi_topup_enabled: bool
    dasha_depth: DashaDepth
    detailed_reports_monthly_included: int
    porutham_reports_monthly_included: int
    ads_enabled: bool
    annual_wrapped_enabled: bool
    annual_wrapped_share_enabled: bool
    journal_enabled: bool
    streak_enabled: bool
    push_notifications_enabled: bool
    varshaphala_enabled: bool
    vargas_enabled: bool
    synastry_enabled: bool
    retrospective_enabled: bool
    remedies_enabled: bool
    life_event_log_enabled: bool
    birth_time_rectification_enabled: bool
    life_area_history_enabled: bool
    pay_per_use_enabled: bool


TIER_LIMITS: dict[str, TierLimits] = {
    "guest": TierLimits(
        birth_profiles_max=0,
        family_vault_profiles_max=0,
        goals_max=0,
        rasi_palan_window_days=0,
        ask_vinaadi_daily_limit=2,
        ask_vinaadi_monthly_limit=None,
        ask_vinaadi_topup_enabled=False,
        dasha_depth="none",
        detailed_reports_monthly_included=0,
        porutham_reports_monthly_included=0,
        ads_enabled=True,
        annual_wrapped_enabled=False,
        annual_wrapped_share_enabled=False,
        journal_enabled=False,
        streak_enabled=False,
        push_notifications_enabled=False,
        varshaphala_enabled=False,
        vargas_enabled=False,
        synastry_enabled=False,
        retrospective_enabled=False,
        remedies_enabled=False,
        life_event_log_enabled=False,
        birth_time_rectification_enabled=False,
        life_area_history_enabled=False,
        pay_per_use_enabled=True,
    ),
    "registered": TierLimits(
        birth_profiles_max=3,
        family_vault_profiles_max=1,
        goals_max=3,
        rasi_palan_window_days=7,
        ask_vinaadi_daily_limit=7,
        ask_vinaadi_monthly_limit=None,
        ask_vinaadi_topup_enabled=False,
        dasha_depth="current_only",
        detailed_reports_monthly_included=0,
        porutham_reports_monthly_included=0,
        ads_enabled=True,
        annual_wrapped_enabled=True,
        annual_wrapped_share_enabled=False,
        journal_enabled=True,
        streak_enabled=True,
        push_notifications_enabled=True,
        varshaphala_enabled=False,
        vargas_enabled=False,
        synastry_enabled=False,
        retrospective_enabled=False,
        remedies_enabled=False,
        life_event_log_enabled=False,
        birth_time_rectification_enabled=False,
        life_area_history_enabled=False,
        pay_per_use_enabled=True,
    ),
    "premium": TierLimits(
        birth_profiles_max=math.inf,
        family_vault_profiles_max=5,
        goals_max=math.inf,
        rasi_palan_window_days=30,
        ask_vinaadi_daily_limit=None,
        ask_vinaadi_monthly_limit=30,
        ask_vinaadi_topup_enabled=True,
        dasha_depth="full",
        detailed_reports_monthly_included=5,
        porutham_reports_monthly_included=3,
        ads_enabled=False,
        annual_wrapped_enabled=True,
        annual_wrapped_share_enabled=True,
        journal_enabled=True,
        streak_enabled=True,
        push_notifications_enabled=True,
        varshaphala_enabled=True,
        vargas_enabled=True,
        synastry_enabled=True,
        retrospective_enabled=True,
        remedies_enabled=True,
        life_event_log_enabled=True,
        birth_time_rectification_enabled=True,
        life_area_history_enabled=True,
        pay_per_use_enabled=True,
    ),
}


# Open beta — what a signed-in account without a subscription gets while
# `settings.open_beta` is on. Premium's features, because /beta promises that
# every feature is unlocked. Deliberately NOT a TIER_LIMITS key: it is not a tier
# anyone buys, and TIER_LIMITS is pinned to tiers.ts by tests/test_tier_parity.py.
#
# The one departure is Ask Vinaadi. It is the only feature that costs money per
# call, so it keeps a daily fair-use cap instead of premium's monthly allowance,
# and that cap is the registered one — the beta costs no more per user than the
# free tier already did.
OPEN_BETA_LIMITS = replace(
    TIER_LIMITS["premium"],
    ask_vinaadi_daily_limit=TIER_LIMITS["registered"].ask_vinaadi_daily_limit,
    ask_vinaadi_monthly_limit=None,
    ask_vinaadi_topup_enabled=False,
)


# Pay-per-use product IDs must match packages/shared/src/constants/tiers.ts PPU_* constants.
PPU_REPORT_IDS = {
    "1page":  "vinaadi.ppu.report.1page",
    "3page":  "vinaadi.ppu.report.3page",
    "5page":  "vinaadi.ppu.report.5page",
    "10page": "vinaadi.ppu.report.10page",
}

PPU_PORUTHAM_IDS = {
    "1page": "vinaadi.ppu.porutham.1page",
    "3page": "vinaadi.ppu.porutham.3page",
}

PPU_TOPUP_IDS = {
    "10q": "vinaadi.ppu.topup.10q",
}

TOPUP_QUESTIONS = {
    PPU_TOPUP_IDS["10q"]: 10,
}


def get_limits(tier: str) -> TierLimits:
    return TIER_LIMITS.get(tier, TIER_LIMITS["guest"])


def ask_vinaadi_limit_for_tier(tier: str) -> tuple[int | None, int | None]:
    """Return (daily_limit, monthly_limit) for the given tier.
    Exactly one of the two will be non-None.
    """
    lim = get_limits(tier)
    return lim.ask_vinaadi_daily_limit, lim.ask_vinaadi_monthly_limit


def ask_vinaadi_limits(lim: TierLimits) -> tuple[int | None, int | None]:
    """(daily_limit, monthly_limit) for an already-resolved limit set."""
    return lim.ask_vinaadi_daily_limit, lim.ask_vinaadi_monthly_limit
