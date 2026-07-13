"""Runtime-editable feature flags stored in process memory."""
from __future__ import annotations

from typing import Any

from app.core.config import get_settings


def _defaults() -> dict[str, Any]:
    settings = get_settings()
    return {
        "enable_admin_data_delete": bool(settings.enable_admin_data_delete),
        "ask_vinaadi_daily_limit": int(settings.ask_vinaadi_daily_limit),
        "enable_push_notifications": True,
        "maintenance_mode": False,
        "max_birth_profiles_per_user": 10,
        # D1 reasoning gate (docs/REASONING_LAYER_UPGRADE_PLAN.md Phase 1).
        # Rollout: internal → beta → all; watch for over-suppression
        # (too many BLOCKED/SILENT means the gate is too strict).
        # Flipped to internal 2026-07-03 per plan §8 rollout order, step 2 —
        # PR-1 thresholds already signed off (§11). Watch for over-suppression
        # before promoting to beta.
        "reasoning_gate": True,
        # D2/D3/D7 ordinal bands (docs/REASONING_LAYER_UPGRADE_PLAN.md Phase 2).
        # Speaks in Band words (STRONG/LIKELY/MIXED/WEAK/BLOCKED/SILENT) and
        # exposes the `band` field on whatif/marriage/daily-guidance responses;
        # derives marriage's legacy confidence tier from the band. Numeric
        # scores are deliberately NOT stripped from copy — product decision
        # 2026-07-13 (P0-1, docs/PREDICTION_DOCTRINE_AND_ROADMAP.md) is to show
        # both the band and the score, not replace one with the other.
        # Independent of reasoning_gate so copy can roll out separately.
        # Flipped ON 2026-07-13 (P0-1 rollout — value already built, ship it).
        "reasoning_bands": True,
        # D4 contradiction engine (docs/REASONING_LAYER_UPGRADE_PLAN.md Phase 3).
        # Classifies gate-vs-timing disagreement into a Reading and speaks it
        # ("promised but not now" / "active period, but not this"). Readings
        # derive from the promise gate, so this only has user-visible effect
        # when reasoning_gate is also on.
        # Specialist sign-off closed 2026-07-13 (plan §15.3, P0-2):
        # §15.1 six templates approved as-is; §15.2 WEAK-gate framing decided
        # Option B (new PARTIALLY_PROMISED reading, distinct from
        # ACTIVE_BUT_UNPROMISED's full redirect); golden-set worksheet's 17
        # TODO rows annotated (tests/golden/reasoning/golden_set_worksheet.json).
        # Flipped ON 2026-07-13 (P0-2 rollout).
        "reasoning_contradiction": True,
        # D5 calibration data spine (docs/REASONING_LAYER_UPGRADE_PLAN.md Phase 4).
        # Silent-launch: log material predictions on serve + join outcomes so
        # hit-rates accrue for weeks before anyone trusts them. No user-facing
        # behaviour change; the read side is admin-only.
        # Flipped ON 2026-07-03 per plan §8 rollout order (turned on first,
        # precisely because it's invisible — needs weeks of collection before
        # n>=30/bucket makes hit-rates meaningful).
        "reasoning_calibration_log": True,
        # Chart signature + root-cause chains (docs/REASONING_LAYER_UPGRADE_PLAN.md
        # Phase 5). Adds a chart-level "dominant graha" framing sentence and,
        # for LOW-confidence life areas, an ordered "because ... therefore ..."
        # causal chain instead of a flat factor list. Purely additive/optional
        # response fields; no change to any score or gate.
        # Specialist review closed 2026-07-13 (P0-4,
        # docs/PREDICTION_DOCTRINE_AND_ROADMAP.md): all 9 SIGNATURE_VOICE
        # motif framings correctly reflect classical graha significations
        # (e.g. Saturn=delay-then-reward, Rahu=ambition/reinvention).
        # §16's "falls back to Sun on no signal" doc claim was found stale —
        # the code actually raises ValueError on malformed/empty chart data
        # (caught gracefully by callers), which is the more doctrine-correct
        # choice (D6: never fabricate a claim) — doc corrected, code kept as
        # built. Wiring extended from life-areas-only to whatif/marriage in
        # this same pass. Flipped ON 2026-07-13.
        "reasoning_chart_signature": True,
        # Track A synthesis (humanization). Composes the six already-computed
        # daily `reasons` + component scores into ONE prioritized, flowing
        # briefing (verdict lead → 1-2 salient signals → one action) instead of
        # the flat six-row stack. Populates the additive `briefing` field on
        # daily guidance; nothing else changes. Tamil glue native-reviewed and
        # approved 2026-07-09; enabled together with the DAILY_SCORE_ENGINE_VERSION
        # bump so cached rows regenerate with the briefing. Frontend falls back to
        # the six-row `reasons` if `briefing` is ever null.
        "daily_briefing_synth": True,
        # "Chances & Cautions" life-propensity panel. Additive read-only
        # endpoint (GET /charts/{id}/propensities).
        # Specialist copy review closed 2026-07-13 (P0-3,
        # docs/PREDICTION_DOCTRINE_AND_ROADMAP.md): all 8 sensitive-tier
        # disclaimers (5 shared DISCLAIMER_* constants + 3 folded from
        # inline literals) read as appropriately hedged, non-alarming, and
        # redirect to real professionals without diagnosing or predicting
        # doom. Sequenced after P1-1 (safety_filter serve-time tone pass)
        # and P1-2 (hard suppression of sensitive cards for minors/opt-in
        # reduced-content preference) per the roadmap's own §7 recommendation
        # — never widen sensitive-domain exposure without the safety pass
        # in place first. Flipped ON 2026-07-13.
        "propensity_insights": True,
        # Timing-vote band cutoffs (app/reasoning/timing_vote.py::timing_band_from_score).
        # Recalibration mechanism (docs/PREDICTION_DOCTRINE_AND_ROADMAP.md P3-2/P3-3):
        # admin reviews GET /admin/calibration hit-rates per band, and once a bucket
        # has enough volume to be meaningful (n>=30), can nudge a cutoff via the
        # existing PATCH /admin/flags/{flag_name} endpoint (auto-audit-logged via
        # log_admin_action) instead of a code change + deploy. Defaults reproduce
        # timing_band_from_score()'s original hardcoded cutoffs byte-for-byte — no
        # threshold has actually been changed yet; only 10 days of data exist as of
        # 2026-07-13, well short of the n>=30/bucket bar the roadmap itself sets.
        "timing_band_strong_cutoff": 75,
        "timing_band_likely_cutoff": 60,
        "timing_band_mixed_cutoff": 45,
    }


_overrides: dict[str, Any] = {}


def get_flag(name: str) -> Any:
    defaults = _defaults()
    if name in _overrides:
        return _overrides[name]
    return defaults.get(name)


def set_flag(name: str, value: Any) -> None:
    defaults = _defaults()
    if name not in defaults:
        raise ValueError(f"Unknown flag: {name}")
    _overrides[name] = value


def reset_flag(name: str) -> None:
    _overrides.pop(name, None)


def all_flags() -> dict[str, dict[str, Any]]:
    defaults = _defaults()
    return {
        name: {
            "name": name,
            "value": get_flag(name),
            "default": default,
            "overridden": name in _overrides,
        }
        for name, default in defaults.items()
    }
