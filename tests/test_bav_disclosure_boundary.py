"""The line between a bindu grid and a claim about somebody's children.

Two things share the word "ashtakavarga" in this codebase and only one of them
is gated.

**The bindu table is a measurement.** `compute_bhinnashtakavarga()` returns a
planet-by-rasi grid of counts. It says nothing about a person, it does not change
with age, and it already ships to every client on `ChartSummaryData.ashtakavarga`.
Showing it on the Jadhagam screen is showing an astrologer their own arithmetic,
which is why P2-05 was ruled in its favour (see `app/calculations/ashtakavarga.py`).

**A karaka-relative reading is a claim.** The 5th from Guru, the 3rd from Sevvai,
the 4th from Budhan, the 9th from Suriyan - progeny, siblings, the maternal line,
the paternal line. Those have a subject who can be hurt by being wrong, so they
live in `bav_derived.py` behind four gates (life-area age band, life-phase
relevance, propensity band, declared-fact) and reach a surface only through
`disclosable_indications()`.

The failure mode this file exists for is not someone deliberately removing a gate.
It is someone building the approved grid, wanting a cell to *mean* something,
importing `compute_bav_derived_indications` because it is right there and public,
and reading `.band` off the result. Every gate is in a sibling function they had
no reason to call, and nothing in a diff of the grid's own file would look wrong.

So the boundary is asserted here rather than written down and hoped for.
"""
from __future__ import annotations

import ast
from pathlib import Path

import pytest

pytestmark = pytest.mark.no_db

REPO_ROOT = Path(__file__).resolve().parents[1]
APP_ROOT = REPO_ROOT / "app"

BAV_DERIVED_MODULE = "app.calculations.bav_derived"

#: The only modules allowed to import the karaka-relative layer.
#:
#: This is deliberately a single entry. `life_areas_service` is the one caller
#: that owns all four gates: it knows the life area the reader is looking at (not
#: the borrowed karaka chain - see the `_AREA_TO_CHAIN_KEY` defect in
#: docs/BAV_DERIVED_INDICATIONS_2026-08-18.md 1.3), and it knows whether the
#: life-phase gate skipped that area. A second caller would need to re-derive
#: both, and two age gates that can drift apart are worse than none, because the
#: drift is invisible.
#:
#: ADDING TO THIS LIST IS A DOCTRINE CHANGE, NOT A REFACTOR. If a new surface
#: needs these indications, it needs its own answer to "which gate decides this
#: reader may see it" first, recorded in the doctrine file. If what the new
#: surface actually wants is the bindu *numbers*, it wants
#: `app.calculations.ashtakavarga` instead, and this list is not in its way.
ALLOWED_IMPORTERS: frozenset[str] = frozenset(
    {
        "app.services.life_areas_service",
    }
)

#: Reading `.band` and emitting a factor code is the disclosure act. A module
#: that computes indications and never asks `disclosable_indications` which of
#: them this reader may see has bypassed the gates whether or not it meant to.
COMPUTE_FN = "compute_bav_derived_indications"
DISCLOSE_FN = "disclosable_indications"


def _module_name(path: Path) -> str:
    return ".".join(path.relative_to(REPO_ROOT).with_suffix("").parts)


def _python_sources() -> list[Path]:
    return [
        p
        for p in APP_ROOT.rglob("*.py")
        if "__pycache__" not in p.parts
    ]


def _imported_modules(tree: ast.AST) -> set[str]:
    """Every module named by an `import x` or `from x import y` in the tree."""
    found: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            found.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            found.add(node.module)
    return found


def _called_names(tree: ast.AST) -> set[str]:
    """Bare function names called anywhere in the tree (`f(...)`, not `o.f(...)`)."""
    return {
        node.func.id
        for node in ast.walk(tree)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
    }


def test_karaka_relative_indications_have_exactly_one_importer():
    """Only a module that owns the gates may reach the gated layer.

    A failure here is most likely the bindu grid reaching for a meaning. The grid
    is approved; the meaning is not. Read `ashtakavarga.py`'s P2-05 ruling before
    widening ALLOWED_IMPORTERS.
    """
    importers = {
        _module_name(path)
        for path in _python_sources()
        if BAV_DERIVED_MODULE in _imported_modules(ast.parse(path.read_text(encoding="utf-8-sig")))
    }

    unexpected = importers - ALLOWED_IMPORTERS
    assert not unexpected, (
        f"{sorted(unexpected)} import {BAV_DERIVED_MODULE}, which carries the "
        "karaka-relative readings (progeny, siblings, maternal, paternal). Those "
        "are gated disclosures, not chart facts.\n"
        "  - If you want the bindu NUMBERS for a grid or a transit score, import "
        "app.calculations.ashtakavarga instead. It is ungated on purpose.\n"
        "  - If you genuinely need the readings on a new surface, decide which "
        "gate protects that surface, record it in docs/DOCTRINE_DECISIONS_V1.md, "
        "then add the module here."
    )

    # The allow-list must not rot into a list of modules that stopped importing
    # it - a stale entry silently re-opens the door for whoever revives the name.
    assert ALLOWED_IMPORTERS <= importers, (
        f"{sorted(ALLOWED_IMPORTERS - importers)} is allow-listed but no longer "
        f"imports {BAV_DERIVED_MODULE}. Remove the stale entry."
    )


def test_every_computer_of_indications_also_asks_which_may_be_shown():
    """Computing the four indications and never gating them is the bypass itself.

    `compute_bav_derived_indications` is age-blind by design - it answers all four
    rules for an infant and an eighty-year-old alike, because bindus do not change
    with age. That is correct for a calculation and catastrophic for a surface.
    `disclosable_indications` is where "may this reader see it" lives, and the two
    are only safe as a pair.
    """
    for path in _python_sources():
        tree = ast.parse(path.read_text(encoding="utf-8-sig"))
        called = _called_names(tree)
        if COMPUTE_FN not in called:
            continue
        assert DISCLOSE_FN in called, (
            f"{_module_name(path)} calls {COMPUTE_FN}() but never {DISCLOSE_FN}(). "
            "The compute layer is age-blind on purpose; it emits progeny, sibling, "
            "maternal and paternal bands for every chart including an infant's. "
            f"Route the result through {DISCLOSE_FN}(indications, area, "
            "age_relevant=...) before anything reads .band."
        )


def test_the_shipped_bindu_grid_carries_numbers_and_no_verdicts():
    """`ChartSummaryData.ashtakavarga` is the grid's payload. It stays numeric.

    The approved Jadhagam grid renders this field. If a band word, a domain label
    or a karaka-relative key ever enters it, the grid has become a disclosure
    surface with no gate in front of it - which is the exact bypass this file
    guards, arriving through the schema instead of through an import.
    """
    from app.schemas.charts import ChartSummaryData

    field = ChartSummaryData.model_fields["ashtakavarga"]
    assert field.annotation == dict[str, dict[int, int]], (
        "ashtakavarga on the chart summary must stay a planet -> rasi -> bindu "
        f"count map; it is now {field.annotation!r}. A bindu grid states a count, "
        "never a subject. Karaka-relative readings belong on the life-area cards, "
        "where the four gates are."
    )


def test_no_schema_or_route_reaches_the_gated_layer():
    """Serialisation and routing are where an ungated leak would actually ship.

    Covered by the allow-list above, but asserted separately because the message
    matters: a gated reading arriving in a response model has escaped the life
    area that was deciding whether to show it, and no client can put it back.
    """
    leaked = sorted(
        _module_name(path)
        for path in _python_sources()
        if path.parts[-2] in {"schemas", "api"}
        and BAV_DERIVED_MODULE in _imported_modules(ast.parse(path.read_text(encoding="utf-8-sig")))
    )
    assert not leaked, (
        f"{leaked} would serialise karaka-relative readings straight onto the "
        "wire. These are disclosed per life area after four gates; a response "
        "model has no gate to apply."
    )


def test_every_disclosable_factor_code_has_bilingual_copy():
    """A disclosed indication with no label degrades to a humanised English key.

    `life-area-card.tsx` falls back to prettifying an unknown factor code, which
    is the right behaviour for an unknown code and the wrong outcome for one we
    ship deliberately: `paternal_bav_thin` would surface to a Tamil reader as
    "Paternal Bav Thin". This catches a fifth rule added without its copy.
    """
    from app.calculations.bav_derived import (
        BAND_STRONG,
        BAND_THIN,
        BAV_DERIVED_RULES,
        BavIndication,
        disclosable_indications,
        factor_code,
    )

    card = (REPO_ROOT / "web" / "components" / "life-area-card.tsx").read_text(encoding="utf-8-sig")

    for rule in BAV_DERIVED_RULES:
        for band in (BAND_STRONG, BAND_THIN):
            indication = BavIndication(
                key=rule.key,
                karaka=rule.karaka,
                house=rule.house,
                domain=rule.domain,
                rasi=1,
                bindus=0,
                band=band,
            )
            # Ask the disclosure layer rather than assuming: progeny's THIN band
            # is withheld by design, so its code should NOT need copy.
            shown = disclosable_indications(
                {rule.key: indication}, rule.domain, age_relevant=True
            )
            code = factor_code(indication)
            if not shown:
                continue
            assert f"{code}:" in card, (
                f"{code} can be disclosed but has no entry in "
                f"web/components/life-area-card.tsx. A Tamil reader would see the "
                "humanised English key instead."
            )
