"""Hora (planetary hour) timing helpers and daily guidance text builders."""
from __future__ import annotations

from datetime import date, datetime

from app.calculations.astro import resolve_timezone
from app.calculations.panchangam import gowri_category_rank, gowri_kala_label
from app.schemas.daily_guidance import (
    DailyGuidanceSuggestion,
    DailyGuidanceText,
    DailyGuidanceWindow,
    DailyGuidanceWindowConflict,
)
from app.services._dg_scoring import _normalize_graha_name, _rasi_lord

_NATURAL_BENEFIC_LORDS = {"JUPITER", "VENUS", "MERCURY", "MOON"}

# Lords whose hora is universally cautioned (malefics with no offsetting dignity)
_MALEFIC_HORA_LORDS = {"SATURN", "MARS", "RAHU", "KETU"}

# Graha display names for the "why this window" line. Duplicated rather than
# imported from daily_guidance_service._REMEDY_PLANET_NAME because that module
# imports *this* one — keep the two spellings in step.
_HORA_LORD_NAME: dict[str, tuple[str, str]] = {
    "SUN": ("சூரியன்", "Sun"),
    "MOON": ("சந்திரன்", "Moon"),
    "MARS": ("செவ்வாய்", "Mars"),
    "MERCURY": ("புதன்", "Mercury"),
    "JUPITER": ("குரு", "Jupiter"),
    "VENUS": ("சுக்கிரன்", "Venus"),
    "SATURN": ("சனி", "Saturn"),
    "RAHU": ("ராகு", "Rahu"),
    "KETU": ("கேது", "Ketu"),
}

# A recommendation shorter than this is not actionable — you cannot start and
# finish anything inside a 6-minute slice, and an intersection grid of 62-minute
# horas against 93-minute kalas throws off slivers at every other boundary. Also
# the floor for *reporting* a collision: a 3-minute clip is not worth a warning.
_MIN_ACTIONABLE_MINUTES = 15

# Conflicts are an explanation, not a list. More than this and the hero is
# reciting the panchangam back at the reader.
_MAX_REPORTED_CONFLICTS = 3


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


def _hora_lord_name(lord: str, lang: str) -> str:
    ta, en = _HORA_LORD_NAME.get(lord, ("", lord.title()))
    return ta if lang == "ta" else en


def _minutes(start: datetime, end: datetime) -> int:
    return int((end - start).total_seconds() // 60)


def _hm(value: datetime) -> str:
    return value.strftime("%H:%M")


def _supportive_sets(
    current_maha_lord: str,
    lagna_rasi: int,
    current_antar_lord: str,
) -> tuple[set[str], set[str]]:
    """(priority_lords, supportive_lords) for this native, with the pre-chart
    fallback the caller has always had when lagna/antar are unavailable."""
    if lagna_rasi and current_antar_lord:
        return _personal_hora_lords(lagna_rasi, current_maha_lord, current_antar_lord)
    supportive = set(_NATURAL_BENEFIC_LORDS) | {"SUN"}
    norm_maha = _normalize_graha_name(current_maha_lord)
    if norm_maha not in _MALEFIC_HORA_LORDS:
        supportive.add(norm_maha)
    return set(), supportive


def _day_gowri_kalas(panchangam) -> list:
    """The eight sunrise→sunset Gowri kalas, or [] when the snapshot predates
    them. Night kalas are excluded: the hora side of this intersection is
    `panchangam.hora[:12]`, which is the daytime half."""
    slots = getattr(panchangam, "gowri_panchangam", None) or []
    return [
        slot for slot in slots
        if getattr(slot, "period", None) == "DAY"
        and getattr(slot, "start", None) is not None
        and getattr(slot, "end", None) is not None
    ]


def _kalam_intervals(panchangam) -> list[tuple[str, datetime, datetime]]:
    """Rahu Kalam / Yamagandam / Kuligai as (name, start, end).

    Same three windows as `_inauspicious_intervals`, which the fallback path
    still uses; this one keeps the name attached so a clash can be attributed
    rather than merely detected."""
    out: list[tuple[str, datetime, datetime]] = []
    for key, attr in (("RAHU_KALAM", "rahu_kalam"), ("YAMAGANDAM", "yamagandam"), ("KULIGAI", "kuligai")):
        slot = getattr(panchangam, attr, None)
        start = getattr(slot, "start", None)
        end = getattr(slot, "end", None)
        if start is not None and end is not None:
            out.append((key, start, end))
    return out


def _conflict_key(is_personal: bool, start: datetime, end: datetime) -> tuple:
    """Rank near-misses by how much the reader loses, not by which grid caused it.

    A native's own hora spoiled by a bad kala comes before a generic benefic
    one — the hero has room for a line or two, and "your Venus hora" is the one
    they will check. After that, the longest lost stretch wins; a 20-minute clip
    is a footnote next to a lost hour.
    """
    return (0 if is_personal else 1, -_minutes(start, end), start)


def _perfect_windows(
    panchangam,
    current_maha_lord: str,
    lagna_rasi: int,
    current_antar_lord: str,
) -> tuple[list[DailyGuidanceWindow], list[DailyGuidanceWindowConflict]]:
    """The day's genuinely clear windows for *this* native, and why the rest are not.

    Three independent grids cover the same sunrise→sunset span, and the app used
    to consult only two of them:

      * Gowri kalas — daylight/8, each named good or bad by the weekday table
      * horas       — daylight/12, each ruled by a graha that is personal,
                      benefic, or malefic *for this chart*
      * the three kalams — Rahu Kalam, Yamagandam, Kuligai

    62 and 93 minutes share no boundary but sunrise, so the grids interleave and
    a whole hora is almost never uniformly good. Recommending one wholesale is
    how the hero came to headline 1:27–2:29 pm as "good for important tasks"
    while the panchangam page marked 1:58 pm onward as Rogam — the same app
    contradicting itself on one screen.

    A window is offered only where all three agree, and it is returned trimmed to
    that agreement rather than to the hora that contained it.

    A stretch that fails on the hora/kala pairing alone — a good kala spent in a
    hora malefic for this native, or a hora that suits them spent in Rogam/Soram/
    Visham — is returned as a conflict naming the cause, because a reader who can
    see Sugam marked good on the panchangam page needs to be told why it is not
    their best window; silence reads as a bug. Clashes with the three kalams are
    filtered but not reported: those already have a hero card of their own.

    Returns ([] , []) when the snapshot carries no Gowri kalas; the caller falls
    back to whole-hora selection there rather than claiming the day has nothing.
    """
    kalas = _day_gowri_kalas(panchangam)
    if not kalas:
        return [], []

    priority_lords, supportive_lords = _supportive_sets(
        current_maha_lord, lagna_rasi, current_antar_lord
    )
    kalams = _kalam_intervals(panchangam)

    windows: list[tuple[tuple, DailyGuidanceWindow]] = []
    conflicts: list[tuple[tuple, DailyGuidanceWindowConflict]] = []

    for entry in panchangam.hora[:12]:
        lord = _normalize_graha_name(_money_hora_name(entry.lord))
        is_personal = lord in priority_lords
        is_supportive = lord in supportive_lords
        is_malefic = lord in _MALEFIC_HORA_LORDS

        for kala in kalas:
            start = max(entry.start, kala.start)
            end = min(entry.end, kala.end)
            if _minutes(start, end) < _MIN_ACTIONABLE_MINUTES:
                continue

            kala_good = getattr(kala, "is_good", None) is not False
            kala_name = getattr(kala, "name", None)
            kala_en = gowri_kala_label(kala_name, "en") or ""
            kala_ta = gowri_kala_label(kala_name, "ta") or kala_en
            lord_en = _hora_lord_name(lord, "en")
            lord_ta = _hora_lord_name(lord, "ta")

            clash = next(
                ((name, ks, ke) for name, ks, ke in kalams if _intervals_overlap(start, end, ks, ke)),
                None,
            )

            # ── the ways a stretch of the day fails ────────────────────────
            if clash is not None:
                # Disqualifying but NOT reported. Rahu Kalam, Yamagandam and
                # Kuligai already have their own hero card and their own red
                # rows on the panchangam page, so naming them again here would
                # only crowd out the collision nothing else in the app tells
                # anyone about. It still has to filter, though: without this a
                # bad-kala stretch that sits inside Kuligai would be reported as
                # a hora/kala collision, which is not what cost the reader that
                # half hour.
                continue

            if not kala_good:
                # A hora this native would otherwise be told to use, spent
                # inside Rogam/Soram/Visham. This is the collision the hero was
                # silently hiding: it dropped nothing (the hora was clear of the
                # three kalams) and printed the window as if it were clean.
                if is_supportive:
                    conflicts.append((
                        _conflict_key(is_personal, start, end),
                        DailyGuidanceWindowConflict(
                            kind="BAD_KALA",
                            cause=str(kala_name or ""),
                            start=_hm(start),
                            end=_hm(end),
                            text=DailyGuidanceText(
                                ta=f"{lord_ta} ஹோரை உங்களுக்கு உகந்தது, ஆனால் இந்த நேரம் {kala_ta} கலத்தில் விழுகிறது.",
                                en=f"The {lord_en} hora suits your chart, but this stretch falls in {kala_en} kala.",
                            ),
                        ),
                    ))
                continue

            if is_malefic:
                # Nalla Neram colliding with a hora that is inauspicious for
                # *this* native — named explicitly, per the owner's ruling.
                conflicts.append((
                    _conflict_key(False, start, end),
                    DailyGuidanceWindowConflict(
                        kind="MALEFIC_HORA",
                        cause=lord,
                        start=_hm(start),
                        end=_hm(end),
                        text=DailyGuidanceText(
                            ta=f"{kala_ta} நல்ல நேரம், ஆனால் இது {lord_ta} ஹோரையில் வருவதால் தவிர்க்கவும்.",
                            en=f"{kala_en} is a good kala, but it runs inside the {lord_en} hora — skip it.",
                        ),
                    ),
                ))
                continue

            if not is_supportive:
                # Neutral for this chart: not offered, not a near-miss worth a
                # line in the hero either.
                continue

            # ── all three grids agree ──────────────────────────────────────
            windows.append((
                (0 if is_personal else 1, gowri_category_rank(kala_name), -_minutes(start, end), start),
                DailyGuidanceWindow(
                    type=f"{lord}_{'PERSONAL_HORA' if is_personal else 'HORA'}",
                    start=_hm(start),
                    end=_hm(end),
                    kala=str(kala_name or "") or None,
                    horaLord=lord,
                    isPersonal=is_personal,
                    text=DailyGuidanceText(
                        ta=(
                            f"{lord_ta} ஹோரை {kala_ta} கலத்தில்"
                            + (" — உங்கள் ஜாதகத்திற்கு உரிய கிரகம்" if is_personal else "")
                        ),
                        en=(
                            f"{lord_en} hora inside {kala_en}"
                            + (" — your own chart's lord" if is_personal else "")
                        ),
                    ),
                ),
            ))

    windows.sort(key=lambda pair: pair[0])
    conflicts.sort(key=lambda pair: pair[0])
    return (
        [w for _, w in windows],
        [c for _, c in conflicts][:_MAX_REPORTED_CONFLICTS],
    )


def _best_hours(
    panchangam,
    current_maha_lord: str,
    lagna_rasi: int = 0,
    current_antar_lord: str = "",
) -> tuple[list[DailyGuidanceWindow], list[DailyGuidanceWindowConflict]]:
    """The day's best windows, best first, plus the near-misses and their causes.

    Abhijit is listed after the computed windows but before the fallback horas.
    It is deliberately NOT filtered against the kalams or the Gowri table:
    Abhijit Muhurtham is the classical exception — traditionally held auspicious
    even when it clips Rahu Kalam — and the app treats it as a universally
    auspicious slot that never fully vanishes. Its only gate is its own weekday
    restriction.
    """
    perfect, conflicts = _perfect_windows(
        panchangam, current_maha_lord, lagna_rasi, current_antar_lord
    )
    windows: list[DailyGuidanceWindow] = list(perfect)

    if not panchangam.abhijit_restricted:
        windows.append(
            DailyGuidanceWindow(
                type="ABHIJIT",
                start=_hm(panchangam.abhijit_start),
                end=_hm(panchangam.abhijit_end),
            )
        )

    if perfect:
        return windows, conflicts

    # Fallback — snapshots cached before the Gowri kalas were persisted carry no
    # kala grid to intersect against. Offer whole horas cleared of the three
    # kalams, which is what this function did before the intersection existed.
    # Reached only for stale snapshots, so it must not claim more than it knows:
    # these windows carry no `kala` and no `text`.
    priority_lords, supportive_lords = _supportive_sets(
        current_maha_lord, lagna_rasi, current_antar_lord
    )
    bad = _inauspicious_intervals(panchangam)

    def _clear(start: datetime, end: datetime) -> bool:
        return not any(_intervals_overlap(start, end, bs, be) for bs, be in bad)

    for entry in panchangam.hora[:12]:
        lord = _normalize_graha_name(_money_hora_name(entry.lord))
        if lord in supportive_lords and _clear(entry.start, entry.end):
            tag = "PERSONAL_HORA" if lord in priority_lords else "HORA"
            windows.append(
                DailyGuidanceWindow(
                    type=f"{lord}_{tag}",
                    start=_hm(entry.start),
                    end=_hm(entry.end),
                    horaLord=lord,
                    isPersonal=lord in priority_lords,
                )
            )

    return windows, conflicts


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
