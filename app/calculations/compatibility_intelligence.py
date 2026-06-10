"""
Compatibility Intelligence engine for signed users.

Produces an 8-level marriage compatibility report beyond the traditional 10-kuta
Porutham check. Requires two fully computed chart snapshots (ChartCalculateResponseData)
and the Porutham + Synastry scores already computed by the existing engines.

Scoring model (total 100 points):
  Porutham (kutas)          20 pts
  7th house strength        20 pts  (10 per person)
  Navamsa (D9) quality      20 pts
  Dasha alignment           15 pts
  Dosha analysis            10 pts  (Sevvai + Nadi combined)
  Emotional compatibility   10 pts
  Synastry (chart aspects)   5 pts  (mapped from 0-100)
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from typing import Any

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.chart_strength import (
    EXALTATION_RASI,
    OWN_SIGN_RASI,
    SIGN_LORD,
    _NATURAL_ENEMIES,
    _NATURAL_FRIENDS,
)
from app.calculations.dasha import DASHA_YEARS, calculate_vimshottari_timeline

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_MALEFICS = frozenset({"MARS", "SATURN", "RAHU", "KETU", "SUN"})
_KENDRAS = frozenset({1, 4, 7, 10})
_TRIKONAS = frozenset({1, 5, 9})
_DUSTHANAS = frozenset({6, 8, 12})
_MARRIAGE_DASHAS = frozenset({"VENUS", "JUPITER", "MOON"})  # dashas generally favourable for marriage


def _get_planet(snap: Any, name: str) -> Any:
    for p in snap.data.planets:
        if p.graha == name:
            return p
    raise ValueError(f"Planet {name} not found in chart snapshot.")


def _seventh_house_rasi(lagna_rasi: int) -> int:
    return (lagna_rasi - 1 + 6) % 12 + 1


def _graha_relation(a: str, b: str) -> str:
    if a == b:
        return "friend"
    if b in _NATURAL_FRIENDS.get(a, frozenset()) or a in _NATURAL_FRIENDS.get(b, frozenset()):
        return "friend"
    if b in _NATURAL_ENEMIES.get(a, frozenset()) or a in _NATURAL_ENEMIES.get(b, frozenset()):
        return "enemy"
    return "neutral"


# ---------------------------------------------------------------------------
# Result dataclasses
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class SevvaiDoshamDetail:
    has_dosham: bool
    mars_house: int
    is_cancelled: bool
    severity: str          # NONE / MILD / MODERATE / SEVERE
    cancellation_reasons: list[str]
    note_en: str
    note_ta: str
    score: int             # 0-5 (5 = no dosham or fully cancelled)


@dataclass(frozen=True, slots=True)
class ChartMarriageStrength:
    seventh_house_rasi: int
    seventh_lord: str
    seventh_lord_house: int
    seventh_lord_strength: int
    venus_house: int
    venus_strength: int
    jupiter_house: int
    jupiter_strength: int
    has_malefic_in_seventh: bool
    score: int             # 0-10
    note_en: str
    note_ta: str


@dataclass(frozen=True, slots=True)
class NavamsaCompatibility:
    person_a_venus_d9: int
    person_b_venus_d9: int
    person_a_seventh_lord_d9: int
    person_b_seventh_lord_d9: int
    harmony_label: str     # STRONG / GOOD / MIXED / WEAK
    note_en: str
    note_ta: str
    score: int             # 0-20


@dataclass(frozen=True, slots=True)
class DashaHarmony:
    person_a_maha_lord: str
    person_a_antar_lord: str
    person_a_maha_end: str   # ISO date string
    person_b_maha_lord: str
    person_b_antar_lord: str
    person_b_maha_end: str
    harmony_label: str       # SUPPORTIVE / MIXED / CHALLENGING
    note_en: str
    note_ta: str
    score: int               # 0-15


@dataclass(frozen=True, slots=True)
class EmotionalCompatibility:
    moon_moon_harmony: str   # EXCELLENT / GOOD / MIXED / TENSE
    venus_mars_harmony: str  # STRONG / GOOD / MIXED / TENSE
    communication_note: str
    note_en: str
    note_ta: str
    score: int               # 0-10


@dataclass
class CompatibilityScoreBreakdown:
    porutham: int = 0        # 0-20
    seventh_house: int = 0   # 0-20
    navamsa: int = 0         # 0-20
    dasha_harmony: int = 0   # 0-15
    dosham_analysis: int = 0 # 0-10
    emotional: int = 0       # 0-10
    synastry: int = 0        # 0-5


@dataclass
class CompatibilityIntelligenceResult:
    person_a_name: str
    person_b_name: str

    # Layer 1 — traditional porutham (raw values from compute_porutham)
    porutham_score: int
    porutham_max: int
    porutham_percentage: float
    porutham_label: str
    rajju_dosha: bool
    vedha_dosha: bool

    # Layer 2+3 — individual chart strength
    chart_a_strength: ChartMarriageStrength
    chart_b_strength: ChartMarriageStrength

    # Layer 4 — Navamsa
    navamsa: NavamsaCompatibility

    # Layer 5 — Dosham
    sevvai_a: SevvaiDoshamDetail
    sevvai_b: SevvaiDoshamDetail

    # Layer 6 — Dasha
    dasha_harmony: DashaHarmony

    # Layer 7 — Emotional
    emotional: EmotionalCompatibility

    # Layer 8 — Synastry (raw 0-100 score from existing engine)
    synastry_score: int

    # Aggregate
    overall_score: int
    overall_label: str
    score_breakdown: CompatibilityScoreBreakdown

    strengths_en: list[str] = field(default_factory=list)
    strengths_ta: list[str] = field(default_factory=list)
    risks_en: list[str] = field(default_factory=list)
    risks_ta: list[str] = field(default_factory=list)

    summary_en: str = ""
    summary_ta: str = ""


# ---------------------------------------------------------------------------
# Level 5: Sevvai Dosham
# ---------------------------------------------------------------------------

_SEVVAI_HOUSES = frozenset({1, 2, 4, 7, 8, 12})
_SEVVAI_SEVERE = frozenset({7, 8})
_SEVVAI_MODERATE = frozenset({1, 4})
_SEVVAI_MILD = frozenset({2, 12})


def _compute_sevvai(snap: Any) -> SevvaiDoshamDetail:
    mars = _get_planet(snap, "MARS")
    h = mars.house_from_lagna
    has_dosham = h in _SEVVAI_HOUSES

    if not has_dosham:
        return SevvaiDoshamDetail(
            has_dosham=False, mars_house=h, is_cancelled=False,
            severity="NONE", cancellation_reasons=[],
            note_en=f"No Sevvai Dosham — Mars is in house {h}.",
            note_ta=f"செவ்வாய் தோஷம் இல்லை — செவ்வாய் {h}ஆம் இடத்தில்.",
            score=5,
        )

    # Severity
    if h in _SEVVAI_SEVERE:
        severity = "SEVERE"
    elif h in _SEVVAI_MODERATE:
        severity = "MODERATE"
    else:
        severity = "MILD"

    cancellations: list[str] = []

    # Mars in own sign
    if mars.rasi in OWN_SIGN_RASI.get("MARS", frozenset()):
        cancellations.append("Mars in own sign (Aries/Scorpio) — dosham significantly reduced")

    # Mars exalted (Capricorn = rasi 10)
    if mars.rasi == EXALTATION_RASI.get("MARS"):
        cancellations.append("Mars exalted in Capricorn — dosham considerably mitigated")

    # Mars in 1st house with strong lagna lord
    if h == 1:
        cancellations.append("Mars in 1st house — Lagna placement is disputed as full dosham by many schools")

    # Jupiter conjunction or aspect (houses differ by 5, 7, 9 for Vedic aspect)
    try:
        jupiter = _get_planet(snap, "JUPITER")
        if jupiter.house_from_lagna == h:
            cancellations.append("Jupiter conjunct Mars — cancels dosham")
        elif abs(jupiter.house_from_lagna - h) in {4, 6, 8}:
            cancellations.append("Jupiter aspects Mars — partial mitigation")
    except ValueError:
        pass

    is_cancelled = bool(cancellations and severity != "SEVERE")
    final_severity = "NONE" if is_cancelled else severity

    score_map = {"NONE": 5, "MILD": 4, "MODERATE": 2, "SEVERE": 0}
    score = score_map.get(final_severity, 2)
    if is_cancelled:
        score = 4

    if is_cancelled:
        note_en = f"Sevvai Dosham (Mars in house {h}) is cancelled: {'; '.join(cancellations)}."
        note_ta = f"செவ்வாய் தோஷம் ({h}ஆம் இடம்) நீக்கப்படுகிறது: {'; '.join(cancellations)}."
    else:
        note_en = f"Sevvai Dosham present — Mars in house {h} ({severity}). Matching partner's dosham level is recommended."
        note_ta = f"செவ்வாய் தோஷம் உள்ளது — {h}ஆம் இடத்தில் செவ்வாய் ({severity}). இணைவரின் தோஷ நிலையுடன் பொருத்துவது பரிந்துரைக்கப்படுகிறது."

    return SevvaiDoshamDetail(
        has_dosham=has_dosham, mars_house=h, is_cancelled=is_cancelled,
        severity=final_severity, cancellation_reasons=cancellations,
        note_en=note_en, note_ta=note_ta, score=score,
    )


def _apply_mutual_sevvai_cancellation(a: SevvaiDoshamDetail, b: SevvaiDoshamDetail) -> tuple[SevvaiDoshamDetail, SevvaiDoshamDetail]:
    """Both persons having uncancelled Sevvai Dosham cancels each other out."""
    if (
        a.has_dosham and not a.is_cancelled
        and b.has_dosham and not b.is_cancelled
    ):
        a = SevvaiDoshamDetail(
            has_dosham=a.has_dosham, mars_house=a.mars_house, is_cancelled=True,
            severity="NONE",
            cancellation_reasons=["Both partners have Sevvai Dosham — mutual cancellation applies"],
            note_en="Both partners have Sevvai Dosham — mutual cancellation applies per classical rules.",
            note_ta="இரு நபர்களுக்கும் செவ்வாய் தோஷம் உள்ளது — பாரம்பரிய விதிப்படி பரஸ்பர நீக்கம் ஏற்படுகிறது.",
            score=4,
        )
        b = SevvaiDoshamDetail(
            has_dosham=b.has_dosham, mars_house=b.mars_house, is_cancelled=True,
            severity="NONE",
            cancellation_reasons=["Both partners have Sevvai Dosham — mutual cancellation applies"],
            note_en="Both partners have Sevvai Dosham — mutual cancellation applies per classical rules.",
            note_ta="இரு நபர்களுக்கும் செவ்வாய் தோஷம் உள்ளது — பாரம்பரிய விதிப்படி பரஸ்பர நீக்கம் ஏற்படுகிறது.",
            score=4,
        )
    return a, b


# ---------------------------------------------------------------------------
# Level 2+3: Individual chart marriage strength
# ---------------------------------------------------------------------------

def _compute_chart_marriage_strength(snap: Any) -> ChartMarriageStrength:
    lagna_rasi = snap.data.lagna.rasi
    seventh_rasi = _seventh_house_rasi(lagna_rasi)
    seventh_lord = SIGN_LORD[seventh_rasi]

    venus = _get_planet(snap, "VENUS")
    jupiter = _get_planet(snap, "JUPITER")

    # Find 7th lord in planets
    seventh_lord_planet = next(
        (p for p in snap.data.planets if p.graha == seventh_lord), None
    )
    seventh_lord_house = seventh_lord_planet.house_from_lagna if seventh_lord_planet else 0
    seventh_lord_strength = seventh_lord_planet.strength_score if seventh_lord_planet else 50

    # Malefics in 7th
    malefics_in_7th = [
        p.graha for p in snap.data.planets
        if p.house_from_lagna == 7 and p.graha in _MALEFICS
    ]
    has_malefic_in_seventh = bool(malefics_in_7th)

    # Score calculation
    score = 0

    # 7th lord in kendra or trikona
    if seventh_lord_house in (_KENDRAS | _TRIKONAS):
        score += 3
    elif seventh_lord_house not in _DUSTHANAS and seventh_lord_house != 0:
        score += 1

    # 7th lord strength
    if seventh_lord_strength >= 70:
        score += 3
    elif seventh_lord_strength >= 50:
        score += 2
    else:
        score += 0

    # Venus strength
    if venus.strength_score >= 70:
        score += 3
    elif venus.strength_score >= 50:
        score += 2
    else:
        score += 1

    # Malefic penalty
    score -= len(malefics_in_7th)
    score = max(0, min(10, score))

    # Build notes
    if score >= 8:
        note_en = (
            f"Strong marriage indicators: 7th lord {seventh_lord} in house {seventh_lord_house} "
            f"with strength {seventh_lord_strength}/100; Venus strength {venus.strength_score}/100."
        )
        note_ta = (
            f"திருமண அறிகுறிகள் வலுவானவை: 7ஆம் அதிபதி {seventh_lord} {seventh_lord_house}ஆம் இடத்தில், "
            f"வலிமை {seventh_lord_strength}/100; சுக்கிர வலிமை {venus.strength_score}/100."
        )
    elif score >= 5:
        note_en = (
            f"Moderate marriage strength: 7th lord {seventh_lord} in house {seventh_lord_house}; "
            f"Venus in house {venus.house_from_lagna}."
            + (f" Note: {', '.join(malefics_in_7th)} in 7th house." if malefics_in_7th else "")
        )
        note_ta = (
            f"நடுத்தர திருமண வலிமை: 7ஆம் அதிபதி {seventh_lord} {seventh_lord_house}ஆம் இடத்தில்; "
            f"சுக்கிரன் {venus.house_from_lagna}ஆம் இடத்தில்."
        )
    else:
        note_en = (
            f"Marriage house needs attention: 7th lord {seventh_lord} in house {seventh_lord_house} "
            f"(strength {seventh_lord_strength}/100)."
            + (f" {', '.join(malefics_in_7th)} in 7th house — remedies advised." if malefics_in_7th else "")
        )
        note_ta = (
            f"திருமண இடம் கவனம் தேவை: 7ஆம் அதிபதி {seventh_lord} {seventh_lord_house}ஆம் இடத்தில் "
            f"(வலிமை {seventh_lord_strength}/100)."
        )

    return ChartMarriageStrength(
        seventh_house_rasi=seventh_rasi,
        seventh_lord=seventh_lord,
        seventh_lord_house=seventh_lord_house,
        seventh_lord_strength=seventh_lord_strength,
        venus_house=venus.house_from_lagna,
        venus_strength=venus.strength_score,
        jupiter_house=jupiter.house_from_lagna,
        jupiter_strength=jupiter.strength_score,
        has_malefic_in_seventh=has_malefic_in_seventh,
        score=score,
        note_en=note_en,
        note_ta=note_ta,
    )


# ---------------------------------------------------------------------------
# Level 4: Navamsa (D9)
# ---------------------------------------------------------------------------

def _compute_navamsa(snap_a: Any, snap_b: Any) -> NavamsaCompatibility:
    venus_a = _get_planet(snap_a, "VENUS")
    venus_b = _get_planet(snap_b, "VENUS")

    lagna_a = snap_a.data.lagna.rasi
    lagna_b = snap_b.data.lagna.rasi
    seventh_lord_a = SIGN_LORD[_seventh_house_rasi(lagna_a)]
    seventh_lord_b = SIGN_LORD[_seventh_house_rasi(lagna_b)]

    seventh_lord_a_planet = next((p for p in snap_a.data.planets if p.graha == seventh_lord_a), None)
    seventh_lord_b_planet = next((p for p in snap_b.data.planets if p.graha == seventh_lord_b), None)

    va_d9 = venus_a.d9_rasi
    vb_d9 = venus_b.d9_rasi
    sla_d9 = seventh_lord_a_planet.d9_rasi if seventh_lord_a_planet else 0
    slb_d9 = seventh_lord_b_planet.d9_rasi if seventh_lord_b_planet else 0

    score = 0

    # Venus D9 harmony — are they in kendra/trikona from each other?
    if va_d9 and vb_d9:
        diff = (va_d9 - vb_d9) % 12 + 1
        if diff in {1, 5, 9}:  # trikona = excellent
            score += 8
        elif diff in {4, 7, 10}:  # kendra = good
            score += 6
        elif diff in {2, 12}:  # 2nd/12th = decent
            score += 4
        elif diff in {3, 11}:
            score += 3
        else:
            score += 1

    # Venus A in own/exaltation D9
    if va_d9 in OWN_SIGN_RASI.get("VENUS", frozenset()):
        score += 3
    elif va_d9 == EXALTATION_RASI.get("VENUS"):
        score += 3

    # Venus B in own/exaltation D9
    if vb_d9 in OWN_SIGN_RASI.get("VENUS", frozenset()):
        score += 3
    elif vb_d9 == EXALTATION_RASI.get("VENUS"):
        score += 3

    # 7th lords D9
    if sla_d9 and sla_d9 in (_KENDRAS | _TRIKONAS):
        score += 3
    if slb_d9 and slb_d9 in (_KENDRAS | _TRIKONAS):
        score += 3

    score = max(0, min(20, score))

    if score >= 16:
        harmony_label = "STRONG"
        note_en = "Excellent Navamsa alignment — Venus and 7th lords in D9 show strong marriage potential."
        note_ta = "சிறந்த நவாம்ச இணக்கம் — D9-ல் சுக்கிரன் மற்றும் 7ஆம் அதிபதி நல்ல திருமண சாத்தியத்தை காட்டுகின்றன."
    elif score >= 11:
        harmony_label = "GOOD"
        note_en = "Good Navamsa compatibility — some strong D9 placements support the match."
        note_ta = "நல்ல நவாம்ச இணக்கம் — D9-ல் சில வலுவான நிலைகள் பொருத்தத்தை ஆதரிக்கின்றன."
    elif score >= 6:
        harmony_label = "MIXED"
        note_en = "Mixed Navamsa signals — the D9 shows some challenges alongside compatible placements."
        note_ta = "கலந்த நவாம்ச அறிகுறிகள் — D9-ல் சில சவால்களும் இணக்கமான நிலைகளும் காணப்படுகின்றன."
    else:
        harmony_label = "WEAK"
        note_en = "Navamsa needs attention — D9 placements suggest working on the deeper soul-level compatibility."
        note_ta = "நவாம்சம் கவனம் தேவை — D9 நிலைகள் ஆழமான ஆன்மீக இணக்கத்தில் முயற்சி தேவை என்று காட்டுகின்றன."

    return NavamsaCompatibility(
        person_a_venus_d9=va_d9,
        person_b_venus_d9=vb_d9,
        person_a_seventh_lord_d9=sla_d9,
        person_b_seventh_lord_d9=slb_d9,
        harmony_label=harmony_label,
        note_en=note_en,
        note_ta=note_ta,
        score=score,
    )


# ---------------------------------------------------------------------------
# Level 6: Dasha Harmony
# ---------------------------------------------------------------------------

def _jd_for_today() -> float:
    from app.calculations.astro import utc_datetime_to_julian_day
    return utc_datetime_to_julian_day(datetime.now(tz=UTC))


def _compute_dasha_harmony(snap_a: Any, snap_b: Any, today_jd: float) -> DashaHarmony:
    moon_a = _get_planet(snap_a, "MOON")
    moon_b = _get_planet(snap_b, "MOON")

    tl_a = calculate_vimshottari_timeline(snap_a.data.julian_day, moon_a.absolute_longitude, today_jd)
    tl_b = calculate_vimshottari_timeline(snap_b.data.julian_day, moon_b.absolute_longitude, today_jd)

    maha_a = tl_a.current_mahadasha.lord
    antar_a = tl_a.current_antardasha.lord
    maha_end_a = tl_a.current_mahadasha.end_date.isoformat()

    maha_b = tl_b.current_mahadasha.lord
    antar_b = tl_b.current_antardasha.lord
    maha_end_b = tl_b.current_mahadasha.end_date.isoformat()

    # Harmony between maha lords
    relation = _graha_relation(maha_a, maha_b)

    # Also check if both are in marriage-supportive dashas
    both_supportive = maha_a in _MARRIAGE_DASHAS and maha_b in _MARRIAGE_DASHAS
    one_supportive = maha_a in _MARRIAGE_DASHAS or maha_b in _MARRIAGE_DASHAS

    if relation == "friend" and both_supportive:
        score = 15
        harmony_label = "SUPPORTIVE"
        note_en = (
            f"Both partners are in supportive dashas ({maha_a} and {maha_b}) and their dasha lords "
            f"are mutually friendly — an auspicious time for marriage planning."
        )
        note_ta = (
            f"இரு நபர்களும் சாதகமான தசைகளில் உள்ளனர் ({maha_a} மற்றும் {maha_b}); தசை அதிபதிகள் "
            f"நண்பர்கள் — திருமண திட்டமிடலுக்கு நல்ல காலம்."
        )
    elif relation == "friend":
        score = 12
        harmony_label = "SUPPORTIVE"
        note_en = (
            f"Dasha lords {maha_a} and {maha_b} are friendly planets — supportive period for the relationship, "
            f"though timing may need checking against transit support."
        )
        note_ta = (
            f"தசை அதிபதிகள் {maha_a} மற்றும் {maha_b} நண்பர்கள் — உறவுக்கு சாதகமான காலம்; "
            f"கோச்சார ஆதரவையும் சரிபார்க்கவும்."
        )
    elif relation == "neutral":
        score = 9
        harmony_label = "MIXED"
        if one_supportive:
            score = 10
            note_en = (
                f"One partner is in a marriage-supportive dasha ({maha_a if maha_a in _MARRIAGE_DASHAS else maha_b}); "
                f"the dasha lords are neutral to each other. Moderately favourable."
            )
            note_ta = (
                f"ஒரு நபர் திருமண சாதகமான தசையில் உள்ளார்; தசை அதிபதிகள் நடுநிலையானவர்கள். "
                f"நடுத்தர சாதகம்."
            )
        else:
            note_en = (
                f"Dasha lords {maha_a} and {maha_b} are neutral — stable but not particularly activated "
                f"for relationship matters in this period."
            )
            note_ta = (
                f"தசை அதிபதிகள் {maha_a} மற்றும் {maha_b} நடுநிலையானவர்கள் — நிலையான ஆனால் "
                f"திருமண விஷயங்களுக்கு குறிப்பாக செயல்படவில்லை."
            )
    else:  # enemy
        score = 4
        harmony_label = "CHALLENGING"
        note_en = (
            f"Dasha lords {maha_a} and {maha_b} are in an inimical relationship — this period may "
            f"bring friction; patience and communication are especially important."
        )
        note_ta = (
            f"தசை அதிபதிகள் {maha_a} மற்றும் {maha_b} எதிர் தன்மை கொண்டவர்கள் — இந்த காலம் "
            f"சில மோதல்களை கொண்டுவரலாம்; பொறுமை மற்றும் தொடர்பு முக்கியம்."
        )

    return DashaHarmony(
        person_a_maha_lord=maha_a,
        person_a_antar_lord=antar_a,
        person_a_maha_end=maha_end_a,
        person_b_maha_lord=maha_b,
        person_b_antar_lord=antar_b,
        person_b_maha_end=maha_end_b,
        harmony_label=harmony_label,
        note_en=note_en,
        note_ta=note_ta,
        score=score,
    )


# ---------------------------------------------------------------------------
# Level 7: Emotional Compatibility
# ---------------------------------------------------------------------------

_MOON_HARMONY_TABLE: dict[int, str] = {
    1: "GOOD",   # same rasi
    2: "EXCELLENT", 12: "EXCELLENT",
    5: "EXCELLENT", 9: "EXCELLENT",  # trikona
    3: "GOOD", 11: "GOOD",
    4: "MIXED", 8: "MIXED",   # kendra (some tension)
    6: "TENSE", 7: "TENSE",
    10: "MIXED",
}


def _moon_harmony_label(rasi_a: int, rasi_b: int) -> str:
    diff = (rasi_a - rasi_b) % 12 + 1
    return _MOON_HARMONY_TABLE.get(diff, "MIXED")


def _compute_emotional_compatibility(snap_a: Any, snap_b: Any) -> EmotionalCompatibility:
    moon_a = _get_planet(snap_a, "MOON")
    moon_b = _get_planet(snap_b, "MOON")
    venus_a = _get_planet(snap_a, "VENUS")
    mars_b = _get_planet(snap_b, "MARS")
    venus_b = _get_planet(snap_b, "VENUS")
    mars_a = _get_planet(snap_a, "MARS")

    moon_harmony = _moon_harmony_label(moon_a.rasi, moon_b.rasi)

    # Venus A ↔ Mars B and Venus B ↔ Mars A (cross-chart attraction indicators)
    vm_diff_ab = abs(venus_a.house_from_lagna - mars_b.house_from_lagna)
    vm_diff_ba = abs(venus_b.house_from_lagna - mars_a.house_from_lagna)
    vm_diff_ab_alt = 12 - vm_diff_ab
    vm_diff_ba_alt = 12 - vm_diff_ba
    vm_ab = min(vm_diff_ab, vm_diff_ab_alt)
    vm_ba = min(vm_diff_ba, vm_diff_ba_alt)

    # Use rasi distance between Venus A and Venus B for overall Venus harmony
    venus_rasi_diff = (venus_a.rasi - venus_b.rasi) % 12 + 1
    if venus_rasi_diff in {1, 2, 12, 5, 9}:
        venus_mars_harmony = "STRONG"
    elif venus_rasi_diff in {3, 11, 4, 10}:
        venus_mars_harmony = "GOOD"
    elif venus_rasi_diff in {6, 8}:
        venus_mars_harmony = "TENSE"
    else:
        venus_mars_harmony = "MIXED"

    # Score (0-10)
    moon_score_map = {"EXCELLENT": 5, "GOOD": 4, "MIXED": 2, "TENSE": 0}
    vm_score_map = {"STRONG": 5, "GOOD": 4, "MIXED": 3, "TENSE": 1}
    score = moon_score_map.get(moon_harmony, 2) + vm_score_map.get(venus_mars_harmony, 3)
    score = max(0, min(10, score))

    moon_diff_desc = (moon_b.rasi - moon_a.rasi) % 12 + 1
    communication_note = (
        "Natural emotional wavelength — communication will feel effortless."
        if moon_harmony in {"EXCELLENT", "GOOD"}
        else "Different emotional styles — intentional communication and empathy bridge the gap."
    )

    if score >= 8:
        note_en = (
            f"Strong emotional resonance: Moon positions show {moon_harmony.lower()} harmony; "
            f"Venus compatibility is {venus_mars_harmony.lower()}. The relationship will feel emotionally nourishing."
        )
        note_ta = (
            f"வலுவான உணர்வு இணக்கம்: சந்திர நிலைகள் {moon_harmony.lower()} இணக்கம் காட்டுகின்றன; "
            f"சுக்கிர இணக்கம் {venus_mars_harmony.lower()}. உறவு உணர்வு ரீதியாக நல்லதாக இருக்கும்."
        )
    elif score >= 5:
        note_en = (
            f"Moderate emotional compatibility: Moon harmony is {moon_harmony.lower()}, "
            f"Venus shows {venus_mars_harmony.lower()} alignment. Mutual understanding grows with time."
        )
        note_ta = (
            f"நடுத்தர உணர்வு இணக்கம்: சந்திர இணக்கம் {moon_harmony.lower()}, "
            f"சுக்கிரன் {venus_mars_harmony.lower()} அமைப்பு. பரஸ்பர புரிதல் நேரத்துடன் வளரும்."
        )
    else:
        note_en = (
            f"Emotional differences need attention: Moon harmony is {moon_harmony.lower()}. "
            f"Building shared emotional vocabulary is the key investment for this relationship."
        )
        note_ta = (
            f"உணர்வு வேறுபாடுகளுக்கு கவனம் தேவை: சந்திர இணக்கம் {moon_harmony.lower()}. "
            f"பகிரப்பட்ட உணர்வு மொழியை உருவாக்குவது இந்த உறவிற்கான முக்கிய முதலீடு."
        )

    return EmotionalCompatibility(
        moon_moon_harmony=moon_harmony,
        venus_mars_harmony=venus_mars_harmony,
        communication_note=communication_note,
        note_en=note_en,
        note_ta=note_ta,
        score=score,
    )


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def compute_compatibility_intelligence(
    *,
    snap_a: Any,
    snap_b: Any,
    porutham_result: Any,     # PorutthamResult from compute_porutham
    synastry_score: int = 50,  # 0-100 from compute_synastry_score
    today_jd: float | None = None,
    person_a_name: str = "Person A",
    person_b_name: str = "Person B",
) -> CompatibilityIntelligenceResult:
    if today_jd is None:
        today_jd = _jd_for_today()

    # Layer 1: Porutham
    porutham_pts = round(porutham_result.percentage / 100 * 20)

    # Layer 2+3: Chart strength
    strength_a = _compute_chart_marriage_strength(snap_a)
    strength_b = _compute_chart_marriage_strength(snap_b)
    seventh_house_pts = strength_a.score + strength_b.score  # 0-20

    # Layer 4: Navamsa
    navamsa = _compute_navamsa(snap_a, snap_b)

    # Layer 5: Dosham
    sevvai_a = _compute_sevvai(snap_a)
    sevvai_b = _compute_sevvai(snap_b)
    sevvai_a, sevvai_b = _apply_mutual_sevvai_cancellation(sevvai_a, sevvai_b)
    dosham_pts = sevvai_a.score + sevvai_b.score  # 0-10 (5 each max)

    # Nadi dosha penalty
    if porutham_result.nadi_dosha.get("has_nadi_dosha"):
        dosham_pts = max(0, dosham_pts - 3)

    # Layer 6: Dasha
    dasha = _compute_dasha_harmony(snap_a, snap_b, today_jd)

    # Layer 7: Emotional
    emotional = _compute_emotional_compatibility(snap_a, snap_b)

    # Layer 8: Synastry → 0-5 pts
    synastry_pts = round(synastry_score / 100 * 5)

    # Overall score
    breakdown = CompatibilityScoreBreakdown(
        porutham=porutham_pts,
        seventh_house=seventh_house_pts,
        navamsa=navamsa.score,
        dasha_harmony=dasha.score,
        dosham_analysis=dosham_pts,
        emotional=emotional.score,
        synastry=synastry_pts,
    )
    overall_score = (
        breakdown.porutham
        + breakdown.seventh_house
        + breakdown.navamsa
        + breakdown.dasha_harmony
        + breakdown.dosham_analysis
        + breakdown.emotional
        + breakdown.synastry
    )
    overall_score = max(0, min(100, overall_score))

    # Label
    if overall_score >= 80:
        overall_label = "EXCELLENT"
    elif overall_score >= 65:
        overall_label = "GOOD"
    elif overall_score >= 50:
        overall_label = "AVERAGE"
    else:
        overall_label = "CAUTION"

    # Strengths and risks
    strengths_en: list[str] = []
    strengths_ta: list[str] = []
    risks_en: list[str] = []
    risks_ta: list[str] = []

    if porutham_result.percentage >= 70:
        strengths_en.append(f"Strong traditional porutham score ({porutham_result.percentage:.0f}%)")
        strengths_ta.append(f"வலுவான பாரம்பரிய பொருத்தம் மதிப்பெண் ({porutham_result.percentage:.0f}%)")
    elif porutham_result.percentage < 50:
        risks_en.append(f"Traditional porutham score is below average ({porutham_result.percentage:.0f}%)")
        risks_ta.append(f"பாரம்பரிய பொருத்தம் சராசரிக்கு கீழே ({porutham_result.percentage:.0f}%)")

    if strength_a.score + strength_b.score >= 14:
        strengths_en.append("Both charts show strong 7th house and Venus placements")
        strengths_ta.append("இரு ஜாதகங்களிலும் 7ஆம் இடம் மற்றும் சுக்கிரன் வலுவாக உள்ளனர்")
    elif strength_a.score + strength_b.score <= 6:
        risks_en.append("7th house or Venus placement needs attention in one or both charts")
        risks_ta.append("ஒரு அல்லது இரு ஜாதகங்களிலும் 7ஆம் இடம் அல்லது சுக்கிரன் கவனம் தேவை")

    if navamsa.harmony_label in {"STRONG", "GOOD"}:
        strengths_en.append(f"Navamsa (D9) alignment is {navamsa.harmony_label.lower()}")
        strengths_ta.append(f"நவாம்ச (D9) இணக்கம் {navamsa.harmony_label.lower()}")
    elif navamsa.harmony_label == "WEAK":
        risks_en.append("Navamsa (D9) placement shows weaker marriage potential")
        risks_ta.append("நவாம்ச (D9) நிலை பலவீனமான திருமண சாத்தியத்தை காட்டுகிறது")

    if dasha.harmony_label == "SUPPORTIVE":
        strengths_en.append(f"Dasha period is supportive ({dasha.person_a_maha_lord} × {dasha.person_b_maha_lord})")
        strengths_ta.append(f"தசை காலம் சாதகமானது ({dasha.person_a_maha_lord} × {dasha.person_b_maha_lord})")
    elif dasha.harmony_label == "CHALLENGING":
        risks_en.append(f"Current dasha lords are in tension ({dasha.person_a_maha_lord} × {dasha.person_b_maha_lord})")
        risks_ta.append(f"தற்போதைய தசை அதிபதிகள் மோதலில் உள்ளனர் ({dasha.person_a_maha_lord} × {dasha.person_b_maha_lord})")

    if sevvai_a.has_dosham and not sevvai_a.is_cancelled:
        risks_en.append(f"Person A has active Sevvai Dosham ({sevvai_a.severity}) — matching recommended")
        risks_ta.append(f"நபர் A-க்கு செவ்வாய் தோஷம் உள்ளது ({sevvai_a.severity}) — பொருத்தம் பரிந்துரை")
    if sevvai_b.has_dosham and not sevvai_b.is_cancelled:
        risks_en.append(f"Person B has active Sevvai Dosham ({sevvai_b.severity}) — matching recommended")
        risks_ta.append(f"நபர் B-க்கு செவ்வாய் தோஷம் உள்ளது ({sevvai_b.severity}) — பொருத்தம் பரிந்துரை")

    if porutham_result.rajju_dosha:
        risks_en.append("Rajju Dosha is present — health/longevity remedies advised")
        risks_ta.append("ரஜ்ஜு தோஷம் உள்ளது — ஆரோக்யம்/ஆயுள் பரிகாரம் பரிந்துரை")

    if emotional.score >= 8:
        strengths_en.append(f"Strong emotional resonance — Moon harmony is {emotional.moon_moon_harmony.lower()}")
        strengths_ta.append(f"வலுவான உணர்வு இணக்கம் — சந்திர இணக்கம் {emotional.moon_moon_harmony.lower()}")
    elif emotional.score <= 3:
        risks_en.append("Emotional styles differ significantly — communication investment needed")
        risks_ta.append("உணர்வு முறைகள் வேறுபட்டுள்ளன — தொடர்பு முயற்சி தேவை")

    # Summary
    if overall_label == "EXCELLENT":
        summary_en = (
            f"Compatibility Intelligence Score: {overall_score}/100 — Excellent. "
            "Traditional porutham, navamsa alignment, dasha harmony, and emotional compatibility all "
            "point strongly in favour of this match. A holistically auspicious pairing."
        )
        summary_ta = (
            f"இணக்க நுண்ணறிவு மதிப்பெண்: {overall_score}/100 — சிறந்தது. "
            "பாரம்பரிய பொருத்தம், நவாம்ச இணக்கம், தசை சாதகம், மற்றும் உணர்வு இணக்கம் அனைத்தும் "
            "இந்த ஜோடிக்கு சாதகமாக சுட்டிக்காட்டுகின்றன."
        )
    elif overall_label == "GOOD":
        summary_en = (
            f"Compatibility Intelligence Score: {overall_score}/100 — Good. "
            "Most compatibility layers align well. Minor areas to be mindful of are noted in the risk section."
        )
        summary_ta = (
            f"இணக்க நுண்ணறிவு மதிப்பெண்: {overall_score}/100 — நல்லது. "
            "பெரும்பாலான இணக்க அடுக்குகள் நன்றாக இணைகின்றன. சில கவனிக்க வேண்டிய அம்சங்கள் குறிப்பிடப்பட்டுள்ளன."
        )
    elif overall_label == "AVERAGE":
        summary_en = (
            f"Compatibility Intelligence Score: {overall_score}/100 — Average. "
            "The match has both supportive and challenging factors. "
            "Understanding the risk areas and working through them together is key."
        )
        summary_ta = (
            f"இணக்க நுண்ணறிவு மதிப்பெண்: {overall_score}/100 — சராசரி. "
            "பொருத்தத்தில் சாதக மற்றும் சவாலான காரணிகள் உள்ளன. "
            "ஆபத்து அம்சங்களை புரிந்துகொண்டு சேர்ந்து செயல்படுவது முக்கியம்."
        )
    else:
        summary_en = (
            f"Compatibility Intelligence Score: {overall_score}/100 — Caution advised. "
            "Several compatibility layers show friction. Consultation with an experienced jyotishi "
            "and careful remedial planning is recommended before proceeding."
        )
        summary_ta = (
            f"இணக்க நுண்ணறிவு மதிப்பெண்: {overall_score}/100 — எச்சரிக்கை பரிந்துரை. "
            "பல இணக்க அடுக்குகளில் மோதல்கள் காணப்படுகின்றன. தொடர்வதற்கு முன் "
            "அனுபவமிக்க ஜோதிட ஆலோசனை மற்றும் பரிகார திட்டமிடல் பரிந்துரைக்கப்படுகிறது."
        )

    return CompatibilityIntelligenceResult(
        person_a_name=person_a_name,
        person_b_name=person_b_name,
        porutham_score=porutham_result.total_score,
        porutham_max=porutham_result.max_score,
        porutham_percentage=porutham_result.percentage,
        porutham_label=porutham_result.label,
        rajju_dosha=porutham_result.rajju_dosha,
        vedha_dosha=porutham_result.vedha_dosha,
        chart_a_strength=strength_a,
        chart_b_strength=strength_b,
        navamsa=navamsa,
        sevvai_a=sevvai_a,
        sevvai_b=sevvai_b,
        dasha_harmony=dasha,
        emotional=emotional,
        synastry_score=synastry_score,
        overall_score=overall_score,
        overall_label=overall_label,
        score_breakdown=breakdown,
        strengths_en=strengths_en,
        strengths_ta=strengths_ta,
        risks_en=risks_en,
        risks_ta=risks_ta,
        summary_en=summary_en,
        summary_ta=summary_ta,
    )
