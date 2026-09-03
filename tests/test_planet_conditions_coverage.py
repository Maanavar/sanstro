"""Coverage guard for the per-planet condition meanings.

The yoga and marker catalogues have scanning guards; this one pins the other
half of the interpretation layer. Its real value is not future drift (the graha
set is fixed at nine) but making the *exemptions* executable: every planet
without an entry must be absent for a stated astronomical reason, not because
it was forgotten.
"""
from __future__ import annotations

import pytest

from app.calculations.planet_conditions import (
    COMBUST_MEANING,
    RETROGRADE_MEANING,
    combust_meaning,
    retrograde_meaning,
)

ALL_GRAHAS = frozenset(
    {"SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"}
)

# The Sun cannot be combust by its own light. Rahu/Ketu are chaya grahas
# (shadow bodies) and are not read for combustion.
COMBUST_EXEMPT = frozenset({"SUN", "RAHU", "KETU"})

# Sun and Moon are never retrograde. Rahu/Ketu are *always* retrograde, so the
# flag distinguishes nothing for them and a note would imply it did.
RETROGRADE_EXEMPT = frozenset({"SUN", "MOON", "RAHU", "KETU"})


@pytest.mark.no_db
def test_every_combustible_planet_has_a_meaning() -> None:
    missing = sorted((ALL_GRAHAS - COMBUST_EXEMPT) - set(COMBUST_MEANING))
    assert not missing, f"combustible planets with no practical meaning: {missing}"


@pytest.mark.no_db
def test_every_retrogradable_planet_has_a_meaning() -> None:
    missing = sorted((ALL_GRAHAS - RETROGRADE_EXEMPT) - set(RETROGRADE_MEANING))
    assert not missing, f"retrogradable planets with no practical meaning: {missing}"


@pytest.mark.no_db
def test_exempt_planets_are_absent_rather_than_blank() -> None:
    """An exempt planet must have no entry at all. A blank entry would render as
    an empty line instead of being skipped."""
    for graha in COMBUST_EXEMPT:
        assert graha not in COMBUST_MEANING, f"{graha} should not have a combustion meaning"
        assert combust_meaning(graha) == ("", "")
    for graha in RETROGRADE_EXEMPT:
        assert graha not in RETROGRADE_MEANING, f"{graha} should not have a retrograde meaning"
        assert retrograde_meaning(graha) == ("", "")


@pytest.mark.no_db
def test_no_catalogue_entry_is_for_an_unknown_graha() -> None:
    """A typo'd key would silently never match a real planet."""
    for catalogue, name in ((COMBUST_MEANING, "COMBUST_MEANING"), (RETROGRADE_MEANING, "RETROGRADE_MEANING")):
        unknown = sorted(set(catalogue) - ALL_GRAHAS)
        assert not unknown, f"{name} has entries for non-grahas: {unknown}"


@pytest.mark.no_db
def test_meanings_are_bilingual_and_planet_specific() -> None:
    for catalogue, name in ((COMBUST_MEANING, "COMBUST_MEANING"), (RETROGRADE_MEANING, "RETROGRADE_MEANING")):
        seen_en: dict[str, str] = {}
        for graha, (ta, en) in catalogue.items():
            assert ta.strip(), f"{name}[{graha}] has no Tamil text"
            assert en.strip(), f"{name}[{graha}] has no English text"
            assert ta != en, f"{name}[{graha}] has identical ta/en — one language was not written"
            assert en not in seen_en, (
                f"{name}[{graha}] repeats the text used for {seen_en.get(en)} — the whole point "
                "of this catalogue is that the condition means something different per planet"
            )
            seen_en[en] = graha
