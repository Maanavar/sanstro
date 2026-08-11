""""Your Chart in Five Minutes" — the second rung of the reading ladder.

Spec: docs/FIVE_MINUTE_READING_SPEC_2026-08-11.md

WHAT THIS IS, RIGHT NOW. The spec sequences eight beats; this module builds
four of them — 1 (identity), 2 (what this rests on) and 8 (one thing) reused
verbatim from ``one_minute_reading_service``, plus the one genuinely new beat
this slice ships: Beat 3, "Core Nature, extended" (§2.1), which inserts one
``mechanism`` clause between the existing ``gift`` and ``shadow`` facets so
the shadow reads as THIS gift's own shadow rather than an adjacent complaint.
Beats 4-7 (repeating pattern, extended past/present period texture, the
topic-in-full mini-reading) are not built yet and are not stubbed — a beat
that doesn't exist is absent from the ``beats`` array, never rendered as a
placeholder.

REGISTER SCOPE, RIGHT NOW (§0.2). Only ``self`` ships. ``parent``/``other``
are not designed for this length per the spec and never will be. ``client_
with_guardian`` IS designed (a reduced 6-beat reading with its own Beat 3
variant that drops the shadow half) but that variant does not exist yet —
shipping it with only 3 of its 6 beats would be exactly the "half-built
reading that silently degrades" failure §0.2 rules out for the two registers
that never ship. So it gets the same 404 as those two, for now.

Reuses ``ChartContext``/``build_chart_context`` from ``one_minute_reading_
service`` rather than recomputing anything — see that module's docstring on
``ChartContext`` for why a second computation is a live risk, not a style
preference.
"""
from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.calculations.display_names import planet_en, planet_ta
from app.schemas.five_minute_reading import (
    FiveMinuteMeta,
    FiveMinuteReadingData,
    FiveMinuteReadingResponse,
)
from app.schemas.one_minute_reading import (
    OneMinuteBeat,
    OneMinuteNextStep,
    OneMinuteReadingWindow,
    OneMinuteText,
    OneMinuteWordCount,
)
from app.services.feature_flags import get_flag
from app.services.one_minute_reading_service import (
    _VOICE,  # noqa: PLC2701 (internal use)
    ChartContext,
    _beat_one_thing,  # noqa: PLC2701 (internal use)
    _beat_what_this_rests_on,  # noqa: PLC2701 (internal use)
    _beat_who_you_are,  # noqa: PLC2701 (internal use)
    _word_count,  # noqa: PLC2701 (internal use)
)

CALC_VERSION = "five-minute-reading-v1.0-2026"


def require_five_minute_reading_enabled() -> None:
    """404 while the rollout flag is off — identical gating to the 2-minute reading.

    404 rather than 403, checked before the chart is looked up: see
    ``require_one_minute_reading_enabled``'s docstring, which this mirrors.
    """
    if not bool(get_flag("five_minute_reading")):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not available.")


# Five minutes at conversational-but-dense pacing, held to the same rule the
# 2-minute ceilings were held to after four unpaid raises (see that module's
# MAX_WORDS_EN comment trail): this is the outer edge, asserted by test, and
# it does not rise without a cut elsewhere paying for it. Per-register from
# day one — spec §0.4.
_FIVE_MIN_WORD_BUDGET: dict[str, tuple[int, int]] = {
    "self": (950, 550),
    # "client_with_guardian": (650, 380) — spec §0.4's own number, kept here
    # rather than invented later. Unused: that register 404s until its own
    # 6-beat list and reduced Beat 3 variant exist (see module docstring).
}


def word_budget(addressed_to: str) -> tuple[int, int]:
    """The (en, ta) ceiling for one five-minute reading. Asserted by test."""
    return _FIVE_MIN_WORD_BUDGET[addressed_to]


def _beat_core_nature_extended(*, strongest: str) -> OneMinuteBeat:
    """5-minute Beat 3 (§2.1) — gift, its mechanism, shadow. One graha, one beat.

    Extends the 2-minute reading's ``_beat_strength_and_cost`` with exactly
    the one clause that function's own docstring names and stops short of:
    the mechanism that makes "gift, then cost" read as one causal object.
    """
    voice = _VOICE[strongest]

    ta = (
        f"உங்கள் உண்மையான பலம் {voice.gift[0]} — {voice.mechanism[0]}. "
        f"விலை என்பது {voice.shadow[0]}."
    )
    en = (
        f"Your real strength is {voice.gift[1]} — {voice.mechanism[1]}. "
        f"Where it costs you is {voice.shadow[1]}."
    )

    return OneMinuteBeat(
        id="core_nature",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(
            ta=f"வலிமையான கிரகம் {planet_ta(strongest)} — பலமும், அதன் வழிமுறையும், விலையும் இதிலிருந்தே",
            en=f"Strongest graha {planet_en(strongest)} — the gift, its mechanism, and its cost, all from it",
        ),
    )


def build_five_minute_reading(context: ChartContext) -> FiveMinuteReadingResponse:
    if context.addressed_to != "self":
        # parent/other: not designed for this length, ever (§0.2).
        # client_with_guardian: designed but not built yet — see module
        # docstring. Same 404 the flag gate returns, not a fallback beat set:
        # no beat-building function below is ever reached for these values.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not available.")

    beats = [
        _beat_who_you_are(
            display_name=context.profile.display_name,
            nakshatra=context.moon.nakshatra,
            nakshatra_name=context.moon.nakshatra_name,
            moon_rasi_name=context.moon.rasi_name,
            moon_rasi=context.moon.rasi,
            lagna_rasi_name=context.lagna.rasi_name,
            lagna_rasi=context.lagna.rasi,
            nakshatra_lord=context.nakshatra_lord,
            signature_lord=context.signature_lord,
            lagna_reliable=context.lagna_reliable,
            addressed_to=context.addressed_to,
        ),
        _beat_what_this_rests_on(
            display_name=context.profile.display_name,
            lagna_reliable=context.lagna_reliable,
            addressed_to=context.addressed_to,
            birth_time_source=context.profile.birth_time_source,
        ),
        _beat_core_nature_extended(strongest=context.strongest),
        _beat_one_thing(timeline=context.timeline, addressed_to=context.addressed_to),
    ]

    return FiveMinuteReadingResponse(
        data=FiveMinuteReadingData(
            chart_id=context.chart_id,
            birth_profile_id=context.profile.birth_profile_id,
            display_name=context.profile.display_name,
            as_of=context.as_of,
            reading_window=OneMinuteReadingWindow(
                from_date=context.timeline.current_antardasha.start_date,
                to_date=context.timeline.current_antardasha.end_date,
            ),
            age=context.age,
            stage=context.stage,
            age_band=OneMinuteText(ta=context.age_band["ta"], en=context.age_band["en"]),
            focus_topic=context.topic,
            addressed_to=context.addressed_to,
            beats=beats,
            pending_question=None,
            word_count=OneMinuteWordCount(
                ta=sum(_word_count(b.text.ta) for b in beats),
                en=sum(_word_count(b.text.en) for b in beats),
            ),
            next_step=OneMinuteNextStep(
                label=OneMinuteText(ta="முழு ஜாதகத்தைப் படிக்க", en="Read the full chart"),
                href=f"/dashboard/family?chart={context.chart_id}",
            ),
        ),
        meta=FiveMinuteMeta(
            calculation_version=CALC_VERSION,
            generated_at=datetime.now(tz=UTC),
        ),
    )


__all__ = [
    "CALC_VERSION",
    "ChartContext",
    "build_five_minute_reading",
    "require_five_minute_reading_enabled",
    "word_budget",
]
