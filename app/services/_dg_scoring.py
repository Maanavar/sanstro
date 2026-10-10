"""Scoring constants and math helpers for the daily guidance engine.

All functions here are pure (or close to it): they take values and return values.
No DB session, no HTTP exceptions except _birth_datetime_utc which validates input.
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException, status

from app.calculations.ashtakavarga import get_av_bindu
from app.calculations.astro import house_from_reference, local_datetime_to_utc
from app.calculations.chart_strength import (
    _NATURAL_ENEMIES,
    _NATURAL_FRIENDS,
    compute_natal_planet_score,
)
from app.calculations.functional_nature import get_dasha_modifier, get_transit_modifier
from app.calculations.maturation import MATURATION_AGE
from app.calculations.panchangam import (
    PanchangamLimbSpan,
    limb_fraction,
    limb_weighted,
    own_chandrashtama_windows,
)
from app.calculations.transits import check_vedha
from app.models import BirthProfile
from app.reasoning.verdict import Band, band_to_legacy_confidence
from app.schemas.daily_guidance import DailyGuidanceText
from app.services.narrative_engine import PLANET_NAME

SIGN_LORDS: dict[int, str] = {
    1: "MARS",
    2: "VENUS",
    3: "MERCURY",
    4: "MOON",
    5: "SUN",
    6: "MERCURY",
    7: "VENUS",
    8: "MARS",
    9: "JUPITER",
    10: "SATURN",
    11: "SATURN",
    12: "JUPITER",
}

# Nakshatras traditionally considered auspicious for daily activity in Tamil Jyothidam.
# Sources: Ashwini(1), Rohini(4), Mirugaseeridam(5), Punarpoosam(7), Poosam(8),
# Hastham(13), Chithirai(14), Swathi(15), Anusham(17), Thiruvonam(22), Revathi(27).
AUSPICIOUS_DAILY_NAKSHATRAS: set[int] = {1, 4, 5, 7, 8, 13, 14, 15, 17, 22, 27}

# The counterpart caution list. This lives here, beside the auspicious set,
# because it previously existed as two hand-copies that had drifted apart:
# `daily_push_cron` carried {2, 9, 10, 14, 19} and `pdf_export_service`
# {2, 9, 10, 19}. The push copy listed **14 (Chithirai) in both** its auspicious
# and its caution set — and because it tested auspicious first, the caution
# branch for 14 was unreachable, so the two surfaces silently agreed on 14 by
# accident while disagreeing in their source. 14 is auspicious; it is not a
# caution star, and the set below says so once.
CAUTION_DAILY_NAKSHATRAS: set[int] = {2, 9, 10, 19}

CAUTION_YOGAS = {1, 6, 9, 10, 17, 27}
# Rikta (4/9/14 in each paksha) and Ashtami. Named rather than inlined because
# the weighted scorer and the flat legacy path must agree on the same sets.
RIKTA_TITHIS: set[int] = {4, 9, 14, 19, 24, 29}
ASHTAMI_TITHIS: set[int] = {8, 23}

# Tara Bala contribution to the *daily guidance* Moon score. Deliberately NOT
# `app.calculations.tara_bala.TARA_SCORE`: that table is the muhurta picker's
# own product calibration on a different scale, and the two tara systems were
# ruled to stay separate (muhurta doctrine, 2026-08-16). Same 1..9 ordering,
# different magnitudes, different consumer — do not merge them.
TARA_DELTA: dict[int, int] = {
    1: -20,  # Janma
    2:  +8,  # Sampat
    3: -15,  # Vipat
    4:  +8,  # Kshema
    5: -10,  # Pratyak
    6:  +5,  # Sadhana
    7: -15,  # Naidhana
    8:  +8,  # Mitra
    9: +12,  # Parama Mitra
}


def tara_position(day_nakshatra: int, janma_nakshatra: int) -> int:
    """The 1..9 Tara Bala position of a day star against a birth star."""
    return ((day_nakshatra - janma_nakshatra) % 27) % 9 + 1


PLANET_DAILY_WEIGHT: dict[str, float] = {
    "JUPITER": 0.18,
    "SATURN": 0.20,
    "RAHU": 0.12,
    "KETU": 0.08,
    "MARS": 0.14,
    "MOON": 0.10,
}

TRANSIT_BASE_SCORE: dict[str, dict[int, int]] = {
    "JUPITER": {1: 50, 2: 72, 3: 48, 4: 42, 5: 78, 6: 38, 7: 68, 8: 25, 9: 82, 10: 58, 11: 80, 12: 34},
    "SATURN": {1: 42, 2: 40, 3: 62, 4: 34, 5: 52, 6: 64, 7: 50, 8: 22, 9: 36, 10: 62, 11: 76, 12: 42},
    "RAHU": {1: 40, 2: 45, 3: 50, 4: 42, 5: 48, 6: 44, 7: 45, 8: 30, 9: 46, 10: 40, 11: 52, 12: 36},
    "KETU": {1: 42, 2: 40, 3: 46, 4: 48, 5: 44, 6: 42, 7: 46, 8: 34, 9: 48, 10: 44, 11: 40, 12: 38},
    "MARS": {1: 38, 2: 34, 3: 50, 4: 40, 5: 46, 6: 52, 7: 42, 8: 28, 9: 48, 10: 44, 11: 50, 12: 32},
    "MOON": {1: 55, 2: 58, 3: 50, 4: 48, 5: 62, 6: 46, 7: 60, 8: 30, 9: 64, 10: 52, 11: 56, 12: 36},
}

PLANET_PERIOD_SCORE: dict[str, int] = {
    "SUN": 55,
    "MOON": 60,
    "MARS": 48,
    "MERCURY": 63,
    "JUPITER": 72,
    "VENUS": 68,
    "SATURN": 44,
    "RAHU": 40,
    "KETU": 42,
}

# Naisargika maitri is NOT redefined here. This module carried a byte-identical
# hand-copy of `chart_strength`'s table, which is how the Venus/Rahu
# contradiction fixed there on 2026-08-17 would have survived in daily guidance
# after being corrected everywhere else. One definition, imported.


def _age_dasha_modifier(age: int, planet: str) -> float:
    """Return a life-stage multiplier for a dasha planet.

    Thirukanitham teaches that the same dasha produces different intensity depending
    on the native's age. Saturn is harsh during youth (before karmic readiness), Mars
    peaks during the physically active years, Venus during the romantic/creative prime,
    Jupiter during the wisdom-expansion years, and the Moon colours the emotionally
    receptive phases.

    ── ANSWERED, 2026-08-27 (astrologer ruling; §7 Q3 of the function &
    calculation review). Two corrections, one principle. ──

    **The direction was right; the thresholds were unsourced — and the sourced
    table was already in this repository.** The doctrine underneath this
    function is the classical **graha maturity (paripakva) ages**, at which a
    graha begins to deliver its dasha in full. They live in
    `app.calculations.maturation.MATURATION_AGE` and have all along:

        Jupiter 16 · Sun 22 · Moon 24 · Venus 25 · Mars 28
        Mercury 32 · Saturn 36 · Rahu 42 · Ketu 48

    This function had hand-rolled its own round numbers beside them. Every youth
    threshold below is now **read from that table** rather than restated, so the
    two cannot drift: Saturn moved 30 -> 36, Mars 25 -> 28, Venus 20 -> 25, the
    Moon's childhood arm 20 -> 24. Nothing about the shape of the curve changed;
    it is the same teaching, now cut where the tradition cuts it.

    The *curve* stays separate from `maturation_multiplier`, which uses the same
    ages on a different shape (0.70 before, 1.10 in a +/-2 window, 1.00 after)
    for a different consumer, the prediction layer's L3. Two consumers may hold
    two calibrations of one doctrine — the same precedent as the two Tara tables
    (doctrine A-11) — but they may not hold two copies of the ages.

    **Sun, Rahu and Ketu should not have been flat.** Rahu matures at 42 and
    Ketu at 48 — the two latest ages in the whole scheme, and the two grahas
    whose dashas are most notoriously difficult when they run early. An 18-year
    Rahu mahadasha opening at 5 and one opening at 45 are not the same period,
    and leaving both nodes flat was the least defensible line in the function.
    The Sun matures at 22: a 6-year Sun dasha in early childhood finds a native
    with no independent standing to express it.

    **Mercury stays flat, and now for a stated reason rather than by omission.**
    It matures at 32, but a Mercury mahadasha running through childhood is the
    *education* dasha and is classically favourable exactly then — the discount
    the maturity age would imply is contradicted by the practice, so Mercury is
    a genuine exception.

    **Jupiter keeps 35-60, and the comment above is what changed.** Jupiter
    matures earliest of all, at 16, so its uplift is NOT a maturity effect and
    must not be described as one; a Guru dasha in childhood is a blessing, which
    is why there is correctly no youth discount here. The 35-60 uplift rests on
    ashrama fitness — the grihastha and vanaprastha years are where Guru's
    significations have somewhere to land — and is a [LINEAGE] product judgement,
    kept as coded.
    """
    immature = age < MATURATION_AGE.get(planet, 30)
    if planet == "SATURN":
        return 0.88 if immature else (1.05 if age > 55 else 1.0)
    if planet == "MARS":
        return 0.92 if immature else (1.05 if age <= 45 else 0.95)
    if planet == "VENUS":
        return 0.90 if immature else (1.08 if age <= 40 else (0.95 if age > 55 else 1.0))
    if planet == "JUPITER":
        # No youth discount: Guru matures earliest of all, at 16, and a Guru
        # dasha in childhood is a blessing. The 35-60 uplift is ashrama fitness,
        # not maturity, which is why it does not read MATURATION_AGE.
        return 1.10 if 35 <= age <= 60 else 1.0
    if planet == "MOON":
        return 1.05 if (immature or age > 60) else 1.0
    if planet == "SUN":
        return 0.92 if immature else 1.0
    if planet in {"RAHU", "KETU"}:
        return 0.90 if immature else 1.0
    return 1.0  # MERCURY — matures at 32, but its dasha is the education dasha


def _to_utc(datetime_value: datetime) -> datetime:
    if datetime_value.tzinfo is None:
        return datetime_value.replace(tzinfo=UTC)
    return datetime_value.astimezone(UTC)


def _birth_datetime_utc(profile: BirthProfile) -> datetime:
    birth_datetime_utc = profile.birth_datetime_utc
    if birth_datetime_utc is not None:
        if birth_datetime_utc.tzinfo is None:
            return birth_datetime_utc.replace(tzinfo=UTC)
        return birth_datetime_utc.astimezone(UTC)

    if profile.birth_time_local is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Birth time is required.")

    local_dt = datetime.combine(profile.birth_date_local, profile.birth_time_local)
    return local_datetime_to_utc(local_dt, profile.birth_timezone)


def _rasi_lord(rasi_number: int) -> str:
    return SIGN_LORDS[rasi_number]


def _normalize_graha_name(name: str) -> str:
    return {
        "GURU": "JUPITER",
        "SANI": "SATURN",
    }.get(name, name)


def _score_label(score: int) -> str:
    if score >= 80:
        return "STRONG_SUPPORT"
    if score >= 65:
        return "GOOD"
    if score >= 50:
        return "BALANCED"
    if score >= 35:
        return "CAUTION"
    return "RESTORATIVE"


def _angular_sep(a: float, b: float) -> float:
    diff = abs(a - b) % 360
    return diff if diff <= 180 else 360 - diff


def _collect_afflicted_planets(chart_snapshot) -> list[str]:
    planets = chart_snapshot.data.planets
    lagna_rasi = chart_snapshot.data.lagna.rasi
    sun = next((p for p in planets if p.graha == "SUN"), None)
    saturn = next((p for p in planets if p.graha == "SATURN"), None)
    rahu = next((p for p in planets if p.graha == "RAHU"), None)
    ketu = next((p for p in planets if p.graha == "KETU"), None)
    sun_longitude = sun.absolute_longitude if sun is not None else 0.0

    rasi_by_graha = {p.graha: p.rasi for p in planets}
    afflicted: list[str] = []
    for planet in planets:
        graha = planet.graha
        house = house_from_reference(lagna_rasi, planet.rasi)
        strength = int(getattr(planet, "strength_score", 0) or 0)
        if strength <= 0:
            strength = compute_natal_planet_score(
                planet=graha,
                natal_rasi=planet.rasi,
                natal_longitude=planet.absolute_longitude,
                natal_lagna_rasi=lagna_rasi,
                sun_longitude=sun_longitude,
                is_retrograde=planet.is_retrograde,
                is_vargottama=planet.is_vargottama,
                d9_rasi=planet.d9_rasi,
                planet_rasi_map=rasi_by_graha,
            )

        is_conj_malefic = False
        for malefic in (saturn, rahu, ketu):
            if malefic is None or malefic.graha == graha:
                continue
            if _angular_sep(planet.absolute_longitude, malefic.absolute_longitude) <= 8:
                is_conj_malefic = True
                break

        if graha == "SUN" and planet.rasi == 7:
            afflicted.append(graha)
            continue

        if (house in {6, 8, 12} and strength < 45) or (planet.is_combust and graha != "SUN") or is_conj_malefic:
            afflicted.append(graha)

    # Preserve order, keep top 3 for concise remedy output.
    unique = list(dict.fromkeys(afflicted))
    return unique[:3]


def _planet_period_score(lord: str) -> int:
    return PLANET_PERIOD_SCORE[lord]


def _transit_with_av_score(
    planet: str,
    transit_rasi: int,
    moon_rasi: int,
    bhinnashtakavarga: dict[str, dict[int, int]],
) -> int:
    """
    Adjust transit house score by Ashtakavarga Bhinna bindus.
    bindus >= 4: supportive transit (+8)
    bindus <= 2: difficult transit (-8)

    Rahu and Ketu have no Bhinnashtakavarga table (doctrine A-15), so
    `get_av_bindu` returns None for them and the transit keeps its base house
    score with no bindu adjustment either way.
    """
    base_house = house_from_reference(moon_rasi, transit_rasi)
    base_score = TRANSIT_BASE_SCORE.get(planet, {}).get(base_house, 50)
    bindus = get_av_bindu(bhinnashtakavarga, planet, transit_rasi)
    if bindus is not None:
        if bindus >= 4:
            base_score += 8
        elif bindus <= 2:
            base_score -= 8
    return max(10, min(90, base_score))


def _dasha_lord_strength_score(
    planet: str,
    natal_planet_score: int,
    transit_house: int,
    is_retrograde_transit: bool = False,
) -> int:
    """
    Compute dasha lord support score from natal strength and current transit.
    Returns 10-95.
    """
    natal_component = natal_planet_score * 0.40
    transit_base = TRANSIT_BASE_SCORE.get(planet, {}).get(transit_house, 50)
    transit_component = transit_base * 0.40
    retro_component = 20.0 if is_retrograde_transit else 10.0
    return max(10, min(95, round(natal_component + transit_component + retro_component)))


def _pratyantar_narrative(
    pratyantar_lord: str,
    pratyantar_days_remaining: int,
    mahadasha_lord: str,
    antardasha_lord: str,
    planet_scores: dict[str, int],
    lang: str = "ta-en",
) -> dict[str, str] | None:
    if pratyantar_days_remaining > 90:
        return None

    score = planet_scores.get(pratyantar_lord, 50)
    quality = "strong" if score >= 65 else ("challenging" if score <= 35 else "moderate")
    quality_ta = "வலுவான" if score >= 65 else ("சவாலான" if score <= 35 else "மிதமான")
    pratyantar_lord_ta = PLANET_NAME[pratyantar_lord].ta if pratyantar_lord in PLANET_NAME else pratyantar_lord
    antardasha_lord_ta = PLANET_NAME[antardasha_lord].ta if antardasha_lord in PLANET_NAME else antardasha_lord
    en = (
        f"{pratyantar_lord.capitalize()} Pratyantar ({pratyantar_days_remaining}d remaining) "
        f"brings a {quality} short-term influence within the "
        f"{antardasha_lord.capitalize()} Antardasha of {mahadasha_lord.capitalize()} Mahadasha."
    )
    ta = (
        f"{pratyantar_lord_ta} பிரத்யந்தர தசை ({pratyantar_days_remaining} நாள் மீதம்) - "
        f"{antardasha_lord_ta} அந்தர தசையில் குறுகிய கால {quality_ta} தாக்கம்."
    )
    return {"en": en, "ta": ta}


def _graha_relationship_score(maha_lord: str, antar_lord: str) -> int:
    """Relationship score from classical natural friendship table. Covers all 9×9 pairs."""
    if maha_lord == antar_lord:
        return 72
    if antar_lord in _NATURAL_FRIENDS.get(maha_lord, frozenset()):
        return 70   # Natural friends
    if antar_lord in _NATURAL_ENEMIES.get(maha_lord, frozenset()):
        return 38   # Natural enemies
    return 55       # Natural neutrals


# ── Duration-weighted almanac scoring (doctrine ruling R-1, 2026-08-19) ────────
#
# Until now every one of these inputs was read at a single instant — the limbs at
# sunrise, the Moon at solar noon — and that instant then carried a whole day's
# score. Measured at Chennai over 2026-08..2027-07 the sunrise nakshatra holds
# less than half the day on 46.6% of days and the sunrise karana on 97.5%; the
# Vishti penalty below was consequently never applied on 100 of the 149 days
# Vishti actually occurs. The உதய rule still *names* the day (calendar grid,
# festivals, headings are untouched) — what changed is that the score is now
# weighted by how long each value was really in force.
#
# On a day with no transition every function here returns exactly what the old
# scalar code returned, which is what confines the movement to the days that
# genuinely split.

def _flat_spans(sunrise: datetime, number: int, name: str) -> tuple[PanchangamLimbSpan, ...]:
    """A single span covering the whole day — the pre-spans scalar, in span form.

    Used when a snapshot carries no span list (a cache record older than
    PANCHANGAM_CACHE_DATA_VERSION 43). Anchoring it to the real sunrise rather
    than to an arbitrary epoch matters: `_overlap_fraction` intersects two span
    lists by timestamp, and a flat list dated 1970 would intersect a real one at
    zero and silently delete the bonus it was standing in for.
    """
    return (
        PanchangamLimbSpan(
            number=number,
            name=name,
            start=sunrise,
            end=sunrise + timedelta(days=1),
            fraction=1.0,
        ),
    )


def _spans_or_flat(
    spans: Sequence[PanchangamLimbSpan],
    sunrise: datetime,
    number: int,
    name: str,
) -> Sequence[PanchangamLimbSpan]:
    return spans if spans else _flat_spans(sunrise, number, name)


def _overlap_fraction(
    spans_a: Sequence[PanchangamLimbSpan],
    predicate_a,
    spans_b: Sequence[PanchangamLimbSpan],
    predicate_b,
) -> float:
    """Share of the day where both span lists satisfy their own predicate.

    Intersects real intervals rather than multiplying two fractions, because the
    two lists do not share boundaries: a rasi boundary falls every 30° and a
    nakshatra boundary every 13°20', so they interleave. Multiplying would claim
    an overlap on a day where the auspicious star and the clear rasi never
    actually coincide.
    """
    matched_a = [span for span in spans_a if predicate_a(span)]
    matched_b = [span for span in spans_b if predicate_b(span)]
    if not matched_a or not matched_b:
        return 0.0

    day_start = min(span.start for span in spans_a)
    day_end = max(span.end for span in spans_a)
    day_seconds = (day_end - day_start).total_seconds()
    if day_seconds <= 0:
        return 0.0

    overlap = 0.0
    for a in matched_a:
        for b in matched_b:
            start = max(a.start, b.start)
            end = min(a.end, b.end)
            if end > start:
                overlap += (end - start).total_seconds()
    return min(1.0, overlap / day_seconds)


def _tithi_penalty(span: PanchangamLimbSpan) -> float:
    if span.number in RIKTA_TITHIS:
        return -15.0
    # Ashtami in both pakshas — mild caution. Amavasai (30) is NOT penalised:
    # it is a sacred Pitru Tarpan day, not an inauspicious one.
    if span.number in ASHTAMI_TITHIS:
        return -10.0
    return 0.0


def _yoga_penalty(span: PanchangamLimbSpan) -> float:
    return -10.0 if span.number in CAUTION_YOGAS else 0.0


def _karana_penalty(span: PanchangamLimbSpan) -> float:
    # Tested on the name, not the number: a karana span carries its 0..59 index
    # within the lunar month, and Vishti is one of the seven movable karanas
    # rather than a fixed index.
    return -10.0 if span.name == "VISHTI" else 0.0


def weighted_panchangam_score(panchangam, *, lagna_lord: str | None, maha_lord: str) -> int:
    """The day's almanac score, weighted by how long each limb value held."""
    sunrise = panchangam.sunrise
    tithi_spans = _spans_or_flat(panchangam.tithi_spans, sunrise, panchangam.tithi_number, panchangam.tithi_name)
    yoga_spans = _spans_or_flat(panchangam.yoga_spans, sunrise, panchangam.yoga_number, panchangam.yoga_name)
    karana_spans = _spans_or_flat(panchangam.karana_spans, sunrise, 0, panchangam.karana_name)

    score = 70.0
    score += limb_weighted(tithi_spans, _tithi_penalty)
    score += limb_weighted(yoga_spans, _yoga_penalty)
    score += limb_weighted(karana_spans, _karana_penalty)
    # The vara terms stay unweighted. A weekday genuinely is a whole-day
    # property — it does not transition at a longitude — so weighting it would
    # be applying the fix to something that never had the defect.
    if lagna_lord and panchangam.weekday_lord == lagna_lord:
        score += 8
    if panchangam.weekday_lord == maha_lord:
        score += 5
    return max(0, min(100, round(score)))


def chandrashtama_share(panchangam, natal_moon_rasi: int) -> float:
    """Share of the day the transiting Moon sits in the 8th rasi from the natal Moon.

    Chandrashtama is a *rasi* test, not a nakshatra one (spec §4.11) — the two
    boundary systems do not align.
    """
    rasi_spans = _spans_or_flat(
        panchangam.moon_rasi_spans,
        panchangam.sunrise,
        panchangam.chandrashtamam_moon_rasi_number,
        panchangam.chandrashtamam_moon_rasi_name,
    )
    target = ((natal_moon_rasi - 1 + 7) % 12) + 1
    return limb_fraction(rasi_spans, lambda span: span.number == target)


def chandrashtama_rasi_for(natal_moon_rasi: int) -> int:
    """The 8th rasi from the natal Moon — the one whose transit is Chandrashtama.

    One definition, used by both the share below and `chandrashtama_end`, so the
    badge and the time printed beside it cannot come from different arithmetic.
    """
    return ((natal_moon_rasi - 1 + 7) % 12) + 1


def chandrashtama_end(
    panchangam,
    *,
    janma_nakshatra: int,
    natal_moon_rasi: int,
) -> datetime | None:
    """When Chandrashtama lifts today, or None if it does not lift today.

    Read off the reader's own janma-star window, because that is what the badge
    beside it now means. Until 2026-09-09 this read `moon_rasi_spans` — when the
    Moon left the 8th RASI — while the badge had moved to the star window, so the
    two disagreed by hours on the very day they were both shown: on 2026-09-09 at
    Chennai a Pooradam native's window closed at 09:34 and this returned 15:14.
    Web mostly hid it behind the card's own window line; mobile renders this
    field directly as *the* end time and had nothing to fall back on.

    The clipping trap the rasi version documented still applies, so the same
    guard is kept in the same shape. `chandrashtamam_janma_nakshatra_windows` is
    clipped to the day it describes — the SOLAR day since 2026-09-09's D11
    ruling, the civil day before it — so the last window's end is the day's edge
    whether or not the star actually hands over then. Returning that
    unconditionally would print a precise-looking time that is simply false.

    Under D11 that case is rarer than it was, and means something specific: a
    window still running at the next sunrise belongs to tomorrow, so the only
    way to be badged today AND end at the day's edge is a window that covers
    both sunrises — a genuinely all-day Chandrashtama, where None is the honest
    answer.

    What changed is which case is common. Under the rasi rule a stretch spanned
    2-3 badged days, so None was the normal answer; a star window is about a day
    and normally closes within the day it is badged on, so a real time is now the
    normal answer and None the exception (a window still running at midnight).
    Callers must still handle None — see the note on `chandrashtamaEnds` in
    packages/shared/src/types/index.ts.

    `natal_moon_rasi` is needed as well as the star: for the nine stars that
    straddle a rasi boundary, the star name alone selects a window belonging to
    the OTHER half of that star's natives, whose Chandrashtama is a fortnight
    away. The badge beside this field applies both tests, so this must too.
    """
    windows = getattr(panchangam, "chandrashtamam_janma_nakshatra_windows", ()) or ()
    if not windows:
        # A snapshot cached before panchangam v44 carries no windows. It cannot
        # say when anything lifts, so it must not pretend to.
        return None

    mine = own_chandrashtama_windows(
        windows,
        janma_nakshatra=janma_nakshatra,
        natal_moon_rasi=natal_moon_rasi,
    )
    if not mine:
        return None

    end = max(window.end for window in mine)
    day_end = max(window.end for window in windows)
    return end if end < day_end else None


def weighted_moon_score(
    panchangam,
    *,
    janma_nakshatra: int,
    natal_moon_rasi: int,
) -> tuple[int, float]:
    """(moon score 0..100, chandrashtama share 0..1) weighted across the day."""
    sunrise = panchangam.sunrise
    nakshatra_spans = _spans_or_flat(
        panchangam.nakshatra_spans, sunrise, panchangam.nakshatra_number, panchangam.nakshatra_name,
    )
    rasi_spans = _spans_or_flat(
        panchangam.moon_rasi_spans, sunrise,
        panchangam.chandrashtamam_moon_rasi_number, panchangam.chandrashtamam_moon_rasi_name,
    )
    chandrashtama_rasi = chandrashtama_rasi_for(natal_moon_rasi)
    share = limb_fraction(rasi_spans, lambda span: span.number == chandrashtama_rasi)

    score = 70.0
    score += limb_weighted(
        nakshatra_spans,
        lambda span: TARA_DELTA[tara_position(span.number, janma_nakshatra)],
    )
    score -= 25.0 * share
    # Chandrashtama nullifies the transit star's daily auspiciousness
    # (Thirukanitham §4.11), so the +10 is earned only by the stretch of the day
    # that is BOTH an auspicious star AND clear of the 8th rasi. That is an
    # interval intersection, not a product of two shares — see _overlap_fraction.
    score += 10.0 * _overlap_fraction(
        nakshatra_spans, lambda span: span.number in AUSPICIOUS_DAILY_NAKSHATRAS,
        rasi_spans, lambda span: span.number != chandrashtama_rasi,
    )
    return max(0, min(100, round(score))), share


# ── Day-score stages (A13 step 3, 2026-10-08) ────────────────────────────────
#
# Lifted out of `build_daily_guidance_response` verbatim, so each is a pure
# function of values the builder already holds and can be tested without a
# chart, a panchangam or a database. The builder still calls them in the same
# order and reads the same results; tests/test_daily_guidance_golden.py pins
# its output across the extraction.

#: Jupiter's house from the natal Moon → transit-score adjustment (primary
#: refinement; never punitive in the 7th).
_JUPITER_FROM_MOON_MODIFIER: dict[int, float] = {
    1: 0.0,   # Neutral
    2: 3.0,   # Good
    3: -3.0,  # Unfavourable
    4: -4.0,  # Unfavourable
    5: 4.0,   # Very good
    6: -2.0,  # Unfavourable
    7: 3.0,   # Good (mixed) - never punitive
    8: -6.0,  # Bad
    9: 4.0,   # Very good
    10: 1.0,  # Neutral leaning supportive
    11: 4.0,  # Very good
    12: -3.0, # Unfavourable
}


@dataclass(frozen=True)
class TransitComponent:
    score: float
    #: House from the natal Moon for every transit body scored — also what the
    #: personal palan reads.
    houses_from_moon: dict[str, int]


def transit_component(
    transit_bodies: Mapping[str, Any],
    *,
    natal_moon_rasi: int,
    natal_lagna: int,
    bav,
) -> TransitComponent:
    """The day's transit score: Ashtakavarga-weighted gochara with Vedha, then
    the Moon-based Jupiter and Lagna-based Saturn adjustments."""
    # House from Moon for all transit bodies (needed for the Vedha check).
    houses: dict[str, int] = {
        g: house_from_reference(natal_moon_rasi, b.rasi)
        for g, b in transit_bodies.items()
    }

    score = 50.0
    for graha, body in transit_bodies.items():
        house_from_moon = houses[graha]
        base = _transit_with_av_score(graha, body.rasi, natal_moon_rasi, bav)
        fn_mult = get_transit_modifier(natal_lagna, graha)  # Lagna-specific (BUG-10)
        contribution = (base - 50) * PLANET_DAILY_WEIGHT[graha] * fn_mult
        # Vedha Vichara: if blocking planet in Vedha house, transit benefit is cancelled (BUG-08)
        if check_vedha(graha, house_from_moon, houses):
            contribution *= 0.25
        score += contribution
    score = max(0, min(100, score))
    # Moon-based Jupiter refinement (primary) + Lagna-based Saturn material modifier.
    saturn_house_from_lagna = house_from_reference(natal_lagna, transit_bodies["SATURN"].rasi)
    lagna_modifier = 0.0
    lagna_modifier += _JUPITER_FROM_MOON_MODIFIER.get(houses["JUPITER"], 0.0)
    if saturn_house_from_lagna in {1, 4, 7, 10}:
        lagna_modifier -= 4.0
    elif saturn_house_from_lagna in {3, 6, 11}:
        lagna_modifier += 2.0
    return TransitComponent(score=max(0, min(100, score + lagna_modifier)), houses_from_moon=houses)


@dataclass(frozen=True)
class DashaComponent:
    score: int
    #: Natal strength of each running lord the chart carries — maha, antar,
    #: pratyantar, in that order — which the pratyantar narrative reads.
    planet_strength: dict[str, int]


def dasha_component(
    planets: Sequence[Any],
    *,
    maha_lord: str,
    antar_lord: str,
    pratyantar_lord: str,
    natal_lagna: int,
    natal_moon_rasi: int,
    transit_bodies: Mapping[str, Any],
    natal_rasi_by_graha: Mapping[str, int],
    is_daytime: bool | None,
    profile_age: int,
) -> DashaComponent:
    """The day's dasha score from the running maha and antar lords.

    Each lord starts from its natal strength in this chart (BUG-06: the actual
    placement, not a generic score), is adjusted by its transit house from the
    natal Moon, then by the lagna's functional-nature and the age-phase
    (Thirukanitham) modifiers, and the two are blended with their relationship.
    ``is_daytime`` is the true sunrise/sunset at the birth place (engine audit
    G3), which needs the ephemeris, so the caller resolves it and passes it in
    (``None`` when the birth time is unknown).
    """
    natal_sun = next((p for p in planets if p.graha == "SUN"), None)
    natal_moon = next((p for p in planets if p.graha == "MOON"), None)
    sun_lon = float(natal_sun.absolute_longitude) if natal_sun else 0.0
    moon_lon = float(natal_moon.absolute_longitude) if natal_moon else 0.0
    paksha_is_shukla = ((moon_lon - sun_lon) % 360.0) < 180.0

    def natal_strength(lord: str, natal) -> int:
        score = int(getattr(natal, "strength_score", 0) or 0)
        if score <= 0:
            score = compute_natal_planet_score(
                planet=lord,
                natal_rasi=natal.rasi,
                natal_longitude=float(natal.absolute_longitude),
                natal_lagna_rasi=natal_lagna,
                sun_longitude=sun_lon,
                is_retrograde=natal.is_retrograde,
                is_vargottama=bool(natal.is_vargottama),
                d9_rasi=natal.d9_rasi,
                is_daytime=is_daytime,
                paksha_is_shukla=paksha_is_shukla,
                planet_rasi_map=natal_rasi_by_graha,
            )
        return score

    planet_strength: dict[str, int] = {}

    def period_score(lord: str) -> int:
        natal = next((p for p in planets if p.graha == lord), None)
        if not natal:
            return _planet_period_score(lord) if lord in PLANET_PERIOD_SCORE else 50
        natal_score = natal_strength(lord, natal)
        planet_strength[lord] = natal_score
        transit = transit_bodies.get(lord)
        if transit is None:
            return natal_score
        return _dasha_lord_strength_score(
            lord,
            natal_score,
            house_from_reference(natal_moon_rasi, transit.rasi),
            is_retrograde_transit=bool(transit.is_retrograde),
        )

    maha_score = period_score(maha_lord)
    antar_score = period_score(antar_lord)
    natal_praty = next((p for p in planets if p.graha == pratyantar_lord), None)
    if natal_praty:
        planet_strength[pratyantar_lord] = natal_strength(pratyantar_lord, natal_praty)

    # Functional-nature modifier (lagna-based) + age-phase modifier (Thirukanitham).
    maha_score = max(10, min(95, round(
        maha_score * get_dasha_modifier(natal_lagna, maha_lord) * _age_dasha_modifier(profile_age, maha_lord)
    )))
    antar_score = max(10, min(95, round(
        antar_score * get_dasha_modifier(natal_lagna, antar_lord) * _age_dasha_modifier(profile_age, antar_lord)
    )))

    # Relationship weight raised from 0.10 → 0.25: enemy lords cause meaningful score divergence
    relationship_score = _graha_relationship_score(maha_lord, antar_lord)
    score = max(0, min(100, round(maha_score * 0.45 + antar_score * 0.30 + relationship_score * 0.25)))
    return DashaComponent(score=score, planet_strength=planet_strength)


#: The Ezharai (Sade Sati) phases — graded by murthi rather than a flat penalty.
SADE_SATI_TYPES = frozenset({"JANMA_SANI", "EZHARAI_SANI_PHASE_1", "EZHARAI_SANI_PHASE_2", "EZHARAI_SANI_PHASE_3"})
#: Keyed by grade; an unknown (or absent) grade takes the middle penalty, 7.
_SADE_SATI_MURTHI_PENALTY: dict[str | None, int] = {"GOLD": 4, "SILVER": 6, "COPPER": 8, "IRON": 10}


def personal_safety_component(
    *,
    chandrashtama: bool,
    saturn_cycle,
    kantaka_sani,
    sade_sati_murthi_grade: str | None,
    abhijit_restricted: bool,
    mercury_combust: bool,
) -> int:
    """The day's personal-safety score, 60 less each caution that applies.

    ``sade_sati_murthi_grade`` is required only when ``saturn_cycle`` is an
    active Sade Sati phase (``SADE_SATI_TYPES``): its grade comes from the
    ingress-Moon method (Doctrine §3, WI-08), which needs the ephemeris, so the
    caller computes it and passes the result in.
    """
    score = 60
    if chandrashtama:
        score -= 15
    if saturn_cycle.is_active:
        if saturn_cycle.type in SADE_SATI_TYPES:
            # Sade Sati is a caution cycle, but never treated as flatly "bad".
            score -= _SADE_SATI_MURTHI_PENALTY.get(sade_sati_murthi_grade, 7)
        elif saturn_cycle.type == "ARDHASHTAMA_SANI":
            score -= 9
        elif saturn_cycle.type == "ASHTAMA_SANI":
            score -= 12
    # Kandaka from the Janma Rasi. Under doctrine A-1 the overlap with
    # Ardhashtama (both are the 4th from the Moon) is the rule rather than a
    # modelling accident, so a reader in that position is *named* both cycles —
    # but the placement is still one placement and must be *scored* once. This
    # guard, written to dodge an overlap that could not previously happen from
    # two different reference points, is what keeps the penalty single now that
    # it can.
    if kantaka_sani.is_active and not saturn_cycle.is_active:
        score -= 7
    if abhijit_restricted:
        score -= 5
    if mercury_combust:
        score -= 3
    return max(0, min(100, score))


@dataclass(frozen=True)
class DayComposite:
    """The weighted day score, its label and its confidence band."""

    moon: int
    transit: int
    dasha: int
    panchangam: int
    personal: int
    remedial: int
    score: int
    label: str
    band: Band
    confidence_reason: DailyGuidanceText
    confidence: str


def composite_day_score(
    *,
    moon_score: float,
    transit_score: float,
    dasha_score: float,
    panchangam_score: float,
    personal_safety_score: float,
    remedial_support: int,
    chandrashtama: bool,
) -> DayComposite:
    # Weights (0.28+0.24+0.19+0.14+0.09 = 0.94) plus flat remedial max 6 → total max = 100.
    # Each component is rounded first; total is their sum — no double-rounding discrepancy.
    moon_c = round(moon_score * 0.28)
    transit_c = round(transit_score * 0.24)
    dasha_c = round(dasha_score * 0.19)
    panch_c = round(panchangam_score * 0.14)
    personal_c = round(personal_safety_score * 0.09)
    score = min(100, moon_c + transit_c + dasha_c + panch_c + personal_c + remedial_support)
    label = _score_label(score)
    # Chandrashtama is a prohibition period in Thirukanitham — no day in ashtama can be
    # labelled positively even if dasha/transits are strong.
    if chandrashtama and label in ("GOOD", "STRONG_SUPPORT"):
        label = "BALANCED"

    # P1-B: Confidence tier — count of components scoring ≥60, expressed as an
    # ordinal Band (plan Phase 2, D2) with legacy HIGH/MED/LOW derived from it.
    # 3 signals → LIKELY (not STRONG: daily alignment is timing-only evidence),
    # 2 → MIXED, ≤1 → WEAK. band_to_legacy keeps the legacy tier byte-identical.
    signals = sum(1 for s in (moon_score, dasha_score, transit_score) if s >= 60)
    if signals >= 3:
        band = Band.LIKELY
        reason = DailyGuidanceText(
            ta="மூன்றும் — சந்திரன், தசை, கோச்சாரம் — இன்று ஆதரவாக உள்ளன",
            en="All three — Moon, dasha, transits — support today",
        )
    elif signals == 2:
        band = Band.MIXED
        reason = DailyGuidanceText(
            ta="மூன்றில் இரண்டு — சந்திரன், தசை, கோச்சாரம் — இன்று ஆதரவாக உள்ளன",
            en="Two of the three — Moon, dasha, transits — support today",
        )
    else:
        band = Band.WEAK
        reason = DailyGuidanceText(
            ta="சந்திரன், தசை, கோச்சாரம் ஒன்றுக்கொன்று மாறுபடுகின்றன — குறிப்பு மட்டுமே",
            en="Moon, dasha and transits pull different ways — indicative only",
        )
    return DayComposite(
        moon=moon_c, transit=transit_c, dasha=dasha_c, panchangam=panch_c, personal=personal_c,
        remedial=remedial_support, score=score, label=label, band=band,
        confidence_reason=reason, confidence=band_to_legacy_confidence(band),
    )
