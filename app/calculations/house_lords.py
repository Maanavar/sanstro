"""Bhava-lord (அதிபதி / house-lordship) placement report — audit T3.

Closes adhipathi gaps #8–#14 from
docs/THIRUKANITHAM_DEGREE_ADHIPATHI_AUDIT_2026-07.md. The engine already
classifies every planet's *functional* nature and computes the Badhaka lord, but
it never emitted the named per-house-lord placement reading a real jathaga uses:

    "உங்கள் பாக்கியாதிபதி குரு 5-ல் உள்ளார்."

For each of the 12 houses this module reports:
  * the ruling planet (adhipathi),
  * the house that lord is *placed* in (from lagna),
  * its degree-based composite strength_score + band,
  * its functional nature (for this lagna), and
  * the classical Tamil significations of the house.

Pure calculation — no I/O. The named significations cover the previously
un-surfaced lords: Dhana (2), Roga/Shatru (6), Ayush/Ashtama (8), Bhagya (9),
Labha (11), Vyaya (12).
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.functional_nature import get_functional_nature

_PLANET_TA: dict[str, str] = {
    "SUN": "சூரியன்", "MOON": "சந்திரன்", "MARS": "செவ்வாய்",
    "MERCURY": "புதன்", "JUPITER": "குரு", "VENUS": "சுக்கிரன்",
    "SATURN": "சனி", "RAHU": "ராகு", "KETU": "கேது",
}
_PLANET_EN: dict[str, str] = {
    "SUN": "Sun", "MOON": "Moon", "MARS": "Mars",
    "MERCURY": "Mercury", "JUPITER": "Jupiter", "VENUS": "Venus",
    "SATURN": "Saturn", "RAHU": "Rahu", "KETU": "Ketu",
}

# Composite strength_score bands (same thresholds the yoga engine uses).
STRONG_THRESHOLD = 60
WEAK_THRESHOLD = 40


@dataclass(frozen=True)
class _HouseMeta:
    adhipathi_ta: str
    adhipathi_en: str
    significations_ta: str
    significations_en: str


# Classical Tamil adhipathi names + significations, house 1–12.
_HOUSE_META: dict[int, _HouseMeta] = {
    1:  _HouseMeta("லக்னாதிபதி", "Lagna lord (1st)", "உடல், ஆளுமை, ஆரோக்கியம்", "body, self, vitality"),
    2:  _HouseMeta("தனாதிபதி", "Dhana lord (2nd)", "செல்வம், குடும்பம், பேச்சு", "wealth, family, speech"),
    3:  _HouseMeta("சகோதராதிபதி", "Sahaja lord (3rd)", "தைரியம், சகோதரர், முயற்சி", "courage, siblings, initiative"),
    4:  _HouseMeta("சுகாதிபதி", "Sukha lord (4th)", "தாய், வீடு, மனநிம்மதி", "mother, home, comfort"),
    5:  _HouseMeta("புத்திராதிபதி", "Putra lord (5th)", "குழந்தைகள், கல்வி, அறிவு", "children, education, intellect"),
    6:  _HouseMeta("ரோகாதிபதி", "Roga / Shatru lord (6th)", "நோய், கடன், எதிரிகள்", "health, debts, adversaries"),
    7:  _HouseMeta("களத்திராதிபதி", "Kalathra lord (7th)", "திருமணம், வாழ்க்கைத்துணை, கூட்டாண்மை", "marriage, spouse, partnerships"),
    8:  _HouseMeta("ஆயுளாதிபதி", "Ayush / Ashtama lord (8th)", "ஆயுள், மாற்றம், மறைவான விஷயங்கள்", "longevity, transformation, the hidden"),
    9:  _HouseMeta("பாக்கியாதிபதி", "Bhagya lord (9th)", "அதிர்ஷ்டம், தர்மம், தந்தை", "fortune, dharma, father"),
    10: _HouseMeta("கர்மாதிபதி", "Karma lord (10th)", "தொழில், அந்தஸ்து, செயல்", "career, status, action"),
    11: _HouseMeta("லாபாதிபதி", "Labha lord (11th)", "லாபம், வருமானம், ஆசைகள்", "gains, income, aspirations"),
    12: _HouseMeta("வியயாதிபதி", "Vyaya lord (12th)", "செலவு, வெளிநாடு, மோட்சம்", "expenses, foreign, liberation"),
}

_BAND_TA = {"STRONG": "வலுவானது", "MODERATE": "நடுத்தரம்", "WEAK": "பலவீனம்"}


@dataclass(frozen=True)
class HouseLordReading:
    """One house's adhipathi placement reading."""
    house: int
    house_rasi: int
    lord: str
    lord_rasi: int
    lord_house: int
    strength_score: int
    strength_band: str  # STRONG | MODERATE | WEAK
    functional_nature: str
    adhipathi_ta: str
    adhipathi_en: str
    significations_ta: str
    significations_en: str
    reading_ta: str
    reading_en: str


def _house_rasi(lagna_rasi: int, house: int) -> int:
    return ((lagna_rasi + house - 2) % 12) + 1


def house_rasi(lagna_rasi: int, house: int) -> int:
    """Which rasi falls in `house` for this lagna. Public form of ``_house_rasi``.

    Exposed for callers that need one house rather than the 12-row report —
    the five-minute reading resolves a single topic house and its adhipathi,
    and building all twelve to read one of them would compute eleven
    functional-nature lookups it discards.
    """
    return _house_rasi(lagna_rasi, house)


def house_significations(house: int) -> tuple[str, str]:
    """(ta, en) classical significations of a house.

    Same strings ``compute_house_lord_report`` renders into its own reading
    line. Exposed so a narration layer can compose its own sentence around
    them without either copying the twelve pairs or reaching into
    ``_HOUSE_META`` — a second copy of this table is how the two surfaces
    would eventually disagree about what the 8th house means.
    """
    meta = _HOUSE_META[house]
    return meta.significations_ta, meta.significations_en


def house_lord_title(house: int) -> tuple[str, str]:
    """(ta, en) name of a house's adhipathi — "பாக்கியாதிபதி" / "Bhagya lord (9th)"."""
    meta = _HOUSE_META[house]
    return meta.adhipathi_ta, meta.adhipathi_en


def strength_band(score: int) -> str:
    """STRONG / MODERATE / WEAK for a composite ``strength_score``.

    Public form of ``_band``. Exposed so a narration layer keying copy on the
    band uses THESE thresholds rather than restating 60 and 40 — a second copy
    of the cut-offs is how a reading would eventually call a planet strong
    that this report calls moderate, in the same sitting.
    """
    return _band(score)


def _band(score: int) -> str:
    if score >= STRONG_THRESHOLD:
        return "STRONG"
    if score < WEAK_THRESHOLD:
        return "WEAK"
    return "MODERATE"


def compute_house_lord_report(
    lagna_rasi: int,
    planet_rasis: Mapping[str, int],
    planet_scores: Mapping[str, int] | None = None,
    *,
    node_rasi_map: Mapping[str, int] | None = None,
) -> list[HouseLordReading]:
    """Build the 12-house adhipathi placement report.

    Args:
        lagna_rasi: ascendant sign, 1–12.
        planet_rasis: planet → occupied rasi (must contain the 7 sign lords).
        planet_scores: planet → composite strength_score (0–100); missing → 50.
        node_rasi_map: forwarded to functional-nature resolution (nodes never
            rule a sign, so this only matters if a caller extends the report).

    House lords are always among the seven classical planets, so every entry
    resolves to a real placement provided ``planet_rasis`` is complete.
    """
    scores = planet_scores or {}
    node_map = dict(node_rasi_map) if node_rasi_map is not None else None
    readings: list[HouseLordReading] = []
    for house in range(1, 13):
        meta = _HOUSE_META[house]
        house_rasi = _house_rasi(lagna_rasi, house)
        lord = SIGN_LORD[house_rasi]
        if lord not in planet_rasis:
            # Incomplete chart data — skip rather than emit a misleading reading.
            continue
        lord_rasi = int(planet_rasis[lord])
        lord_house = house_from_reference(lagna_rasi, lord_rasi)
        score = int(scores.get(lord, 50))
        band = _band(score)
        nature = get_functional_nature(lagna_rasi, lord, node_rasi_map=node_map).value
        planet_ta = _PLANET_TA.get(lord, lord)
        planet_en = _PLANET_EN.get(lord, lord.title())
        reading_ta = (
            f"உங்கள் {meta.adhipathi_ta} {planet_ta} {lord_house}ஆம் வீட்டில் உள்ளார் — "
            f"{meta.significations_ta}. வலிமை {score}/100 ({_BAND_TA[band]})."
        )
        reading_en = (
            f"Your {meta.adhipathi_en} {planet_en} is placed in house {lord_house} — "
            f"{meta.significations_en}. Strength {score}/100 ({band.title()})."
        )
        readings.append(
            HouseLordReading(
                house=house,
                house_rasi=house_rasi,
                lord=lord,
                lord_rasi=lord_rasi,
                lord_house=lord_house,
                strength_score=score,
                strength_band=band,
                functional_nature=nature,
                adhipathi_ta=meta.adhipathi_ta,
                adhipathi_en=meta.adhipathi_en,
                significations_ta=meta.significations_ta,
                significations_en=meta.significations_en,
                reading_ta=reading_ta,
                reading_en=reading_en,
            )
        )
    return readings
