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
        # `_ninth_lord_dignity`'s bare return values (`_yoga_detect.py`). Never
        # appended to conditions_met/cancellation_factors on their own — they
        # are only ever embedded inside the f-string marker
        # `ninth_lord_{dignity}`, which `_fill` below expands to a real token
        # ("ninth_lord_exalted") that IS covered by a MARKER_PATTERNS rule.
        "exalted",
        "own_sign",
        "moolatrikona",
        # `DoctrineOptions.o6_sevvai_cancer_leo`'s string value, compared with
        # `==` in `_yoga_dosham.py` — a config value, not a marker.
        "full_exemption",
        # O-2 and O-18 option values compared in `_yoga_dosham.py`; they
        # select branches but are never appended as rendered markers.
        "explicit_signs",
        "full_cancellation",
        # O-27 / O-28 (DD-17) option values, compared the same way.
        "kendra_functional_benefic",
        "strong_or_benefic",
        # DD-05 (DOCTRINE_DECISIONS v1.3): `DoshamResult.astrologer_markers` is
        # a THIRD list, separate from conditions_met/cancellation_factors, and
        # is never rendered by this panel by design — it is the astrologer /
        # porutham view only (see `_yoga_dosham.detect_sevvai_dosham`'s
        # `astrologer_markers` build). Its f-string shape is excluded here
        # rather than given a label, because giving it one would be a standing
        # invitation to actually render it on a consumer surface.
        "{gender_norm}_weighted_house_{house_num}_{ref_key}",
    }
)


def _without_dunder_all(source: str) -> str:
    """Drop an ``__all__`` block before scanning for markers.

    yogas.py is a facade, and its ``__all__`` is a list of ~70 quoted function
    names — `"detect_gaja_kesari"`, `"get_badhaka_lord"` — which are exactly the
    shape this scraper looks for. Scanned, they arrive as 35 "unlabelled
    markers" that no detector ever emits and no panel should ever have a label
    for.

    Narrow on purpose. The alternative was adding those names to _NOT_MARKERS,
    and that list's own comment says to keep it short and specific because a
    broad entry there hides real gaps. An export declaration is categorically
    not a marker emission, so excluding the construct is exact where naming the
    35 names would be a standing invitation to bury a real one among them.
    """
    return re.sub(r"__all__\s*=\s*[\[(].*?[\])]", "", source, flags=re.DOTALL)


def _emitted_markers() -> set[str]:
    """Tokens the detectors put into conditions_met / cancellation_factors."""
    markers: set[str] = set()
    for filename in _DETECTOR_SOURCES:
        path = _CALC / filename
        if not path.exists():
            continue
        source = _without_dunder_all(path.read_text(encoding="utf-8"))
        # A placeholder is matched as a whole `{…}` group, so f-string markers
        # come through whether they hold a bare name (`rahu_house_{rahu_house}`)
        # or an expression (`{planet.lower()}_in_marana_karaka_sthana`). The
        # old character class allowed `{`/`}` but not `.`/`(`, so every
        # expression placeholder was skipped and "mercury in marana karaka
        # sthana" reached the card raw with this guard green (2026-10-06).
        for literal in re.findall(r'"((?:[A-Za-z0-9_]|\{[^{}"\n]+\})+)"', source):
            if len(literal) < 6 or not (literal[0].isalpha() or literal[0] == "{"):
                continue
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

    # Expression placeholders whose values are a closed set, not a graha code.
    # Filled with a real member so the token is one the engine can emit.
    enum_fills = {
        "grade.lower()": "full",  # raja_grade_{full|qualified|mixed|…}
        "context.purity.lower()": "pure",  # adhi_purity_{pure|mixed|adverse}
        "sub_type.lower()": "maha",  # parivartana sub_type_{maha|dainya|kahala}
        "naga['code'].lower()": "ananta",  # Kala Sarpa variant_{naga}
        "target_label.lower()": "lagna",  # kartari *_hemming_{target}
        "houses": "4_9",  # {planet}_yogakaraka_owns_{kendra}_{trikona}
    }

    def _fill(match: re.Match[str]) -> str:
        expr = match.group(1)
        if expr.strip() in enum_fills:
            return enum_fills[expr.strip()]
        # Placeholders are sometimes expressions rather than bare names
        # (`{pv.planet_a.lower()}`); an explicit .lower() tells us the engine
        # emits a lower-case graha code there.
        if ".lower()" in expr:
            return "venus"
        name = expr.strip()
        # `graha` is this codebase's own word for a planet (see `planet.graha`),
        # so a placeholder named that interpolates a graha code, not a house
        # number. It was missing here until `graha_on_node_{graha}` was added
        # in 2026-08 and expanded to `graha_on_node_7` — a token the engine can
        # never emit, which then failed against a correctly planet-shaped rule.
        if name in {"p", "planet", "graha"} or name.endswith("_lord"):
            return "JUPITER"
        # DD-03 (v1.3): `rahu_ketu_axis_{axis}` — axis is "1_7" or "2_8", never
        # a house number. Filling it with "7" produced the unmatchable
        # "rahu_ketu_axis_7" against a rule written for the real values.
        if name == "axis":
            return "1_7"
        # DD-02 (v1.3): `ninth_lord_{dignity}` — dignity is one of
        # "exalted" / "own_sign" / "moolatrikona" (`_ninth_lord_dignity`),
        # never a house number.
        if name == "dignity":
            return "exalted"
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


#: DD-17 context notes are rendered by web *and* mobile through the shared
#: package, so their labels live there rather than in the web panel.
_SHARED_RECKONING = _ROOT / "packages" / "shared" / "src" / "doshamReckoning.ts"


def _panel_source() -> str:
    assert _PANEL.exists(), f"web panel not found at {_PANEL} — did the file move?"
    return _PANEL.read_text(encoding="utf-8")


def _context_label_block() -> str:
    source = _SHARED_RECKONING.read_text(encoding="utf-8")
    return source.split("export const DOSHAM_CONTEXT_LABELS", 1)[1].split("\n};", 1)[0]


def _static_labels(panel: str) -> set[str]:
    block = panel.split("const MARKER_LABELS", 1)[1].split("\n};", 1)[0]
    keys = set(re.findall(r"^\s{2}([a-z][a-z0-9_]*)\s*:", block, re.M))
    return keys | set(re.findall(r"^\s{2}([a-z][a-z0-9_]*)\s*:", _context_label_block(), re.M))


@pytest.mark.no_db
def test_every_sevvai_and_rahu_ketu_mitigation_has_a_verdict_phrase() -> None:
    """The L2 verdict line (plan 2026-10-06) names protections by marker from
    `MITIGATION_PHRASE`. A marker the detectors emit without a phrase would be
    silently left out of the sentence — the verdict would under-explain itself.
    """
    source = (_CALC / "_yoga_dosham.py").read_text(encoding="utf-8")
    bodies = [
        source.split(f"def {fn}(", 1)[1].split("\ndef ", 1)[0]
        for fn in ("detect_sevvai_dosham", "detect_rahu_ketu_dosham")
    ]
    emitted = {m for body in bodies for m in re.findall(r'cancellation_factors\.append\("([a-z_]+)"\)', body)}
    assert len(emitted) >= 15, f"only {len(emitted)} mitigation markers found — extraction broken?"
    phrase_block = _SHARED_RECKONING.read_text(encoding="utf-8").split("export const MITIGATION_PHRASE", 1)[1].split("\n};", 1)[0]
    phrases = set(re.findall(r"^\s{2}([a-z][a-z0-9_]*):", phrase_block, re.M))
    missing = sorted(emitted - phrases)
    assert not missing, f"no MITIGATION_PHRASE in packages/shared/src/doshamReckoning.ts for: {missing}"


@pytest.mark.no_db
def test_context_note_labels_match_backend_wording() -> None:
    """One wording for each DD-17 context note: the backend's why-text and the
    shared card table must not drift apart (they are hand-kept twins)."""
    from app.calculations._yoga_helpers import _marker_explain, _marker_explain_ta

    block = _context_label_block()
    entries = re.findall(r'^\s{2}([a-z][a-z0-9_]*):\s*\{\s*ta:\s*"([^"]*)",\s*en:\s*"([^"]*)",?\s*\}', block, re.M | re.S)
    assert len(entries) >= 4, "DOSHAM_CONTEXT_LABELS extraction looks broken"
    for key, ta, en in entries:
        assert _marker_explain(key) == en, key
        assert _marker_explain_ta(key) == ta, key


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


_EXPLANATION_SERVICE = _ROOT / "app" / "services" / "chart_explanation_service.py"
# aspectTypeLabel moved here when the panel was split (FTR-05, 2026-10-04).
_EXPLANATION_PANEL = _ROOT / "web" / "components" / "chart-reading" / "reading-helpers.ts"


def _emitted_aspect_types() -> set[str]:
    """Aspect-type keys `_aspect_type` can emit, as concrete strings.

    The function is four lines: a literal "STANDARD_7TH" and an f-string
    `f"{planet}_SPECIAL_{aspect_house}TH"`. Rather than guess, read both shapes
    out of the source so a renamed constant is caught here.
    """
    source = _EXPLANATION_SERVICE.read_text(encoding="utf-8")
    body = source.split("def _aspect_type(", 1)[1].split("\ndef ", 1)[0]
    emitted = set(re.findall(r'return "([A-Z0-9_]+)"', body))
    if re.search(r'return f"\{planet\}_SPECIAL_\{aspect_house\}TH"', body):
        # Every graha that owns a special aspect, at every house it can throw.
        for planet in ("MARS", "JUPITER", "SATURN", "RAHU", "KETU"):
            for house in (3, 4, 5, 8, 9, 10):
                emitted.add(f"{planet}_SPECIAL_{house}TH")
    assert emitted, "_aspect_type extraction found nothing — did the function move?"
    return emitted


@pytest.mark.no_db
def test_every_aspect_type_renders_as_a_phrase() -> None:
    """Sibling of the marker guard, for the UPPER_CASE token family.

    `_static_labels` above deliberately skips `literal.isupper()`, which left
    aspect-type constants unguarded — and they duly leaked, printing
    "MARS_SPECIAL_4TH" straight into the drishti chips until an astrologer
    review caught it (2026-07-18). `aspectTypeLabel` in the explanation panel is
    now the renderer; this asserts it actually covers what the engine emits
    instead of falling through to its own last-resort branch.
    """
    panel = _EXPLANATION_PANEL.read_text(encoding="utf-8")
    assert "function aspectTypeLabel" in panel, (
        "aspectTypeLabel is gone from the explanation panel — aspect types are "
        "being rendered by something this guard can no longer see"
    )
    body = panel.split("function aspectTypeLabel", 1)[1].split("\n}", 1)[0]
    special_rule = re.search(r"/\^\[A-Z\]\+_SPECIAL_\(\\d\+\)TH\$/", body)
    handles_standard = '"STANDARD_7TH"' in body

    unhandled = []
    for aspect_type in sorted(_emitted_aspect_types()):
        if aspect_type == "STANDARD_7TH" and handles_standard:
            continue
        if special_rule and re.fullmatch(r"[A-Z]+_SPECIAL_\d+TH", aspect_type):
            continue
        unhandled.append(aspect_type)

    assert not unhandled, (
        "These aspect types reach the UI with no branch in aspectTypeLabel, so "
        f"they render via its raw fallback: {unhandled}"
    )


@pytest.mark.no_db
def test_scan_self_check() -> None:
    """A regex that matched nothing would make the coverage assertion below
    vacuously pass."""
    markers = _emitted_markers()
    assert len(markers) >= 40, f"only {len(markers)} markers scanned — extraction likely broken"
    assert "mars_own_sign" in markers, "missed a plain literal marker"
    assert any("{" in m for m in markers), "missed the f-string marker family"
    assert "{planet.lower()}_in_marana_karaka_sthana" in markers, "missed an expression placeholder"

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
