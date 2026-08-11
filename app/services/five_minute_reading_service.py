""""Your Chart in Five Minutes" — the second rung of the reading ladder.

Spec: docs/FIVE_MINUTE_READING_SPEC_2026-08-11.md

WHAT THIS IS, RIGHT NOW. The spec sequences eight beats; this module builds
all eight for the ``self`` register — 1 (identity), 2 (what this rests on)
and 8 (one thing) reused verbatim from ``one_minute_reading_service``, plus
five extended/new beats: Beat 3, "Core Nature, extended" (§2.1), which
inserts one ``mechanism`` clause between the existing ``gift`` and ``shadow``
facets so the shadow reads as THIS gift's own shadow rather than an adjacent
complaint; Beat 4, "Repeating Pattern" (§2.2), which reuses that SAME graha's
``shadow`` clause as its opening sentence and appends its
``domain_flex["WORK"]``/``domain_flex["RELATIONSHIPS"]`` facets — one trait,
relocated into two domains, never a different graha's table (§0.3's "one
graha" invariant); Beat 5, "What the Last Period Was Teaching, extended"
(§2.3), which reuses ``one_minute_reading_service._beat_last_ten_years``
verbatim and only adds a ``_PERIOD_THEME`` word ahead of the SAME
``past_texture`` sentence, never a second, independently-computed transition;
Beat 6, "Right Now, extended" (§2.4), which appends the new ``asks`` facet
(what the period REQUIRES) to the SAME ``_beat_right_now`` output the
2-minute reading already builds, never a second hinge computation; and Beat
7, "Your [Topic] in Full" (§2.5), the one genuinely composed beat — built
from the strongest graha's OWN ``gift`` (facet 1, alone, no ``mechanism``)
and a compressed ``_SHADOW_ESSENCE`` paraphrase of ``shadow`` (facet 3),
reframed through a topic-specific ``_TOPIC_LENS`` opener, plus the SAME
``_outlook`` clause the 2-minute reading's age-question beat already
computes for this topic. Facets 1 and 3 depart from §2.5's literal wording
(which named ``gift``/``mechanism``/``shadow`` verbatim) on purpose: a
manual read-through found the literal version made a reading repeat Beat 3's
own two sentences almost word for word, four beats later — see
``_beat_topic_in_full``'s own docstring for the full account. Withheld
exactly when the 2-minute age-question beat would be
(``topic == TOPIC_UNKNOWN``), and for the same reason: a topic we cannot
pick without a fact we do not hold is asked for, not guessed at.

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

from datetime import UTC, date, datetime

from fastapi import HTTPException, status

from app.calculations.dasha import VimshottariTimeline
from app.calculations.display_names import planet_en, planet_ta
from app.schemas.five_minute_reading import (
    FiveMinuteMeta,
    FiveMinuteReadingData,
    FiveMinuteReadingResponse,
)
from app.schemas.one_minute_reading import (
    OneMinuteBeat,
    OneMinuteNextStep,
    OneMinutePendingQuestion,
    OneMinuteReadingWindow,
    OneMinuteText,
    OneMinuteWordCount,
)
from app.services.feature_flags import get_flag
from app.services.one_minute_reading_service import (
    _TOPIC_AREA,  # noqa: PLC2701 (internal use)
    _VOICE,  # noqa: PLC2701 (internal use)
    TOPIC_ELDER,
    TOPIC_UNKNOWN,
    BaseRate,
    ChartContext,
    Provenance,
    _beat_last_ten_years,  # noqa: PLC2701 (internal use)
    _beat_one_thing,  # noqa: PLC2701 (internal use)
    _beat_right_now,  # noqa: PLC2701 (internal use)
    _beat_what_this_rests_on,  # noqa: PLC2701 (internal use)
    _beat_who_you_are,  # noqa: PLC2701 (internal use)
    _marital_status_pending_question,  # noqa: PLC2701 (internal use)
    _month_year,  # noqa: PLC2701 (internal use)
    _outlook,  # noqa: PLC2701 (internal use)
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


# ── This module's own tables (§2.3, §2.5) ────────────────────────────────────
#
# `mechanism` and `domain_flex` (§2.1/§2.2) live on `_Voice` in
# one_minute_reading_service.py, alongside `asks` (§2.4) — see that module's
# own `_Voice.PROVENANCE`. The three tables below are specific to THIS module
# (they are not per-graha facets on `_Voice`) so they get their own
# provenance dict here, following the exact shape of
# one_minute_reading_service._TABLE_PROVENANCE.
_TABLE_PROVENANCE: dict[str, tuple[Provenance, BaseRate]] = {
    # §2.3. A compression of the same rule-applied-to-a-D-fact `past_texture`
    # already is — not a new kind of claim, the single word a person would use
    # to summarise the stretch before saying more.
    "_PERIOD_THEME": (Provenance.RULE, BaseRate.KEYED),
    # §2.5. A grammatical hinge, not a characterization — "at work, that shows
    # up as..." supplies the domain; the graha table it is paired with
    # supplies the content. Same class as the beat-4 domain connectives
    # (`_WORK_CONNECTIVE`/`_RELATIONSHIPS_CONNECTIVE`), which is why those two
    # are FRAME below and not counted toward the reviewable vocabulary cap.
    "_TOPIC_LENS": (Provenance.FRAME, BaseRate.KEYED),
    # Added 2026-08-11, after a manual read-through of rendered Beat 7 output
    # found that composing it from `gift`/`mechanism`/`shadow` verbatim (the
    # first draft, following §2.5 literally) made a single reading repeat
    # Beat 3's own two sentences almost word for word, with `shadow` alone
    # appearing a THIRD time counting Beat 4's opening line. Same class as
    # `shadow` itself — a compression of the same claim, not a new one — see
    # `_beat_topic_in_full`'s own docstring for the full account.
    "_SHADOW_ESSENCE": (Provenance.TENDENCY, BaseRate.KEYED),
}

# §2.3. One label per graha — the noun the theme sentence opens on. Not a new
# claim: `past_texture` already says what the stretch asked for; this is the
# single word a person would use to summarise it before saying more. Kept
# separate from `past_texture` rather than baked into a longer string, because
# the 2-minute reading needs the short form and must not inherit a theme-word
# it never asked for. Copied verbatim from spec §2.3.
_PERIOD_THEME: dict[str, tuple[str, str]] = {
    "SUN": ("பொறுப்பு", "responsibility"),
    "MOON": ("மாற்றம்", "change"),
    "MARS": ("வேகம்", "momentum"),
    "MERCURY": ("கற்றல்", "learning"),
    "JUPITER": ("விரிவாக்கம்", "expansion"),
    "VENUS": ("சமநிலை", "balance"),
    "SATURN": ("சகிப்புத்தன்மை", "endurance"),
    "RAHU": ("தேடல்", "reaching"),
    "KETU": ("விடுதல்", "letting go"),
}

# §2.5. One opening clause per topic, used to reframe the STRONGEST graha's
# own `gift` (facet 1) into that domain — a grammatical hinge, not a new
# characterization. "At work, that shows up as..." / "In how you learn, that
# shows up as...". Eight entries, not the spec's estimated nine:
# TOPIC_THIRD_PARTY is the ninth non-UNKNOWN topic, and it is structurally
# unreachable here — Beat 7 only ever builds on the "self" register (every
# other register 404s before any beat is built), and TOPIC_THIRD_PARTY is
# only ever assigned on the "other" register. A dead entry that no test could
# ever exercise is worse than the KeyError a genuine mis-key would raise.
# CHILD_GROWTH/TEEN are unreachable on "self" today for the same structural
# reason (a minor's chart never reaches "self" — see build_chart_context) but
# are included anyway: the client_with_guardian register is next on this
# module's own roadmap and TEEN is its likely topic beat.
_TOPIC_LENS: dict[str, tuple[str, str]] = {
    "CHILD_GROWTH": ("வளர்ச்சியில், இது இப்படித் தெரியலாம்:", "In how they're growing, that shows up as"),
    "TEEN": ("உங்களை நிலைப்படுத்துவதில், இது இப்படித் தெரியலாம்:", "In how you're finding your footing, that shows up as"),
    "EDUCATION": ("நீங்கள் கற்கும் விதத்தில், இது இப்படித் தெரியலாம்:", "In how you learn, that shows up as"),
    "MARRIAGE": ("நீங்கள் தேர்ந்தெடுக்கும் விதத்தில், இது இப்படித் தெரியலாம்:", "In who and how you choose, that shows up as"),
    "MARRIED_LIFE": ("வீடு மற்றும் குடும்பத்தில், இது இப்படித் தெரியலாம்:", "In home and family, that shows up as"),
    "CAREER": ("வேலையில், இது இப்படித் தெரியலாம்:", "At work, that shows up as"),
    "ELDER": ("உடல்நலம் மற்றும் நீங்கள் ஒப்படைப்பதில், இது இப்படித் தெரியலாம்:", "In health and what you hand on, that shows up as"),
    "STEADYING": ("இப்போது உங்களை நிலைநிறுத்துவதில், இது இப்படித் தெரியலாம்:", "In what steadies you now, that shows up as"),
}

# Added 2026-08-11 (see _TABLE_PROVENANCE's own note above). A compressed
# paraphrase of `shadow` — NOT a substring of it, reviewed as its own clause —
# used in place of `shadow` for Beat 7's friction facet so a reading does not
# print the identical shadow sentence three times (Beat 3's closing clause,
# Beat 4's opening clause, and — before this table existed — Beat 7's own
# friction clause). One per graha, same size class as `_PERIOD_THEME`.
_SHADOW_ESSENCE: dict[str, tuple[str, str]] = {
    "SUN": ("நம்பாத நிலைப்பாட்டைத் தொடர்ந்து காப்பாற்றுதல்", "defending a position you no longer believe"),
    "MOON": ("சூழலின் மனநிலையை உங்களுக்குள் விட்டுவிடுதல்", "letting the room's mood become yours"),
    "MARS": ("தயாராகும் முன்பே ஒரு முடிவை வலுக்கட்டாயமாக வரவழைத்தல்", "forcing a decision before it's ready"),
    "MERCURY": ("இரு பக்கமும் வாதிட்டு எதுவும் வெல்லாமல் போகச் செய்தல்", "arguing both sides until neither wins"),
    "JUPITER": ("மறுக்கத் தெரியாமை", "not knowing how to say no"),
    "VENUS": ("எதிர்ப்பைச் சொல்லாமல் உள்ளுக்குள் விழுங்குதல்", "swallowing an objection instead of raising it"),
    "SATURN": ("வராத ஒரு உறுதிக்காகக் காத்திருத்தல்", "waiting for a certainty that never comes"),
    "RAHU": ("அடுத்ததற்காக முடிக்காமல் விட்டுவிடுதல்", "leaving things unfinished for what's next"),
    "KETU": ("தேவைப்படும் தருணத்திலேயே விலகிவிடுதல்", "withdrawing right when staying was needed"),
}

# Fixed, topic-invariant connectives — never counted toward the reviewable
# vocabulary cap, same treatment as beat 4's `_WORK_CONNECTIVE`/
# `_RELATIONSHIPS_CONNECTIVE` below.
_FRICTION_CONNECTIVE: tuple[str, str] = ("இது சிக்கலாக மாறும் இடம்:", "Where it runs into friction:")
_GUIDANCE_CONNECTIVE: tuple[str, str] = ("உதவக்கூடியது:", "One thing that might help:")
# The universal facet-5 fallback (§2.5's "single ... fallback clause"),
# deliberately used for EVERY topic rather than `action` verbatim. `action`
# is Beat 8's own closing sentence, keyed on the identical current-mahadasha
# lord Beat 7 would be keying it on too — using it here would print the same
# sentence twice in immediate succession, which is exactly the kind of
# self-repetition the forward-beat comment in one_minute_reading_service.py
# ("beat 4 already spent it") is written to avoid one module over. One fixed
# clause, reviewed once, costs nothing against the vocabulary cap for the
# same reason the beat-4 connectives do not.
_GUIDANCE_FALLBACK: tuple[str, str] = (
    "உங்கள் அடுத்த உரையாடலில் இது பற்றி ஒரு திறந்த கேள்வியைக் கொண்டு வாருங்கள்.",
    "bring one open question about it to your next conversation.",
)


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


# Fixed connective for Beat 4 (§2.2) — no `_transition` device needed here.
# `_transition` picks CONTRAST/CONTINUATION/NOTHING from two DIFFERENT
# sentences' orientation, which only makes sense when the two clauses could
# plausibly pull apart. Beat 4's two clauses come from ONE graha's
# `domain_flex` by construction (§0.3's invariant), so there is no
# contrast/continuation choice to make — a fixed light connective naming which
# domain each clause belongs to is honest and sufficient.
_WORK_CONNECTIVE: tuple[str, str] = ("வேலையில், இது இப்படித் தெரியலாம்:", "At work, that can look like")
_RELATIONSHIPS_CONNECTIVE: tuple[str, str] = (
    "உறவுகளில், இது இப்படித் தெரியலாம்:",
    "In relationships, it can look like",
)


def _beat_repeating_pattern(*, strongest: str) -> OneMinuteBeat:
    """5-minute Beat 4 (§2.2) — one shadow trait, relocated into two domains.

    ONE GRAHA, BY CONSTRUCTION (§0.3): reuses the SAME ``strongest`` graha
    Beat 3 already opened on, reuses that graha's own ``shadow`` clause
    verbatim as this beat's opening sentence, and appends only that graha's
    own ``domain_flex["WORK"]``/``domain_flex["RELATIONSHIPS"]`` — never a
    different graha's table, even if it would read well on its own. The
    structural guarantee is that this function has no branch that could pick
    a different graha for the two domain clauses than it used for ``shadow``;
    see ``test_beat_4_never_mixes_grahas`` for the test that checks this
    against the tables directly rather than trusting the copy.
    """
    voice = _VOICE[strongest]
    work_ta, work_en = voice.domain_flex["WORK"]
    relationships_ta, relationships_en = voice.domain_flex["RELATIONSHIPS"]
    shadow_ta, shadow_en = voice.shadow

    ta = (
        f"{shadow_ta[0].upper()}{shadow_ta[1:]}. "
        f"{_WORK_CONNECTIVE[0]} {work_ta}. "
        f"{_RELATIONSHIPS_CONNECTIVE[0]} {relationships_ta}."
    )
    en = (
        f"{shadow_en[0].upper()}{shadow_en[1:]}. "
        f"{_WORK_CONNECTIVE[1]} {work_en}. "
        f"{_RELATIONSHIPS_CONNECTIVE[1]} {relationships_en}."
    )

    return OneMinuteBeat(
        id="repeating_pattern",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(
            ta=f"{planet_ta(strongest)} — ஒரே இயல்பு, வேலையிலும் உறவிலும் மீண்டும் தெரிகிறது",
            en=f"{planet_en(strongest)} — the same trait, showing up twice",
        ),
    )


def _beat_last_period_extended(
    *, timeline: VimshottariTimeline, as_of: date, birth_date: date
) -> tuple[OneMinuteBeat, tuple[int, str] | None]:
    """5-minute Beat 5 (§2.3) — the 2-minute dated-past beat, plus one theme word.

    Reuses ``_beat_last_ten_years`` verbatim rather than re-deriving the span,
    the handover branch, or the hinge — the only thing this function adds is
    passing this module's own ``_PERIOD_THEME`` table in, so the theme word is
    looked up against the SAME lord the shared function already picked for
    ``past_texture``, never a second, independently-computed one. See that
    function's own ``theme_table`` docstring for why the dependency runs this
    direction and not the other.

    Renamed from ``last_ten_years`` to ``last_period`` on the wire — same
    precedent as Beat 3's ``strength_and_cost`` -> ``core_nature``: the text
    is no longer byte-identical to the 2-minute beat, so it gets its own id.
    """
    beat, hinge, _theme_lord = _beat_last_ten_years(
        timeline=timeline, as_of=as_of, birth_date=birth_date, theme_table=_PERIOD_THEME
    )
    return OneMinuteBeat(id="last_period", text=beat.text, basis=beat.basis), hinge


# Fixed, topic/graha-invariant connective for Beat 6's new clause — see
# _FRICTION_CONNECTIVE's own comment on why fixed connectives are not counted
# toward the reviewable vocabulary cap.
_ASKS_CONNECTIVE: tuple[str, str] = ("இந்தக் காலம் கேட்பது:", "What this period asks of you:")


def _beat_this_period_extended(
    *, timeline: VimshottariTimeline, hinge: tuple[int, str] | None
) -> OneMinuteBeat:
    """5-minute Beat 6 (§2.4) — the 2-minute right_now beat, plus what it asks.

    Reuses ``_beat_right_now`` verbatim for the hinge lead, the current lord
    and ``now_texture`` (what the period OFFERS) — appends only the new
    ``asks`` facet (what it REQUIRES). "self" is passed for ``addressed_to``
    unconditionally: this module never builds beats for any other register
    (see ``build_five_minute_reading``'s 404 guard).
    """
    base = _beat_right_now(timeline=timeline, hinge=hinge, addressed_to="self")
    asks_ta, asks_en = _VOICE[timeline.current_mahadasha.lord].asks

    return OneMinuteBeat(
        id="this_period",
        text=OneMinuteText(
            ta=f"{base.text.ta} {_ASKS_CONNECTIVE[0]} {asks_ta}.",
            en=f"{base.text.en} {_ASKS_CONNECTIVE[1]} {asks_en}.",
        ),
        basis=base.basis,
    )


def _beat_topic_in_full(
    *, topic: str, strongest: str, timeline: VimshottariTimeline
) -> OneMinuteBeat:
    """5-minute Beat 7 (§2.5) — composed, not authored, from tables that already exist.

    Facet 1 (style) is the strongest graha's own ``gift`` ALONE, reframed
    through this topic's ``_TOPIC_LENS`` opener — deliberately not paired
    with ``mechanism`` here, unlike Beat 3. Facet 3 (friction) uses
    ``_SHADOW_ESSENCE``, a compressed paraphrase of ``shadow``, not ``shadow``
    itself. Both are departures from a literal reading of §2.5, which named
    ``gift``/``mechanism``/``shadow`` verbatim as this beat's source facets —
    the first draft followed that literally. A manual read-through of
    rendered output on 2026-08-11 found that a literal reading made a single
    5-beat reading repeat Beat 3's own two sentences almost word for word
    here, four beats later, with ``shadow`` alone appearing a THIRD time
    counting Beat 4's opening clause. No test caught it: every beat was
    individually correct and spec-compliant, and Beats 3/4/7 each reusing the
    SAME graha is §0.3's own invariant working as designed — the repetition
    was only visible reading start to finish, the way a person actually
    would. Facet 4 (current emphasis) is ``_outlook`` unchanged: the
    identical call the 2-minute reading's own age-question beat already
    makes for this topic, not recomputed. Facet 5 (guidance) is the fixed
    ``_GUIDANCE_FALLBACK`` rather than ``action`` verbatim — see that
    constant's own comment for why.

    Caller-gated on ``topic != TOPIC_UNKNOWN``, same as the 2-minute reading's
    own age-question beat.
    """
    voice = _VOICE[strongest]
    lens_ta, lens_en = _TOPIC_LENS[topic]
    essence_ta, essence_en = _SHADOW_ESSENCE[strongest]

    next_change = timeline.current_antardasha.end_date
    outlook_ta, outlook_en = _outlook(
        topic,
        timeline.current_mahadasha.lord,
        (_month_year(next_change, "ta"), _month_year(next_change, "en")),
    )

    ta = " ".join(
        part
        for part in (
            f"{lens_ta} {voice.gift[0]}.",
            f"{_FRICTION_CONNECTIVE[0]} {essence_ta}.",
            outlook_ta,
            f"{_GUIDANCE_CONNECTIVE[0]} {_GUIDANCE_FALLBACK[0]}",
        )
        if part
    )
    en = " ".join(
        part
        for part in (
            f"{lens_en} {voice.gift[1]}.",
            f"{_FRICTION_CONNECTIVE[1]} {essence_en}.",
            outlook_en,
            f"{_GUIDANCE_CONNECTIVE[1]} {_GUIDANCE_FALLBACK[1]}",
        )
        if part
    )

    return OneMinuteBeat(
        id="topic_in_full",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(
            ta=f"கவனப் பகுதி {_TOPIC_AREA[topic]}; வலிமையான கிரகம் {planet_ta(strongest)}",
            en=f"Focus area {_TOPIC_AREA[topic]}; strongest graha {planet_en(strongest)}",
        ),
    )


# Where the withheld Beat 7 would have stood — the beat that comes right
# after it in the sequence below. Same device as
# one_minute_reading_service._QUESTION_ANCHOR_BEAT, own constant because this
# module's beat order differs from the 2-minute one.
_FIVE_MIN_QUESTION_ANCHOR_BEAT = "one_thing"


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
        _beat_repeating_pattern(strongest=context.strongest),
    ]

    # Elder path skips the dated past entirely, same call and same reasoning
    # as the 2-minute reading's own G6 branch: a 67-year-old knows his own
    # decades better than we do, and reciting them back is filler, not trust.
    if context.topic == TOPIC_ELDER:
        hinge: tuple[int, str] | None = None
    else:
        last_period_beat, hinge = _beat_last_period_extended(
            timeline=context.timeline, as_of=context.as_of, birth_date=context.profile.birth_date_local
        )
        beats.append(last_period_beat)

    beats.append(_beat_this_period_extended(timeline=context.timeline, hinge=hinge))

    # Withheld, not defaulted — identical reasoning to the 2-minute reading's
    # own age-question beat: every version of Beat 7 is a statement about the
    # reader's marriage, and we hold no fact that picks between them.
    if context.topic != TOPIC_UNKNOWN:
        beats.append(
            _beat_topic_in_full(
                topic=context.topic, strongest=context.strongest, timeline=context.timeline
            )
        )

    beats.append(_beat_one_thing(timeline=context.timeline, addressed_to=context.addressed_to))

    pending: OneMinutePendingQuestion | None = None
    if context.topic == TOPIC_UNKNOWN and not (context.profile.marital_status or "").strip():
        pending = _marital_status_pending_question(before_beat=_FIVE_MIN_QUESTION_ANCHOR_BEAT)

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
            pending_question=pending,
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
