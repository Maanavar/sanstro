"""FTR-21 — the Story view's selections, server-side (app/services/reading_story.py).

The rules mirror web/components/chart-reading/reading-selectors.ts. Two kinds
of check live here (pure, no database):

1. The tables this module copies match their TypeScript sources byte for byte,
   so a reworded house meaning or a newly adverse yoga cannot land on one
   runtime only.
2. The selection rules on hand-built payloads, including the cases the web
   selector tests pin (synthesis first, CAUTION before BOOST, cancelled adverse
   yogas out of the care column).

The end-to-end answer is held to the web's by
`web/components/chart-reading/reading-story-parity.test.ts`, on captured charts.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from app.schemas.chart_explanation import ChartExplanationFacet, ChartExplanationText
from app.schemas.charts import ChartDoshamInsight, ChartYogaInsight
from app.services.reading_story import (
    ADVERSE_YOGAS,
    HOUSE_MEANING,
    care_patterns,
    top_active_yogas,
    top_natal_yogas,
    why_facets,
)

pytestmark = pytest.mark.no_db

_ROOT = Path(__file__).resolve().parents[1]
_HOUSE_TS = _ROOT / "packages" / "shared" / "src" / "reading.ts"
_YOGA_TS = _ROOT / "packages" / "shared" / "src" / "yogaDisplay.ts"


def test_house_meaning_matches_the_web_table() -> None:
    body = _HOUSE_TS.read_text(encoding="utf-8").split("export const HOUSE_MEANING", 1)[1].split("\n};", 1)[0]
    rows = re.findall(r'^\s*(\d+):\s*\{\s*ta:\s*"([^"]+)",\s*en:\s*"([^"]+)"\s*\},', body, re.M)
    assert len(rows) == 12
    assert {int(n): (ta, en) for n, ta, en in rows} == HOUSE_MEANING


def test_shared_rasi_names_match_the_backend_display_tables() -> None:
    from app.calculations.display_names import RASI_EN, RASI_TA

    body = _HOUSE_TS.read_text(encoding="utf-8").split("export const RASI_NAME", 1)[1].split("\n};", 1)[0]
    rows = re.findall(r'^\s*(\d+):\s*\{\s*ta:\s*"([^"]+)",\s*en:\s*"([^"]+)"\s*\},', body, re.M)
    assert len(rows) == 12
    assert {int(n): ta for n, ta, _ in rows} == RASI_TA
    assert {int(n): en for n, _, en in rows} == RASI_EN


def test_adverse_set_matches_the_shared_set() -> None:
    body = _YOGA_TS.read_text(encoding="utf-8").split("export const ADVERSE_YOGAS", 1)[1].split("]);", 1)[0]
    names = set(re.findall(r'"([A-Z0-9_]+)"', body))
    assert len(names) >= 7
    assert names == set(ADVERSE_YOGAS)


def _facet(key: str, tone: str) -> ChartExplanationFacet:
    text = ChartExplanationText(ta="x", en="x")
    return ChartExplanationFacet(key=key, label=text, value=text, tone=tone)


def test_why_facets_synthesis_first_then_caution_before_boost() -> None:
    facets = [
        _facet("strength", "BOOST"),
        _facet("placement", "CAUTION"),  # excluded: it is the meaning line
        _facet("condition", "CAUTION"),
        _facet("nakshatra", "NEUTRAL"),  # neutral stays in the detail list
        _facet("synthesis", "NEUTRAL"),
    ]
    assert [f.key for f in why_facets(facets)] == ["synthesis", "condition"]
    assert [f.key for f in why_facets(facets[:4])] == ["condition", "strength"]


def _yoga(name: str, strength: str = "STRONG", *, present: bool = True, cancel: list[str] | None = None,
          tier: str = "NONE", score: int = 0, reach: int = 0) -> ChartYogaInsight:
    return ChartYogaInsight(
        name=name, isPresent=present, strength=strength, conditionsMet=[], cancellationFactors=cancel or [],
        dashaActivated=False, activationScore=score, isCurrentlyActive=False, descriptionTa="", descriptionEn="",
        activationTier=tier, structuralReach=reach,
    )


def test_yoga_ranking_is_per_chart_never_by_name() -> None:
    yogas = [
        _yoga("GAJA_KESARI_PARASHARA", "PARTIAL"),
        _yoga("HAMSA_YOGA", "STRONG", cancel=["x"]),
        _yoga("RUCHAKA_YOGA", "STRONG", tier="MODERATE", score=40),
        _yoga("KEMADRUMA_YOGA", "STRONG"),  # adverse: never a gift
        _yoga("AMALA_YOGA", "WEAK", cancel=["x"]),  # cancelled: never ranked
    ]
    assert [y.name for y in top_natal_yogas(yogas)] == ["RUCHAKA_YOGA", "HAMSA_YOGA", "GAJA_KESARI_PARASHARA"]
    assert [y.name for y in top_active_yogas(yogas)] == ["RUCHAKA_YOGA"]


def test_o25_lasting_gifts_ignore_the_running_dasa() -> None:
    """The review's A/B/C case: a strong, dormant 9th–10th Raja Yoga (A) leads
    Lasting gifts on reach; Running now lists only B and C."""
    yogas = [
        _yoga("DHANA_YOGA", tier="STRONG", score=90, reach=320),
        _yoga("BUDHA_ADITYA_YOGA", tier="MODERATE", score=70, reach=310),
        _yoga("RAJA_YOGA", tier="NONE", score=34, reach=421),
    ]
    assert [y.name for y in top_natal_yogas(yogas)] == ["RAJA_YOGA", "DHANA_YOGA", "BUDHA_ADITYA_YOGA"]
    assert [y.name for y in top_active_yogas(yogas)] == ["DHANA_YOGA", "BUDHA_ADITYA_YOGA"]


def test_o25_structural_reach_is_lordship_then_occupation_then_lagna() -> None:
    from types import SimpleNamespace

    from app.services._chart_build import _structural_reach

    def item(*grahas: str) -> SimpleNamespace:
        return SimpleNamespace(name="RAJA_YOGA", key_grahas=grahas, former_groups=())

    mesham = 1
    # Sani (10+11) and Guru (9+12), both in the 10th: 4 ruled, 1 occupied, no Lagna.
    assert _structural_reach(item("SATURN", "JUPITER"), {"SATURN": 10, "JUPITER": 10}, mesham) == 410
    # Add Sevvai (1+8) sitting in the Lagna: 6 ruled, 2 occupied, the Lagna lord takes part.
    assert _structural_reach(item("SATURN", "JUPITER", "MARS"),
                             {"SATURN": 10, "JUPITER": 10, "MARS": 1}, mesham) == 621
    # Lordship outranks occupation: one more house ruled beats any spread of placements.
    assert _structural_reach(item("MERCURY"), {"MERCURY": 3}, mesham) > _structural_reach(item("SUN"), {"SUN": 5}, mesham)
    # Nodes rule nothing; a yoga with no forming grahas reaches nothing.
    assert _structural_reach(item("RAHU"), {"RAHU": 7}, mesham) == 10
    assert _structural_reach(item(), {}, mesham) == 0


def test_o25_adhi_raja_grade_stays_out_of_the_top_lists() -> None:
    yogas = [_yoga("ADHI_RAJA_GRADE", tier="STRONG", reach=999), _yoga("HAMSA_YOGA", "WEAK", tier="MODERATE")]
    assert [y.name for y in top_natal_yogas(yogas)] == ["HAMSA_YOGA"]
    assert [y.name for y in top_active_yogas(yogas)] == ["HAMSA_YOGA"]


def test_o25_headline_takes_no_honorific() -> None:
    """T1: a graha is அமைந்துள்ளது, never உள்ளார்."""
    import inspect

    from app.services import reading_story

    source = inspect.getsource(reading_story.story_headline)
    assert "அமைந்துள்ளது" in source and "உள்ளார்" not in source


def test_care_column_keeps_cancelled_adverse_yogas_out() -> None:
    dosham = ChartDoshamInsight(
        name="SEVVAI_DOSHAM", isPresent=True, isCancelled=False, strength="PARTIAL", conditionsMet=[],
        cancellationFactors=[], dashaActivated=False, descriptionTa="", descriptionEn="",
    )
    mitigated = dosham.model_copy(update={"name": "PITRU_DOSHAM", "is_cancelled": True})
    yogas = [_yoga("KEMADRUMA_YOGA", "WEAK", present=False, cancel=["bhanga"]), _yoga("SAKATA_YOGA", "STRONG")]
    picked = care_patterns([dosham, mitigated], yogas)
    assert [(c.name, c.kind) for c in picked] == [("SAKATA_YOGA", "YOGA"), ("SEVVAI_DOSHAM", "DOSHAM")]
