from __future__ import annotations

from datetime import date

from fastapi import HTTPException, status

from app.data.calendar_categories_2026 import (
    CALENDAR_CATEGORY_META,
    YEAR,
    CalendarCategoryEvent,
    category_slugs,
    events_for_category,
)

WEEKDAY_TA = {
    "Monday": "திங்கள்",
    "Tuesday": "செவ்வாய்",
    "Wednesday": "புதன்",
    "Thursday": "வியாழன்",
    "Friday": "வெள்ளி",
    "Saturday": "சனி",
    "Sunday": "ஞாயிறு",
}


def _bi(ta: str, en: str) -> dict[str, str]:
    return {"ta": ta, "en": en}


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


def list_calendar_categories(year: int = YEAR, *, reference: date | None = None) -> dict:
    if year != YEAR:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No festival categories published for {year}. Available years: [{YEAR}]",
        )
    ref = reference or date.today()
    categories = []
    for slug in category_slugs(year):
        meta = CALENDAR_CATEGORY_META[slug]
        events = events_for_category(slug, year)
        categories.append(
            {
                "slug": slug,
                "year": year,
                "title": _bi(meta.title_ta, meta.title_en),
                "description": _bi(meta.description_ta, meta.description_en),
                "categoryLabel": _bi(meta.category_label_ta, meta.category_label_en),
                "source": _bi(meta.source_ta, meta.source_en),
                "count": len(events),
                "nextDate": _next_date(events, ref),
            }
        )
    return {"year": year, "categories": categories}


def get_calendar_category(slug: str, year: int = YEAR, *, reference: date | None = None) -> dict:
    if year != YEAR or slug not in CALENDAR_CATEGORY_META:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown calendar category: {slug}",
        )
    ref = reference or date.today()
    meta = CALENDAR_CATEGORY_META[slug]
    events = events_for_category(slug, year)
    return {
        "slug": slug,
        "year": year,
        "title": _bi(meta.title_ta, meta.title_en),
        "description": _bi(meta.description_ta, meta.description_en),
        "categoryLabel": _bi(meta.category_label_ta, meta.category_label_en),
        "source": _bi(meta.source_ta, meta.source_en),
        "count": len(events),
        "nextDate": _next_date(events, ref),
        "events": [_event_payload(event) for event in events],
    }
