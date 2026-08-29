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

from collections.abc import Mapping

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

# Kalaprakasika p.245's fractional drishti.  The regular sight rises toward
# the seventh and falls symmetrically afterwards.  Mars 4/8, Jupiter 5/9 and
# Saturn 3/10 are the classical poorna special aspects; the product's existing
# Rahu/Ketu 5/9 convention remains poorna too.
_FRACTIONAL_DRISHTI: dict[int, float] = {
    3: 0.25, 4: 0.50, 5: 0.75, 7: 1.00, 8: 0.75, 9: 0.50, 10: 0.25,
}


def aspect_strength(planet: str, source_rasi: int, target_rasi: int) -> float:
    """Return this graha's drishti strength: 0, .25, .50, .75 or 1.

    ``aspects_house`` deliberately remains the poorna-only compatibility API;
    callers that need partial sight must opt into this numeric function rather
    than accidentally widening a binary rule such as yoga presence.
    """
    house = house_from_reference(source_rasi, target_rasi)
    strength = _FRACTIONAL_DRISHTI.get(house, 0.0)
    if house in aspect_houses(planet):
        return 1.0
    return strength


def aspect_houses(planet: str) -> frozenset[int]:
    """Houses (counted from the planet's own position) that `planet` aspects.

    Unknown/unlisted planets (Sun, Moon, Mercury, Venus) default to the
    standard 7th-house aspect only.
    """
    return ASPECT_HOUSES.get(planet, frozenset({7}))


def aspects_house(planet: str, source_rasi: int, target_rasi: int) -> bool:
    """Whether ``planet`` has *poorna* drishti on ``target_rasi``.

    This retains the historical boolean contract.  Yoga/dosha presence and
    other binary classical rules must not become true on a fractional glance.
    """
    return aspect_strength(planet, source_rasi, target_rasi) == 1.0


def aspect_target_rasis(planet: str, source_rasi: int) -> list[int]:
    """Absolute rasis receiving this planet's *poorna* drishti.

    This is the longstanding target-set API used by transit and prediction
    callers.  Fractional sight is intentionally exposed only through
    :func:`aspect_strength`; returning it here would turn every planet into the
    same seven-house set and erase the special-aspect contract.
    """
    return sorted(
        ((source_rasi - 1 + (house - 1)) % 12) + 1
        for house in aspect_houses(planet)
    )


def effective_natural_class(
    planet: str,
    planet_rasis: Mapping[str, int],
    *,
    paksha_is_shukla: bool | None = None,
) -> str:
    """Return the chart-contextual natural class: ``BENEFIC`` or ``MALEFIC``.

    Moon is benefic only in Shukla paksha. Mercury is benefic only when it is
    associated (same rasi) with an effective benefic; malefic association, or
    no association, makes it malefic. If degrees are unavailable, paksha is
    derived from Sun/Moon rasi separation (the seven-rasi opposition belongs to
    Krishna, matching the longitude boundary). If that context is absent, Moon
    retains the historical benefic fallback rather than being silently turned
    into a malefic.
    """
    if planet in {"JUPITER", "VENUS"}:
        return "BENEFIC"
    if planet == "MOON":
        if paksha_is_shukla is None:
            sun_rasi = planet_rasis.get("SUN")
            moon_rasi = planet_rasis.get("MOON")
            if sun_rasi is None or moon_rasi is None:
                return "BENEFIC"
            paksha_is_shukla = house_from_reference(sun_rasi, moon_rasi) <= 6
        return "BENEFIC" if paksha_is_shukla else "MALEFIC"
    if planet != "MERCURY":
        return "MALEFIC"

    mercury_rasi = planet_rasis.get("MERCURY")
    if mercury_rasi is None:
        return "MALEFIC"
    associates = [p for p, rasi in planet_rasis.items() if p != "MERCURY" and rasi == mercury_rasi]
    if any(effective_natural_class(p, planet_rasis, paksha_is_shukla=paksha_is_shukla) == "MALEFIC" for p in associates):
        return "MALEFIC"
    if any(effective_natural_class(p, planet_rasis, paksha_is_shukla=paksha_is_shukla) == "BENEFIC" for p in associates):
        return "BENEFIC"
    return "MALEFIC"
