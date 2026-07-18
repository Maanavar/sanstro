"""Shared classical special-aspect (drishti) table.

Consolidates the special aspects previously duplicated (and inconsistently
applied) across chart_explanation_service.py (correct), _yoga_detect.py /
_yoga_dosham.py (plain 7th only, or Jupiter-only 5/7/9), chart_strength.py
(7th + Jupiter 5/9 only), and transits.py (Jupiter/Saturn, no Mars).

Source: classical Parashari special aspects — Mars 4/7/8, Jupiter 5/7/9,
Saturn 3/7/10. Rahu/Ketu 5/7/9 is this project's documented node-aspect
convention (see chart_explanation_service.py's method_note); all other
planets use the standard 7th-house aspect only.
"""

from __future__ import annotations

from app.calculations.astro import house_from_reference

ASPECT_HOUSES: dict[str, frozenset[int]] = {
    "MARS": frozenset({4, 7, 8}),
    "JUPITER": frozenset({5, 7, 9}),
    "SATURN": frozenset({3, 7, 10}),
    # SCHOOL CHOICE, not a universal rule. Giving Rahu/Ketu Jupiter-like 5/7/9
    # drishti follows one recognised tradition (and is what this product ships),
    # but it is genuinely contested: other authorities give the nodes the 7th
    # aspect only, and a stricter Parashari reading gives chaya grahas no
    # independent drishti at all, letting them aspect only through their
    # dispositor. Tamil practice itself varies here.
    #
    # Flagged in the 2026-07-18 astrologer review as something that must be
    # disclosed to the reader rather than presented as settled doctrine — the
    # UI surfaces this via the nodal-aspect note in the drishti section.
    # Changing these two lines changes real output (Kala Sarpa, bhava bala,
    # yoga detection all consume this table), so it is a doctrine decision for
    # an astrologer, not a code cleanup.
    "RAHU": frozenset({5, 7, 9}),
    "KETU": frozenset({5, 7, 9}),
    # Gulika/Mandhi is treated as casting only the standard 7th-house aspect,
    # like a plain malefic — no special multi-house drishti in classical
    # Tamil practice. Listed explicitly (rather than relying on the {7}
    # fallback below) so the choice is documented, not implicit.
    "MANDHI": frozenset({7}),
}


def aspect_houses(planet: str) -> frozenset[int]:
    """Houses (counted from the planet's own position) that `planet` aspects.

    Unknown/unlisted planets (Sun, Moon, Mercury, Venus) default to the
    standard 7th-house aspect only.
    """
    return ASPECT_HOUSES.get(planet, frozenset({7}))


def aspects_house(planet: str, source_rasi: int, target_rasi: int) -> bool:
    """Whether `planet`, standing in `source_rasi`, aspects `target_rasi`."""
    return house_from_reference(source_rasi, target_rasi) in aspect_houses(planet)


def aspect_target_rasis(planet: str, source_rasi: int) -> list[int]:
    """Absolute target rasis (1-12) that `planet` aspects from `source_rasi`.

    For callers (e.g. transit-aspect lookups) that need rasi numbers rather
    than a boolean.
    """
    return sorted(((source_rasi - 1 + (house - 1)) % 12) + 1 for house in aspect_houses(planet))
