"""Response shapes for "Your Chart in One Minute" (docs/ONE_MINUTE_READING_2026-08-04.md).

``beats`` is an ARRAY, not seven named fields, deliberately: a beat can be
suppressed (a minor gets no career beat, an unanswered marital-status question
withholds beat 5) without the frontend having to know why. A named-field shape
would force every consumer to re-implement the suppression rules that
``one_minute_reading_service`` already owns.
"""
from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class OneMinuteText(BaseModel):
    ta: str
    en: str

    model_config = ConfigDict(populate_by_name=True)


class OneMinuteBeat(BaseModel):
    """One paragraph of the reading.

    ``basis`` is the astrological ground for the beat ("Rohini; Saturn
    mahadasha 2015-2022") and is the ONLY field on this surface permitted to
    carry technical vocabulary — the body text never does. Same disclosure
    pattern as the numerology verdict's AlignmentBasis: the plain reader never
    opens it, and the reader who wants to check us can.
    """

    id: str
    text: OneMinuteText
    basis: OneMinuteText | None = None

    model_config = ConfigDict(populate_by_name=True)


class OneMinuteQuestionOption(BaseModel):
    value: str
    label: OneMinuteText

    model_config = ConfigDict(populate_by_name=True)


class OneMinutePendingQuestion(BaseModel):
    """The one question the reading is allowed to ask.

    Raised only when the answer changes which beat 5 is correct and we do not
    hold it — see the service's ``_focus_topic``. Answering PATCHes the birth
    profile, which improves every other surface too.

    ``before_beat`` names the beat the question renders above, and it exists
    because the question now stands in place of a beat that was withheld: with
    nothing to anchor to, the client fell back to the top of the piece and asked
    a reader their marital status before they had read a word. The beat order is
    the service's to know, so the anchor is sent rather than inferred.

    ``options`` is deliberately not a yes/no. "Not yet" is not the same answer as
    "single", and a divorced or widowed reader given only those two buttons has
    to misdescribe themselves to make the question go away.
    """

    field: str
    prompt: OneMinuteText
    options: list[OneMinuteQuestionOption]
    before_beat: str = Field(alias="beforeBeat")

    model_config = ConfigDict(populate_by_name=True)


class OneMinuteReadingWindow(BaseModel):
    """The span this reading is stable for.

    The reading regenerates at the antardasha boundary, never daily — a
    life-story that reads differently each morning announces itself as
    generated. The UI shows this as "as of <month year>".
    """

    from_date: date = Field(alias="from")
    to_date: date = Field(alias="to")

    model_config = ConfigDict(populate_by_name=True)


class OneMinuteWordCount(BaseModel):
    ta: int
    en: int

    model_config = ConfigDict(populate_by_name=True)


class OneMinuteNextStep(BaseModel):
    label: OneMinuteText
    href: str

    model_config = ConfigDict(populate_by_name=True)


class OneMinuteReadingData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    # Returned so the client can answer `pending_question` against the real
    # PATCH /birth-profiles/{id} route rather than needing a by-chart alias
    # invented for this one surface.
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


class OneMinuteMeta(BaseModel):
    calculation_version: str = Field(alias="calculationVersion")
    generated_at: datetime = Field(alias="generatedAt")

    model_config = ConfigDict(populate_by_name=True)


class OneMinuteReadingResponse(BaseModel):
    success: bool = True
    data: OneMinuteReadingData
    meta: OneMinuteMeta

    model_config = ConfigDict(populate_by_name=True)
