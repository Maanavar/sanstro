""""Your Chart in Five Minutes" — the second rung of the reading ladder.

Spec: docs/FIVE_MINUTE_READING_SPEC_2026-08-11.md

WHAT THIS IS, RIGHT NOW. Eleven beats for ``self`` and a reduced six for
``client_with_guardian`` (§0.2). The spec's own §1 sequenced eight; §8
records why that sequence was rebuilt on 2026-08-11 and what changed.

THE READING IS A DESCENT, AND THAT IS THE FEATURE. Nature → the pattern it
repeats → the contradiction underneath it → the last period → this period
and the bhukti inside it → the transit window between now and a named month
→ the topic read from its own house → the next handover → the one thing.
Each level cites something the previous level did not, and the material gets
more specific and more dated as it goes.

It was not a descent before. An astrologer review of RENDERED OUTPUT, read
start to finish, found that this module contained *less chart* than the
two-minute reading it is sold as an upgrade from: it elaborated the most
cold-readable material (temperament) at greater length and never wired in
``_beat_next_ten_years`` at all, so the reader who chose five minutes over
two paid for the extra length by losing the forward horizon. Everything in
it was natal or dasha-level — true of a life, or of a stretch measured in
years — so nothing in it could be checked against the reader's next few
months, which is what a returning reader actually verifies. Three beats
exist to correct that (``the_tension``, ``window_ahead``,
``what_comes_after``) and a fourth was rebuilt for the same reason
(``topic_in_full``).

Reused verbatim from ``one_minute_reading_service``: identity, what this
rests on, the dated past, and the forward horizon. The rest:

- **Core nature** (§2.1) — ``gift``, then ``shadow``, with ``mechanism``
  hinging INTO the shadow rather than off the gift. The first build had it
  the other way round; see ``_beat_core_nature_extended``.
- **Repeating pattern** (§2.2/§0.3) — one graha's ``shadow`` relocated into
  ``domain_flex["WORK"]``/``["RELATIONSHIPS"]``, never a second graha's
  table, and never restating the shadow sentence it follows.
- **The tension** (§8, NEW) — ``_LAGNA_FACE`` against ``_MOON_MIND``: how
  the reader is met against how they actually decide. Both tables have been
  written, reviewed and unwired since the 2-minute module cut its rasi
  clauses for length, held explicitly "for the longer reading". Withheld
  when the birth time is not confirmed, because the lagna is the value a
  twenty-minute error moves.
- **Right now** (§2.4) — the 2-minute ``_beat_right_now``, plus ``asks``
  (what the period REQUIRES, against ``now_texture``'s what it OFFERS), plus
  what the running antardasha adds via ``_BHUKTI_FLAVOR`` — with the
  bhukti's real end date, which was computed and disclosed in ``basis`` but
  never spoken until 2026-08-11.
- **The window ahead** (§8, NEW) — the only beat in either reading that is
  about this season rather than this life. Sani's house from the janma rasi,
  its classical gochara texture, the almanac's own name for the position
  where one exists, and the month it moves on.
- **Your [topic] in full** (§2.5, REBUILT) — the topic's own house, that
  house's adhipathi, and where the adhipathi sits. It used to be the
  strongest graha's ``gift`` behind a lens, which printed Beat 3's opening
  clause a second time under a different label; see
  ``_beat_topic_in_full``. Withheld exactly when the 2-minute age-question
  beat would be (``topic == TOPIC_UNKNOWN``), and for the same reason: a
  topic we cannot pick without a fact we do not hold is asked for, not
  guessed at.
- **One thing** — ``action``, naming the period it descends from rather than
  arriving unattributed at the end of four dated beats.

THE GUARD THAT MAKES THE ABOVE SAFE is ``repeated_source_clauses``. Every
copy defect this module has shipped was a beat printing a content string
another beat had already spent, every one was found by a human reading
output start to finish, and none by a test — because each beat was
individually correct and the defect lived only in adjacency. That function
scans an assembled reading by reflection over both modules' content tables;
add a beat, and it is covered without anybody remembering to cover it.

REGISTER SCOPE (§0.2). ``self`` ships full (8 beats). ``client_with_guardian``
ships reduced (6 beats: identity, rests-on, nature, current period,
age-topic mini-reading, one thing) — a 13-to-17-year-old reading their own
chart, addressed directly, same register the 2-minute reading already gates
this way. Two beats drop entirely: Beat 4 (repeating pattern, built from
``shadow``) and Beat 5 (dated past — degenerate by construction below age 18,
same reasoning the 2-minute reading's own client_with_guardian block already
gives for dropping ``last_ten_years``). Two beats are built REDUCED rather
than reused verbatim, both to keep the same character-verdict material the
2-minute reading already refuses this register out of the 5-minute versions
too: Beat 3 drops its ``shadow`` sentence (``_beat_core_nature_extended``'s
own ``addressed_to`` branch); Beat 7's friction facet swaps
``_SHADOW_ESSENCE`` for the graha's own ``nature`` line — dispositional, not
a verdict, the same standard the 2-minute reading already applies to keep
``nature`` in this register's opening beat while dropping its strength/
shadow beat outright (``_beat_topic_in_full``'s own ``addressed_to`` branch).
``parent``/``other`` are not designed for this length per the spec and never
will be — same 404 the flag gate returns when off, not a fallback beat set.

Reuses ``ChartContext``/``build_chart_context`` from ``one_minute_reading_
service`` rather than recomputing anything — see that module's docstring on
``ChartContext`` for why a second computation is a live risk, not a style
preference.
"""
from __future__ import annotations

from datetime import UTC, date, datetime

from fastapi import HTTPException, status

from app.calculations.astro import (
    house_from_reference,
    julian_day_to_utc_datetime,
    rasi_from_degree,
    utc_datetime_to_julian_day,
)
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.dasha import VimshottariTimeline
from app.calculations.display_names import planet_en, planet_ta
from app.calculations.ephemeris import saturn_longitude_at_jd
from app.calculations.house_lords import (
    house_lord_title,
    house_rasi,
    house_significations,
    strength_band,
)
from app.calculations.transits import find_saturn_egress_jd
from app.schemas.charts import PlanetPosition
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
    _AREA_NOUN,  # noqa: PLC2701 (internal use)
    _LAGNA_FACE,  # noqa: PLC2701 (internal use)
    _LONGEVITY_REFUSAL,  # noqa: PLC2701 (internal use)
    _MOON_MIND,  # noqa: PLC2701 (internal use)
    _TOPIC_AREA,  # noqa: PLC2701 (internal use)
    _VOICE,  # noqa: PLC2701 (internal use)
    TOPIC_ELDER,
    TOPIC_UNKNOWN,
    BaseRate,
    ChartContext,
    Provenance,
    _beat_last_ten_years,  # noqa: PLC2701 (internal use)
    _beat_next_ten_years,  # noqa: PLC2701 (internal use)
    _beat_one_thing,  # noqa: PLC2701 (internal use)
    _beat_right_now,  # noqa: PLC2701 (internal use)
    _beat_what_this_rests_on,  # noqa: PLC2701 (internal use)
    _beat_who_you_are,  # noqa: PLC2701 (internal use)
    _cap,  # noqa: PLC2701 (internal use)
    _marital_status_pending_question,  # noqa: PLC2701 (internal use)
    _month_year,  # noqa: PLC2701 (internal use)
    _outlook,  # noqa: PLC2701 (internal use)
    _word_count,  # noqa: PLC2701 (internal use)
    forward_beat_names_mahadasha_handover,
)

CALC_VERSION = "five-minute-reading-v1.0-2026"


def require_five_minute_reading_enabled() -> None:
    """404 while the rollout flag is off — identical gating to the 2-minute reading.

    404 rather than 403, checked before the chart is looked up: see
    ``require_one_minute_reading_enabled``'s docstring, which this mirrors.
    """
    if not bool(get_flag("five_minute_reading")):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not available.")


# Held to the same rule the 2-minute ceilings were held to after four unpaid
# raises (see that module's MAX_WORDS_EN comment trail): this is the outer
# edge, asserted by test, and it does not rise without a cut elsewhere paying
# for it. Per-register from day one — spec §0.4.
#
# LOWERED FROM 950/550 ON 2026-08-11, WHICH IS NOT THE DIRECTION THIS USUALLY
# MOVES. §0.4 derived 950 from the clock (~4m19s at 220 wpm) before any copy
# existed, which was the right way to set a first number and the wrong number
# to keep once there was something to measure. The widest reading this module
# produces is 519 English words and 357 Tamil (a 67-year-old on the ELDER
# topic, which carries the longevity refusal on top of a full topic beat) —
# see the sweep below. A ceiling at 950 sits 82% above the worst real case: it
# cannot fail, so it is not a guard, it is a comment with an assert around it.
#
# 650/450 keeps ~25% headroom over the measured worst case — enough that
# ordinary table growth does not trip it, tight enough that the beat somebody
# adds without reading this comment does. That is the whole job.
#
# WORTH SAYING PLAINLY, because the number is now visible: this reading is
# nowhere near five minutes of prose, and three beats were ADDED in the pass
# that established that. RESOLVED 2026-08-12 by renaming the surface to "four
# minutes" (spec §8.7) rather than padding to reach the old name, which would
# have undone the entire point of §0.4 — a reader who checks a clock against a
# promise that undershoots trusts the next promise less.
#
# The decision was measured, not argued. Sweeping 120 charts (10 ages x 4
# marital statuses x 3 birth times) through BOTH readings on the same charts:
#
#     2-minute EN   min 207   median 236   max 268
#     5-minute EN   min 388   median 487   max 519
#     5-minute TA   min 270   median 332   max 357
#     ratio EN      min 1.83  median 2.01  max 2.15
#
# Two things fall out of that table, and the second is the useful one.
#
# First, the longer reading is almost exactly TWICE the shorter one on every
# chart — a 0.32 spread across 120 charts. The content ladder is 2.0x while
# the names promised 2.5x, and the names were the part that could move.
#
# Second, THE PRODUCT ALREADY SET ITS OWN WORDS-PER-MINUTE RATE and nobody had
# written it down. The 2026-08-10 rename shipped a 236-word median reading
# under the label "two minutes": 118 words per advertised minute. Not a
# reading-speed estimate — a labelling convention, and the right one for copy
# a person stops to check against their own life. At that rate 487 words is
# 4.1 minutes, so this is a four-minute reading. Which gives the 15-minute
# module an objective rule instead of a fresh argument:
#
#     advertised minutes = round(median EN words / 118)
#
# Re-measure with `word_count` across a chart sweep whenever beats are added;
# the name follows the measurement, never the other way round.
_FIVE_MIN_WORD_BUDGET: dict[str, tuple[int, int]] = {
    "self": (650, 450),
    # Unchanged, and now the looser of the two: this register lost its
    # `mechanism` clause and its whole facet-3 in the same pass, so its real
    # worst case moved DOWN from whatever it was. Left alone rather than
    # re-measured because a teen reading needs `is_own_chart` plus an age
    # inside 13-17, which the sweep above does not construct — asserting a
    # tightened number this session cannot check would be worse than an honest
    # loose one.
    "client_with_guardian": (650, 380),
}


def word_budget(addressed_to: str) -> tuple[int, int]:
    """The (en, ta) ceiling for one five-minute reading. Asserted by test."""
    return _FIVE_MIN_WORD_BUDGET[addressed_to]


# Clauses a reading is allowed to print more than once, and there are none
# yet — the set exists so that adding one is a decision somebody writes down
# rather than a test edit. A repeated fixed connective ("At work,") is not a
# candidate: `repeated_source_clauses` below only ever sees CONTENT strings,
# because that is all the tables it scans hold.
_REPETITION_ALLOWED: frozenset[str] = frozenset()

# Every table whose entries are content rather than frame, in either module,
# flattened to the bilingual strings a beat can print. This is what the
# repetition guard scans a rendered reading against.
#
# Deliberately built by REFLECTION over the tables rather than by listing the
# facets a beat is known to use. The whole failure class this guards is a beat
# reaching for a string somebody did not realise another beat had already
# spent — a hand-maintained list would have to be updated by exactly the person
# who did not realise it, which is the same reason the provenance test in the
# 2-minute suite is bidirectional rather than a checklist.
def _content_strings() -> set[str]:
    strings: set[str] = set()
    for voice in _VOICE.values():
        for facet in (voice.gift, voice.shadow, voice.life_lesson, voice.past_texture,
                      voice.now_texture, voice.action, voice.asks, voice.mechanism):
            strings.update(facet)
        strings.update((voice.nature.ta, voice.nature.en))
        for domain in voice.domain_flex.values():
            strings.update(domain)
    # `_PERIOD_THEME` is DELIBERATELY NOT SCANNED, and the reason generalises:
    # its entries are single common words ("change", "learning", "balance"),
    # and a substring search for a single common word finds it everywhere. The
    # concrete case — not hypothetical, it is one Moon mahadasha away — is that
    # `_beat_right_now`'s maha branch opens "That changed in 2020" while the
    # theme prefix on the beat before it prints "Change: ". Both contain
    # "change", neither is a repetition, and the guard would have failed a
    # correct reading. A guard that cries wolf on correct output is a guard
    # somebody switches off.
    #
    # Nothing is lost by the exclusion: the theme word has two checks of its
    # own already — `_theme_prefix` suppresses it when `past_texture` contains
    # it, and `test_last_period_theme_never_names_a_different_lord_than_the_
    # span_it_opens` checks the cross-beat seam it actually participates in.
    #
    # THE GENERAL RULE, for whoever adds the next table here: this scans for
    # repeated CLAUSES. A table of single words or short nouns does not belong
    # in it, because substring matching cannot tell a repetition from a
    # coincidence at that length. `_AREA_NOUN` is out for the same reason.
    for table in (_SHADOW_ESSENCE, _BHUKTI_FLAVOR, _GOCHARA_SANI,
                  _LORD_STRENGTH_NOTE, _LAGNA_FACE, _MOON_MIND):
        for entry in table.values():
            strings.update(entry)
    return {s for s in strings if s and s not in _REPETITION_ALLOWED}


def repeated_source_clauses(beats: list[OneMinuteBeat]) -> dict[str, list[str]]:
    """Content strings that appear in more than one beat of one reading.

    THE GUARD THAT WOULD HAVE CAUGHT EVERY COPY DEFECT THIS MODULE HAS HAD.
    All three of them — Beat 4 reopening on ``shadow`` verbatim, Beat 7
    printing ``shadow`` a third time, Beat 7 printing ``gift`` after Beat 3
    had spent it — were found by a person reading rendered output start to
    finish, and none by a test, for the same structural reason each time:
    every beat was individually correct, every table lookup was the one the
    spec named, and the defect existed only in the ADJACENCY of two beats that
    no test looked at together. A per-beat suite cannot see it by
    construction.

    Returns ``{clause: [beat ids]}`` for every content string printed by two
    or more beats — empty when the reading is clean. Substring matching, not
    equality, because that is how the repetition actually shows up: Beat 3
    embeds ``shadow`` inside a longer sentence and Beat 4 embedded the same
    string inside a different one.

    Scoped to CONTENT strings only. Fixed connectives are meant to recur and
    counting them would make the guard fire on every reading, which is the
    fastest way to have it switched off.
    """
    repeats: dict[str, list[str]] = {}
    for clause in _content_strings():
        hits = [
            beat.id
            for beat in beats
            if clause in beat.text.ta or clause in beat.text.en
        ]
        if len(hits) > 1:
            repeats[clause] = hits
    return repeats


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
    # Added 2026-08-11 (see `_BHUKTI_FLAVOR`'s own comment below). A rule
    # applied to the antardasha lord's own significations, read onto the
    # mahadasha it is currently running inside — same class as `now_texture`
    # itself, one level finer.
    "_BHUKTI_FLAVOR": (Provenance.RULE, BaseRate.KEYED),
    # §7 (added 2026-08-11). Classical gochara: what Sani pressing the Nth
    # from the janma rasi tends to ask for. RULE for the same reason
    # `past_texture`/`now_texture` are — it describes a PERIOD under a rule,
    # never the reader, and never an occurrence. KEYED because the house
    # counted from the natal Moon is a chart fact this reader shares with
    # roughly one person in twelve, not with everybody.
    "_GOCHARA_SANI": (Provenance.RULE, BaseRate.KEYED),
    # The named phase (ஏழரை சனி / அஷ்டம சனி / அர்த்தாஷ்டம சனி) for the five
    # positions the Tamil almanac names. A FRAME rather than a claim: the
    # texture clause it sits beside is what actually says anything, and this
    # only supplies the name a reader would already have heard for it.
    "_SANI_PHASE_NAME": (Provenance.FRAME, BaseRate.KEYED),
    # §2.5, rebuilt 2026-08-11. Which house a topic is read from. A doctrinal
    # mapping, not a characterization — the FRAME class it shares with
    # `_TOPIC_LENS`, for the same reason: it decides which chart fact gets
    # spoken and asserts nothing on its own.
    "_TOPIC_HOUSE": (Provenance.FRAME, BaseRate.KEYED),
    # §2.5 facet 2, added 2026-08-11. What the topic house's adhipathi's own
    # strength band means for that side of the life. A rule applied to a
    # computed score — same class as every other period/placement reading
    # here, and DERIVED-adjacent in the sense that the band it keys on is a
    # number this chart produced rather than a table lookup.
    "_LORD_STRENGTH_NOTE": (Provenance.RULE, BaseRate.KEYED),
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

# Added 2026-08-11, in response to an astrologer review of the module's own
# copy: `_beat_this_period_extended` spoke only in the mahadasha lord's
# voice, so two readings of the same person taken years apart inside the
# same ~10-year mahadasha rendered an identical Beat 6 — the antardasha
# (bhukti), which is what actually makes a Moon-Saturn stretch feel
# different from a Moon-Venus one, was computed (`timeline.
# current_antardasha`, already cited in `_beat_right_now`'s own `basis`
# field) but never spoken in the body text. This table is what that
# antardasha lord adds, one entry per graha, phrased as a complete
# predicate ("adds...", "brings...", "pushes...") so the caller only ever
# concatenates whole words — never splices a case ending onto a bare noun,
# the exact class of Tamil-morphology bug the KETU `shadow` entry's own
# comment (above) already warns against.
#
# Deliberately NOT keyed on the (maha, antar) pair — that is an 81-entry
# cross-product, exactly the "COPY VOCABULARY SIZE" trap this module's own
# §2.5 already refused once for Beat 7. One axis: what THIS lord's bhukti
# adds, independent of which mahadasha it is currently running inside.
# Withheld entirely when the antardasha lord IS the mahadasha lord
# (swabhukti — the common case at the start of every mahadasha): there is
# nothing new to add in that case, and reusing this table there would
# reproduce the exact same-clause-twice defect `_beat_repeating_pattern`
# was just fixed for, one beat over.
_BHUKTI_FLAVOR: dict[str, tuple[str, str]] = {
    "SUN": (
        "கூடுதல் கவனிப்பைக் கொண்டுவருகிறது, நல்லதோ கெட்டதோ",
        "brings extra visibility, for better or worse",
    ),
    "MOON": (
        "வழக்கத்தை விட மனநிலைக்கும் மனிதர்களுக்குமான அதிக உணர்திறனைக் கொண்டுவருகிறது",
        "brings more sensitivity to mood and people than usual",
    ),
    "MARS": (
        "இந்தக் காலம் மற்றபடி கேட்பதை விட வேகமாக நகரும்படி தூண்டுகிறது",
        "pushes you to move faster than the rest of this stretch asks for",
    ),
    "MERCURY": (
        "அதிக பேச்சையும், ஆவணங்களையும், பின்னும் முன்னுமான ஓட்டத்தையும் கொண்டுவருகிறது",
        "brings more talk, more paperwork, more back-and-forth",
    ),
    "JUPITER": (
        "மீதமுள்ள காலம் தராத வளர்ச்சிக்கான இடத்தைத் திறக்கிறது",
        "opens room to grow that the rest of the stretch may not offer",
    ),
    "VENUS": (
        "மற்றபடி கேட்பதற்குள் ஓர் எளிதான பகுதியைக் கொண்டுவருகிறது",
        "brings an easier patch inside whatever the stretch is otherwise asking for",
    ),
    "SATURN": (
        "இலகுவான காலத்திற்குள்ளும் கூடுதல் சுமையையும் மெதுவான நகர்வையும் சேர்க்கிறது",
        "adds extra weight and slower going, even inside a lighter stretch",
    ),
    "RAHU": (
        "புதிதாக ஏதோ ஒன்றை நோக்கிய நிலையற்ற ஈர்ப்பைச் சேர்க்கிறது",
        "adds an unsettled pull toward something new",
    ),
    "KETU": (
        "தொடங்குவதை விட முடிப்பதை நோக்கிய ஈர்ப்பைச் சேர்க்கிறது",
        "adds a pull to close things off rather than start them",
    ),
}
# NATIVE-TAMIL REVIEW PASSED 2026-08-12 — owner sign-off, all nine entries,
# read as a set. Each was checked to end in a finite predicate that completes
# the caller's frame on its own, which is the whole-words rule this table's
# comment above states and the reason no entry can be spliced with a case
# ending. This was the LAST pending Tamil marker in this module.

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
#
# THE OPENER LOST ITS "that shows up as" ON 2026-08-11, with the rebuild of the
# beat it opens. That trailing clause existed to hand off to a temperament
# facet ("At work, that shows up as judgment people trust enough to act on"),
# and "that" is what made the hand-off a repetition rather than a reading — it
# pointed back at a trait the reading had already spent, which is precisely how
# the same sentence ended up printed twice. Now that the beat opens on a house
# and its adhipathi, the lens has only one job left: name the domain and get
# out of the way. Each entry is a bare locative phrase with its own comma, and
# the sentence after it stands on its own.
_TOPIC_LENS: dict[str, tuple[str, str]] = {
    "CHILD_GROWTH": ("வளர்ச்சியில்,", "In how they're growing,"),
    "TEEN": ("உங்களை நிலைப்படுத்துவதில்,", "In how you're finding your footing,"),
    "EDUCATION": ("நீங்கள் கற்கும் விதத்தில்,", "In how you learn,"),
    "MARRIAGE": ("நீங்கள் தேர்ந்தெடுக்கும் விதத்தில்,", "In who and how you choose,"),
    "MARRIED_LIFE": ("வீடு மற்றும் குடும்பத்தில்,", "In home and family,"),
    "CAREER": ("வேலையில்,", "At work,"),
    "ELDER": ("உடல்நலம் மற்றும் நீங்கள் ஒப்படைப்பதில்,", "In health and what you hand on,"),
    "STEADYING": ("இப்போது உங்களை நிலைநிறுத்துவதில்,", "In what steadies you now,"),
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

# ── The dated window (§7, added 2026-08-11) ──────────────────────────────────
#
# Added in response to the same astrologer review that produced the beat-3 and
# beat-7 fixes above, against a specific complaint: a reader who chooses the
# five-minute reading over the two-minute one is asking for more CHART, and the
# five-minute module was answering with more sentences about the same natal
# temperament. Every beat in it was natal — nothing in the reading was true of
# this month rather than of this life, so nothing in it could be checked
# against the reader's next few seasons.
#
# Gochara is the cheapest honest answer to that, and Sani is the right graha to
# spend it on: it is the slowest of the seven, so its position holds long
# enough to be worth dating; the Tamil almanac audience already knows ஏழரை சனி
# by name and expects it to be spoken; and its house from the janma rasi is a
# single integer this module can compute without a second chart load.
#
# ONE GRAHA, DELIBERATELY. Adding Guru's twelve houses from the Moon would
# double this table for a transit that moves four times as fast and therefore
# dates four times as coarsely, and the module's own §2.5 already refused a
# cross-product once for exactly this reason. Guru's position is named in
# `basis` and nowhere else.
#
# Classical placement, and it is not evenly distributed: Sani from the Moon is
# held favourable in 3, 6 and 11, hardest in 1, 2 and 12 (the ஏழரை சனி triad),
# 4 (அர்த்தாஷ்டம) and 8 (அஷ்டம), mixed elsewhere. The strings below carry that
# without grading it — each says what the stretch ASKS FOR, present tense, no
# occurrence, which is the same Rule-1 discipline `past_texture` is held to.
_GOCHARA_SANI: dict[int, tuple[str, str]] = {
    1: (
        "இந்தக் காலம் உங்கள் உடலையும் மனநிலையையும் நேரடியாகச் சோதிக்கிறது; முன்பு எளிதாக இருந்தவை "
        "இப்போது கூடுதல் முயற்சி கேட்கின்றன",
        "this stretch presses directly on your body and your mood; things that used to take little "
        "effort now ask for more",
    ),
    2: (
        "இது பணத்தையும் குடும்பத்தில் நீங்கள் பேசும் விதத்தையும் சோதிக்கிறது; இந்தக் காலத்தில் "
        "செலவும் சொல்லும் கவனமாக இருக்க வேண்டும்",
        "it presses on money and on how you speak inside the family; spending and wording both "
        "repay care in this stretch",
    ),
    3: (
        "இது சனி நன்றாக நிற்கும் இடங்களில் ஒன்று — முயற்சி பலன் தருகிறது, எதிர்ப்பு தானாகக் குறைகிறது",
        "this is one of the places Saturn stands well — effort pays here, and opposition thins out "
        "on its own",
    ),
    4: (
        "இது வீட்டையும் உள்ளுக்குள்ளான நிம்மதியையும் சோதிக்கிறது; நீங்கள் நிற்கும் தளமே "
        "பரிசோதிக்கப்படுகிறது",
        "it presses on home and on your inner quiet; the ground you stand on is what is being "
        "tested",
    ),
    5: (
        "இது உங்கள் தீர்ப்பையும், நீங்கள் உருவாக்குவதையும், பிள்ளைகள் சார்ந்ததையும் சோதிக்கிறது; "
        "இந்தக் காலத்தில் சூதாட்டம் பொருந்தாது",
        "it presses on your judgment, on what you make, and on anything to do with children; this "
        "is not a stretch that rewards a gamble",
    ),
    6: (
        "இது சனி நன்றாக நிற்கும் இடங்களில் ஒன்று — கடன், நோய், எதிரிகள் மூன்றுமே வலு இழக்கின்றன",
        "this is one of the places Saturn stands well — debts, illness and opposition all lose "
        "ground",
    ),
    7: (
        "இது கூட்டாண்மையையும் வாழ்க்கைத் துணையையும் சோதிக்கிறது; ஒப்பந்தங்களும் உறவுகளும் இப்போது "
        "எடையைச் சுமக்கின்றன",
        "it presses on partnership, in marriage and in agreements alike; both are carrying weight "
        "in this stretch",
    ),
    8: (
        "இது இந்த வட்டத்தின் மிகக் கடினமான இடம் — தாமதங்கள், மறைவான செலவுகள், உடல்நலம்; ஓய்வுதான் "
        "இங்கே உண்மையான பரிகாரம்",
        "this is the hardest position in the cycle — delays, hidden costs, health; rest is the "
        "real remedy here rather than more effort",
    ),
    9: (
        "இது அதிர்ஷ்டத்தையும் தந்தை சார்ந்ததையும் சோதிக்கிறது; முயற்சிக்குரிய பலன் வர நேரம் எடுக்கிறது",
        "it presses on fortune and on anything to do with your father; effort takes longer than it "
        "should to return",
    ),
    10: (
        "இது தொழிலையும் அந்தஸ்தையும் சோதிக்கிறது; இந்தக் காலத்தில் பெயர் மெதுவாகவே சம்பாதிக்கப்படுகிறது",
        "it presses on work and standing; in this stretch a reputation is earned slowly and never "
        "handed over",
    ),
    11: (
        "இது சனி மிகச் சிறப்பாக நிற்கும் இடம் — வருமானமும், உங்களைச் சுற்றியுள்ள வட்டமும் "
        "விரிவடைகின்றன",
        "this is the strongest place Saturn stands — income and the circle around you both widen",
    ),
    # Says nothing about the cycle OPENING, deliberately: house 12 is the one
    # position whose `_SANI_PHASE_NAME` entry already carries that word ("the
    # opening phase of Ezharai Sani"), and the first draft had the beat render
    # "the opening phase of Ezharai Sani. This is where the cycle opens" — the
    # name and its gloss saying the same thing in consecutive clauses. The
    # other four named positions have no such collision, so only this entry
    # was rewritten.
    12: (
        "செலவும், தூரமும், கலைந்த தூக்கமும் வழக்கத்தை விட அதிக எடையாகின்றன; குறைவாகச் செலவழித்து "
        "அதிகமாக ஓய்வெடுக்கும்படி இந்தக் காலம் கேட்கிறது",
        "expense, distance and broken sleep all weigh more than they used to; this is the stretch "
        "that asks you to spend less and rest more",
    ),
}
# NATIVE-TAMIL REVIEW PASSED 2026-08-12 — owner sign-off on all twelve
# entries, read as a set against the classical placement documented above.
# House 12's silence about the cycle OPENING was reviewed and is deliberate
# (see that entry's own comment); it is not an omission to repair.

# The five positions the Tamil almanac names outright. Tamil naming, not the
# Sanskrit — this is the vocabulary the audience already reads in the panchangam
# every year, and the enum-vs-display split every other surface here follows.
# The other seven houses get no name because the almanac gives them none, and
# inventing one would be a claim dressed as a convention.
#
# Written as NOUN PHRASES, not as appositive fragments, because of where they
# land. The first draft read "Ezharai Sani, first phase" and was spliced in as
# ", {phase}," ahead of an em-dash — which rendered "transiting the 12th from
# your Moon, Ezharai Sani, first phase, — this is where the cycle opens": three
# commas and a dangling dash around a name. A phrase that can complete "— {x}."
# on its own needs no punctuation supplied by the caller, which is the same
# whole-words rule `_BHUKTI_FLAVOR` states for its own entries.
_SANI_PHASE_NAME: dict[int, tuple[str, str]] = {
    12: ("ஏழரை சனியின் தொடக்கக் கட்டம்", "the opening phase of Ezharai Sani"),
    1: ("ஏழரை சனியின் உச்சக் கட்டம்", "the peak of Ezharai Sani"),
    2: ("ஏழரை சனியின் இறுதிக் கட்டம்", "the closing phase of Ezharai Sani"),
    4: ("அர்த்தாஷ்டம சனி", "Ardhashtama Sani"),
    8: ("அஷ்டம சனி", "Ashtama Sani"),
}
# NATIVE-TAMIL REVIEW PASSED 2026-08-12 — owner sign-off, all five entries,
# confirming these are the almanac's own names and not a translation of them.

# §2.5 rebuilt. Which house each topic is actually read from — the fact that
# makes Beat 7 a chart reading rather than a relabelled temperament note.
# Standard significations: 10 for work, 7 for marriage, 5 for study, 4 for
# home/comfort/peace of mind, 6 for health.
#
# TOPIC_MARRIED_LIFE takes 4 and not 7 on purpose. Its own `_TOPIC_LENS` opener
# is "In home and family" and `_TOPIC_AREA` routes it to FAMILY_HARMONY — this
# topic is reached by someone who is already married, so the question it
# carries is the household, which is the 4th. TOPIC_MARRIAGE, which is reached
# before a marriage, takes the 7th.
_TOPIC_HOUSE: dict[str, int] = {
    "CHILD_GROWTH": 4,
    "TEEN": 4,
    "EDUCATION": 5,
    "MARRIAGE": 7,
    "MARRIED_LIFE": 4,
    "CAREER": 10,
    "ELDER": 6,
    "STEADYING": 4,
}

# What the topic house's adhipathi's own strength band means for that side of
# the life. Three strings, keyed on the band `house_lords._band` already
# computes from `strength_score` — the number is this chart's own, so this
# clause moves between readers where a table lookup would not.
_LORD_STRENGTH_NOTE: dict[str, tuple[str, str]] = {
    "STRONG": (
        "அது அங்கே வலுவாக இருக்கிறது — அதனால் வாழ்க்கையின் இந்தப் பகுதி அழுத்தத்தில் தானாகவே "
        "தாங்கிக்கொள்கிறது",
        "it is strong there, so this side of your life tends to hold under pressure without being "
        "rescued",
    ),
    "MODERATE": (
        "அது அங்கே நடுத்தரமாக இருக்கிறது — இந்தப் பகுதி முயற்சிக்குப் பதில் தருகிறது, ஆனால் தானாக "
        "நடப்பதில்லை",
        "it is moderate there — this side of your life answers to effort, but it does not run "
        "itself",
    ),
    "WEAK": (
        "அது அங்கே பலவீனமாக இருக்கிறது — அதனால்தான் இந்தப் பகுதிக்கு எப்போதும் கூடுதல் கவனம் "
        "தேவைப்பட்டிருக்கிறது",
        "it is not strong there, which is why this side of your life has always needed more "
        "deliberate attention than it looks like it should",
    ),
}
# NATIVE-TAMIL REVIEW PASSED 2026-08-12 — owner sign-off, all three bands.

# Fixed, topic-invariant connectives — never counted toward the reviewable
# vocabulary cap, same treatment as beat 4's `_WORK_CONNECTIVE`/
# `_RELATIONSHIPS_CONNECTIVE` below.
_FRICTION_CONNECTIVE: tuple[str, str] = ("இது சிக்கலாக மாறும் இடம்:", "Where it runs into friction:")
_GUIDANCE_CONNECTIVE: tuple[str, str] = ("உதவக்கூடியது:", "One thing that might help:")
# The universal facet-5 fallback (§2.5's "single ... fallback clause"),
# deliberately used for EVERY topic rather than `action` verbatim. `action`
# is the closing beat's own sentence, keyed on the identical current-mahadasha
# lord Beat 7 would be keying it on too — using it here would print the same
# sentence twice in immediate succession, which is exactly the kind of
# self-repetition the forward-beat comment in one_minute_reading_service.py
# ("beat 4 already spent it") is written to avoid one module over. One fixed
# clause, reviewed once, costs nothing against the vocabulary cap for the
# same reason the beat-4 connectives do not.
#
# BOTH ITS NOUNS ARE NAMED, and neither was until 2026-08-11. The old string —
# "bring one open question about it to your next conversation" — closed a beat
# with two dangling references: "it" pointed at a topic the sentence never
# names, and "your next conversation" at nobody in particular, so the reading's
# final piece of advice was the vaguest sentence in it. `{area}` comes from
# `_AREA_NOUN`, the same table the outlook clause above it now names its own
# subject from, and the listener is described rather than left blank.
#
# The Tamil takes `{area}` under `பற்றி`, a postposition that governs the bare
# noun — so this frame splices no case ending onto the table entry, the
# discipline `_BHUKTI_FLAVOR`'s own comment sets out.
_GUIDANCE_FALLBACK: tuple[str, str] = (
    "{area} பற்றி ஒரு திறந்த கேள்வியை, நீங்கள் உண்மையில் நம்பும் ஒருவரிடம் கொண்டு செல்லுங்கள்.",
    "take one open question about {area} to the next person whose judgment you actually trust.",
)


def _beat_core_nature_extended(*, strongest: str, addressed_to: str) -> OneMinuteBeat:
    """5-minute Beat 3 (§2.1) — gift, its mechanism, shadow. One graha, one beat.

    Extends the 2-minute reading's ``_beat_strength_and_cost`` with exactly
    the one clause that function's own docstring names and stops short of:
    the mechanism that makes "gift, then cost" read as one causal object.

    THE MECHANISM HINGES INTO THE SHADOW, NOT OFF THE GIFT, and the first
    build had it the other way round. It rendered ``{gift} — {mechanism}.
    {shadow}.``, which puts a "because" clause immediately after the
    strength — so the sentence reads as explaining why the reader is good at
    something, and every one of these clauses is written to explain how the
    good thing turns into the cost. An astrologer review on 2026-08-11 caught
    it on Jupiter, where the effect is worst ("your real strength is judgment
    people trust — because the same generosity ... does not know how to
    stop"): a strength explained BY its own failure mode, which is not a
    causal claim anyone can follow. Seven of the nine strings were already
    written as gift→shadow bridges and were simply being printed on the wrong
    side of the full stop; Sun's and Jupiter's were not, and were rewritten
    with the rest of this fix rather than relabelled.

    On ``client_with_guardian``, drops the shadow sentence entirely (§0.2):
    a character verdict a 13-to-17-year-old has not earned, the same
    reasoning the 2-minute reading already applies by omitting this beat's
    2-minute equivalent (``_beat_strength_and_cost``) from that register
    outright. ``mechanism`` goes with it, and that is a consequence of the
    fix above rather than a second decision: once the clause is understood as
    the hinge INTO the shadow, a register that does not get the shadow has
    nothing for it to hinge into, and printing it alone would attach a
    cost-explaining clause to a gift with no cost named.
    """
    voice = _VOICE[strongest]

    if addressed_to == "client_with_guardian":
        ta = f"உங்கள் உண்மையான பலம் {voice.gift[0]}."
        en = f"Your real strength is {voice.gift[1]}."
        basis_ta = f"வலிமையான கிரகம் {planet_ta(strongest)} — பலம் இதிலிருந்தே"
        basis_en = f"Strongest graha {planet_en(strongest)} — the gift, from it"
    else:
        ta = (
            f"உங்கள் உண்மையான பலம் {voice.gift[0]}. "
            f"விலை என்பது {voice.shadow[0]} — {voice.mechanism[0]}."
        )
        en = (
            f"Your real strength is {voice.gift[1]}. "
            f"Where it costs you is {voice.shadow[1]} — {voice.mechanism[1]}."
        )
        basis_ta = f"வலிமையான கிரகம் {planet_ta(strongest)} — பலமும், விலையும், அதன் வழிமுறையும் இதிலிருந்தே"
        basis_en = f"Strongest graha {planet_en(strongest)} — the gift, its cost, and the mechanism between them"

    return OneMinuteBeat(
        id="core_nature",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(ta=basis_ta, en=basis_en),
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
    Beat 3 already opened on, and appends only that graha's own
    ``domain_flex["WORK"]``/``domain_flex["RELATIONSHIPS"]`` — never a
    different graha's table, even if it would read well on its own. The
    structural guarantee is that this function has no branch that could pick
    a different graha for the two domain clauses than Beat 3 used for
    ``shadow``; see ``test_beat_4_never_mixes_grahas`` for the test that
    checks this against the tables directly rather than trusting the copy.

    Does NOT reopen on ``shadow`` verbatim. An earlier draft did — this beat
    always follows Beat 3 directly, whose own closing clause is "Where it
    costs you is {shadow}." — so a reader saw the identical shadow sentence
    twice in a row, once framed as a cost and then again, capitalised, with
    no framing at all. An astrologer review of rendered output on 2026-08-11
    caught it reading start to finish; no test did, because each beat was
    individually correct and §0.3's "one graha" invariant was satisfied
    either way. Same failure class ``_beat_topic_in_full`` was patched for
    on the same date — see that function's own docstring. The fix here is
    the same shape: drop the restated clause and let Beat 4 continue
    straight from Beat 3's own sentence instead of repeating it.
    """
    voice = _VOICE[strongest]
    work_ta, work_en = voice.domain_flex["WORK"]
    relationships_ta, relationships_en = voice.domain_flex["RELATIONSHIPS"]

    ta = f"{_WORK_CONNECTIVE[0]} {work_ta}. {_RELATIONSHIPS_CONNECTIVE[0]} {relationships_ta}."
    en = f"{_WORK_CONNECTIVE[1]} {work_en}. {_RELATIONSHIPS_CONNECTIVE[1]} {relationships_en}."

    return OneMinuteBeat(
        id="repeating_pattern",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(
            ta=f"{planet_ta(strongest)} — ஒரே இயல்பு, வேலையிலும் உறவிலும் மீண்டும் தெரிகிறது",
            en=f"{planet_en(strongest)} — the same trait, showing up twice",
        ),
    )


# The tension beat's frame. `_LAGNA_FACE`'s entries are written to complete
# "so people meet you ..." and `_MOON_MIND`'s to complete "a mind that ..." —
# see both tables' own comments in one_minute_reading_service.py, which state
# that the frame supplies the attribution so twelve strings do not each have to
# repeat which of the two nouns they belong to. This is that frame.
_TENSION_FRAME: tuple[str, str] = (
    "லக்னத்தால் {face}. உள்ளே இயங்குவதோ — {mind}.",
    "People meet you {face}. What is actually running underneath is {mind}.",
)
# The claim the beat closes on, and it is carefully NOT "these two contradict
# each other". Nothing computed here says the lagna's face and the Moon's manas
# oppose — for many charts they plainly agree — and asserting a contradiction
# that a reader looks for and cannot find is the exact failure `_transition`
# was rewritten to stop one module over ("a reader who looks for the
# contradiction and finds none concludes the app is generating rather than
# reading"). What IS true for every chart is that these are two different
# significators answering two different questions: the lagna is the body and
# the first impression, the Moon is the manas. The gap between them is
# structural, so naming the gap is safe where naming a conflict would not be.
_TENSION_CLOSE: tuple[str, str] = (
    "மற்றவர்கள் உங்களைப் படிக்கும் விதத்திற்கும், நீங்கள் உண்மையில் முடிவெடுக்கும் விதத்திற்கும் "
    "இடையிலான இந்த இடைவெளிதான், உங்களுக்கு உங்களுடனேயே ஏற்படும் உராய்வின் பெரும்பகுதி.",
    "That gap — between how you are read and how you actually decide — is where most of the "
    "friction you have with yourself comes from.",
)


def _beat_the_tension(*, lagna_rasi: int, moon_rasi: int) -> OneMinuteBeat:
    """5-minute Beat 5 (§7, NEW 2026-08-11) — the one named internal contradiction.

    Built from ``_LAGNA_FACE`` and ``_MOON_MIND``, and those two tables were
    written for this beat before it existed. Both have sat unwired since the
    2-minute module cut its rasi clauses for length, held explicitly "for the
    longer reading" — see the `self` entry in that module's ``_WORD_BUDGET``,
    whose rasi allowance was deliberately left unspent and whose guard
    (``test_the_rasi_clauses_cannot_outgrow_their_budget``) has been bounding
    these tables against a beat that had not been built yet. This is the beat.

    WITHHELD WHEN THE BIRTH TIME IS NOT CONFIRMED, and that is not a
    formality: ``_LAGNA_FACE`` is keyed on the lagna rasi, which is the one
    value a twenty-minute error moves — `_beat_what_this_rests_on` already
    tells this reader the lagna is being left out, and printing a
    lagna-derived beat three beats later would contradict the disclosure the
    reading just made. The caller gates it; this function is never reached
    with an unreliable lagna.

    Why this beat rather than a strongest-vs-weakest one: strongest and
    weakest are already spent (Beat 3 opens on `strongest`, Beat 4 relocates
    its shadow), and a second reading of the same graha would be the exact
    repetition the beat-7 rebuild was undertaken to stop. Lagna and Moon are
    the two significators the reading names in Beat 1 and then never reads
    from again.
    """
    face_ta, face_en = _LAGNA_FACE[lagna_rasi]
    mind_ta, mind_en = _MOON_MIND[moon_rasi]

    return OneMinuteBeat(
        id="the_tension",
        text=OneMinuteText(
            ta=f"{_TENSION_FRAME[0].format(face=face_ta, mind=mind_ta)} {_TENSION_CLOSE[0]}",
            en=f"{_TENSION_FRAME[1].format(face=face_en, mind=mind_en)} {_TENSION_CLOSE[1]}",
        ),
        basis=OneMinuteText(
            ta=f"லக்னம் ராசி {lagna_rasi} (வெளித்தோற்றம்); சந்திரன் ராசி {moon_rasi} (மனம்)",
            en=f"Lagna rasi {lagna_rasi} — how you are met; Moon rasi {moon_rasi} — the manas",
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
    *,
    timeline: VimshottariTimeline,
    hinge: tuple[int, str] | None,
    addressed_to: str,
    as_of: date,
    forward_beat_follows: bool,
) -> OneMinuteBeat:
    """5-minute Beat 6 (§2.4) — the 2-minute right_now beat, plus what it asks.

    Reuses ``_beat_right_now`` verbatim for the hinge lead, the current lord
    and ``now_texture`` (what the period OFFERS) — appends the new ``asks``
    facet (what it REQUIRES) and, between them, what the running antardasha
    (bhukti) adds. ``addressed_to`` is passed through rather than hardcoded,
    so ``client_with_guardian`` still gets ``_beat_right_now``'s own
    ``_MINOR_NOW_TEXTURE`` substitution — neither ``asks`` nor
    ``_BHUKTI_FLAVOR`` has a register-specific variant (every entry read as
    dispositional rather than adult-specific when drafted, so none was
    added).

    The bhukti clause is withheld on swabhukti (``current_antardasha.lord ==
    current_mahadasha.lord``, the first bhukti of every mahadasha) — see
    ``_BHUKTI_FLAVOR``'s own comment for why reusing the table there would
    reopen the exact same-clause-twice defect Beat 4 was just fixed for.

    THE BHUKTI CARRIES ITS OWN END DATE as of 2026-08-11, and the omission was
    the sharper half of the same review. ``_beat_right_now`` names the
    mahadasha's end year, which is up to ten years out and therefore too
    coarse to act on; the antardasha's end date is the near horizon a person
    can actually plan against, it was already computed, and it was already
    printed — in ``basis``, where only a reader who opens the disclosure sees
    it. A dated sub-period is also the single cheapest signal that a reading
    was computed for this chart rather than generated: "until June 2027" is
    checkable in a way that no amount of temperament copy is. It costs four
    words to move it into the prose.

    AND IT IS THE BHUKTI DATE THAT PAYS FOR DROPPING THE MAHADASHA'S, as of
    2026-08-12 — the last item spec §8.5 left open. On the elder path (no
    hinge) ``_beat_right_now`` bounds its own possibly-negative texture with
    the mahadasha's end year, "runs to 2034"; three beats later
    ``what_comes_after`` states the same handover to the month, "until June
    2034". Both are correct, neither is redundant on its own, and together a
    reader notices the reading saying one thing twice at two precisions.

    So this beat suppresses the coarse year, but only where ALL THREE
    replacements are actually present:

    - ``forward_beat_follows`` — the caller's own answer, because it is a fact
      about the REGISTER, not the chart: ``client_with_guardian`` is six beats
      and has no forward horizon at all (§0.2), so nothing there would ever
      restate the handover. A predicate over the timeline cannot see that.
    - ``forward_beat_names_mahadasha_handover`` — false when no mahadasha
      handover falls inside the forward beat's decade, in which case that beat
      speaks only of an antardasha turn and the mahadasha's end is never said
      again. Suppressing there would delete the bound rather than defer it.
    - a bhukti clause on this very beat — withheld on swabhukti. It is the
      NEARER expiry (months, not a decade) and it sits in the same breath as
      the texture it bounds, which the forward beat, three beats away, does
      not. Without it the lead would carry a difficulty with no expiry until
      the reader reaches the end of the reading.

    Keeping the year when any is missing is the deliberate direction to
    fail: a mild repetition costs a reader a raised eyebrow, an unbounded
    "Saturn pays late" costs them the evening.
    """
    maha_lord = timeline.current_mahadasha.lord
    antar = timeline.current_antardasha
    antar_lord = antar.lord
    has_bhukti_clause = antar_lord != maha_lord
    base = _beat_right_now(
        timeline=timeline,
        hinge=hinge,
        addressed_to=addressed_to,
        name_maha_end=not (
            forward_beat_follows
            and has_bhukti_clause
            and forward_beat_names_mahadasha_handover(timeline=timeline, as_of=as_of)
        ),
    )
    asks_ta, asks_en = _VOICE[maha_lord].asks

    bhukti_ta = bhukti_en = ""
    if has_bhukti_clause:
        flavor_ta, flavor_en = _BHUKTI_FLAVOR[antar_lord]
        bhukti_ta = (
            f" இப்போதைய {planet_ta(antar_lord)} பகுதி — {_month_year(antar.end_date, 'ta')} வரை — "
            f"{flavor_ta}."
        )
        bhukti_en = (
            f" Its current {planet_en(antar_lord)} phase, which runs to "
            f"{_month_year(antar.end_date, 'en')}, {flavor_en}."
        )

    return OneMinuteBeat(
        id="this_period",
        text=OneMinuteText(
            ta=f"{base.text.ta}{bhukti_ta} {_ASKS_CONNECTIVE[0]} {asks_ta}.",
            en=f"{base.text.en}{bhukti_en} {_ASKS_CONNECTIVE[1]} {asks_en}.",
        ),
        basis=base.basis,
    )


def _beat_window_ahead(*, moon_rasi: int, as_of: date) -> OneMinuteBeat:
    """5-minute Beat 8 (§7, NEW 2026-08-11) — the one dated gochara window.

    THE ONLY BEAT IN EITHER READING THAT IS ABOUT THIS SEASON. Every other
    beat is natal or dasha-level: true of this life, or of a stretch measured
    in years. This one says something about the months between now and a named
    month, which is what makes the reading feel live rather than a static
    summary — and, more usefully, what gives the reader something to check
    against their own next few seasons. A reading that can be checked and
    holds is what earns the next one.

    Sani's rasi is read from the ephemeris at ``as_of`` rather than from the
    natal chart — this is a transit, so the natal snapshot has nothing to say
    about it. The house is counted FROM THE JANMA RASI (the natal Moon's
    sign), which is the classical gochara reference and the one the almanac's
    own ஏழரை சனி reckoning uses; counting from the lagna would be a different
    (also classical) system, and mixing the two inside one reading is how a
    surface ends up contradicting the panchangam the reader already has.

    The end date comes from ``find_saturn_egress_jd``, which bisects to a day
    and is rendered to a month — see that function's docstring on the
    retrograde caveat, and note the copy says the transit "moves on in
    {month}" rather than naming a day, precisely because the day is the part
    the simplification touches.
    """
    saturn_rasi = rasi_from_degree(
        saturn_longitude_at_jd(
            utc_datetime_to_julian_day(datetime.combine(as_of, datetime.min.time(), tzinfo=UTC))
        )
    )
    house = house_from_reference(moon_rasi, saturn_rasi)
    texture_ta, texture_en = _GOCHARA_SANI[house]

    egress = julian_day_to_utc_datetime(
        find_saturn_egress_jd(
            saturn_rasi,
            utc_datetime_to_julian_day(datetime.combine(as_of, datetime.min.time(), tzinfo=UTC)),
        )
    ).date()

    phase = _SANI_PHASE_NAME.get(house)
    phase_ta = f" — {phase[0]}" if phase else ""
    phase_en = f" — {phase[1]}" if phase else ""

    ta = (
        f"இப்போது சனி உங்கள் ராசியிலிருந்து {house}ஆம் இடத்தில் நகர்கிறார்{phase_ta}. "
        f"{_cap(texture_ta)}. {_month_year(egress, 'ta')} அளவில் அது இடம் மாறுகிறது."
    )
    en = (
        f"Saturn is currently transiting the {_ordinal_en(house)} from your Moon{phase_en}. "
        f"{_cap(texture_en)}. It moves on around {_month_year(egress, 'en')}."
    )

    return OneMinuteBeat(
        id="window_ahead",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(
            ta=(
                f"கோசார சனி ராசி {saturn_rasi}; ஜென்ம ராசி {moon_rasi}; "
                f"ராசியிலிருந்து {house}ஆம் இடம்; இடம் மாறுவது {egress.isoformat()}"
            ),
            en=(
                f"Transiting Saturn in rasi {saturn_rasi}; janma rasi {moon_rasi}; "
                f"house {house} from the Moon; leaves that rasi {egress.isoformat()}"
            ),
        ),
    )


# House numbers are spoken as ordinals in the English prose and as "{n}ஆம்
# இடம்" in the Tamil, which needs no such table. Twelve entries rather than a
# suffix rule because the rule has three exceptions in the first four numbers
# and this range is closed — the chart has twelve houses and will not grow one.
_ORDINAL_EN: dict[int, str] = {
    1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", 6: "6th",
    7: "7th", 8: "8th", 9: "9th", 10: "10th", 11: "11th", 12: "12th",
}


def _ordinal_en(house: int) -> str:
    return _ORDINAL_EN[house]


def _topic_house_lord(
    *, topic: str, lagna_rasi: int, planets: tuple[PlanetPosition, ...]
) -> tuple[int, str, PlanetPosition] | None:
    """(topic house, its adhipathi, that adhipathi's natal record), or None.

    Returns None when the chart response has no record for the lord — the
    same posture ``compute_house_lord_report`` takes for an incomplete chart
    (skip the row rather than emit a misleading reading). The caller drops the
    house sentence and keeps the rest of the beat.

    Never called on an unreliable birth time: every house here is counted from
    the lagna, so the whole construction inherits the same withholding rule
    ``_beat_the_tension`` does.
    """
    house = _TOPIC_HOUSE[topic]
    lord = SIGN_LORD[house_rasi(lagna_rasi, house)]
    record = next((p for p in planets if p.graha == lord), None)
    if record is None:
        return None
    return house, lord, record


def _beat_topic_in_full(
    *,
    topic: str,
    strongest: str,
    timeline: VimshottariTimeline,
    addressed_to: str,
    lagna_rasi: int | None,
    planets: tuple[PlanetPosition, ...],
) -> OneMinuteBeat:
    """5-minute Beat 9 (§2.5, rebuilt 2026-08-11) — the topic read from its own house.

    FACET 1 IS NOW A HOUSE, NOT A TEMPERAMENT, and that is the substantive
    change. It used to be the strongest graha's ``gift`` reframed through
    ``_TOPIC_LENS`` — which produced, for a Jupiter-strongest reader on the
    married-life topic, "In home and family, that shows up as judgment people
    trust enough to act on": the identical clause Beat 3 had already spent as
    the general strength, relabelled as the home-and-family manifestation four
    beats later. An astrologer review named the effect exactly — a template
    variable dropped into the wrong slot — and it is not fixable by rewording
    the lens, because the defect is that the beat had no material of its own.
    It was the two-minute reading's vocabulary, re-served.

    What it says instead is the topic's own house, that house's adhipathi,
    and where that adhipathi actually sits — three chart facts, none of them
    used anywhere else in either reading, all checkable against any other
    jathagam the reader owns. ``_TOPIC_HOUSE`` supplies the first,
    ``house_lords`` the naming and the significations, and the reader's own
    persisted planet records the placement and its strength band. This is the
    composition move §2.5 always described (small fixed table + tables that
    already exist); the first build applied it to the wrong tables.

    Facet 3 (friction) keeps ``_SHADOW_ESSENCE`` — a compressed paraphrase of
    ``shadow``, not ``shadow`` itself, added in the same 2026-08-11 pass that
    found this beat repeating Beat 3 wholesale. Facet 4 is ``_outlook``, which
    now names its own subject (see ``_AREA_NOUN``) rather than opening on a
    "that" whose antecedent, at this position in the beat, was the friction
    clause. Facet 5 is ``_GUIDANCE_FALLBACK``, likewise now naming the area it
    is about.

    ``lagna_rasi`` is None when the birth time is not confirmed, and the house
    sentence is then dropped entirely rather than computed from a lagna the
    reading has already told this reader it is not using — same withholding
    rule ``_beat_the_tension`` follows, and the same one
    ``_beat_what_this_rests_on`` promises two beats earlier. The rest of the
    beat stands: friction, outlook and guidance need no lagna.

    Facet 3 is now conditional and ``client_with_guardian`` no longer has one
    at all — see the block comment at its own branch below, which is where the
    reasoning belongs because it turns on what the rest of the beat managed to
    say.

    Caller-gated on ``topic != TOPIC_UNKNOWN``, same as the 2-minute reading's
    own age-question beat.
    """
    lens_ta, lens_en = _TOPIC_LENS[topic]
    area_ta, area_en = _AREA_NOUN[_TOPIC_AREA[topic]]

    next_change = timeline.current_antardasha.end_date
    outlook_ta, outlook_en = _outlook(
        topic,
        timeline.current_mahadasha.lord,
        (_month_year(next_change, "ta"), _month_year(next_change, "en")),
    )

    house_ta = house_en = ""
    basis_house_ta = basis_house_en = ""
    resolved = (
        None
        if lagna_rasi is None
        else _topic_house_lord(topic=topic, lagna_rasi=lagna_rasi, planets=planets)
    )
    if resolved is not None:
        house, lord, record = resolved
        title_ta, title_en = house_lord_title(house)
        sig_ta, sig_en = house_significations(record.house_from_lagna)
        note_ta, note_en = _LORD_STRENGTH_NOTE[strength_band(record.strength_score)]
        house_ta = (
            f"{lens_ta} உங்கள் {title_ta} {planet_ta(lord)}, அவர் {record.house_from_lagna}ஆம் "
            f"வீட்டில் அமர்ந்திருக்கிறார் — {sig_ta}. {note_ta}."
        )
        house_en = (
            f"{lens_en} your {title_en} is {planet_en(lord)}, and it sits in your "
            f"{_ordinal_en(record.house_from_lagna)} house — {sig_en}. {_cap(note_en)}."
        )
        basis_house_ta = (
            f"; {house}ஆம் வீடு (இந்தத் தலைப்பின் இடம்), அதிபதி {planet_ta(lord)} "
            f"{record.house_from_lagna}-ல், வலிமை {record.strength_score}/100"
        )
        basis_house_en = (
            f"; house {house} (this topic's house), lord {planet_en(lord)} in "
            f"{record.house_from_lagna}, strength {record.strength_score}/100"
        )

    # THE FRICTION FACET IS A FALLBACK NOW, NOT A FIXTURE. It used to run
    # unconditionally, and with the house sentence in place beside it a
    # rendered Jupiter reading came out "Where it costs you is saying no, so
    # your yes gets spread thin" in Beat 3 and "Where it runs into friction:
    # not knowing how to say no" here — a milder form of exactly the repetition
    # this beat was rebuilt to stop, and one the reader hits twice in the same
    # sitting. Two clauses about saying no is one clause about saying no.
    #
    # Where the lagna IS confirmed the beat no longer needs it: it has a house,
    # an adhipathi, a placement and a strength band, none of which appear
    # anywhere else in the reading. Where the lagna is NOT confirmed there is
    # no house sentence, and the temperament clause becomes the only thing this
    # beat can honestly say about the topic — so it is kept exactly there and
    # nowhere else. That also happens to be the reading that has the least
    # derived material overall, which is the one that can best afford a
    # dispositional clause.
    #
    # `client_with_guardian` gets no facet 3 on either path. Its version was
    # `_VOICE[strongest].nature`, and that register's Beat 1 prints
    # `_VOICE[nakshatra_lord].nature` — the same string whenever the two lords
    # coincide, which is roughly one teenager in nine printing their own
    # temperament sentence twice. The shadow-derived alternative is the one
    # thing §0.2 refuses this register outright, so there is no third option
    # and the honest move is silence.
    facet3_ta = facet3_en = ""
    basis_friction_ta = basis_friction_en = ""
    if resolved is None and addressed_to != "client_with_guardian":
        essence_ta, essence_en = _SHADOW_ESSENCE[strongest]
        # CARRIES THE LENS, because on this path nothing else does. The lens is
        # normally attached to the house sentence, and with the house sentence
        # withheld the beat opened straight on "Where it runs into friction:" —
        # a whole beat about the reader's marriage or work that never named
        # which. The reader on this path is the one who can least afford an
        # unanchored clause: they have already been told the reading is
        # working with less.
        facet3_ta = f"{lens_ta} {_FRICTION_CONNECTIVE[0]} {essence_ta}."
        facet3_en = (
            f"{lens_en} {_FRICTION_CONNECTIVE[1][0].lower()}{_FRICTION_CONNECTIVE[1][1:]} "
            f"{essence_en}."
        )
        # Named in `basis` only when it is actually printed. A disclosure that
        # lists an input the prose was not built from is the same broken
        # promise `_beat_who_you_are` removed the Moon's rasi over — made to
        # the one reader who cared enough to open it.
        basis_friction_ta = f"; உராய்வுக் குறிப்பு வலிமையான {planet_ta(strongest)}-லிருந்து"
        basis_friction_en = f"; friction clause from the strongest graha, {planet_en(strongest)}"

    # THE ELDER REFUSAL TRAVELS WITH THE ELDER TOPIC, and it did not until
    # 2026-08-11. `_beat_age_question` declares it on the 2-minute reading's
    # own ELDER branch — "this reading does not read length of life" — for the
    # reason its own comment gives: at the one gate where the question is
    # actually live, the refusal is a position rather than a disclaimer. The
    # five-minute reading routes the same 67-year-old to the same health topic,
    # says considerably more about it, and was saying it without the refusal.
    # A longer reading of the same subject cannot carry fewer commitments than
    # the shorter one it is sold as an upgrade from.
    refusal_ta = refusal_en = ""
    if topic == TOPIC_ELDER:
        refusal_ta, refusal_en = _LONGEVITY_REFUSAL

    ta = " ".join(
        part
        for part in (
            house_ta,
            facet3_ta,
            outlook_ta,
            f"{_GUIDANCE_CONNECTIVE[0]} {_GUIDANCE_FALLBACK[0].format(area=area_ta)}",
            refusal_ta,
        )
        if part
    )
    en = " ".join(
        part
        for part in (
            house_en,
            facet3_en,
            outlook_en,
            f"{_GUIDANCE_CONNECTIVE[1]} {_GUIDANCE_FALLBACK[1].format(area=area_en)}",
            refusal_en,
        )
        if part
    )

    return OneMinuteBeat(
        id="topic_in_full",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(
            ta=f"கவனப் பகுதி {_TOPIC_AREA[topic]}{basis_house_ta}{basis_friction_ta}",
            en=f"Focus area {_TOPIC_AREA[topic]}{basis_house_en}{basis_friction_en}",
        ),
    )


def _beat_one_thing_keyed(
    *, timeline: VimshottariTimeline, addressed_to: str
) -> OneMinuteBeat:
    """The closing remedy, saying out loud what it descends from.

    The 2-minute reading closes "One thing: {action}." — and ``action`` IS
    keyed on the running mahadasha lord, has been since it was written, and
    says so in its own ``basis``. The prose never did. Standing at the end of
    a five-minute reading that has just spent four beats on dated periods,
    an unattributed instruction reads as generic wellness advice arriving from
    nowhere, which is the same complaint that cost Chandra's ``action`` its
    "hydration" clause in the same review: a remedy the reader cannot trace
    invites them to reclassify the derived material beside it as guesswork
    too.

    So the five-minute form names the anchor in the sentence rather than only
    in the disclosure. No new table, no new copy per graha — the lord's name
    is already in hand, and one fixed connective turns a bare instruction into
    a visibly descended one.

    ``client_with_guardian`` keeps ``_beat_one_thing`` verbatim. That register
    already has its own lead-in (``remedy_lead_in_for_stage``, which puts the
    family in the room with the teenager), and stacking a second frame on it
    would displace the one that was written for the age.
    """
    if addressed_to == "client_with_guardian":
        return _beat_one_thing(timeline=timeline, addressed_to=addressed_to)

    lord = timeline.current_mahadasha.lord
    return OneMinuteBeat(
        id="one_thing",
        text=OneMinuteText(
            ta=(
                f"ஒரு செயல் — இது இன்றைய நாளை ஒட்டியது அல்ல, நீங்கள் இருக்கும் "
                f"{planet_ta(lord)} காலத்தை ஒட்டியது: {_VOICE[lord].action[0]}."
            ),
            en=(
                f"One thing, and it is keyed to the {planet_en(lord)} period you are in rather "
                f"than to today: {_VOICE[lord].action[1]}."
            ),
        ),
        basis=OneMinuteText(
            ta=f"நடப்பு {planet_ta(lord)} மகாதசையை அடிப்படையாகக் கொண்டது",
            en=f"Anchored on the running {planet_en(lord)} mahadasha",
        ),
    )


# Where the withheld topic beat would have stood — the beat that comes right
# after it in the sequence below. Same device as
# one_minute_reading_service._QUESTION_ANCHOR_BEAT, own constant because this
# module's beat order differs from the 2-minute one.
_FIVE_MIN_QUESTION_ANCHOR_BEAT = "what_comes_after"


def build_five_minute_reading(context: ChartContext) -> FiveMinuteReadingResponse:
    if context.addressed_to not in ("self", "client_with_guardian"):
        # parent/other: not designed for this length, ever (§0.2). Same 404
        # the flag gate returns, not a fallback beat set: no beat-building
        # function below is ever reached for these values.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not available.")

    opening = _beat_who_you_are(
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
    )
    rests_on = _beat_what_this_rests_on(
        display_name=context.profile.display_name,
        lagna_reliable=context.lagna_reliable,
        addressed_to=context.addressed_to,
        birth_time_source=context.profile.birth_time_source,
    )
    core_nature = _beat_core_nature_extended(
        strongest=context.strongest, addressed_to=context.addressed_to
    )

    pending: OneMinutePendingQuestion | None = None

    if context.addressed_to == "client_with_guardian":
        # §0.2's reduced 6-beat list: identity, rests-on, nature (reduced,
        # above), current period, age-topic mini-reading, one thing. Beat 4
        # (repeating pattern, built from `shadow`) and Beat 5 (dated past)
        # both drop entirely — the past beat is degenerate by construction
        # below age 18 for the same reason the 2-minute reading's own
        # client_with_guardian block already drops `last_ten_years` (window
        # clamped to age 15: nothing for a 15-year-old, two years for a
        # 17-year-old). `hinge=None` for the same reason: the hinge names the
        # year the previous beat closed on, and there is no previous beat
        # here to close.
        #
        # Topic is never TOPIC_UNKNOWN on this register — it is only ever
        # reached when a 13-to-17-year-old holds their own account, and
        # topic routing resolves that to TOPIC_TEEN or TOPIC_EDUCATION by
        # construction (see one_minute_reading_service's own topic
        # resolution) — so Beat 7 always renders and no marital-status
        # pending question is ever raised for a minor.
        beats = [
            opening,
            rests_on,
            core_nature,
            _beat_this_period_extended(
                timeline=context.timeline,
                hinge=None,
                addressed_to=context.addressed_to,
                as_of=context.as_of,
                # This register has no forward horizon (§0.2), so nothing later
                # restates the mahadasha's end and the lead keeps its own bound.
                forward_beat_follows=False,
            ),
            _beat_topic_in_full(
                topic=context.topic,
                strongest=context.strongest,
                timeline=context.timeline,
                addressed_to=context.addressed_to,
                lagna_rasi=context.lagna.rasi if context.lagna_reliable else None,
                planets=context.planets,
            ),
            _beat_one_thing_keyed(
                timeline=context.timeline, addressed_to=context.addressed_to
            ),
        ]
    else:
        # THE SEQUENCE IS A DESCENT, and it was not one before 2026-08-11.
        #
        # The order below is deliberate and the order is the feature: nature →
        # the pattern it repeats → the contradiction underneath it → the last
        # period → this period and its bhukti → the transit window between now
        # and a named month → the topic read from its own house → the next
        # handover → the one thing. Each level cites something the previous one
        # did not, and the material gets more specific and more dated as it
        # goes.
        #
        # What it replaced was eight beats of natal temperament in which the
        # only dated content was two dasha spans, and which — measured against
        # the two-minute reading it is sold as an upgrade from — contained
        # LESS chart, not more: `_beat_next_ten_years` was never wired in, so
        # the reader who chose five minutes over two lost the forward horizon
        # as the price of choosing it. An astrologer review put the failure in
        # one sentence: the longer version spent its extra length elaborating
        # the most cold-readable material in the reading and cut the derived
        # material, which is backwards. Three of the beats below (the tension,
        # the window ahead, the forward horizon) exist to correct that, and the
        # topic beat was rebuilt on house material for the same reason.
        beats = [
            opening,
            rests_on,
            core_nature,
            _beat_repeating_pattern(strongest=context.strongest),
        ]

        # Withheld on an unconfirmed birth time, not softened — see
        # `_beat_the_tension`'s docstring. Beat 2 has just told this reader the
        # lagna is being left out; a lagna-derived beat two beats later would
        # contradict that disclosure, and a disclosure that covers one of the
        # two places a problem lives is worse than none.
        if context.lagna_reliable:
            beats.append(
                _beat_the_tension(lagna_rasi=context.lagna.rasi, moon_rasi=context.moon.rasi)
            )

        # Elder path skips the dated past entirely, same call and same
        # reasoning as the 2-minute reading's own G6 branch: a 67-year-old
        # knows his own decades better than we do, and reciting them back is
        # filler, not trust.
        if context.topic == TOPIC_ELDER:
            hinge: tuple[int, str] | None = None
        else:
            last_period_beat, hinge = _beat_last_period_extended(
                timeline=context.timeline,
                as_of=context.as_of,
                birth_date=context.profile.birth_date_local,
            )
            beats.append(last_period_beat)

        beats.append(
            _beat_this_period_extended(
                timeline=context.timeline,
                hinge=hinge,
                addressed_to=context.addressed_to,
                as_of=context.as_of,
                forward_beat_follows=True,
            )
        )
        beats.append(_beat_window_ahead(moon_rasi=context.moon.rasi, as_of=context.as_of))

        # Withheld, not defaulted — identical reasoning to the 2-minute
        # reading's own age-question beat: every version of the topic beat is
        # a statement about the reader's marriage, and we hold no fact that
        # picks between them.
        if context.topic != TOPIC_UNKNOWN:
            beats.append(
                _beat_topic_in_full(
                    topic=context.topic,
                    strongest=context.strongest,
                    timeline=context.timeline,
                    addressed_to=context.addressed_to,
                    lagna_rasi=context.lagna.rasi if context.lagna_reliable else None,
                    planets=context.planets,
                )
            )

        # The forward horizon, reused verbatim from the 2-minute reading and
        # renamed on the wire only (`next_ten_years` -> `what_comes_after`),
        # because at this position it follows a beat that has just dated a
        # transit to a month and a "next ten years" heading beside it reads as
        # two different clocks. Its own text is unchanged.
        #
        # It closes the reading rather than opening the forward half on
        # purpose: an ending that points past itself is what makes a reading
        # feel like a chapter instead of a verdict, and this is the only beat
        # in the module that names a handover the reader has not reached yet.
        forward = _beat_next_ten_years(
            timeline=context.timeline, as_of=context.as_of, addressed_to=context.addressed_to
        )
        beats.append(
            OneMinuteBeat(id="what_comes_after", text=forward.text, basis=forward.basis)
        )

        beats.append(
            _beat_one_thing_keyed(
                timeline=context.timeline, addressed_to=context.addressed_to
            )
        )

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
