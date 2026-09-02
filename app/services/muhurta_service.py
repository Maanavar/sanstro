"""
Muhurta picker service — P1-E.

Returns top-5 auspicious time slots for a given activity within a date range.
Uses panchangam (tithi, nakshatra, yoga, kalam) + dasha support.

Methodology (Thirukanitham), in the order the layers apply:

- **Day score** (`muhurta_engine.score_day`): the whole almanac + doctrine +
  personal stack in one call — the generic almanac layer, the per-activity
  rules sourced from the classical text, and Tara Bala / Chandra Bala when a
  subject is supplied. Chandrashtama **vetoes** — the day is dropped, not
  merely docked points, because no almanac strength offsets it. Activities with
  a primary-text table: MARRIAGE (Kalaprakasika Ch. XIV), NAMING_CEREMONY /
  ANNAPRASANA (Ch. III), EAR_BORING (Ch. IV), and the Ch. XXI treasure set
  (TREASURE_STORE, GOLD, GEMS, GRAIN, LAND_POSSESSION, LAND_PURCHASE,
  CATTLE_PURCHASE). The rest get an explicit UNSOURCED verdict rather than a
  silent pass. This service used to
  carry its own copy of the generic layer; it does not any more, and must not
  grow one again (see the §9.4 gate in `tests/test_muhurta_engine.py`).
- **Dasha support**: whether the running lord is relevant to the activity.
- **Window**: a favoured hora ∩ a good Gowri day kala clear of Rahu Kalam /
  Yamagandam / Kuligai, so the clock time and the reason printed beside it
  always agree (see `_best_time_window`).
"""
from __future__ import annotations

import logging
from dataclasses import replace
from datetime import UTC, date, datetime, time, timedelta
from typing import NamedTuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.astro import nakshatra_to_rasi, resolve_rasi, resolve_timezone, utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.muhurta_engine import (
    SOURCED_ACTIVITIES as ENGINE_SOURCED_ACTIVITIES,
)
from app.calculations.muhurta_engine import (
    DayScore,
    Subject,
    Verdict,
    display_score,
    karaka_dignity_factors,
    lagna_sign_factor_at_window,
    limb_factors_at_window,
    score_day,
    wealth_house_heuristic_factor,
)
from app.calculations.panchangam import (
    best_gowri_slot,
    calculate_daily_panchangam_range,
    gowri_category_rank,
    gowri_good_label,
    with_daylight_lagna_schedule,
)
from app.calculations.tamil_calendar import TAMIL_MONTHS, format_tamil_date, tamil_solar_date
from app.calculations.tara_bala import tara_number
from app.constants.astrology import NAKSHATRA_NAMES, SIGN_LORD
from app.data.kuligai_polarity import favours as kuligai_favours
from app.data.kuligai_polarity import rejects as kuligai_rejects
from app.models import BirthProfile, Chart
from app.schemas.charts import ChartCalculateResponseData
from app.schemas.muhurta import (
    BiText,
    MuhurtaActivityLocation,
    MuhurtaFactor,
    MuhurtaResponse,
    MuhurtaResponseData,
    MuhurtaSlot,
    ResponseMeta,
    TraditionalMonthNotice,
)
from app.services.chart_service import load_persisted_chart_response
from app.services.location_service import resolve_effective_daily_location
from app.services.narrative_engine import PLANET_NAME

logger = logging.getLogger(__name__)

MAX_DATE_RANGE_DAYS = 60
TOP_N = 5

# A sliver of the day narrower than this is not actionable as a muhurta window.
_MIN_WINDOW = timedelta(minutes=15)
_SANDHYA_DURATION = timedelta(minutes=24)
_LATEST_WINDOW_START = time(21, 0)
_LATEST_WINDOW_END = time(21, 30)

# The picker’s visual score thresholds.  The cap is applied to raw score, but
# `display_score` is identity below 80, so these limits also cap the number and
# colour a reader sees.  Keep them with the client’s 75/55 picker thresholds.
_BEST_SCORE_MIN = 75.0
_GOOD_SCORE_MIN = 55.0
_TARA_DISPLAY_CAP: dict[int, float] = {
    3: _BEST_SCORE_MIN - 0.1,  # Vipat: at most Good
    5: _BEST_SCORE_MIN - 0.1,  # Pratyari: at most Good
    7: _GOOD_SCORE_MIN - 0.1,  # Naidhana: at most Usable
}


def _apply_in_band_heuristic_bonus(score: float, bonus: float) -> float:
    """Add an approved heuristic without letting it change the visible band.

    The wealth-house rule is deliberately a refinement, never a verdict. A
    score that is already on the edge of Usable/Good or Good/Best therefore
    keeps its existing band even when the condition is present.
    """
    adjusted = score + bonus
    for boundary in (_GOOD_SCORE_MIN, _BEST_SCORE_MIN):
        if score < boundary <= adjusted:
            adjusted = min(adjusted, boundary - 0.1)
    return max(score, adjusted)


def _score_band(score: float, *, recommended: bool) -> str:
    if not recommended:
        return "NOT_RECOMMENDED"
    if score >= _BEST_SCORE_MIN:
        return "BEST"
    if score >= _GOOD_SCORE_MIN:
        return "GOOD"
    return "USABLE"


class _Window(NamedTuple):
    """The day's recommended window and the hora credit earned by it."""

    start: datetime
    end: datetime
    hora_bonus: float
    hora_support: BiText | None


class _ScoredDay(NamedTuple):
    """One ranked candidate day. Named rather than a bare tuple because this
    grew to eight positional fields and the unpacking at the far end of the
    function had no way to catch a swapped pair."""

    score: float
    day: date
    time_start: str
    time_end: str
    panchangam_support: BiText
    hora_support: BiText | None
    cautions: list[BiText]
    factors: list[MuhurtaFactor]
    snapshot: object
    window_start: datetime
    window_end: datetime
    # False only for a one-date assessment requested with `include_excluded`.
    # Search results themselves never contain vetoed days.
    recommended: bool = True

# Activity → relevant dasha lords (first-choice benefics for that domain).
#
# ENGINE_POLICY unless noted. These were product choices from the original
# picker, not sastra, and the newly-sourced activities are deliberately NOT
# given invented entries: only CATTLE_PURCHASE has an authority for its lord
# (Kalaprakasika Ch. XXI p.113 footnote, `KP_CH21_CATTLE_LORD_001`: "Jupiter
# governs the sheep, the cow and all those animals that are useful to man").
#
# Absence here is not a bug. An activity with no lord entry earns no dasha bonus
# and names no favoured hora — it falls back to the best clear Gowri kala, which
# is the honest answer when no source assigns the activity a graha. Adding a
# plausible-looking lord to "complete the table" would put an unsourced
# judgement behind a citation-bearing result.
_ACTIVITY_LORDS: dict[str, set[str]] = {
    "JOB_START":   {"SUN", "MERCURY", "JUPITER"},
    "MARRIAGE":    {"VENUS", "JUPITER", "MOON"},
    "EXAM":        {"MERCURY", "JUPITER", "MOON"},
    "TRAVEL":      {"MERCURY", "MOON", "VENUS"},
    "INVESTMENT":  {"JUPITER", "VENUS", "MERCURY"},
    "MEDICAL":     {"SUN", "MOON"},
    "PURCHASE":    {"VENUS", "JUPITER", "MERCURY"},
    "SPIRITUAL":   {"JUPITER", "SUN", "MOON"},
    # Sourced: KP_CH21_CATTLE_LORD_001, Ch. XXI p.113.
    "CATTLE_PURCHASE": {"JUPITER"},
}

# Activities whose lord entry above rests on a citation rather than on product
# judgement. Pinned by `tests/test_kalaprakasika_treasure_doctrine.py` so a
# future "let's fill in the rest of the table" pass has to confront the gap.
_SOURCED_ACTIVITY_LORDS: frozenset[str] = frozenset({"CATTLE_PURCHASE"})

# Activity → house numbers to check for dasha support. Same policy as above:
# the sourced activities get no entry, because no chapter assigns them houses.
_ACTIVITY_HOUSES: dict[str, list[int]] = {
    "JOB_START":  [10, 2],
    "MARRIAGE":   [7, 2],
    "EXAM":       [4, 9],
    "TRAVEL":     [3, 12],
    "INVESTMENT": [2, 11],
    "MEDICAL":    [1, 6],
    "PURCHASE":   [2, 11],
    "SPIRITUAL":  [9, 5],
}

# Every activity the picker accepts.
#
# This used to be `_ACTIVITY_LORDS` itself, which made the lord map do double
# duty as the validity registry — so a new activity could only become reachable
# by inventing a dasha lord for it. Separating the two is what lets the Ch. XXI
# and Ch. III/IV activities be selectable *and* honest about having no sourced
# lord. Kept in one place so the API description, the pickers and the 422 all
# read from the same list.
MUHURTA_ACTIVITIES: frozenset[str] = frozenset(_ACTIVITY_LORDS) | ENGINE_SOURCED_ACTIVITIES

# Client keys that are not the backend activity name.
#
# `baby_naming` has been on the mobile picker since it shipped and has never
# reached a backend activity: uppercased it becomes `BABY_NAMING`, which was in
# neither the lord map nor anything else, so every tap 422'd. It now routes to
# the sourced Namakarana activity. Kept as an explicit alias rather than by
# renaming the mobile key, so an installed build that still sends the old string
# keeps working.
#
# `house`, `vehicle` and `business` are on the same mobile picker and have the
# same defect. They are deliberately NOT aliased here: routing them somewhere
# would be guessing which backend activity the astrologer meant, and Ch. XXI
# gives no house or vehicle rule. They still 422, visibly, which is the correct
# state for an option with no doctrine behind it.
_ACTIVITY_ALIASES: dict[str, str] = {
    "BABY_NAMING": "NAMING_CEREMONY",
}


def normalize_activity(activity: str) -> str:
    """Uppercase an incoming activity key and resolve any client-side alias."""
    key = str(activity or "").strip().upper()
    return _ACTIVITY_ALIASES.get(key, key)


_SIGN_LORDS = SIGN_LORD

_GURU_ALIAS = {"GURU": "JUPITER", "SANI": "SATURN"}


def _t(ta: str, en: str) -> BiText:
    return BiText(ta=ta, en=en)


# These are widely followed family customs, not rules that veto a muhurta.
# Keep the scope deliberately narrow: the tradition is especially established
# for weddings, while families differ substantially for other ceremonies.
_WEDDING_MONTH_CUSTOMS: dict[int, tuple[str, str]] = {
    3: (
        "பல தமிழ் குடும்பங்கள் ஆடி மாதத்தில் திருமணத்தைத் திட்டமிடுவதைத் தவிர்ப்பார்கள். "
        "இது பொதுவான குடும்ப வழக்கம் மட்டுமே; இந்த முஹூர்த்தத்தின் மதிப்பெண் அல்லது பரிந்துரையை மாற்றாது.",
        "Many Tamil families traditionally defer weddings during Aadi. This is a general family custom only; it does not change this muhurta's score or recommendation.",
    ),
    5: (
        "புரட்டாசி வழிபாட்டுக் காலமாகக் கருதப்படுவதால், சில தமிழ் குடும்பங்கள் இந்த மாதத்தில் திருமணத்தைத் திட்டமிட மாட்டார்கள். "
        "இது பொதுவான குடும்ப வழக்கம் மட்டுமே; இந்த முஹூர்த்தத்தின் மதிப்பெண் அல்லது பரிந்துரையை மாற்றாது.",
        "As Purattasi is widely observed as a devotional month, some Tamil families do not schedule weddings then. This is a general family custom only; it does not change this muhurta's score or recommendation.",
    ),
    8: (
        "மார்கழி பக்தி மற்றும் கோவில் வழிபாட்டிற்கான மாதமாகக் கருதப்படுவதால், சில தமிழ் குடும்பங்கள் இந்த மாதத்தில் திருமணத்தைத் திட்டமிட மாட்டார்கள். "
        "இது பொதுவான குடும்ப வழக்கம் மட்டுமே; இந்த முஹூர்த்தத்தின் மதிப்பெண் அல்லது பரிந்துரையை மாற்றாது.",
        "As Margazhi is widely observed for devotion and temple worship, some Tamil families do not schedule weddings then. This is a general family custom only; it does not change this muhurta's score or recommendation.",
    ),
    9: (
        "மணமகன் அல்லது மணமகள் தம் உடன்பிறப்புகளில் மூத்தவராக இருந்தால், சில தமிழ் குடும்பங்கள் தை மாதத்தில் தலைக் கல்யாணத்தைத் தவிர்ப்பார்கள். "
        "இது அந்தக் குடும்ப வழக்கத்தைப் பின்பற்றுபவர்களுக்கு மட்டும் பொருந்தும் பொதுவான குறிப்பு; இந்த முஹூர்த்தத்தின் மதிப்பெண் அல்லது பரிந்துரையை மாற்றாது.",
        "If the bride or groom is the eldest among their siblings, some Tamil families avoid a thalai kalyanam during Thai. This general note applies only to families that follow the custom; it does not change this muhurta's score or recommendation.",
    ),
}


def _traditional_month_notices(
    activity: str, on_date: date, timezone_name: str, latitude: float, longitude: float
) -> list[TraditionalMonthNotice]:
    """Return non-blocking Tamil family-custom notes for this activity date."""
    if activity != "MARRIAGE":
        return []
    try:
        month_index, _ = tamil_solar_date(on_date, timezone_name, latitude, longitude)
    except Exception as exc:  # Calendar enrichment must never hide a valid slot.
        logger.debug("Tamil month custom lookup failed for %s: %s", on_date, exc)
        return []
    custom = _WEDDING_MONTH_CUSTOMS.get(month_index)
    if custom is None:
        return []
    month_ta, month_en = TAMIL_MONTHS[month_index]
    message_ta, message_en = custom
    return [TraditionalMonthNotice(month=_t(month_ta, month_en), message=_t(message_ta, message_en))]


def _norm(lord: str) -> str:
    return _GURU_ALIAS.get(lord, lord)


def _format_clock_label(value) -> str:
    if hasattr(value, "strftime"):
        value = value.strftime("%H:%M")
    pieces = str(value).split(":")
    try:
        hour = int(pieces[0])
        minute = int(pieces[1]) if len(pieces) > 1 else 0
    except (TypeError, ValueError):
        return str(value)
    hour %= 24
    minute %= 60
    period = "am" if hour < 12 else "pm"
    hour12 = hour % 12 or 12
    return f"{hour12}:{minute:02d} {period}"


def _format_time_range(start, end) -> str:
    return f"{_format_clock_label(start)}-{_format_clock_label(end)}"


def _activity_hora_lords(activity: str, lagna_rasi: int) -> set[str]:
    """
    Personal hora lords for a given activity and chart.
    = activity generic lords ∪ lords of activity-relevant houses for this lagna.
    """
    generic = set(_ACTIVITY_LORDS.get(activity, set()))
    for house_offset in _ACTIVITY_HOUSES.get(activity, []):
        house_rasi = ((lagna_rasi - 1 + house_offset - 1) % 12) + 1
        generic.add(_norm(_SIGN_LORDS[house_rasi]))
    return generic


def _planet_ta(lord: str) -> str:
    return PLANET_NAME[lord].ta if lord in PLANET_NAME else lord.capitalize()


def _hora_support_text(lord: str, is_lagna_lord: bool, hora, kala_name: str | None) -> BiText:
    """Reason copy for a window that lies inside `hora`.

    The hora's own clock range is printed, and the returned window is a
    sub-range of it — so the reason and the time beside it always agree.
    """
    time_str = _format_time_range(hora.start, hora.end)
    kala_en = gowri_good_label(kala_name, "en")
    kala_ta = gowri_good_label(kala_name, "ta")
    within_en = f" within {kala_en}" if kala_en else ""
    within_ta = f" [{kala_ta}]" if kala_ta else ""
    if is_lagna_lord:
        return _t(
            f"லக்கினாதிபதி {_planet_ta(lord)} ஹோரை ({time_str}){within_ta} — சிறந்த தனிப்பட்ட நேரம்",
            f"Lagna lord {lord.capitalize()} hora ({time_str}){within_en} — strongest personal window",
        )
    return _t(
        f"{_planet_ta(lord)} ஹோரை ({time_str}){within_ta} இந்த செயலை ஆதரிக்கிறது",
        f"{lord.capitalize()} hora ({time_str}){within_en} supports this activity",
    )


def _panchangam_support(day: DayScore) -> BiText:
    """The one-line "why this day" summary, built from the factors that actually
    earned the day points.

    Only BONUS factors are read. The generic-almanac copy this replaces appended
    the day's yoga name to the same string unconditionally, so a day carrying
    Vyatipata read back to the user as *supported by* Vyatipata. The yoga is
    still reported — as its own NEUTRAL factor in `factors[]`, where it says it
    is ungraded rather than posing as support.
    """
    bonuses = [f for f in day.factors if f.verdict is Verdict.BONUS]
    if not bonuses:
        return _t("சாதாரண நாள்", "Ordinary day")
    return _t(
        ", ".join(f.reason_ta for f in bonuses),
        " ".join(f.reason_en for f in bonuses),
    )


def _nakshatra_to_rasi(nak_number: int, pada: int = 1) -> int:
    return nakshatra_to_rasi(nak_number, pada)


def _clear_good_day_kalas(snapshot, activity: str) -> list:
    """Good Gowri day kalas that no inauspicious kalam touches.

    The Gowri kalas and Rahu Kalam / Yamagandam / Kuligai are cut from the same
    sunrise->sunset eighths, so a good kala can land exactly on a bad kalam —
    Thursday's DHANAM *is* Yamagandam. No reliable panchangam announces such a
    slot, and neither do we.

    **Kuligai is activity-dependent and is therefore cut conditionally.**
    EC-RULING-07: Kuligai repeats whatever is begun in it, so it disqualifies a
    window only for activities nobody wants repeated. Excluding it here for
    every activity was the other half of the blanket exclusion — the polarity
    table alone could not fix it, because a slot cut at this step never reaches
    the code that consults the table. For GOLD the Kuligai window is not merely
    admissible, it is the one a jothidar would pick.
    """
    bad = [b for b in (snapshot.rahu_kalam, snapshot.yamagandam) if b is not None]
    if snapshot.kuligai is not None and kuligai_rejects(activity):
        bad.append(snapshot.kuligai)
    return [
        slot
        for slot in snapshot.gowri_panchangam
        if slot.period == "DAY"
        and slot.is_good
        and not any(_overlaps(slot.start, slot.end, b.start, b.end) for b in bad)
    ]


def _daylight_fragments(snapshot, start: datetime, end: datetime) -> list[tuple[datetime, datetime]]:
    """Return actionable daylight pieces after universal timing exclusions.

    Sandhya excludes one ghati on either side of sunrise and sunset.  Each
    Durmuhurtham interval is then subtracted, rather than discarding a whole
    Gowri kala that only partly overlaps it.  The table is empty until verified,
    but the exclusion path is deliberately live and regression-tested now.
    """
    latest_start = datetime.combine(snapshot.date_local, _LATEST_WINDOW_START, tzinfo=start.tzinfo)
    latest_end = datetime.combine(snapshot.date_local, _LATEST_WINDOW_END, tzinfo=start.tzinfo)
    clipped_start = max(start, snapshot.sunrise + _SANDHYA_DURATION)
    clipped_end = min(end, snapshot.sunset - _SANDHYA_DURATION, latest_end)
    if clipped_start > latest_start:
        return []
    if clipped_end - clipped_start < _MIN_WINDOW:
        return []

    fragments = [(clipped_start, clipped_end)]
    for exclusion in getattr(snapshot, "durmuhurtham", ()):
        next_fragments: list[tuple[datetime, datetime]] = []
        for fragment_start, fragment_end in fragments:
            if not _overlaps(fragment_start, fragment_end, exclusion.start, exclusion.end):
                next_fragments.append((fragment_start, fragment_end))
                continue
            if exclusion.start - fragment_start >= _MIN_WINDOW:
                next_fragments.append((fragment_start, min(fragment_end, exclusion.start)))
            if fragment_end - exclusion.end >= _MIN_WINDOW:
                next_fragments.append((max(fragment_start, exclusion.end), fragment_end))
        fragments = next_fragments
    return fragments


def _best_fragment(snapshot, start: datetime, end: datetime) -> tuple[datetime, datetime] | None:
    fragments = _daylight_fragments(snapshot, start, end)
    return min(fragments, default=None, key=lambda fragment: fragment[0])


def _apply_tara_display_cap(raw_score: float, snapshot, subject: Subject | None) -> float:
    """Apply the owner-approved maximum displayed band for adverse Tara Bala."""
    if subject is None:
        return raw_score
    tara = tara_number(subject.janma_nakshatra, snapshot.nakshatra_number)
    cap = _TARA_DISPLAY_CAP.get(tara)
    return min(raw_score, cap) if cap is not None else raw_score


def _karaka_factors_at(activity: str, window_start: datetime, window_end: datetime, day: date) -> list:
    """The wealth karakas' dignity at the recommended window's midpoint.

    The midpoint rather than sunrise, so the condition is read at the moment the
    act is actually recommended — the same convention the wealth-house heuristic
    uses. Combustion moves far too slowly for the choice to change a verdict, but
    two factors on one card disagreeing about which instant they describe is the
    contradiction class this service already fixed once (D1).
    """
    try:
        midpoint = window_start + (window_end - window_start) / 2
        planets = calculate_sidereal_planets(utc_datetime_to_julian_day(midpoint.astimezone(UTC))).bodies
        return karaka_dignity_factors(activity, planets)
    except Exception as exc:
        # An ephemeris hiccup must not drop the whole day from the picker, but it
        # must not silently read as "the karakas are fine" either — the caller
        # sees no factor, and the log names the date.
        logger.debug("Karaka dignity lookup failed for %s: %s", day, exc)
        return []


def _best_time_window(snapshot, activity: str, lagna_rasi: int | None) -> _Window:
    """Pick the day's recommended window, and the hora bonus that goes with it.

    The window is the **intersection** of a favoured hora with a good Gowri day
    kala clear of Rahu Kalam / Yamagandam / Kuligai, so the returned clock range
    always lies inside the hora its own `horaSupport` names.

    This closes two defects:

    * **D1** — the hora used to be scored and described in one place while the
      returned time came from `nalla_neram` in another. The two never had to
      agree, and mostly did not: for PURCHASE in Chennai the two failed to
      overlap on all seven days from 2026-08-17 — Mon 17 Aug returned
      06:00-07:33 beside a reason naming the 08:04-09:06 Guru hora. A hora is
      now named only when the window returned actually sits inside it.
    * **D2** — the scan used to `return` on the first favoured hora of the day,
      so a lagna-lord hora at index 9 lost to a generic one at index 2. Every
      hora/kala pair is now ranked and the best one wins.

    Consequently the hora bonus is earned only by a *usable* window: a favoured
    hora spent entirely inside Rahu Kalam no longer lifts the day's score.

    The window stays inside daylight. Night horas are scanned but cannot
    intersect a DAY kala, so they never win — extending the picker to evening
    windows is a product decision that needs the astrologer, and ranking a night
    window has walked us into the small hours once already (see
    `_compute_gowri_nalla_neram`).
    """
    candidates = _clear_good_day_kalas(snapshot, activity)
    # General mode has no chart, so it must not select or describe a lagna- or
    # dasha-derived hora. It still returns the strongest clear daytime Gowri
    # kala, which is the location-aware almanac answer it can honestly make.
    if lagna_rasi is None:
        candidate_fragments = [
            (kala, start, end)
            for kala in candidates
            for start, end in _daylight_fragments(snapshot, kala.start, kala.end)
        ]
        if candidate_fragments:
            kala, start, end = min(
                candidate_fragments,
                key=lambda item: (gowri_category_rank(item[0].name), item[1]),
            )
            return _Window(start, end, 0.0, None)
        fallback = best_gowri_slot(snapshot.nalla_neram)
        if fallback is not None:
            fragment = _best_fragment(snapshot, fallback.start, fallback.end)
            if fragment is not None:
                return _Window(*fragment, 0.0, None)
        fragment = _best_fragment(snapshot, snapshot.abhijit_start, snapshot.abhijit_end)
        if fragment is not None:
            return _Window(*fragment, 0.0, None)
        return _Window(snapshot.sunrise + _SANDHYA_DURATION, snapshot.sunrise + _SANDHYA_DURATION, 0.0, None)

    target_lords = _activity_hora_lords(activity, lagna_rasi)
    lagna_lord = _norm(_SIGN_LORDS[lagna_rasi])

    best_key: tuple | None = None
    best: _Window | None = None
    for entry in snapshot.hora:
        lord = _norm(entry.lord)
        if lord not in target_lords:
            continue
        is_lagna_lord = lord == lagna_lord
        bonus = 13.0 if is_lagna_lord else 8.0
        for kala in candidates:
            for start, end in _daylight_fragments(
                snapshot,
                max(entry.start, kala.start),
                min(entry.end, kala.end),
            ):
                # Lagna-lord hora first, then the Gowri kala's own rank
                # (Amirtham > Uthi > Labham > Dhanam > Sugam), then earliest.
                key = (-bonus, gowri_category_rank(kala.name), start)
                if best_key is None or key < best_key:
                    best_key = key
                    best = _Window(start, end, bonus, _hora_support_text(lord, is_lagna_lord, entry, kala.name))

    if best is not None:
        return best

    # No favoured hora meets a clear good kala today: fall back to the best-ranked
    # clear good kala and name no hora, rather than crediting one we cannot use.
    candidate_fragments = [
        (kala, start, end)
        for kala in candidates
        for start, end in _daylight_fragments(snapshot, kala.start, kala.end)
    ]
    if candidate_fragments:
        kala, start, end = min(
            candidate_fragments,
            key=lambda item: (gowri_category_rank(item[0].name), item[1]),
        )
        return _Window(start, end, 0.0, None)

    fallback = best_gowri_slot(snapshot.nalla_neram)
    if fallback is not None:
        fragment = _best_fragment(snapshot, fallback.start, fallback.end)
        if fragment is not None:
            return _Window(*fragment, 0.0, None)

    fragment = _best_fragment(snapshot, snapshot.abhijit_start, snapshot.abhijit_end)
    if fragment is not None:
        return _Window(*fragment, 0.0, None)
    return _Window(snapshot.sunrise + _SANDHYA_DURATION, snapshot.sunrise + _SANDHYA_DURATION, 0.0, None)


def _overlaps(start_a: datetime, end_a: datetime, start_b: datetime, end_b: datetime) -> bool:
    return max(start_a, start_b) < min(end_a, end_b)


def _dasha_support(maha_lord: str, antar_lord: str, activity: str) -> BiText:
    """Generate dasha support text for the activity."""
    favorable = _ACTIVITY_LORDS.get(activity, set())
    lords_active_en = []
    lords_active_ta = []
    if maha_lord in favorable:
        lords_active_en.append(maha_lord.capitalize())
        lords_active_ta.append(PLANET_NAME[maha_lord].ta if maha_lord in PLANET_NAME else maha_lord)
    if antar_lord in favorable:
        lords_active_en.append(antar_lord.capitalize())
        lords_active_ta.append(PLANET_NAME[antar_lord].ta if antar_lord in PLANET_NAME else antar_lord)

    if lords_active_en:
        en = f"{' and '.join(lords_active_en)} dasha supports this activity"
        ta = f"{' மற்றும் '.join(lords_active_ta)} தசை இந்த செயலை ஆதரிக்கிறது"
        return _t(ta, en)
    return _t(
        "தசை நடுநிலையானது — கிரக சஞ்சாரம் முக்கிய காரணி",
        "Dasha is neutral — transit timing is the primary factor",
    )


def find_best_muhurta_slots(
    chart_id: UUID | None,
    activity: str,
    date_from: date,
    date_to: date,
    session: Session,
    *,
    activity_latitude: float | None = None,
    activity_longitude: float | None = None,
    activity_timezone: str | None = None,
    include_excluded: bool = False,
    paksha: str | None = None,
    chart_data: ChartCalculateResponseData | None = None,
    activity_place: str | None = None,
) -> MuhurtaResponse:
    activity = normalize_activity(activity)
    if activity not in MUHURTA_ACTIVITIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Unknown activity '{activity}'. Valid values: {sorted(MUHURTA_ACTIVITIES)}",
        )

    delta_days = (date_to - date_from).days
    if delta_days < 0:
        raise HTTPException(status_code=422, detail="date_to must be >= date_from")
    if delta_days > MAX_DATE_RANGE_DAYS:
        raise HTTPException(status_code=422, detail=f"Date range cannot exceed {MAX_DATE_RANGE_DAYS} days")
    if include_excluded and delta_days != 0:
        raise HTTPException(status_code=422, detail="includeExcluded requires a single selected date")
    normalized_paksha = str(paksha or "").upper() or None
    if normalized_paksha not in {None, "SHUKLA", "KRISHNA"}:
        raise HTTPException(status_code=422, detail="paksha must be SHUKLA or KRISHNA")

    location_values = (activity_latitude, activity_longitude, activity_timezone)
    has_activity_location = any(value is not None for value in location_values)
    if has_activity_location and not all(value is not None for value in location_values):
        raise HTTPException(status_code=422, detail="lat, lon, and tz must be supplied together")

    subject: Subject | None = None
    lagna_rasi: int | None = None
    maha_lord = "UNKNOWN"
    antar_lord = "UNKNOWN"

    has_personal_chart = chart_id is not None or chart_data is not None

    if chart_data is not None:
        if activity_latitude is None or activity_longitude is None or activity_timezone is None:
            raise HTTPException(status_code=422, detail="lat, lon, and tz are required for an in-memory chart")
        lat = float(activity_latitude)
        lon = float(activity_longitude)
        tz_name = str(activity_timezone)
        location_source = "activity"
        location_place = activity_place or "Selected activity location"
        try:
            resolve_timezone(tz_name)
            lagna_rasi = chart_data.lagna.rasi
            natal_moon = next(p for p in chart_data.planets if p.graha == "MOON")
        except (AttributeError, StopIteration, ValueError) as exc:
            raise HTTPException(status_code=422, detail="Could not derive the personal chart for muhurta") from exc
        birth_jd = chart_data.julian_day
        moon_lon = natal_moon.absolute_longitude
        subject = Subject(
            janma_nakshatra=natal_moon.nakshatra,
            janma_rasi=natal_moon.rasi,
            lagna_rasi=lagna_rasi,
        )
        try:
            tz_obj = resolve_timezone(tz_name)
            today_local = datetime.now(tz_obj).date()
            today_midnight = datetime.combine(today_local, datetime.min.time(), tzinfo=tz_obj)
            jd_today = utc_datetime_to_julian_day(today_midnight.astimezone(UTC))
            timeline = calculate_vimshottari_timeline(birth_jd, moon_lon, jd_today)
            maha_lord = timeline.current_mahadasha.lord
            antar_lord = timeline.current_antardasha.lord
        except Exception as exc:
            logger.debug("Muhurta dasha lookup failed for in-memory chart: %s", exc)
    elif chart_id is None:
        if activity_latitude is None or activity_longitude is None or activity_timezone is None:
            raise HTTPException(status_code=422, detail="lat, lon, and tz are required without chartId")
        lat = float(activity_latitude)
        lon = float(activity_longitude)
        tz_name = str(activity_timezone)
        location_source = "activity"
        location_place = activity_place or "Selected activity location"
    else:
        # Load chart via persisted snapshot (same pattern as life_event_service).
        chart_snapshot = load_persisted_chart_response(session, chart_id)
        chart_row = session.get(Chart, chart_id)
        if chart_row is None:
            raise HTTPException(status_code=404, detail="Chart not found")
        bp = session.get(BirthProfile, chart_row.birth_profile_id)
        if bp is None:
            raise HTTPException(status_code=404, detail="Birth profile not found")

        daily_location = resolve_effective_daily_location(bp)
        if activity_latitude is not None and activity_longitude is not None and activity_timezone is not None:
            lat = float(activity_latitude)
            lon = float(activity_longitude)
            tz_name = str(activity_timezone)
            location_source = "activity"
            location_place = activity_place or "Selected activity location"
        else:
            lat = daily_location.latitude
            lon = daily_location.longitude
            tz_name = daily_location.timezone
            location_source = daily_location.source
            location_place = (bp.current_place or bp.birth_place) if location_source == "current" else bp.birth_place
        try:
            resolve_timezone(tz_name)
            moon_rasi = resolve_rasi(str(chart_row.moon_rasi))
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=f"Invalid location or Moon rasi in chart data: {exc}") from exc
        lagna_rasi = chart_snapshot.data.lagna.rasi
        natal_moon = next(p for p in chart_snapshot.data.planets if p.graha == "MOON")
        birth_jd = chart_snapshot.data.julian_day
        moon_lon = natal_moon.absolute_longitude
        janma_name = str(chart_row.janma_nakshatra or "").strip().upper()
        if janma_name in NAKSHATRA_NAMES:
            subject = Subject(
                janma_nakshatra=NAKSHATRA_NAMES.index(janma_name) + 1,
                janma_rasi=moon_rasi,
                lagna_rasi=lagna_rasi,
            )
        else:
            logger.warning(
                "Chart %s has an unrecognised janma nakshatra %r — muhurta falls back to almanac-only scoring",
                chart_id, chart_row.janma_nakshatra,
            )
        try:
            tz_obj = resolve_timezone(tz_name)
            today_local = datetime.now(tz_obj).date()
            today_midnight = datetime.combine(today_local, datetime.min.time(), tzinfo=tz_obj)
            jd_today = utc_datetime_to_julian_day(today_midnight.astimezone(UTC))
            timeline = calculate_vimshottari_timeline(birth_jd, moon_lon, jd_today)
            maha_lord = timeline.current_mahadasha.lord
            antar_lord = timeline.current_antardasha.lord
        except Exception as exc:
            logger.debug("Muhurta dasha lookup failed for chart %s: %s", chart_id, exc)

    if not has_personal_chart:
        try:
            resolve_timezone(tz_name)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=f"Invalid timezone: {tz_name}") from exc
    dasha_support = _dasha_support(maha_lord, antar_lord, activity) if has_personal_chart else None

    # Scan each day in range — batch-load/compute panchangam snapshots in one pass
    # to avoid a per-day cache SELECT+DELETE (see calculate_daily_panchangam_range).
    snapshots_by_date = calculate_daily_panchangam_range(date_from, date_to, lat, lon, tz_name, session=session)

    scored_days: list[_ScoredDay] = []
    current = date_from
    while current <= date_to:
        try:
            snap = snapshots_by_date[current]
            if normalized_paksha is not None and snap.tithi_paksha != normalized_paksha:
                current += timedelta(days=1)
                continue
            # One scorer, all layers: the generic almanac, the per-activity
            # rules sourced from the classical text (Kalaprakasika Ch. XIV for
            # MARRIAGE today), and the personal Tara Bala / Chandra Bala factors
            # when a subject exists. A vetoed day is dropped outright —
            # Chandrashtama is not compensable by an excellent almanac, so it
            # must not merely lose points and stay rankable.
            # The selected-window lagna is calculated only for the top five
            # candidates below.  A sunrise lagna would be cheaper but falsely
            # claims the sign at the recommended clock time.
            day = score_day(snap, activity, subject, include_lagna_sign=False)
            # A vetoed day is never a candidate. `continue` would be wrong here —
            # the loop counter advances at the bottom of the while body, outside
            # this try, so skipping the rest must not skip the increment.
            if not day.vetoed or include_excluded:
                day_score = day.score
                pan_support = _panchangam_support(day)
                cautions = [
                    _t(f.reason_ta, f.reason_en)
                    for f in day.factors
                    if f.verdict is Verdict.PENALTY
                ]

                # Dasha bonus
                if maha_lord in _ACTIVITY_LORDS.get(activity, set()) or antar_lord in _ACTIVITY_LORDS.get(activity, set()):
                    day_score += 10
                # Window + hora bonus — the two are chosen together so the returned
                # time always falls inside the hora its own reason names (D1).
                window = _best_time_window(snap, activity, lagna_rasi)
                day_score += window.hora_bonus
                slot_start, slot_end = window.start, window.end
                t_start, t_end = slot_start.strftime("%H:%M"), slot_end.strftime("%H:%M")
                slot_cautions = list(cautions)
                slot_factors = [MuhurtaFactor.from_engine(f) for f in day.factors]

                # A5 — the wealth karakas' condition on this day. Evaluated for
                # every candidate, not just the shortlist, because combustion
                # runs for weeks: a range that straddles the end of சுக்ர
                # மௌட்யம் must be able to rank the clear days above the hidden
                # ones, which a top-N-only check could never do. Measured at
                # 0.5 ms per call, so 60 days costs ~32 ms of a 1.5 s budget.
                for karaka_factor in _karaka_factors_at(activity, slot_start, slot_end, current):
                    day_score += karaka_factor.contribution
                    slot_factors.append(MuhurtaFactor.from_engine(karaka_factor))
                    slot_cautions.append(_t(karaka_factor.reason_ta, karaka_factor.reason_en))
                # Capped once, after every additive layer. The karaka penalties
                # are negative-only, so moving the cap below them cannot raise a
                # capped day — it just stops the cap being applied twice.
                day_score = _apply_tara_display_cap(day_score, snap, subject)
                for band, band_ta, band_en in (
                    (snap.rahu_kalam, "ராகு காலம்", "Rahu Kalam"),
                    (snap.yamagandam, "யமகண்டம்", "Yamagandam"),
                    (snap.kuligai, "குளிகை", "Kuligai"),
                ):
                    if band is None or not _overlaps(slot_start, slot_end, band.start, band.end):
                        continue
                    # EC-RULING-07: Kuligai is not adverse in itself — it repeats
                    # whatever is begun in it, so its sign follows the activity.
                    # An overlap is always *named* (a reader checking against a
                    # printed almanac needs to see it), but only an activity
                    # nobody wants repeated gets the penalty sentence.
                    if band is snap.kuligai and not kuligai_rejects(activity):
                        if kuligai_favours(activity):
                            reason = _t(
                                "குளிகை இந்த நேரத்துடன் ஒட்டுகிறது — குளிகையில் "
                                "தொடங்கியது மீண்டும் மீண்டும் நிகழும், எனவே இச்செயலுக்கு "
                                "இது உகந்த நேரம்",
                                "Kuligai overlaps this slot, which favours this activity: "
                                "what is begun in Kuligai recurs, and for this activity "
                                "recurrence is the point.",
                            )
                            # Named as a bonus, not priced. The window scorer does
                            # not yet carry a Kuligai term, and inventing a weight
                            # here would put a number in the response that no
                            # scorer agrees with.
                            slot_factors.append(MuhurtaFactor(
                                factor="WINDOW_KULIGAI_FAVOURABLE",
                                verdict="BONUS",
                                contribution=0.0,
                                reason=reason,
                            ))
                            continue
                        reason = _t(
                            "குளிகை இந்த நேரத்துடன் ஒட்டுகிறது — குளிகையில் தொடங்கியது "
                            "மீண்டும் நிகழும்; இச்செயலுக்கான தரவரிசை இன்னும் "
                            "உறுதி செய்யப்படவில்லை",
                            "Kuligai overlaps this slot. What is begun in Kuligai recurs, "
                            "and no ruling for this activity has been recorded yet.",
                        )
                        slot_cautions.append(reason)
                        slot_factors.append(MuhurtaFactor(
                            factor="WINDOW_KULIGAI_OVERLAP",
                            verdict="NEUTRAL",
                            contribution=0.0,
                            reason=reason,
                        ))
                        continue
                    reason = _t(
                        f"{band_ta} இந்த நேரத்துடன் ஒட்டுகிறது",
                        f"{band_en} overlaps this slot",
                    )
                    slot_cautions.append(reason)
                    # Reported as a factor too, so `factors` stays a superset of
                    # `cautions` and a UI need only render one list.
                    #
                    # Contribution is 0.0 on purpose, and that is a gap, not a
                    # judgement that it does not matter: `_best_time_window`
                    # already refuses any kala a band touches, so this can only
                    # fire on the Abhijit/Nalla-Neram fallback path — and what an
                    # overlap should cost there (§6.3 argues for a veto) is an
                    # unanswered doctrine question. It is named rather than
                    # priced until that is settled.
                    slot_factors.append(MuhurtaFactor(
                        factor="WINDOW_KALAM_OVERLAP",
                        verdict="PENALTY",
                        contribution=0.0,
                        reason=reason,
                    ))
                scored_days.append(_ScoredDay(
                    score=day_score,
                    day=current,
                    time_start=t_start,
                    time_end=t_end,
                    panchangam_support=pan_support,
                    hora_support=window.hora_support,
                    cautions=slot_cautions,
                    factors=slot_factors,
                    snapshot=snap,
                    window_start=slot_start,
                    window_end=slot_end,
                    recommended=not day.vetoed,
                ))
        except Exception as exc:
            logger.debug("Muhurta score failed for %s: %s", current, exc)
        current += timedelta(days=1)

    # Sort by score descending, take top N
    scored_days.sort(key=lambda x: x.score, reverse=True)
    top = scored_days[:TOP_N]

    enriched_top: list[_ScoredDay] = []
    for candidate in top:
        snapshot_with_schedule = with_daylight_lagna_schedule(candidate.snapshot, session=session)
        midpoint = candidate.window_start + (candidate.window_end - candidate.window_start) / 2
        lagna_window = next(
            (
                interval
                for interval in snapshot_with_schedule.lagna_schedule
                if interval.start <= midpoint < interval.end
            ),
            None,
        )
        if lagna_window is None:
            enriched_top.append(candidate._replace(snapshot=snapshot_with_schedule))
            continue

        score = candidate.score
        factors = list(candidate.factors)
        cautions = list(candidate.cautions)

        # The limbs actually in force during the chosen window. The picker has
        # always read the lagna and the planets at this midpoint while every
        # limb factor stayed pinned to sunrise, so a window could be certified
        # by a star or karana that had already ended hours earlier. A veto here
        # drops the candidate outright rather than merely docking it: the source
        # forbids the karana *at the elected moment*, and this is that moment.
        vetoed_at_window = False
        for limb_factor in limb_factors_at_window(candidate.snapshot, midpoint, activity):
            factors.append(MuhurtaFactor.from_engine(limb_factor))
            if limb_factor.verdict is Verdict.VETO:
                vetoed_at_window = True
                cautions.append(_t(limb_factor.reason_ta, limb_factor.reason_en))
            elif limb_factor.verdict is Verdict.PENALTY:
                score = _apply_tara_display_cap(score + limb_factor.contribution, snapshot_with_schedule, subject)
                cautions.append(_t(limb_factor.reason_ta, limb_factor.reason_en))
        if vetoed_at_window:
            enriched_top.append(candidate._replace(
                score=0, cautions=cautions, factors=factors, snapshot=snapshot_with_schedule,
            ))
            continue

        lagna_factor = lagna_sign_factor_at_window(activity, lagna_window.rasi_number)
        if lagna_factor is not None:
            score = _apply_tara_display_cap(score + lagna_factor.contribution, snapshot_with_schedule, subject)
            factors.append(MuhurtaFactor.from_engine(lagna_factor))
            if lagna_factor.verdict is Verdict.PENALTY:
                cautions.append(_t(lagna_factor.reason_ta, lagna_factor.reason_en))

        # This is intentionally calculated only for the already-shortlisted
        # dates, alongside the selected-window lagna. It is an owner-approved
        # product heuristic, not a claimed Kalaprakasika rule.
        try:
            midpoint_jd = utc_datetime_to_julian_day(midpoint.astimezone(UTC))
            planets = calculate_sidereal_planets(midpoint_jd).bodies
            wealth_factor = wealth_house_heuristic_factor(activity, lagna_window.rasi_number, planets)
        except Exception as exc:
            logger.debug("Wealth-house heuristic lookup failed for %s: %s", candidate.day, exc)
            wealth_factor = None
        if wealth_factor is not None:
            pre_heuristic_score = score
            score = _apply_in_band_heuristic_bonus(score, wealth_factor.contribution)
            score = _apply_tara_display_cap(score, snapshot_with_schedule, subject)
            # Report the real applied contribution, which can be zero when a
            # band boundary or Tara cap correctly prevents a score change.
            wealth_factor = replace(wealth_factor, contribution=score - pre_heuristic_score)
            factors.append(MuhurtaFactor.from_engine(wealth_factor))
        enriched_top.append(candidate._replace(score=score, cautions=cautions, factors=factors, snapshot=snapshot_with_schedule))
    top = sorted(enriched_top, key=lambda candidate: candidate.score, reverse=True)

    def _tamil_date(d: date) -> BiText | None:
        try:
            ta, en = format_tamil_date(d, tz_name, lat, lon)
            return _t(ta, en)
        except Exception as exc:  # ephemeris hiccup must not break the muhurta list
            logger.debug("Tamil date conversion failed for %s: %s", d, exc)
            return None

    slots = [
        MuhurtaSlot(
            date=c.day,
            tamilDate=_tamil_date(c.day),
            timeStart=c.time_start,
            timeEnd=c.time_end,
            # The engine deliberately does not clamp — callers add their own
            # layers on top of it — so the display mapping is applied here.
            # It must be `display_score`, not a bare clamp: nearly a third of
            # real day-scores exceed 100 raw, and clamping them flattened the
            # top of every activity's list into an identical "100".
            score=round(display_score(c.score), 1),
            recommended=c.recommended,
            band=_score_band(display_score(c.score), recommended=c.recommended),
            panchangamSupport=c.panchangam_support,
            dashaSupport=dasha_support,
            horaSupport=c.hora_support,
            cautions=c.cautions,
            traditionalMonthNotices=_traditional_month_notices(activity, c.day, tz_name, lat, lon),
            factors=c.factors,
        )
        for c in top
    ]

    return MuhurtaResponse(
        success=True,
        data=MuhurtaResponseData(
            chartId=chart_id,
            activity=activity,
            dateFrom=date_from,
            dateTo=date_to,
            timezone=tz_name,
            activityLocation=MuhurtaActivityLocation(
                place=location_place,
                latitude=lat,
                longitude=lon,
                timezone=tz_name,
                source=location_source,
            ),
            slots=slots,
        ),
        meta=ResponseMeta(
            calculationVersion="1.0",
            generatedAt=datetime.now(UTC).isoformat(),
        ),
    )
