from __future__ import annotations

from pathlib import Path

from app.services.daily_guidance_service import TRANSIT_BASE_SCORE

REPO_ROOT = Path(__file__).resolve().parents[1]


def _read(path: str) -> str:
    return (REPO_ROOT / path).read_text(encoding="utf-8")


def test_b05_jupiter_seventh_from_moon_is_supportive_in_scoring_tables():
    # Rule B-05: Jupiter 7th from Moon must not be scored as red/caution.
    assert TRANSIT_BASE_SCORE["JUPITER"][7] >= 65


def test_b10_shadow_prompts_component_uses_proxy_fetch_helper():
    # Rule B-10: shadow prompts must use apiFetchJson via Next proxy.
    src = _read("web/components/dashboard-shadow-prompts.tsx")
    assert "apiFetchJson" in src
    assert "promptType=SHADOW" in src
    assert "fetch('/api/v1/" not in src
    assert 'fetch("/api/v1/' not in src


def test_b11_no_hardcoded_white_text_color_in_primary_dashboard_tabs():
    # Rule B-11: prevent white-on-white text regressions in light mode.
    # File list updated 2026-07-13: the Classic-tier files this rule originally
    # named (dashboard-daily-snapshot.tsx, dashboard-plan-tab.tsx,
    # dashboard-journal-tab.tsx, dashboard-personal-tab.tsx,
    # dashboard-calendar-tab.tsx, dashboard-decision-panel.tsx) were deleted by
    # the Nova-Only Migration (commit 047926d, 2026-07-11); this test kept
    # referencing them and silently stopped checking anything. Repointed at
    # their live Nova successors, per dashboard-workspace.tsx's actual tab
    # wiring (activeTab "personal" now renders DashboardTodayTabNova).
    # dashboard-daily-snapshot.tsx is dropped outright rather than remapped —
    # it is dead code, not imported/rendered anywhere in the current tree.
    files = [
        "web/components/dashboard-today-tab-nova.tsx",
        "web/components/dashboard-plan-tab-nova.tsx",
        "web/components/dashboard-journal-tab-nova.tsx",
        "web/components/dashboard-calendar-tab-nova.tsx",
        "web/components/dashboard-plan-decisions-nova.tsx",
        "web/components/dashboard-synastry-panel.tsx",
    ]
    for rel in files:
        src = _read(rel)
        assert 'color: "rgba(255,255,255,' not in src, f"hardcoded white text color remains in {rel}"
