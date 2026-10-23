"""Festival and holiday category pages for the public Tamil calendar.

A category page is ``{kind}-{year}`` (``hindu-festivals-2027``). Each kind has
the source it honestly can, per year:

* every kind, in the curated year (`calendar_categories_2026`, owner-supplied
  lists reconciled against the engine);
* Hindu festivals, any other published year: the yearly observances the daily
  panchangam itself names (`panchangam_events_service.hindu_festival_days`);
* Christian festivals, any other published year: computed
  (`christian_calendar`);
* Muslim festivals and Tamil Nadu government holidays: only where a published
  list exists. Moon sighting and the government order cannot be computed, so a
  year without one has no page rather than a guessed one.
"""
from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status

from app.calculations.christian_calendar import christian_feasts
from app.data.calendar_categories_2026 import (
    CALENDAR_CATEGORY_EVENTS_2026,
    CALENDAR_CATEGORY_META,
    CalendarCategoryEvent,
    CalendarCategoryMeta,
    events_for_category,
)
from app.data.calendar_categories_2026 import YEAR as CURATED_YEAR
from app.services.panchangam_events_service import PUBLISHED_YEARS, hindu_festival_days

WEEKDAY_TA = {
    "Monday": "திங்கள்",
    "Tuesday": "செவ்வாய்",
    "Wednesday": "புதன்",
    "Thursday": "வியாழன்",
    "Friday": "வெள்ளி",
    "Saturday": "சனி",
    "Sunday": "ஞாயிறு",
}

HINDU = "hindu-festivals"
MUSLIM = "muslim-festivals"
CHRISTIAN = "christian-festivals"
TN_GOVT = "tamil-nadu-government-holidays"
#: Page order, as the curated year lists them.
KINDS: tuple[str, ...] = (HINDU, MUSLIM, CHRISTIAN, TN_GOVT)
#: Kinds with a page in every published year, not only the curated one.
COMPUTED_KINDS: tuple[str, ...] = (HINDU, CHRISTIAN)

_CURATED_TA = {
    event.name_en: event.name_ta
    for event in CALENDAR_CATEGORY_EVENTS_2026
    if event.category_slug == f"{HINDU}-{CURATED_YEAR}"
}

#: The yearly Hindu observances the engine names, and how the page prints each
#: (English, Tamil). The monthly vratas (Pradosham, Ekadashi, Sashti, ...) have
#: their own event pages and are left out. Tamil is the curated rows' where they
#: hold the name; the rest is copied from the shared festival-name table
#: (packages/shared/src/i18n/festival-names.ts, DRAFT), with its caveat.
HINDU_YEARLY_NAMES: dict[str, tuple[str, str]] = {
    **{
        name: (name, _CURATED_TA[name])
        for name in (
            "Bhogi", "Thai Pongal", "Mattu Pongal", "Kaanum Pongal", "Thai Amavasai", "Thai Poosam",
            "Maasi Magam", "Panguni Uthiram", "Vaigasi Visakam", "Aadi Perukku", "Thiru Aadi Pooram",
            "Varalakshmi Vratham", "Krishna Jayanthi", "Vinayagar Chaturthi", "Mahalaya Amavasai",
            "Navarathiri Begins", "Saraswathi Poojai", "Ayudha Pooja", "Vijayadasami", "Deepavali",
            "Karthigai Deepam", "Arudra Darisanam",
        )
    },
    "Sivarathiri": ("Maha Sivarathiri", _CURATED_TA["Maha Sivarathiri"]),
    "Puthandu (Tamil New Year)": ("Tamil New Year (Puthandu)", "தமிழ் வருடப் பிறப்பு"),
    "Chitra Pournami": ("Chitra Pournami", "சித்ரா பௌர்ணமி"),
    "Aadi Amavasai": ("Aadi Amavasai", "ஆடி அமாவாசை"),
    "Aadi Krithigai": ("Aadi Krithigai", "ஆடி கிருத்திகை"),
    "Skanda Sashti": ("Skanda Sashti", "கந்த சஷ்டி"),
    "Vaikunta Ekadashi": ("Vaikunta Ekadashi", "வைகுண்ட ஏகாதசி"),
}

_COMPUTED_META_TEXT: dict[str, dict[str, str]] = {
    HINDU: {
        "title_en": "Hindu Festivals {year}",
        "title_ta": "இந்துப் பண்டிகைகள் {year}",
        "description_en": "Major Hindu and Tamil festival dates for {year}, computed by the Vinaadi panchangam, with weekday and panchangam links.",
        "description_ta": "{year}-க்கான முக்கிய இந்து மற்றும் தமிழ்ப் பண்டிகைகள், Vinaadi பஞ்சாங்கக் கணிப்பின்படி, தேதி, கிழமை, பஞ்சாங்கம் இணைப்புகளுடன்.",
        "source_en": "Computed by Vinaadi's festival rules (Chennai sunrise, Thirukkanitham). A local temple may observe a festival a day apart.",
        "source_ta": "Vinaadi பண்டிகை விதிகளின்படி கணிக்கப்பட்டது (சென்னை சூரிய உதயம், திருக்கணிதம்). உள்ளூர் கோயிலில் ஒரு நாள் வேறுபடலாம்.",
    },
    CHRISTIAN: {
        "title_en": "Christian Festivals {year}",
        "title_ta": "கிறிஸ்தவ பண்டிகைகள் {year}",
        "description_en": "Christian observances and festival dates for {year} including Lent, Holy Week, Easter and Christmas.",
        "description_ta": "{year}-க்கான லெண்ட், புனித வாரம், ஈஸ்டர், கிறிஸ்துமஸ் உள்ளிட்ட கிறிஸ்தவ பண்டிகைகள்.",
        "source_en": "Computed: Easter by the Gregorian church calendar, Holy Week from Easter, fixed feasts by date.",
        "source_ta": "கணிக்கப்பட்டது: ஈஸ்டர் கிரிகோரியன் திருச்சபை நாட்காட்டிப்படி, புனித வாரம் ஈஸ்டரிலிருந்து, நிலையான திருநாட்கள் தேதிப்படி.",
    },
}


def _bi(ta: str, en: str) -> dict[str, str]:
    return {"ta": ta, "en": en}


def current_year() -> int:
    """This year in India: the default when a caller names none."""
    return datetime.now(ZoneInfo("Asia/Kolkata")).year


def _not_found(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _kinds_for(year: int) -> tuple[str, ...]:
    if year == CURATED_YEAR:
        return KINDS
    if year in PUBLISHED_YEARS:
        return COMPUTED_KINDS
    return ()


def _meta(kind: str, year: int) -> CalendarCategoryMeta:
    if year == CURATED_YEAR:
        return CALENDAR_CATEGORY_META[f"{kind}-{year}"]
    text = {key: value.format(year=year) for key, value in _COMPUTED_META_TEXT[kind].items()}
    curated = CALENDAR_CATEGORY_META[f"{kind}-{CURATED_YEAR}"]
    return CalendarCategoryMeta(
        slug=f"{kind}-{year}",
        year=year,
        category_label_en=curated.category_label_en,
        category_label_ta=curated.category_label_ta,
        **text,
    )


def _hindu_events(year: int) -> list[CalendarCategoryEvent]:
    """The engine's yearly observances. `hindu_festival_days` is the engine
    alone, without hand-entered rows (2025's Krishna Jayanthi on 16 Aug), so a
    festival is never listed on two days."""
    slug = f"{HINDU}-{year}"
    events = []
    for row in hindu_festival_days(year):
        day = date.fromisoformat(row["date"])
        for name in row["names"]:
            shown = HINDU_YEARLY_NAMES.get(name)
            if shown:
                events.append(CalendarCategoryEvent(slug, day, shown[0], shown[1], ("hindu",)))
    return events


def _christian_events(year: int) -> list[CalendarCategoryEvent]:
    slug = f"{CHRISTIAN}-{year}"
    return [CalendarCategoryEvent(slug, f.date, f.name_en, f.name_ta, ("christian",)) for f in christian_feasts(year)]


def _events(kind: str, year: int) -> list[CalendarCategoryEvent]:
    if year == CURATED_YEAR:
        return events_for_category(f"{kind}-{year}", year)
    events = _hindu_events(year) if kind == HINDU else _christian_events(year)
    return sorted(events, key=lambda event: (event.date, event.name_en))


def _next_date(events: list[CalendarCategoryEvent], reference: date) -> str | None:
    for event in events:
        if event.date >= reference:
            return event.date.isoformat()
    return None


def _event_payload(event: CalendarCategoryEvent) -> dict:
    weekday_en = event.date.strftime("%A")
    return {
        "date": event.date.isoformat(),
        "weekday": _bi(WEEKDAY_TA[weekday_en], weekday_en),
        "name": _bi(event.name_ta, event.name_en),
        "tags": list(event.tags),
        "note": _bi(event.note_ta, event.note_en) if event.note_en or event.note_ta else None,
    }


def _summary(kind: str, year: int, events: list[CalendarCategoryEvent], reference: date) -> dict:
    meta = _meta(kind, year)
    return {
        "slug": meta.slug,
        "year": year,
        "title": _bi(meta.title_ta, meta.title_en),
        "description": _bi(meta.description_ta, meta.description_en),
        "categoryLabel": _bi(meta.category_label_ta, meta.category_label_en),
        "source": _bi(meta.source_ta, meta.source_en),
        "count": len(events),
        "nextDate": _next_date(events, reference),
    }


def parse_category_slug(slug: str) -> tuple[str, int] | None:
    """``hindu-festivals-2027`` -> (``hindu-festivals``, 2027); None if not a category."""
    kind, _, year = slug.strip().lower().rpartition("-")
    if kind not in KINDS or not year.isdigit():
        return None
    return kind, int(year)


def list_calendar_categories(year: int | None = None, *, reference: date | None = None) -> dict:
    year = current_year() if year is None else year
    kinds = _kinds_for(year)
    if not kinds:
        raise _not_found(
            f"No festival categories published for {year}. "
            f"Available years: {PUBLISHED_YEARS.start}-{PUBLISHED_YEARS.stop - 1}"
        )
    ref = reference or date.today()
    return {"year": year, "categories": [_summary(kind, year, _events(kind, year), ref) for kind in kinds]}


def get_calendar_category(slug: str, year: int | None = None, *, reference: date | None = None) -> dict:
    parsed = parse_category_slug(slug)
    if parsed is None or (year is not None and year != parsed[1]) or parsed[0] not in _kinds_for(parsed[1]):
        raise _not_found(f"Unknown calendar category: {slug}")
    kind, slug_year = parsed
    events = _events(kind, slug_year)
    return {
        **_summary(kind, slug_year, events, reference or date.today()),
        "events": [_event_payload(event) for event in events],
    }
