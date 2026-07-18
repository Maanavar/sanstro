"""Guard: every condition/cancellation marker the engine emits must render as
a sentence, not as a raw token.

`markerLabel` in the web panel falls back to `marker.replaceAll("_", " ")` for
an unmapped token, so a gap here does not throw, does not fail typecheck, and
does not fail any frontend test — it just quietly shows the user
"eleventh lord weak malefic conj" where a sentence belongs. That is exactly the
kind of silent cross-boundary drift this repo has been bitten by before, so the
check lives here, in the one place that can see both sides.

This test reads a `.tsx` file from Python, which is unusual. It is deliberate:
the tokens are authored in `app/calculations/`, the labels in `web/`, and
neither side's own test suite can see the other.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

_ROOT = Path(__file__).resolve().parent.parent
_CALC = _ROOT / "app" / "calculations"
_PANEL = _ROOT / "web" / "components" / "dashboard-yoga-dosham-panel.tsx"

_DETECTOR_SOURCES = ("_yoga_dosham.py", "_yoga_detect.py", "yogas.py", "_yoga_helpers.py")

# String literals that match the token shape but are not markers: dataclass
# field names, dict keys, and enum-ish values that appear in the same files.
# Keep this list short and specific — a broad pattern here would hide real gaps.
_NOT_MARKERS = frozenset(
    {
        "meaning_en",
        "meaning_ta",
        "description_en",
        "description_ta",
        "present",
        "strength_score",
        "explanation_what_en",
        "explanation_what_ta",
        "explanation_why_en",
        "explanation_why_ta",
        "explanation_how_en",
        "explanation_how_ta",
    }
)


def _emitted_markers() -> set[str]:
    """Tokens the detectors put into conditions_met / cancellation_factors."""
    markers: set[str] = set()
    for filename in _DETECTOR_SOURCES:
        path = _CALC / filename
        if not path.exists():
            continue
        source = path.read_text(encoding="utf-8")
        # The `{}` in the class is what lets f-string markers through
        # (`rahu_house_{rahu_house}`). Without it they are skipped entirely and
        # the whole parametrized family goes unchecked — which is precisely the
        # bug test_scan_self_check caught on this file's first run.
        for literal in re.findall(r'"([A-Za-z{][A-Za-z0-9_{}]{5,})"', source):
            if literal in _NOT_MARKERS:
                continue
            # Markers are snake_case or PLANET-prefixed snake_case; yoga/dosham
            # codes are fully upper-case and are handled by YOGA_EFFECT instead.
            if literal.isupper():
                continue
            if "_" not in literal:
                continue
            markers.add(literal)
    return markers


def _expand_fstring_markers(source_markers: set[str]) -> set[str]:
    """f-string markers are extracted with their placeholders intact
    (``rahu_house_{rahu_house}``). Substitute representative values so the
    pattern rules are exercised on something shaped like a real token.

    The substitution has to be type-aware: a placeholder named ``planet`` or
    ``*_lord`` interpolates an upper-case graha code, everything else a house
    number. Filling both with "7" would let a planet-shaped rule pass against a
    token that can never occur.
    """

    def _fill(match: re.Match[str]) -> str:
        expr = match.group(1)
        # Placeholders are sometimes expressions rather than bare names
        # (`{pv.planet_a.lower()}`); an explicit .lower() tells us the engine
        # emits a lower-case graha code there.
        if ".lower()" in expr:
            return "venus"
        name = expr.strip()
        if name in {"p", "planet"} or name.endswith("_lord"):
            return "JUPITER"
        return "7"

    expanded: set[str] = set()
    for marker in source_markers:
        concrete = re.sub(r"\{([^{}]+)\}", _fill, marker)
        # Markers built by concatenation end with a bare separator
        # (`"combust_key_planet_" + "_".join(...)`); complete them the way the
        # engine does, with lower-case graha names.
        if concrete.endswith("_"):
            concrete += "mercury"
        expanded.add(concrete)
    return expanded


def _panel_source() -> str:
    assert _PANEL.exists(), f"web panel not found at {_PANEL} — did the file move?"
    return _PANEL.read_text(encoding="utf-8")


def _static_labels(panel: str) -> set[str]:
    block = panel.split("const MARKER_LABELS", 1)[1].split("\n};", 1)[0]
    return set(re.findall(r"^\s{2}([a-z][a-z0-9_]*)\s*:", block, re.M))


def _pattern_regexes(panel: str) -> list[re.Pattern[str]]:
    block = panel.split("const MARKER_PATTERNS", 1)[1].split("\n];", 1)[0]
    # The rules use plain character classes and anchors, which mean the same
    # thing in JS and Python. Anything fancier would need a real JS regex
    # translation and should fail loudly rather than be silently mistranslated.
    sources = re.findall(r"re:\s*/(.+?)/,", block)
    patterns: list[re.Pattern[str]] = []
    for src in sources:
        assert not any(tok in src for tok in ("(?<", "\\p{", "(?=")), (
            f"pattern {src!r} uses a JS-specific regex feature this guard cannot "
            "evaluate — translate it or extend this test"
        )
        patterns.append(re.compile(src))
    return patterns


@pytest.mark.no_db
def test_scan_self_check() -> None:
    """A regex that matched nothing would make the coverage assertion below
    vacuously pass."""
    markers = _emitted_markers()
    assert len(markers) >= 40, f"only {len(markers)} markers scanned — extraction likely broken"
    assert "mars_own_sign" in markers, "missed a plain literal marker"
    assert any("{" in m for m in markers), "missed the f-string marker family"

    panel = _panel_source()
    assert len(_static_labels(panel)) >= 50, "MARKER_LABELS extraction looks broken"
    assert len(_pattern_regexes(panel)) >= 5, "MARKER_PATTERNS extraction looks broken"


@pytest.mark.no_db
def test_every_emitted_marker_renders_as_a_sentence() -> None:
    panel = _panel_source()
    labels = _static_labels(panel)
    patterns = _pattern_regexes(panel)

    unlabelled = []
    for marker in sorted(_expand_fstring_markers(_emitted_markers())):
        if marker in labels:
            continue
        if any(p.search(marker) for p in patterns):
            continue
        unlabelled.append(marker)

    assert not unlabelled, (
        "These markers can be shown to a user but have no label in MARKER_LABELS "
        "and match no MARKER_PATTERNS rule, so they render as raw snake_case via "
        f"the replaceAll fallback: {unlabelled}"
    )
