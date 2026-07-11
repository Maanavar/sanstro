"""Golden tests for the functional-nature table (audit T4).

The 108-cell FUNCTIONAL_NATURE_TABLE is hand-authored; a single wrong cell
silently corrupts every prediction for that lagna. These tests lock it down:

  * every mechanically-derivable cell must equal `derive_functional_nature`;
  * the only allowed deviations are the explicit, documented expert overrides;
  * the local sign-lord map used by the derivation must not drift from the
    canonical `chart_strength.SIGN_LORD`.
"""
from __future__ import annotations

import pytest

from app.calculations.chart_strength import SIGN_LORD
from app.calculations.functional_nature import (
    _SIGN_LORD,
    FUNCTIONAL_NATURE_TABLE,
    KNOWN_FUNCTIONAL_NATURE_OVERRIDES,
    PLANET_OWNED_RASIS,
    derive_functional_nature,
    get_functional_nature,
)

SEVEN_PLANETS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")
NODES = ("RAHU", "KETU")


@pytest.mark.no_db
def test_local_sign_lord_matches_canonical():
    """The derivation's local sign-lord map must equal chart_strength.SIGN_LORD."""
    assert _SIGN_LORD == SIGN_LORD


@pytest.mark.no_db
def test_owned_rasis_cover_all_signs():
    all_owned = {rasi for rasis in PLANET_OWNED_RASIS.values() for rasi in rasis}
    assert all_owned == set(range(1, 13))


@pytest.mark.no_db
@pytest.mark.parametrize("lagna", range(1, 13))
@pytest.mark.parametrize("planet", SEVEN_PLANETS)
def test_table_matches_derivation_or_documented_override(lagna: int, planet: str):
    """Each of the 84 planet cells equals the derivation, or is a listed override."""
    table_value = FUNCTIONAL_NATURE_TABLE[lagna][planet]
    derived = derive_functional_nature(lagna, planet).value
    if table_value == derived:
        return
    override = KNOWN_FUNCTIONAL_NATURE_OVERRIDES.get((lagna, planet))
    assert override is not None, (
        f"Lagna {lagna} {planet}: table={table_value} but derivation={derived}. "
        f"If this is intentional, add it to KNOWN_FUNCTIONAL_NATURE_OVERRIDES with a reason; "
        f"otherwise it is a table typo."
    )
    assert override[0] == table_value, (
        f"Lagna {lagna} {planet}: override records {override[0]} but table has {table_value}."
    )


@pytest.mark.no_db
def test_every_override_is_actually_divergent():
    """No stale overrides: each listed override must still diverge from derivation."""
    for (lagna, planet), (value, _note) in KNOWN_FUNCTIONAL_NATURE_OVERRIDES.items():
        derived = derive_functional_nature(lagna, planet).value
        assert FUNCTIONAL_NATURE_TABLE[lagna][planet] == value
        assert derived != value, (
            f"Override for Lagna {lagna} {planet} no longer diverges from the "
            f"derivation — remove it from KNOWN_FUNCTIONAL_NATURE_OVERRIDES."
        )


@pytest.mark.no_db
def test_override_count_is_small_and_pinned():
    """Guardrail: the set of hand-tuned deviations stays small and reviewed."""
    assert len(KNOWN_FUNCTIONAL_NATURE_OVERRIDES) == 3


@pytest.mark.no_db
@pytest.mark.parametrize("lagna", range(1, 13))
@pytest.mark.parametrize("planet", NODES)
def test_nodes_are_neutral_in_table(lagna: int, planet: str):
    """Nodes have no ownership; table default is NEUTRAL (dispositor logic is separate)."""
    assert FUNCTIONAL_NATURE_TABLE[lagna][planet] == "NEUTRAL"


@pytest.mark.no_db
@pytest.mark.parametrize("lagna", range(1, 13))
def test_get_functional_nature_matches_table(lagna: int):
    for planet in SEVEN_PLANETS:
        assert get_functional_nature(lagna, planet).value == FUNCTIONAL_NATURE_TABLE[lagna][planet]


# ── Node (Rahu/Ketu) dispositor + occupied-house nature (audit T5) ────────────


@pytest.mark.no_db
@pytest.mark.parametrize("node", NODES)
def test_node_without_chart_context_is_neutral(node: str):
    """Legacy callers (lagna + planet only) still get NEUTRAL for nodes."""
    from app.calculations.functional_nature import FunctionalNature

    assert get_functional_nature(1, node) == FunctionalNature.NEUTRAL


@pytest.mark.no_db
@pytest.mark.parametrize("node", NODES)
def test_node_inherits_yogakaraka_dispositor(node: str):
    """Node in a Saturn-ruled sign for Rishabam lagna (Saturn = Yogakaraka),
    when not in a dusthana house, inherits YOGAKARAKA."""
    from app.calculations.functional_nature import FunctionalNature

    # Rishabam lagna (2). Saturn is YOGAKARAKA (9th+10th lord).
    # Rasi 10 (Magaram, Saturn-ruled) sits in the 9th house from lagna 2 — not a dusthana.
    result = get_functional_nature(2, node, node_rasi_map={node: 10})
    assert result == FunctionalNature.YOGAKARAKA


@pytest.mark.no_db
@pytest.mark.parametrize("node", NODES)
def test_node_in_dusthana_house_is_malefic(node: str):
    """A node occupying a 6/8/12 house acts malefic regardless of dispositor."""
    from app.calculations.functional_nature import FunctionalNature

    # Mesha lagna (1); rasi 6 (Kanni) is the 6th house → dusthana.
    result = get_functional_nature(1, node, node_rasi_map={node: 6})
    assert result == FunctionalNature.DUSTHANA


@pytest.mark.no_db
def test_node_inherits_lagna_lord_dispositor():
    """Node in the lagna-lord's own sign inherits LAGNA_LORD (non-dusthana house)."""
    from app.calculations.functional_nature import FunctionalNature

    # Mesha lagna (1); Mars is lagna lord and rules rasi 1 (house 1) and rasi 8.
    # Place Rahu in rasi 1 (house 1, not dusthana) → dispositor Mars = LAGNA_LORD.
    result = get_functional_nature(1, "RAHU", node_rasi_map={"RAHU": 1})
    assert result == FunctionalNature.LAGNA_LORD
