"""Hora (planetary hour) timing helpers and daily guidance text builders."""
from __future__ import annotations

from datetime import date, datetime

from app.calculations.astro import resolve_timezone
from app.schemas.daily_guidance import (
    DailyGuidanceSuggestion,
    DailyGuidanceText,
    DailyGuidanceWindow,
)
from app.services._dg_scoring import _normalize_graha_name, _rasi_lord

_NATURAL_BENEFIC_LORDS = {"JUPITER", "VENUS", "MERCURY", "MOON"}

# Lords whose hora is universally cautioned (malefics with no offsetting dignity)
_MALEFIC_HORA_LORDS = {"SATURN", "MARS", "RAHU", "KETU"}


def _money_hora_name(lord: str) -> str:
    return {
        "SUN": "SUN",
        "MOON": "MOON",
        "MARS": "MARS",
        "MERCURY": "MERCURY",
        "GURU": "JUPITER",
        "VENUS": "VENUS",
        "SATURN": "SATURN",
    }[lord]


def _current_hora_lord(panchangam, on_date: date, timezone_name: str) -> str | None:
    """
    Return the currently running hora lord for on_date in local timezone.
    Returns None when the requested date is not today in that timezone.
    """
    from datetime import datetime
    tz_now = datetime.now(resolve_timezone(timezone_name))
    if tz_now.date() != on_date:
        return None

    now_local = tz_now
    for slot in panchangam.hora:
        from app.services._dg_scoring import _to_utc
        start = _to_utc(slot.start).astimezone(tz_now.tzinfo)
        end = _to_utc(slot.end).astimezone(tz_now.tzinfo)
        if start <= now_local < end:
            normalized_lord = _normalize_graha_name(slot.lord)
            if normalized_lord == "GURU":
                return "JUPITER"
            return normalized_lord
    return None


def _personal_hora_lords(
    lagna_rasi: int,
    maha_lord: str,
    antar_lord: str,
) -> tuple[set[str], set[str]]:
    """
    Return (priority_lords, supportive_lords).

    priority_lords  — personal planets: lagna lord + current dasha lords.
                      These are ranked highest regardless of natural benefic status.
    supportive_lords — natural benefics + SUN + priority_lords.
                      Any hora from this set is shown as a best window.
    """
    lagna_lord = _normalize_graha_name(_rasi_lord(lagna_rasi))
    norm_maha = _normalize_graha_name(maha_lord)
    norm_antar = _normalize_graha_name(antar_lord)

    priority = {lagna_lord, norm_maha, norm_antar} - _MALEFIC_HORA_LORDS
    supportive = set(_NATURAL_BENEFIC_LORDS) | {"SUN"} | priority
    return priority, supportive


def _intervals_overlap(a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> bool:
    """True when [a_start, a_end) and [b_start, b_end) intersect. All four are
    datetimes from the same panchangam snapshot (same day, same zone), so a
    direct comparison is sound."""
    return a_start < b_end and b_start < a_end


def _inauspicious_intervals(panchangam) -> list[tuple[datetime, datetime]]:
    """Rahu Kalam, Yamagandam and Kuligai as (start, end) pairs — the day's
    classically inauspicious kalams. A window recommended as *best* must not
    fall inside any of them."""
    out: list[tuple[datetime, datetime]] = []
    for attr in ("rahu_kalam", "yamagandam", "kuligai"):
        slot = getattr(panchangam, attr, None)
        start = getattr(slot, "start", None)
        end = getattr(slot, "end", None)
        if start is not None and end is not None:
            out.append((start, end))
    return out


def _best_hours(
    panchangam,
    current_maha_lord: str,
    lagna_rasi: int = 0,
    current_antar_lord: str = "",
) -> list[DailyGuidanceWindow]:
    windows: list[DailyGuidanceWindow] = []

    # A hora "best window" that sits inside Rahu Kalam, Yamagandam or Kuligai is
    # a self-contradiction — the same day view marks those as periods to avoid.
    # So every *hora* candidate below is dropped if it overlaps one of them.
    # (This was the bug where the featured window 3:35–4:37pm landed squarely
    # inside Yamagandam 3:35–5:09pm.)
    #
    # Abhijit is deliberately NOT filtered this way: Abhijit Muhurtham is the
    # classical exception — traditionally held auspicious even when it clips
    # Rahu Kalam — and the app already treats it as a universally auspicious slot
    # that never fully vanishes. Its only gate is its own weekday restriction.
    bad = _inauspicious_intervals(panchangam)

    def _clear(start: datetime, end: datetime) -> bool:
        return not any(_intervals_overlap(start, end, bs, be) for bs, be in bad)

    if not panchangam.abhijit_restricted:
        windows.append(
            DailyGuidanceWindow(
                type="ABHIJIT",
                start=panchangam.abhijit_start.strftime("%H:%M"),
                end=panchangam.abhijit_end.strftime("%H:%M"),
            )
        )

    if lagna_rasi and current_antar_lord:
        priority_lords, supportive_lords = _personal_hora_lords(
            lagna_rasi, current_maha_lord, current_antar_lord
        )
    else:
        # Fallback: generic benefic set + weekday/maha lords if they qualify
        supportive_lords = set(_NATURAL_BENEFIC_LORDS) | {"SUN"}
        priority_lords: set[str] = set()
        norm_maha = _normalize_graha_name(current_maha_lord)
        if norm_maha not in _MALEFIC_HORA_LORDS:
            supportive_lords.add(norm_maha)

    # Emit all daytime horas that qualify, marking personal-planet horas
    # distinctly — but never one overlapping an inauspicious kalam.
    for entry in panchangam.hora[:12]:
        norm_lord = _normalize_graha_name(_money_hora_name(entry.lord))
        if norm_lord in supportive_lords and _clear(entry.start, entry.end):
            tag = "PERSONAL_HORA" if norm_lord in priority_lords else "HORA"
            windows.append(
                DailyGuidanceWindow(
                    type=f"{norm_lord}_{tag}",
                    start=entry.start.strftime("%H:%M"),
                    end=entry.end.strftime("%H:%M"),
                )
            )

    return windows


def _caution_windows(panchangam) -> list[DailyGuidanceWindow]:
    # Rahu Kalam stays first — callers read caution_windows[0] as the Rahu Kalam
    # for the Rahu-specific caution copy. Yamagandam and Kuligai are the day's
    # other two inauspicious kalams and belong in the same avoid-set.
    windows = [
        DailyGuidanceWindow(
            type="RAHU_KALAM",
            start=panchangam.rahu_kalam.start.strftime("%H:%M"),
            end=panchangam.rahu_kalam.end.strftime("%H:%M"),
        )
    ]
    for window_type, attr in (("YAMAGANDAM", "yamagandam"), ("KULIGAI", "kuligai")):
        slot = getattr(panchangam, attr, None)
        if slot is not None and getattr(slot, "start", None) is not None and getattr(slot, "end", None) is not None:
            windows.append(
                DailyGuidanceWindow(
                    type=window_type,
                    start=slot.start.strftime("%H:%M"),
                    end=slot.end.strftime("%H:%M"),
                )
            )
    return windows


def _build_text(
    score: int,
    label: str,
    best_windows: list[DailyGuidanceWindow],
    caution_windows: list[DailyGuidanceWindow],
) -> tuple[DailyGuidanceText, DailyGuidanceSuggestion, DailyGuidanceSuggestion]:
    if label == "STRONG_SUPPORT":
        en = "Today is strongly supportive for planned actions. Use the clearest window and keep decisions calm."
        ta = "இன்று திட்டமிட்ட செயல்களுக்கு நல்ல ஆதரவு உள்ளது. நல்ல நேரத்தை பயன்படுத்தி முடிவுகளை அமைதியாக எடுத்துக்கொள்ளுங்கள்."
    elif label == "GOOD":
        en = "Today has useful support for planned actions. Avoid Rahu Kalam for new starts and keep important decisions structured."
        ta = "இன்று திட்டமிட்ட செயல்களுக்கு நல்ல ஆதரவு உள்ளது. ராகு காலத்தைத் தவிர்த்து முக்கிய முடிவுகளை அமைதியாக எடுத்துக்கொள்ளுங்கள்."
    elif label == "BALANCED":
        en = "Today is steady and workable. Move step by step, and prefer simple, practical decisions."
        ta = "இன்று நிலையான நாளாக உள்ளது. படிப்படியாகச் செயல்பட்டு, எளிய மற்றும் நடைமுறை முடிவுகளைத் தேர்வு செய்யுங்கள்."
    elif label == "CAUTION":
        en = "Keep the day light and structured. Focus on routine tasks, and save major decisions for a better window."
        ta = "இன்று நாளை இலகுவாகவும் ஒழுங்காகவும் வைத்துக்கொள்ளுங்கள். வழக்கமான பணிகளுக்கு முன்னுரிமை கொடுத்து, பெரிய முடிவுகளை நல்ல நேரத்திற்கு மாற்றுங்கள்."
    else:
        en = "A quieter, restorative pace will suit today. Keep commitments small and favor rest, review, and simple follow-through."
        ta = "இன்று சற்று அமைதியான, மீளச்சேர்க்கை தரும் நடைமுறை நல்லது. சிறிய பொறுப்புகளை மட்டும் எடுத்துக்கொண்டு ஓய்வு, மறுபரிசீலனை, எளிய தொடர்ச்சி ஆகியவற்றுக்கு முன்னுரிமை கொடுங்கள்."

    action_en = "Use the best window for your most important task."
    action_ta = "உங்கள் முக்கியமான பணியை நல்ல நேரத்தில் செய்யுங்கள்."
    if best_windows:
        action_en = f"Use {best_windows[0].type.replace('_', ' ').title()} for your most important task."
        action_ta = f"{best_windows[0].type.replace('_', ' ')} நேரத்தில் முக்கிய பணியைத் தொடங்குங்கள்."

    caution_en = "Avoid rushing decisions during Rahu Kalam and keep the day practical."
    caution_ta = "ராகு காலத்தில் அவசர முடிவுகளைத் தவிர்த்து, நாளை நடைமுறைபூர்வமாக வைத்துக்கொள்ளுங்கள்."

    return (
        DailyGuidanceText(ta=ta, en=en),
        DailyGuidanceSuggestion(ta=action_ta, en=action_en),
        DailyGuidanceSuggestion(ta=caution_ta, en=caution_en),
    )
