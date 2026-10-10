"""Lagna sign-edge notes: when birth-time error would change the Lagna or D9 Lagna.

Every house in a whole-sign chart is counted from the Lagna, so a Lagna that
flips sign inside the birth-time uncertainty moves every house reading at once.

Astrologer ruling 2026-09-23 (sign-edge Q4):

* **Recompute, never threshold on degrees.** The Lagna is recomputed at the
  birth time ± the window, and the crossing is found by bisection on the real
  ephemeris. Rising speed varies by sign and latitude, so "within 1°" misstates
  the risk.
* **Two tiers.** ±5 min is a firm warning (the Lagna depends on the precise
  time); ±15 min is a softer note, because Indian birth times are commonly
  rounded to 5 or 15 minutes. A recorded confidence window wider than 15 min
  widens the soft tier.
* **Navamsa Lagna too.** The D9 Lagna changes every 3°20' (about 13 minutes),
  and the D9 Lagna feeds yoga detection and the holistic strength synthesis.
  It is checked at the firm tier only: a ±15 min window is wider than a whole
  navamsa, so a soft D9 tier would fire on every chart and say nothing.

Returns ``(ta, en)`` prose or None, the same shape as ``planet_conditions``
meanings; the narration layers wrap it in their own BiText type.
"""
from __future__ import annotations

from collections.abc import Callable

from app.calculations.astro import navamsa_rasi_from_degree
from app.calculations.display_names import rasi_en, rasi_ta
from app.calculations.ephemeris import calculate_lagna_degree

FIRM_WINDOW_MINUTES = 5.0
SOFT_WINDOW_MINUTES = 15.0

_MINUTE = 1.0 / 1440.0
_BISECT_STEPS = 12  # 15 min / 2**12 ≈ 0.2 s — far below any rounding we print


def _crossing_minutes(
    jd: float,
    window_minutes: float,
    direction: int,
    segment: Callable[[float], int],
) -> float | None:
    """Minutes from `jd` (in `direction`) to the first change of `segment`, if
    it happens within `window_minutes`. Found by recompute + bisection."""
    start = segment(jd)
    if segment(jd + direction * window_minutes * _MINUTE) == start:
        return None
    lo, hi = 0.0, window_minutes
    for _ in range(_BISECT_STEPS):
        mid = (lo + hi) / 2.0
        if segment(jd + direction * mid * _MINUTE) == start:
            lo = mid
        else:
            hi = mid
    return hi


def _nearest_crossing(
    jd: float, window_minutes: float, segment: Callable[[float], int]
) -> tuple[float, int] | None:
    """(minutes, direction) of the nearest segment change within the window."""
    found = [
        (minutes, direction)
        for direction in (-1, 1)
        if (minutes := _crossing_minutes(jd, window_minutes, direction, segment)) is not None
    ]
    return min(found) if found else None


def _minutes_text(minutes: float, direction: int) -> tuple[str, str]:
    whole = max(1, round(minutes))
    plural = "s" if whole != 1 else ""
    if direction < 0:
        return f"சுமார் {whole} நிமிடம் முன்னதாக", f"about {whole} minute{plural} earlier"
    return f"சுமார் {whole} நிமிடம் தாமதமாக", f"about {whole} minute{plural} later"


def _rasi_of(longitude: float) -> int:
    return int((longitude % 360.0) // 30) + 1


def lagna_edge_note(
    lagna_longitude: float,
    julian_day: float,
    latitude: float,
    longitude: float,
    confidence_minutes: float = 0.0,
) -> tuple[str, str] | None:
    """(ta, en) note when the Lagna changes sign within the firm or soft window."""
    soft_window = max(SOFT_WINDOW_MINUTES, float(confidence_minutes or 0))
    rasi = _rasi_of(lagna_longitude)

    def lagna_rasi(jd: float) -> int:
        return _rasi_of(calculate_lagna_degree(jd, latitude, longitude))

    crossing = _nearest_crossing(julian_day, soft_window, lagna_rasi)
    if crossing is None:
        return None
    minutes, direction = crossing
    other = (12 if rasi == 1 else rasi - 1) if direction < 0 else (1 if rasi == 12 else rasi + 1)
    here_ta, here_en = rasi_ta(rasi), rasi_en(rasi)
    other_ta, other_en = rasi_ta(other), rasi_en(other)
    deg = lagna_longitude % 30.0
    shift_ta, shift_en = _minutes_text(minutes, direction)

    if minutes <= FIRM_WINDOW_MINUTES:
        return (
            f"லக்னம் {here_ta} ராசியின் விளிம்பில் ({deg:.2f}°) உள்ளது. பிறந்த நேரம் {shift_ta} "
            f"இருந்திருந்தால் லக்னம் {other_ta} ஆகிவிடும். இந்த லக்னம் துல்லியமான பிறந்த நேரத்தைச் "
            "சார்ந்தது; எல்லா வீடுகளும் லக்னத்திலிருந்தே எண்ணப்படுவதால், வீடு சார்ந்த பலன்களை "
            "நம்புவதற்கு முன் பிறந்த நேரத்தை உறுதிசெய்யவும்.",
            f"The Lagna sits at the edge of {here_en} ({deg:.2f}°). A birth time {shift_en} would "
            f"make it {other_en}. This Lagna depends on the precise birth time: every house is "
            "counted from it, so confirm the recorded time before relying on house-based readings.",
        )
    return (
        f"பிறந்த நேரம் {shift_ta} இருந்திருந்தால் லக்னம் {here_ta} அல்ல, {other_ta} ஆகும். "
        "பிறந்த நேரங்கள் பெரும்பாலும் 5 அல்லது 15 நிமிடங்களுக்குச் சுற்றி எழுதப்படுகின்றன; "
        "உங்கள் நேரம் அப்படி இருந்தால், வீடு சார்ந்த பலன்களுக்கு முன் அதைச் சரிபார்க்கவும்.",
        f"A birth time {shift_en} would make the Lagna {other_en} rather than {here_en}. Birth "
        "times are often rounded to 5 or 15 minutes; if yours was, check it before leaning on "
        "house-based readings.",
    )


def navamsa_lagna_edge_note(
    lagna_longitude: float,
    julian_day: float,
    latitude: float,
    longitude: float,
) -> tuple[str, str] | None:
    """(ta, en) note when the Navamsa (D9) Lagna changes within the firm window."""
    d9 = navamsa_rasi_from_degree(lagna_longitude)

    def d9_lagna(jd: float) -> int:
        return navamsa_rasi_from_degree(calculate_lagna_degree(jd, latitude, longitude))

    crossing = _nearest_crossing(julian_day, FIRM_WINDOW_MINUTES, d9_lagna)
    if crossing is None:
        return None
    minutes, direction = crossing
    other = navamsa_rasi_from_degree(
        calculate_lagna_degree(julian_day + direction * (minutes + 0.05) * _MINUTE, latitude, longitude)
    )
    shift_ta, shift_en = _minutes_text(minutes, direction)
    return (
        f"நவாம்ச (D9) லக்னம் {rasi_ta(d9)}; பிறந்த நேரம் {shift_ta} இருந்திருந்தால் அது "
        f"{rasi_ta(other)} ஆகிவிடும். நவாம்ச லக்னம் சுமார் 13 நிமிடங்களுக்கு ஒருமுறை மாறுவதால், "
        "அதைச் சார்ந்த பலன்களுக்கு நிமிடம் வரை துல்லியமான பிறந்த நேரம் தேவை.",
        f"The Navamsa (D9) Lagna is {rasi_en(d9)}; a birth time {shift_en} would make it "
        f"{rasi_en(other)}. The D9 Lagna changes roughly every 13 minutes, so readings that use "
        "it need a birth time accurate to the minute.",
    )


def _place(profile: object) -> tuple[float, float] | None:
    latitude = getattr(profile, "birth_latitude", None) if profile is not None else None
    longitude = getattr(profile, "birth_longitude", None) if profile is not None else None
    if latitude is None or longitude is None:
        return None
    return float(latitude), float(longitude)


def lagna_edge_note_for_profile(
    lagna_longitude: float, julian_day: float, profile: object
) -> tuple[str, str] | None:
    """`lagna_edge_note` with place and confidence read off a birth profile."""
    place = _place(profile)
    if place is None:
        return None
    return lagna_edge_note(
        lagna_longitude,
        julian_day,
        *place,
        float(getattr(profile, "birth_time_confidence_minutes", 0) or 0),
    )


def navamsa_lagna_edge_note_for_profile(
    lagna_longitude: float, julian_day: float, profile: object
) -> tuple[str, str] | None:
    """`navamsa_lagna_edge_note` with place read off a birth profile."""
    place = _place(profile)
    if place is None:
        return None
    return navamsa_lagna_edge_note(lagna_longitude, julian_day, *place)
