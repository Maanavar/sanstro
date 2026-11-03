"""Owner rulings of 2026-10-30, final answer sheet (DOCTRINE_DECISIONS_V1.md
§18): Putra Sarpa's grammar (Q9-Q12, Q14), the four-part assessment and its
parihara answer (Q13, Q15), and the progeny invariant (Q17): no output path may
say a person cannot have children.

Lagna Mesham throughout the hand-built charts: the 5th house is Simmam (5), its
lord the Sun. Synthetic only — no person, no birth data.
"""
from __future__ import annotations

import random
import re
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.calculations._yoga_dosham import detect_putra_sarpa_dosham, detect_santhana_thadai
from app.calculations._yoga_helpers import PROGENY_OUTLOOKS
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.remedies import active_dosham_planet
from app.schemas.charts import ChartDoshamInsight

pytestmark = pytest.mark.no_db

_BASE = {"SUN": 3, "MOON": 6, "MARS": 7, "MERCURY": 3, "VENUS": 6, "SATURN": 8}


def _ps(**placed: int):
    return detect_putra_sarpa_dosham({**_BASE, **placed}, 1, {})


# ── Q11: only a node in the 5th declares; the legs grade it ──────────────────
def test_a_node_in_the_fifth_alone_is_mild() -> None:
    r = _ps(RAHU=5, KETU=11, JUPITER=2)
    assert (r.is_present, r.strength, r.label) == (True, "WEAK", "ACTIVE_DOSHAM")
    assert r.progeny_outlook == "delay" and r.parihara == "full"
    # Q13: no D7, no dasha step yet, so the reading says it is not final.
    assert not r.assessment_complete
    assert "children_assessment_incomplete" in r.context_notes


def test_one_leg_confirms_it() -> None:
    r = _ps(RAHU=5, KETU=11, SUN=11, JUPITER=2)  # Ketu beside the 5th lord
    assert (r.strength, r.formation_strength) == ("PARTIAL", "PARTIAL")
    assert "fifth_lord_sun_joined_by_ketu" in r.conditions_met


def test_both_legs_make_it_severe() -> None:
    # Ketu in the 5th; Rahu beside the Sun and beside Jupiter, which aspects
    # the 5th from the 11th.
    r = _ps(KETU=5, RAHU=11, SUN=11, JUPITER=11)
    assert (r.strength, r.label) == ("STRONG", "STRONG_ACTIVE_DOSHAM")
    assert {"fifth_lord_sun_joined_by_rahu", "jupiter_joined_by_rahu"} <= set(r.conditions_met)


def test_legs_without_a_node_in_the_fifth_are_a_watch_note_only() -> None:
    r = _ps(RAHU=3, KETU=9, SUN=9, JUPITER=2)
    assert not r.is_present
    assert r.context_notes == ("putra_sarpa_watch_only",)
    assert r.parihara == "none"
    assert r.progeny_outlook == "needs_attention"
    assert active_dosham_planet([r], 1) is None, "no naga parihara for a watch-note"


def test_guru_rahu_is_a_leg_only_when_jupiter_is_linked_to_the_fifth() -> None:
    # Jupiter with Rahu in Mithunam aspects 7, 9, 11: no link to Simmam.
    unlinked = _ps(RAHU=3, KETU=9, JUPITER=3, SUN=6)
    assert not unlinked.is_present and unlinked.context_notes == ()
    # Jupiter with Rahu in Dhanusu aspects Simmam (its 9th): linked.
    linked = _ps(RAHU=9, KETU=3, JUPITER=9, SUN=6)
    assert linked.context_notes == ("putra_sarpa_watch_only",)
    assert "jupiter_joined_by_rahu" in linked.conditions_met


def test_guru_ketu_is_a_watch_note_not_a_leg() -> None:
    """Q14: no Rahu rule extends to Ketu by default; D6b is unruled."""
    declared = _ps(RAHU=5, KETU=11, JUPITER=11, SUN=6)  # Ketu with a linked Jupiter
    assert declared.strength == "WEAK", "Guru + Ketu must not raise the grade"
    assert "jupiter_joined_by_ketu" not in declared.conditions_met
    assert "putra_sarpa_guru_ketu_noted" in declared.context_notes
    alone = _ps(RAHU=3, KETU=9, JUPITER=9, SUN=6)
    assert not alone.is_present and alone.parihara == "none"
    assert set(alone.context_notes) == {"putra_sarpa_watch_only", "putra_sarpa_guru_ketu_noted"}


def test_protection_lowers_a_grade_and_never_cancels() -> None:
    # Confirmed, with Jupiter in Kadagam (a kendra).
    r = _ps(RAHU=5, KETU=11, SUN=11, JUPITER=4)
    assert (r.formation_strength, r.strength) == ("PARTIAL", "WEAK")
    assert r.is_cancelled is False and r.is_present
    assert "jupiter_in_kendra_house_4" in r.cancellation_factors


def test_the_kendra_test_stays_at_its_shipped_behaviour_pending_definition() -> None:
    """Q12: the kendra-only definition is NOT approved, and must not be
    narrowed or widened by the engine before the astrologer rules: a Jupiter
    in a kendra still protects even when a node joins it."""
    r = _ps(RAHU=5, KETU=11, JUPITER=11, SUN=11)  # Jupiter in the 11th: no kendra
    assert not any(f.startswith("jupiter_in_kendra") for f in r.cancellation_factors)
    joined = _ps(KETU=5, RAHU=10, JUPITER=10, SUN=6)  # Jupiter in the 10th with Rahu
    assert "jupiter_in_kendra_house_10" in joined.cancellation_factors


def test_no_d7_leg() -> None:
    """Ruling C: no text defines a weak D7, so the detector takes no D7 input."""
    import inspect

    assert "d7" not in inspect.signature(detect_putra_sarpa_dosham).parameters


# ── Q13/Q15: the parihara is the assessment's fourth answer ──────────────────
def test_santhana_thadai_protection_lightens_the_parihara_and_says_so() -> None:
    open_fifth = detect_santhana_thadai({**_BASE, "SATURN": 5, "JUPITER": 2, "RAHU": 3, "KETU": 9}, 1, {})
    guarded = detect_santhana_thadai({**_BASE, "SATURN": 5, "JUPITER": 1, "RAHU": 3, "KETU": 9}, 1, {})
    assert open_fifth.is_present and open_fifth.parihara == "full"
    assert guarded.is_present and guarded.parihara == "objective_only", "never silently withheld"
    assert "santhana_thadai_lighter_parihara" in guarded.context_notes
    assert "santhana_thadai_lighter_parihara" not in open_fifth.context_notes
    for r in (open_fifth, guarded):
        assert not r.assessment_complete and "children_assessment_incomplete" in r.context_notes
    # The graha's (cause) parihara routes a planet only on "full".
    assert active_dosham_planet([guarded], 1) is None
    assert active_dosham_planet([open_fifth], 1) == "SATURN"


def test_remedy_routing_reads_the_api_shape_too() -> None:
    """`active_dosham_planet` is also fed API `ChartDoshamInsight`s, which carry
    the level under `assessment`; a flat lookup would read them as "full"."""
    base = {
        "name": "SANTHANA_THADAI", "isPresent": True, "isCancelled": True, "strength": "WEAK",
        "conditionsMet": [], "cancellationFactors": [], "dashaActivated": False,
        "descriptionTa": "", "descriptionEn": "",
    }
    lighter = ChartDoshamInsight.model_validate({**base, "assessment": {"formation": True, "parihara": "objective_only"}})
    legacy = ChartDoshamInsight.model_validate(base)
    assert active_dosham_planet([lighter], 1) is None
    assert active_dosham_planet([legacy], 1) == "SATURN"
    with pytest.raises(ValidationError):
        ChartDoshamInsight.model_validate({**base, "assessment": {"formation": True, "parihara": "withheld"}})


# ── Q17: the progeny invariant ───────────────────────────────────────────────
def test_the_outlook_type_has_no_denial() -> None:
    assert PROGENY_OUTLOOKS == {"delay", "difficulty", "needs_attention"}
    with pytest.raises(ValidationError):
        ChartDoshamInsight.model_validate({
            "name": "PUTRA_SARPA_DOSHAM", "isPresent": True, "isCancelled": False, "strength": "WEAK",
            "conditionsMet": [], "cancellationFactors": [], "dashaActivated": False,
            "descriptionTa": "", "descriptionEn": "", "progenyOutlook": "denial",
        })


#: Backstop only: the semantic field above is the gate.
_DENIAL = re.compile(
    r"cannot have children|can't have children|can not have children|will not have children|"
    r"won't have children|never have children|no children|childless|denial of children|denies children|"
    r"barren|infertil|குழந்தை பிறக்காது|குழந்தைப்பேறு இல்லை|குழந்தை இல்லை|சந்ததி இல்லை|"
    r"புத்திர பாக்கியம் இல்லை|குழந்தை பாக்கியம் இல்லை|மலட்டு",
    re.IGNORECASE,
)
_TEXT_FIELDS = (
    "description_ta", "description_en", "explanation_what_ta", "explanation_what_en",
    "explanation_why_ta", "explanation_why_en", "explanation_how_ta", "explanation_how_en",
    "meaning_ta", "meaning_en",
)


def test_every_children_finding_carries_an_outlook_and_never_denies() -> None:
    rng = random.Random(1030)
    seen = set()
    for _ in range(600):
        snap = calculate_sidereal_planets(rng.uniform(2_436_934.5, 2_455_197.5))
        planets = {g: b.rasi for g, b in snap.bodies.items()}
        lagna = rng.randint(1, 12)
        for result in (detect_putra_sarpa_dosham(planets, lagna, {}), detect_santhana_thadai(planets, lagna, {})):
            assert result.category == "CHILDREN"
            if result.is_present or result.context_notes:
                assert result.progeny_outlook in PROGENY_OUTLOOKS, result
                seen.add(result.progeny_outlook)
            else:
                assert result.progeny_outlook == ""
            for field in _TEXT_FIELDS:
                assert not _DENIAL.search(getattr(result, field)), (field, getattr(result, field))
    assert seen == PROGENY_OUTLOOKS, f"the population never reached {PROGENY_OUTLOOKS - seen}"


_ROOT = Path(__file__).resolve().parents[1]
_SHIPPED = ("app", "packages/shared/src", "web/lib", "web/components", "web/app", "mobile/src", "mobile/app")
#: Files that name the forbidden claim in order to forbid it, or to recognise
#: it in what a person typed. ask_vinaadi_topics.py matches "infertility" in a
#: question so it gets the safety addendum (spec L7); it renders no copy. Blind
#: spot: a denial string added to either file as shipped copy would pass here.
_ALLOWED_FILES = {"app/services/qa_service.py", "app/services/ask_vinaadi_topics.py"}


def test_no_shipped_string_claims_denial() -> None:
    """Comments are skipped, and so is a question (an FAQ asking "does this
    mean I cannot have children?" answers it with "No")."""
    hits = []
    for top in _SHIPPED:
        for path in (_ROOT / top).rglob("*"):
            if path.suffix not in {".py", ".ts", ".tsx"} or "node_modules" in path.parts:
                continue
            rel = path.relative_to(_ROOT).as_posix()
            if rel in _ALLOWED_FILES or ".test." in path.name or "__pycache__" in path.parts:
                continue
            for number, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
                stripped = line.lstrip()
                if stripped.startswith(("#", "//", "*", "/*")):
                    continue
                for match in _DENIAL.finditer(line):
                    rest = re.split(r"[\"'`]", line[match.end():], maxsplit=1)[0]
                    if "?" in rest:
                        continue
                    hits.append(f"{rel}:{number}: {match.group(0)}")
    assert not hits, hits
