"""EC-RULING-06 — the mortality class, swept statically over every shipped string.

Why this is a separate file from `test_tone_compliance.py`, and why it is static:

`run_safety_pass` only ever inspects text that a request actually generated. That
is precisely how "traditionally associated with widowhood risk" survived in the
public porutham summary while "danger" was being caught everywhere — no test
exercised that branch, so the runtime validator never saw the string. A second
instance was sitting in `web/lib/marketing-i18n/tool-porutham.ts`, which no
Python check touches at all.

So this sweep reads the shipped **source** of every Python, TS and TSX file and
inspects its *string literals*. Comments and identifiers are exempt, so a comment
explaining the rule does not trip it, but anything that can reach a user does.

The two classes are kept apart deliberately. A `tone_validator` hit means the
copy is needlessly bleak and should be rewritten. A `mortality_validator` hit
means an EC-A11-class event assertion is present, and the ruling is explicit that
this class gets no conversion-operator form: delete the claim, keep the finding
as a reason code (see `porutham.RAJJU_SOURCE_TEXT_CATEGORY`).
"""
from __future__ import annotations

import ast
import os
from pathlib import Path

import pytest

from app.services.narrative_engine import (
    _BANNED_MORTALITY_PHRASES,
    mortality_validator,
    tone_validator,
)

pytestmark = pytest.mark.no_db

_REPO_ROOT = Path(__file__).resolve().parents[1]

_SCAN_ROOTS = ("app", "web", "mobile", "packages")
_SCAN_SUFFIXES = (".py", ".ts", ".tsx")

#: Pruned during the walk, not filtered after it. `Path.glob("web/**/*.ts")`
#: descends into node_modules before anything gets a chance to skip it, which
#: turned this sweep from ~2s into a multi-minute walk over tens of thousands of
#: vendored files. Prune at the directory level.
_SKIP_DIRS = frozenset({
    "node_modules", ".venv", "venv", "__pycache__", ".next", "dist", "build",
    ".pytest_cache", ".turbo", ".git", "coverage", ".mypy_cache", ".ruff_cache",
})

#: file -> why its mortality-word hits are admissible.
#:
#: Exactly two admissible kinds:
#:   1. "widowed" as a MARITAL STATUS the user selects about themselves. A person
#:      describing their own life is not the engine predicting a death.
#:   2. Preserved SOURCE TEXT inside a provenance record that is never rendered.
#:
#: A new file appearing here fails `test_the_allowlist_has_no_stale_entries`'s
#: sibling below, which is the point: adding a death assertion should cost an
#: explicit, reviewable justification rather than passing silently.
_ALLOWED: dict[str, str] = {
    # 1 — marital-status vocabulary (enum values, form labels, i18n labels).
    "app/core/age_gate.py": "marital-status token; drives remarriage framing",
    "app/schemas/birth_profiles.py": "marital-status enum value",
    "app/schemas/family_vaults.py": "marital-status enum value",
    "app/schemas/one_minute_reading.py": "marital-status enum value",
    "app/services/marriage_service.py": "marital-status branch key",
    "app/services/one_minute_reading_service.py": "marital-status option label (self-description)",
    "web/components/dashboard-edit-profile-modal.tsx": "marital-status form option",
    "web/components/dashboard-life-areas-predictions-nova.tsx": "marital-status branch key",
    "web/components/dashboard-life-areas-shared.ts": "marital-status branch key",
    "web/components/dashboard-life-areas-tab-nova.tsx": "marital-status branch key",
    "web/components/dashboard-setup-tab.tsx": "marital-status form option",
    "web/lib/i18n.ts": "marital-status form label",
    # 2 — preserved source text, provenance only, never rendered.
    "app/data/marriage_muhurta_rules.py": (
        "RuleSource.authority passage; its own note records that user-facing copy "
        "is a deliberately separate, undecided question"
    ),
    # The banned set itself.
    "app/services/narrative_engine.py": "defines the banned phrases",
}


def _ts_string_literals(text: str) -> list[str]:
    """Every string literal in a TS/TSX source, via a single linear pass.

    Deliberately NOT a regex. The obvious pattern —
    ``(['"`])((?:\\.|(?!\1).)*)\1`` with DOTALL — backtracks catastrophically on
    real .tsx files, because prose apostrophes ("don't") open a quote that never
    closes and the engine rescans to EOF from every position. That took this
    sweep from seconds to over five minutes.

    A state machine over the characters is O(n), cannot blow up, and gets
    comments right as a side effect: a `//` inside a string stays part of the
    string, and a quote inside a comment does not open one.
    """
    out: list[str] = []
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        if ch == "/" and i + 1 < n and text[i + 1] == "/":
            i = text.find("\n", i)
            if i == -1:
                break
        elif ch == "/" and i + 1 < n and text[i + 1] == "*":
            end = text.find("*/", i + 2)
            i = n if end == -1 else end + 2
        elif ch in "'\"`":
            quote, start, i = ch, i + 1, i + 1
            while i < n:
                if text[i] == "\\":
                    i += 2
                    continue
                if text[i] == quote:
                    break
                i += 1
            out.append(text[start:i])
            i += 1
        else:
            i += 1
    return out


def _python_string_literals(text: str) -> list[str]:
    """Every string literal in a Python module, docstrings included.

    Docstrings are deliberately NOT exempt. A docstring is read by the next
    engineer and copied into the next rewrite, so the banned wording should not
    survive there either.
    """
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return []
    return [
        node.value
        for node in ast.walk(tree)
        if isinstance(node, ast.Constant) and isinstance(node.value, str)
    ]


def _scan_files():
    for root_name in _SCAN_ROOTS:
        root = _REPO_ROOT / root_name
        if not root.is_dir():
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in _SKIP_DIRS]
            for filename in filenames:
                path = Path(dirpath) / filename
                if path.suffix not in _SCAN_SUFFIXES:
                    continue
                try:
                    text = path.read_text(encoding="utf-8")
                except (UnicodeDecodeError, OSError):
                    continue
                rel = path.relative_to(_REPO_ROOT).as_posix()
                literals = (
                    _python_string_literals(text)
                    if path.suffix == ".py"
                    else _ts_string_literals(text)
                )
                yield rel, literals


def test_no_unallowlisted_mortality_assertion_in_any_shipped_string() -> None:
    """EC-RULING-06's CI requirement, over templates and i18n — not just runtime."""
    offenders: dict[str, set[str]] = {}
    for rel, literals in _scan_files():
        if rel in _ALLOWED:
            continue
        for literal in literals:
            for phrase in mortality_validator(literal):
                offenders.setdefault(rel, set()).add(phrase)

    assert not offenders, (
        "spouse/native death assertions found in shipped strings — EC-RULING-06 says "
        "excise, don't reword, and keep the finding as a reason code:\n"
        + "\n".join(f"  {f}: {sorted(p)}" for f, p in sorted(offenders.items()))
    )


def test_the_allowlist_has_no_stale_entries() -> None:
    """An allowlist entry matching nothing is a licence nobody is using — and the
    next person to add a death assertion to that file inherits it silently."""
    hit_files = {
        rel
        for rel, literals in _scan_files()
        if any(mortality_validator(literal) for literal in literals)
    }
    stale = sorted(set(_ALLOWED) - hit_files)
    assert not stale, f"allowlist entries matching nothing, remove them: {stale}"


def test_the_sweep_actually_reaches_the_web_i18n_layer() -> None:
    """A guard on the guard. The second live breach was in a `.ts` i18n file, so
    a sweep that silently globbed nothing under `web/` would look green while
    checking almost nothing."""
    scanned = {rel for rel, _ in _scan_files()}
    assert "web/lib/marketing-i18n/tool-porutham.ts" in scanned
    assert sum(1 for rel in scanned if rel.startswith("web/")) > 50


def test_mortality_validator_catches_the_phrase_that_actually_shipped() -> None:
    """The regression this class exists for. `tone_validator` returned [] for
    this string for months, because its list held 'danger' but not 'widowhood'."""
    shipped = (
        "Rajju Dosha: same Rajju group — traditionally associated with widowhood risk"
    )
    # One hit, not three: "widow" is a substring check and deliberately carries
    # the whole inflection family rather than listing widower/widowhood/widowed.
    assert mortality_validator(shipped) == ["widow"]
    assert tone_validator(shipped) == ["widow"]


def test_mortality_validator_catches_tamil_and_the_euphemism() -> None:
    assert mortality_validator("வைதவ்ய ஆபத்துடன் தொடர்புடையது") == ["வைதவ்ய"]
    # The phrasing a well-meaning rewrite reaches for instead of the direct word.
    assert mortality_validator("மாங்கல்ய பங்கம் ஏற்படலாம்") == ["மாங்கல்ய பங்கம்"]


def test_mortality_and_tone_classes_stay_separable() -> None:
    """They call for different responses — rewrite vs delete — so a caller has to
    be able to tell them apart."""
    assert mortality_validator("A crisis is approaching.") == []
    assert tone_validator("A crisis is approaching.") == ["crisis"]
    assert set(_BANNED_MORTALITY_PHRASES).isdisjoint({"crisis", "danger", "hardship"})
