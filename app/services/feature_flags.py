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
        # D2/D3 ordinal bands (docs/REASONING_LAYER_UPGRADE_PLAN.md Phase 2).
        # Strips X/100 from user copy and speaks in Band words; SILENT voice.
        # Independent of reasoning_gate so copy can roll out separately.
        "reasoning_bands": False,
        # D4 contradiction engine (docs/REASONING_LAYER_UPGRADE_PLAN.md Phase 3).
        # Classifies gate-vs-timing disagreement into a Reading and speaks it
        # ("promised but not now" / "active period, but not this"). Readings
        # derive from the promise gate, so this only has user-visible effect
        # when reasoning_gate is also on.
        "reasoning_contradiction": False,
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
        "reasoning_chart_signature": False,
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
