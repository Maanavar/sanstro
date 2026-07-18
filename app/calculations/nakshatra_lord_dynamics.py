"""How a planet's nakshatra lord colours the planet's results.

A chart shows "Mercury in Sadayam pada 4" and stops. But Sadayam is ruled by
Rahu, and in practice the star lord's own condition modifies what the occupying
planet actually delivers — a planet can sit in a dignified sign and still give
results shaped by a star lord sitting in a difficult house. Classical practice
leans on this heavily (it is the whole basis of Nadi and of Krishnamurti's
sub-lord method); the chart data was already here, the reading was not.

Deliberately modest in what it claims. This module states the linkage and the
direction it pulls in — it does not try to compute a combined verdict. The star
lord's house is the strongest single signal a short note can carry, so that is
what it carries.

TAMIL COPY STATUS: first-draft, author-written. Queued for the native-Tamil
review pass — not a substitute for it.
"""
from __future__ import annotations

from app.calculations.dasha import NAK_LORD
from app.calculations.display_names import planet_en, planet_ta

# What the star lord's own house placement contributes to the planet sitting in
# its nakshatra. Keyed by the lord's house from Lagna.
_LORD_HOUSE_COLOUR: dict[int, tuple[str, str]] = {
    1: ("சுய முயற்சியுடனும் தன்னம்பிக்கையுடனும்", "through your own initiative and self-direction"),
    2: ("குடும்பம், சேமிப்பு, பேச்சு வழியாக", "through family, savings, and the way you speak"),
    3: ("முயற்சி, தொடர்பு, உடன்பிறப்பு வழியாக", "through effort, communication, and siblings"),
    4: ("வீடு, தாய், மன அமைதி வழியாக", "through home, mother, and peace of mind"),
    5: ("படைப்பாற்றல், கல்வி, குழந்தைகள் வழியாக", "through creativity, learning, and children"),
    6: ("சேவை, போட்டி, சிக்கல்களைக் கடப்பதன் வழியாக", "through service, competition, and working past obstacles"),
    7: ("கூட்டாண்மை, உறவுகள் வழியாக", "through partnership and close relationships"),
    8: ("திடீர் மாற்றங்கள், ஆழமான தேடல் வழியாக", "through sudden change and deep enquiry"),
    9: ("அதிர்ஷ்டம், வழிகாட்டுதல், நம்பிக்கை வழியாக", "through fortune, guidance, and belief"),
    10: ("தொழில், பொது அங்கீகாரம் வழியாக", "through career and public standing"),
    11: ("லாபம், தொடர்புகள், நண்பர்கள் வழியாக", "through gains, networks, and friendships"),
    12: ("மறைவான முயற்சி, வெளிநாட்டுத் தொடர்பு, ஆன்மிகம் வழியாக", "through behind-the-scenes work, foreign links, and inner life"),
}

# Houses whose lordship asks for a note of care rather than encouragement.
_DEMANDING_HOUSES = frozenset({6, 8, 12})


def nakshatra_lord(nakshatra: int) -> str:
    """Graha ruling a nakshatra (1-27). One canonical source: the Vimshottari
    table in ``dasha.py`` — never a second hand-maintained copy."""
    return NAK_LORD[nakshatra]


def nakshatra_lord_note(
    graha: str,
    nakshatra: int,
    nakshatra_name: str,
    lord_house_from_lagna: int | None,
) -> tuple[str, str]:
    """Bilingual one-liner on how the star lord colours this planet.

    ``lord_house_from_lagna`` may be None when the lord is not among the plotted
    bodies; the note then states the linkage without claiming a direction.
    """
    lord = NAK_LORD[nakshatra]
    lord_ta, lord_en = planet_ta(lord), planet_en(lord)
    graha_ta, graha_en = planet_ta(graha), planet_en(graha)

    # A planet in its own nakshatra is not being modified by anyone else — say
    # so plainly rather than producing a sentence that reads like a link.
    if lord == graha:
        return (
            f"{graha_ta} தன் சொந்த நட்சத்திரமான {nakshatra_name}-ல் உள்ளது — "
            f"இதன் பலன் வேறு கிரகத்தால் திசைதிருப்பப்படாமல் நேரடியாக வெளிப்படும்.",
            f"{graha_en} sits in {nakshatra_name}, its own nakshatra — its results come through "
            f"directly rather than being coloured by another planet.",
        )

    if lord_house_from_lagna is None:
        return (
            f"{graha_ta} {nakshatra_name} நட்சத்திரத்தில் உள்ளது; இதன் அதிபதி {lord_ta}. "
            f"{lord_ta}-வின் நிலை இந்தக் கிரகத்தின் பலனைச் சாயமிடுகிறது.",
            f"{graha_en} sits in {nakshatra_name}, a nakshatra ruled by {lord_en}. "
            f"{lord_en}'s own condition colours how {graha_en} delivers.",
        )

    colour_ta, colour_en = _LORD_HOUSE_COLOUR[lord_house_from_lagna]
    care_ta = (
        " இந்தத் துறையில் பொறுமையும் கவனமும் பலனைத் தீர்மானிக்கும்."
        if lord_house_from_lagna in _DEMANDING_HOUSES
        else ""
    )
    care_en = (
        " That area asks for patience, and it is usually what decides the result here."
        if lord_house_from_lagna in _DEMANDING_HOUSES
        else ""
    )
    return (
        f"{graha_ta} {nakshatra_name} நட்சத்திரத்தில் உள்ளது; இதன் அதிபதி {lord_ta}, "
        f"{lord_house_from_lagna}ஆம் வீட்டில் அமர்ந்துள்ளார். அதனால் {graha_ta}-வின் பலன் "
        f"{colour_ta} வெளிப்படும்.{care_ta}",
        f"{graha_en} sits in {nakshatra_name}, a nakshatra ruled by {lord_en} — and {lord_en} "
        f"is placed in house {lord_house_from_lagna}. So {graha_en}'s results tend to arrive "
        f"{colour_en}.{care_en}",
    )
