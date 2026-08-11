"""Response shapes for "Your Chart in Five Minutes" (docs/FIVE_MINUTE_READING_SPEC_2026-08-11.md).

Reuses ``OneMinuteText``/``OneMinuteBeat``/``OneMinuteQuestionOption``/
``OneMinutePendingQuestion``/``OneMinuteReadingWindow``/``OneMinuteWordCount``/
``OneMinuteNextStep``/``OneMinuteMeta`` from ``app.schemas.one_minute_reading``
rather than duplicating them — none of those shapes carry anything specific to
the two-minute reading, and the spec's own framing ("not new content") applies
to the wire shape as much as to the copy. ``FiveMinuteReadingData``/
``FiveMinuteReadingResponse`` stay their own types rather than aliasing
``OneMinuteReadingResponse`` — the two routes are separate API contracts that
may diverge (CLAUDE.md's coordination rule), and aliasing would silently
couple them.
"""
from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.one_minute_reading import (
    OneMinuteBeat,
    OneMinuteNextStep,
    OneMinutePendingQuestion,
    OneMinuteReadingWindow,
    OneMinuteText,
    OneMinuteWordCount,
)

__all__ = [
    "FiveMinuteMeta",
    "FiveMinuteReadingData",
    "FiveMinuteReadingResponse",
]


class FiveMinuteMeta(BaseModel):
    calculation_version: str = Field(alias="calculationVersion")
    generated_at: datetime = Field(alias="generatedAt")

    model_config = ConfigDict(populate_by_name=True)


class FiveMinuteReadingData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    birth_profile_id: UUID = Field(alias="birthProfileId")
    display_name: str = Field(alias="displayName")
    as_of: date = Field(alias="asOf")
    reading_window: OneMinuteReadingWindow = Field(alias="readingWindow")
    age: int
    stage: str
    age_band: OneMinuteText = Field(alias="ageBand")
    focus_topic: str = Field(alias="focusTopic")
    addressed_to: str = Field(alias="addressedTo")
    beats: list[OneMinuteBeat]
    pending_question: OneMinutePendingQuestion | None = Field(default=None, alias="pendingQuestion")
    word_count: OneMinuteWordCount = Field(alias="wordCount")
    next_step: OneMinuteNextStep = Field(alias="nextStep")

    model_config = ConfigDict(populate_by_name=True)


class FiveMinuteReadingResponse(BaseModel):
    success: bool = True
    data: FiveMinuteReadingData
    meta: FiveMinuteMeta

    model_config = ConfigDict(populate_by_name=True)
