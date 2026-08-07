"""\"Your Chart in One Minute\" — the astrologer's opening reading.

Spec: docs/ONE_MINUTE_READING_2026-08-04.md

WHAT THIS IS. When a jodhidar picks up a jadhagam they speak for about a minute
before the client asks anything: they name the star and describe the nature,
they name the strength and its cost, they describe the stretch of years just
past, they say what runs now, they raise the ONE question that belongs to this
person's age, they say what changes next, and they give one thing to do. The
client is convinced by the first three of those, not by the sixth. **Trust is
earned on the checkable past and spent on the unknowable future — in that
order**, and every rule below follows from that sentence.

WHAT THIS IS NOT. Not a new engine — every value here is already computed
somewhere else (Vimshottari timeline, strength scores, the age gates, the
dasha/area affinity table). This module only orders and narrates them. Not a
replacement for the jadhagam report, which is the document someone carries out
of the room. Not personalised by an LLM: every string below is a fixed template
filled from computed values, because this is the one surface whose entire value
is that it can be audited.

THE FOUR RULES THE COPY MUST OBEY
  1. Texture, never events. Vimshottari says which lord ran a stretch; it does
     NOT say the person lost a job. "You had trouble at work in 2019" is a
     fabrication. "That stretch asked for endurance more than it offered
     reward" is a claim about the quality of a period, and it is the whole
     difference between this product and a fortune-teller.
  2. Every trait carries its own cost. A description of pure gifts reads as
     flattery and the reader discounts everything downstream.
  3. Jargon is language-specific. நட்சத்திரம்/ராசி/சனி are ordinary Tamil
     household words and removing them would make the copy read as translated
     from English. "nakshatra"/"mahadasha"/"lagna" ARE jargon to an English
     reader who nonetheless knows "Rohini" and "Saturn". So the English body
     text carries no technical terms while the Tamil may; proper nouns are
     always fine in both. tests/test_one_minute_reading.py enforces exactly
     that asymmetry, and the ``basis`` field is the one place either language
     may be technical.
  4. Windows, never date-certain outcomes. "From March 2031" — never "in March
     2031 you will".

PROVENANCE. Rules 1 and 4 are two instances of one rule, and until 2026-08-05
this module had the instances without the rule. Every string now carries a
declared class — D derived / R rule / T tendency / F frame, with E event and C
cold-read banned — asserted statically rather than filtered at serve time. See
``Provenance`` below and docs/AGE_GATED_READING_AUDIT_2026-08-05.md §6.2(a). The
copy was already almost clean when the model went in; the point is that nothing
had stopped the next string being an event claim, and one already was.

COPY VOCABULARY SIZE. 9 grahas x 6 facets, plus the frames, topics and outlook
clauses = 78 reviewable strings per language. The spec's original estimate was
60; the binding constraint was never the number but "a Tamil review pass must
fit in one sitting", which 78 short strings does. The size cap is real and load-
bearing though: the alternative shape — per-nakshatra x per-graha x per-stage
copy — is ~2,000 strings, would never be reviewed, and would become a fifth
permanently-closed content gate of exactly the kind
docs/DASHBOARD_PRODUCT_DECISIONS_2026-08-02.md is about.

The Tamil below is PENDING NATIVE-TAMIL REVIEW (same posture as
nakshatra_content.NAKSHATRA_LENS, which ships live under the same marker).
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime
from enum import StrEnum
from typing import ClassVar
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.dasha import (
    DashaPeriod,
    VimshottariTimeline,
    _build_subperiods,
    calculate_vimshottari_timeline,
)
from app.calculations.display_names import nakshatra_ta, planet_en, planet_ta, rasi_ta
from app.core.age_gate import (
    compute_age,
    is_married_settled,
    is_minor_age,
    is_past_prime_marriage_age,
    is_seeking_marriage,
)
from app.models import BirthProfile, Chart, FamilyMember
from app.reasoning.chart_signature import detect_signature
from app.schemas.one_minute_reading import (
    OneMinuteBeat,
    OneMinuteMeta,
    OneMinuteNextStep,
    OneMinutePendingQuestion,
    OneMinuteQuestionOption,
    OneMinuteReadingData,
    OneMinuteReadingResponse,
    OneMinuteReadingWindow,
    OneMinuteText,
    OneMinuteWordCount,
)
from app.services.age_phase_service import (
    STAGE_INFANT,
    STAGE_TEEN,
    get_age_phase_label,
    life_stage,
    remedy_lead_in_for_stage,
)
from app.services.chart_service import load_persisted_chart_response
from app.services.feature_flags import get_flag
from app.services.life_areas_service import _DASHA_AREA_SCORE
from app.services.safety_filter import run_safety_pass

CALC_VERSION = "one-minute-reading-v1.0-2026"


def require_one_minute_reading_enabled() -> None:
    """404 while the rollout flag is off.

    404 rather than 403, and checked *before* the chart is looked up — same
    reasoning as ``numerology_service.require_numerology_enabled``: a feature
    that has not launched should not advertise its own existence, and a gate
    that fires after the ownership check turns into an oracle for which chart
    ids exist.
    """
    if not bool(get_flag("one_minute_reading")):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not available.")

# Body text must stay inside a minute. English reads ~200-220 wpm, Tamil ~130
# wpm on this kind of dense personal prose. These are HARD ceilings asserted by
# test: without one, this surface becomes a report within two sprints, which is
# exactly how the jadhagam report got to where it is.
#
# Raised from 240/180 when the signature opening and the grievance went in
# (2026-08-04). Most of that cost was paid for by deleting the neutral outlook
# clause rather than by the raise; the raise covered the rest.
#
# Raised again to 285/212 for the falsifiability beat (2026-08-05), and this
# time NOTHING was cut to pay for it, which is worth saying plainly. The 08-04
# raise found a clause that reported an absence of signal in thirteen words; the
# beats that remain are all chart-derived, and paying for a trust device by
# deleting a chart claim would trade the reading's substance for its frame. 285
# English words is ~78s at 220 wpm against a promise of "about a minute" — the
# honest end of "about".
#
# The Tamil number has never been a clock figure and is not one now. 212 words
# at ~130 wpm is ~98s; 190 was already ~88s. It was set as a ratio of the
# English ceiling rather than derived, so it has been quietly making a different
# promise the whole time. Flagged rather than fixed here: §4.2 item 5 of
# docs/AGE_GATED_READING_AUDIT_2026-08-05.md replaces this global pair with a
# per-gate budget, and both numbers should be re-derived from the clock there.
#
# Raised a third time (2026-08-07) for two devices that both land on the SELF
# register: v2's E→R+invitation clause on the dated past beat, and the sentence
# that names which half of an unconfirmed-time reading actually moves. Nothing
# was cut, again, and the search was real — the only sentence that reads as
# removable is "Within it, {year} marked a turn", and it is not: it is the only
# place the hinge year is introduced, and beat 4 opens on it.
#
# The honest way to read three unpaid raises in four days is that the 240 the
# feature started on was measuring the wrong thing. A reading is not too long
# because of a word count; it is too long when it contains a sentence the reader
# would not miss. The per-gate matrix below is the guard that actually catches
# that, and no raise has ever bought CHART material — all three bought trust
# devices, which is the trade this surface exists to make.
#
# A fourth raise, same day, and this one has a different justification from the
# other three: THE READING GAINED A BEAT. `what_life_keeps_teaching` gives the
# weakest graha its own observation instead of forcing it into the strongest
# graha's causal chain, so the adult reading now contains two soft spots where
# it contained one. That is a new claim about the reader, not a new frame around
# an old one, and the only honest way to fit it would be to delete a different
# claim.
#
# Two things WERE found and taken, and both are corrections rather than trims:
# the married frame's "rather than on reinventing your work" is an uncomputed
# negation that the STEADYING frame twelve lines below was deliberately written
# without, and the lesson frame lost a leading "And". Seven words against
# sixteen. The rest is the raise.
#
# These two are the CEILING OF THE CEILINGS only. The confirmed adult reading is
# held at 305/228 in the matrix below and the unconfirmed one at 320/240, so the
# common case cannot drift up into the headroom the rarer case needs. 320
# English words is ~87s at 220 wpm, which is the outer edge of "about a minute"
# and should be treated as the last raise this surface gets without something
# leaving.
#
# ...AND THE FOURTH RAISE'S JUSTIFICATION NO LONGER SHIPS. §6.17 answered "the
# only honest way to fit it would be to delete a different claim" by deleting the
# beat instead: `what_life_keeps_teaching` is built but not emitted, and beat 1's
# two rasi clauses went the same way. The numbers below are unchanged and still
# hold — every gate measures under them — but they now carry MORE headroom than
# the reasoning above describes, and headroom nobody has re-derived is how a
# ceiling stops being a measurement.
#
# Left as a raise rather than walked back, deliberately: re-deriving these from
# the clock is §4.2 item 5's job and the audit already owns it. What is NOT
# acceptable is the paragraph above reading as though the beat ships, because
# that is precisely how three tests came to assert copy that no longer existed.
MAX_WORDS_EN = 330
MAX_WORDS_TA = 240

# ...and the global pair is now the CEILING OF THE CEILINGS. §4.2 item 5 of the
# audit: a four-beat guardian reading and a seven-beat adult one were being held
# to the same number, which means the number was doing nothing for the shorter
# ones — a guardian reading could double in length and still pass.
#
# The forcing case was G6. Its trust mechanism is a declared refusal ("this
# reading does not read length of life"), it is the highest trust-per-word
# sentence in the source document, and it must not be truncated — but an elder
# reading was already running 265 of 285 English words, so the refusal could not
# fit under a ceiling that did not know which gate it was guarding. The budget
# had to become per-gate BEFORE the copy that needed it could be written, which
# is the reverse of the order §6.6 sequences them in.
#
# The refusal was PAID FOR rather than granted an allowance, which is the
# discipline the 08-04 raise used and the 08-05 one could not. The elder topic
# frame closed on "both are worth deliberate attention rather than assumed
# continuity" — nine words instructing the reader to pay attention, which is not
# a claim about anything. The refusal costs about the same and says something.
# So MAX_WORDS_EN/TA above are unchanged, and no gate exceeds them.
_WORD_BUDGET: dict[str, tuple[int, int]] = {
    "parent": (200, 155),
    "client_with_guardian": (250, 190),
    # Four beats, all D or F. Anything approaching the adult number here means
    # interpretation of an absent adult has crept back in — the budget is a
    # second guard on §3.1, not only on length.
    "other": (150, 115),
    # Measured, not chosen: the binding case is a 45-year-old widowed reader,
    # which takes the STEADYING frame and so cannot pay with the married frame's
    # deleted negation.
    #
    # THE RASI ALLOWANCE INSIDE THIS NUMBER IS NOW UNSPENT. It was 322 as the
    # fixture charted it, plus the gap between the fixture's rasi pair and the
    # longest pair in the tables — because those two clauses are the one part of
    # beat 1 whose length the API matrix structurally cannot see (every synthetic
    # profile shares a birth time, so the suite exercises 1 of 144 pairs). §6.17
    # then cut the clauses, so the reading no longer spends it.
    #
    # The allowance and its guard both stay, and that is not inertia:
    # `_MOON_MIND`/`_LAGNA_FACE` are held for the longer reading exactly as
    # `_beat_what_life_keeps_teaching` is, so the day they are wired back the
    # budget must already know their worst case —
    # `test_the_rasi_clauses_cannot_outgrow_their_budget` keeps bounding the
    # tables directly, which is the only place that check can live. 328 is ~89s
    # at 220 wpm.
    "self": (328, 238),
}

# THE UNCONFIRMED ADULT READING IS ITS OWN LENGTH CLASS, and giving it one is
# the alternative to a fourth flat raise. It keeps every beat and additionally
# has to say what it left out, what stands without the lagna, and which part of
# what remains rests on it anyway.
#
# THE ORDERING HAS SINCE INVERTED AND THE SPLIT SURVIVES IT. When this class was
# created the unconfirmed reading was the LONGER one — 305 English words against
# 291 — and that gap was the argument for it. Adding the lagna clause to beat 1
# gave the confirmed reading words the unconfirmed one does not get, and the two
# now measure 325 and 324. That is coincidence, not convergence: they are
# different copy, they were 14 apart a day ago, and the next change to either
# separates them again. Merging them on the strength of a one-word gap would
# re-create exactly the failure §4.2 item 5 named, with the roles swapped —
# whichever class is shorter next month would stop being guarded.
#
# A single raised global would have let the COMMON reading — the confirmed one,
# which is most of them — drift up to the same ceiling for free. That is exactly
# the failure §4.2 item 5 named when a four-beat guardian reading and a
# seven-beat adult one were held to one number: a ceiling that does not know
# what it is guarding stops guarding the shorter case. The same argument applies
# INSIDE a register, and this is the first place it bites.
#
# It is uncomfortable that the reading with less confirmed input is the longest
# one, and it is not a defect: those extra words are the price of telling that
# reader precisely how far to trust it, and they are the reader who most needs
# telling. 310 words is ~84s at 220 wpm.
#
# Kept out of the dict above rather than keyed into it as a tuple. A mapping
# whose keys are sometimes a register and sometimes a (register, condition) pair
# has stopped being a lookup table and become two tables sharing a name, and the
# next condition would make it three.
_WORD_BUDGET_SELF_UNCONFIRMED: tuple[int, int] = (327, 236)


def word_budget(addressed_to: str, *, lagna_reliable: bool = True) -> tuple[int, int]:
    """The (en, ta) ceiling for one reading. Asserted by test, not by the service.

    Truncating would be worse than running long — it would cut a sentence in
    half — so this stays a test-time assertion, exactly as the global pair
    always was.
    """
    if addressed_to == "self" and not lagna_reliable:
        return _WORD_BUDGET_SELF_UNCONFIRMED
    return _WORD_BUDGET[addressed_to]

_MONTH_TA: dict[int, str] = {
    1: "ஜனவரி", 2: "பிப்ரவரி", 3: "மார்ச்", 4: "ஏப்ரல்", 5: "மே", 6: "ஜூன்",
    7: "ஜூலை", 8: "ஆகஸ்ட்", 9: "செப்டம்பர்", 10: "அக்டோபர்", 11: "நவம்பர்", 12: "டிசம்பர்",
}

# Birth-time sources we treat as reliable enough to open on the lagna. A wrong
# birth time moves the lagna, and beat 1 is the sentence that most depends on
# it — opening confidently on a lagna we are not sure of loses the reader at
# sentence one, which costs us the whole reading. On anything else we open on
# the Moon's nakshatra, which is stable across a much wider time error.
_RELIABLE_TIME_SOURCES: frozenset[str] = frozenset({"BIRTH_CERTIFICATE", "HOSPITAL_RECORD", "FAMILY_RECORD"})
_LAGNA_TIME_TOLERANCE_MINUTES = 30

# How much of the ten-year window the OUTGOING mahadasha must have held before
# the handover is worth telling as the story of that decade. Below this, the
# incoming lord is what the reader actually lived and the turn is read one level
# down. See _beat_last_ten_years.
_DOMINANT_STRETCH_SHARE = 0.3


# ── Provenance: what class of claim a string is allowed to be ────────────────
#
# docs/AGE_GATED_READING_AUDIT_2026-08-05.md §6.2(a), from the reading-generation
# spec v2 Part 1. Every authored string carries exactly one class, declared at
# AUTHORING time and asserted by tests/test_one_minute_reading.py.
#
# The adaptation matters and it is deliberate: v2 specifies a RUNTIME validator
# that drops E/C sentences on their way out, which it needs only because it
# assumes a generator. We have a fixed vocabulary, so the same rule is a static
# annotation over the tables — strictly stronger, because a runtime dropper can
# only catch what its matcher recognises, while a table with no E slot cannot
# emit an E sentence at all. v2's own warning ("an E rewritten by the same
# generator comes back as a softer E") is a problem this shape does not have.


class Provenance(StrEnum):
    """The class of claim a string makes. Two of these may never be emitted."""

    #: Mechanically traceable to a placement, a lordship or dasa arithmetic.
    #: A second engine given the same birth data reproduces it exactly.
    DERIVED = "D"
    #: A classical interpretive rule applied to a D fact.
    RULE = "R"
    #: Traditional characterological inference. A disposition, never an
    #: occurrence, and present tense.
    TENDENCY = "T"
    #: Connective tissue that makes no claim at all — a hinge, a validation, a
    #: label. NOT one of v2's five: v2's table assumes every sentence is a
    #: claim, and it has no row for "And yet:". Forcing those into T would
    #: classify a conversational move as a characterological inference, which
    #: is how a class system stops meaning anything.
    FRAME = "F"
    #: Asserts that a specific thing happened or will happen. BANNED.
    EVENT = "E"
    #: No chart link. Lands on most readers regardless of chart. BANNED.
    COLD_READ = "C"


EMITTABLE_PROVENANCE: frozenset[Provenance] = frozenset(
    {Provenance.DERIVED, Provenance.RULE, Provenance.TENDENCY, Provenance.FRAME}
)


class BaseRate(StrEnum):
    """How much of the population a slot's predicate is true of anyway.

    The sixth column, and it exists because v2's own C-test does not close.
    That test asks "would this land on 70% of readers regardless of chart?"
    and applies it to the sentence's FORM — so a properly keyed, properly
    derived R sentence passes it while still carrying no information, because
    its predicate is near-universal. ("Most people borrow money between
    twenty-five and twenty-eight.") The failure reappears one level up, on the
    rule's consequent rather than on the sentence, and keying does not fix it.

    This is a judgement, not a measurement, and no test can make it for us. The
    column's job is to force the judgement to be WRITTEN DOWN next to the copy
    before the copy ships — see docs/AGE_GATED_READING_AUDIT_2026-08-05.md
    §6.3(a).
    """

    #: The predicate varies with the chart and is not near-universal.
    KEYED = "keyed"
    #: Common in the population. Keying makes the sentence honest; it does not
    #: make it informative. Admissible, but it buys less than it looks like it
    #: buys, and it must not be leaned on as the reading's proof.
    COMMON = "common"
    #: Near-universal. Carries no information however impeccable its
    #: derivation. Not admissible.
    UNIVERSAL = "universal"


class Orientation(StrEnum):
    """Which way a temperament sentence faces — outward at people, or inward.

    THE CONNECTIVE BETWEEN TWO SENTENCES IS A FACT ABOUT THE SENTENCES, NOT
    ABOUT THE GRAHAS THEY CAME FROM. That is the whole argument for this enum,
    and it is worth stating because the obvious alternative — a table of graha
    pairs that "oppose" each other — is what this replaces. The reader never
    sees a graha. They see two sentences, and they notice immediately when the
    word joining them claims a tension that is not in the words.

    A graha-pair table also decays on the first copy rewrite: change Ketu's
    nature line and every pair involving Ketu is silently wrong, with nothing to
    catch it. The tag travels ON the sentence, in the same literal, so a
    contributor rewriting the English is looking at `faces=` on the next line.

    ONE AXIS, and the collapse from three is deliberate. Tone (outward/inward),
    polarity (assertive/reflective) and energy (active/passive) are nearly
    collinear across our nine openings and nine nature lines — a line that faces
    outward is assertive and active in essentially every case — so three fields
    would sort the copy into the same two buckets while looking like they sorted
    it into eight. This is extensible: a second axis that genuinely separates
    lines the first one merges can be added as a field here, and `_transition`
    is the only reader.
    """

    #: Faces people, visibility, action, wanting.
    OUTWARD = "outward"
    #: Faces inward — withdrawal, patience, observation, self-containment.
    INWARD = "inward"


@dataclass(frozen=True, slots=True)
class _Line:
    """One authored sentence, carried together with what it MEANS.

    Deliberately not a ``(ta, en)`` pair plus a parallel lookup keyed by graha.
    A parallel table is the failure the tag exists to prevent, one level up: it
    can drift from the copy it describes and nothing shows the drift, whereas a
    field on the same literal cannot be missed by anyone editing the text.
    """

    ta: str
    en: str
    faces: Orientation


# The three transitions, and the choice between them is made from the two lines'
# tags rather than from anything astronomical. See ``Orientation``.
#
# THE TAMIL AND ENGLISH USED TO SAY DIFFERENT THINGS HERE, which is how long
# this went unnoticed. The single connective was ("அதே நேரத்தில்:", "And yet:")
# — but அதே நேரத்தில் means "at the same time", a CONTINUATION, while "And yet"
# asserts a CONTRAST. So the two languages have been printing opposite claims
# about the same pair of sentences since the device shipped. The Tamil was the
# right connective for the common case and the English was the wrong one; both
# now exist, chosen by meaning, and the old Tamil string keeps the job it was
# always doing.
# The Tamil is மறுபுறம் and NOT ஆனால், which is the obvious word and was the
# first draft. Every one of the nine Tamil nature lines already contains ஆனால் —
# they must, because rule 2 says every trait carries its own cost and ஆனால் is
# how that clause attaches — so the connective collided with its own object in
# all nine: "…பிறந்தவர். ஆனால், தொடங்கியதை முடிப்பவர்; … — ஆனால் ஒரு வழிமுறையை…".
# The English has no such collision ("And yet" against "though"), so this was
# visible only by reading the Tamil, and only after the transition engine made
# a contrast connective exist at all.
_CONTRAST: tuple[str, str] = ("மறுபுறம்:", "And yet:")
_CONTINUATION: tuple[str, str] = ("அதே நேரத்தில்:", "At the same time:")
_NO_TRANSITION: tuple[str, str] = ("", "")


def _transition(first: _Line, second: _Line) -> tuple[str, str]:
    """The connective between two temperament sentences, chosen from their sense.

    Three outcomes, in descending order of how much they claim:

    - **contrast** — the two face opposite ways, so the second genuinely turns
      against the first and saying so is more convincing than a flat note. Real
      people are contradictory and a jodhidar reading two significators that
      pull apart says it out loud.
    - **continuation** — different sentences facing the same way. They add to
      each other, and the connective marks that without claiming a tension.
    - **nothing** — the same line twice over, in effect: one graha supplied
      both, so there is no transition to make and a connective would be
      punctuation pretending to be thought.
    """
    if first.faces is not second.faces:
        return _CONTRAST
    if first is second or (first.en == second.en):
        return _NO_TRANSITION
    return _CONTINUATION


@dataclass(frozen=True, slots=True)
class _Voice:
    """One graha's six narration facets, each as ``(ta, en)`` except ``nature``.

    ``nature``      — temperament, when this graha lords the janma nakshatra.
                      A ``_Line`` rather than a pair, because it is the only
                      facet that ever stands next to another authored sentence
                      and therefore the only one that needs a transition chosen
                      for it. The heterogeneity is the honest shape: tagging the
                      other five would be metadata nothing reads.
    ``gift``        — the human capacity this graha gives. Was ``capacity``.
    ``shadow``      — where that same gift becomes excessive. Was ``soft_spot``.
    ``life_lesson`` — what the shadow keeps teaching. Closes the chain.

    THE FIRST THREE ARE ONE CHAIN AND THE NAMES NOW SAY SO. ``capacity`` and
    ``soft_spot`` were named when they came from two DIFFERENT grahas — the
    strongest and the weakest — so they were two independent facts and their
    names were fine. Since they became gift and shadow of one graha the old
    names actively misled: ``soft_spot`` reads as "a weakness this person has",
    which invites keying it back to the weakest graha, when what it means is
    "where this person's strength runs past its use".
    ``past_texture``— what a stretch under this lord asked for (past tense).
    ``now_texture`` — what a stretch under this lord offers (tense-neutral, so
                      beats 4 and 6 share it; deliberately self-contained,
                      never comparing to the preceding lord, because that would
                      be a claim we have not computed).
    ``action``      — the one thing to do while this lord runs.

    ``PROVENANCE`` classifies the FACET, not the graha, and that is the whole
    point of putting it here rather than on each instance. A facet that is T for
    Saturn and E for Mars is not a fact about Mars — it is a defect in the
    Saturn string, and the fix is to rewrite the string rather than to relabel
    it. Saturn's ``past_texture`` was exactly that case: see the note on it.
    """

    PROVENANCE: ClassVar[dict[str, tuple[Provenance, BaseRate]]] = {
        # Dispositions of the person, present tense, no occurrence.
        "nature": (Provenance.TENDENCY, BaseRate.KEYED),
        "gift": (Provenance.TENDENCY, BaseRate.KEYED),
        "shadow": (Provenance.TENDENCY, BaseRate.KEYED),
        # T, and the closest call in this table. "Life keeps teaching you X" is
        # one clause from "life taught you X in 2019", which is an event claim —
        # the class boundary runs directly under this facet. It stays T because
        # it names a standing disposition of the reader's life and no
        # occurrence: nothing in it happened, and nothing in it is dated. Any
        # future entry here that reaches for a period, a stage of life or a
        # circumstance has crossed into E and must be rewritten, not relabelled.
        "life_lesson": (Provenance.TENDENCY, BaseRate.KEYED),
        # NOT T. These describe a PERIOD, not the reader — the classical rule
        # for what a stretch under this lord asks for, applied to the D fact of
        # which lord ran. Calling them T would claim they describe the reader's
        # disposition, which they do not, and would hide the one place this
        # feature can slide into E: a sentence about a period is one clause
        # away from a sentence about what the reader did in it.
        "past_texture": (Provenance.RULE, BaseRate.KEYED),
        "now_texture": (Provenance.RULE, BaseRate.KEYED),
        # A remedial prescription is a rule application too. The rule is real
        # and traditional; we have not yet NAMED it in ``basis``, which §6.3(b)
        # of the audit rules a standing goal rather than a ship blocker —
        # sourcing 14 rules is a research task, and a content gate that cannot
        # close is worse than the feature not existing. Declaring these R and
        # leaving the source open is the honest record of that; declaring them
        # T to dodge the question would not be.
        "action": (Provenance.RULE, BaseRate.KEYED),
    }

    nature: _Line
    gift: tuple[str, str]
    shadow: tuple[str, str]
    life_lesson: tuple[str, str]
    past_texture: tuple[str, str]
    now_texture: tuple[str, str]
    action: tuple[str, str]


_VOICE: dict[str, _Voice] = {
    "SUN": _Voice(
        nature=_Line(
            "நீங்கள் பொறுப்பேற்கும் இயல்பு கொண்டவர்; அதை மற்றவர்கள் உடனே உணர்கிறார்கள் — ஆனால் "
            "கருத்து வேறுபாட்டை வெளியே காட்டுவதை விட உள்ளுக்குள் அதிகம் உணர்கிறீர்கள்.",
            "You carry yourself as someone in charge and people read that quickly — though you take "
            "disagreement more personally than you let on.",
            # Taking charge in front of people.
            Orientation.OUTWARD,
        ),
        gift=(
            "கேட்காமலேயே மற்றவர்கள் உங்களிடம் ஒப்படைக்கும் பொறுப்பு",
            "the authority people hand you without being asked",
        ),
        shadow=(
            "தவறு என்று வெளிப்பட நேரும் தருணம் — நீங்கள் நம்பாத நிலைப்பாட்டையும் தொடர்ந்து காப்பாற்றுகிறீர்கள்",
            "being seen to be wrong; you defend a position past the point you believe it",
        ),
        life_lesson=(
            "தன்னை நிரூபிப்பதும் தானாக மாறுவதும் ஒன்றல்ல என்பதை வாழ்க்கை உங்களுக்குத் "
            "திரும்பத் திரும்பச் சொல்கிறது.",
            "Life keeps reminding you that proving yourself and becoming yourself are not the "
            "same thing.",
        ),
        past_texture=(
            "அது உங்களை மற்றவர்கள் முன்னால் நிறுத்தியது — நீங்கள் விரும்பினாலும் விரும்பாவிட்டாலும்",
            "it put you in front of people, whether or not you wanted to be there",
        ),
        now_texture=(
            "இது நீங்கள் தெரியும் காலம்; பாதுகாப்பான பங்கை விட வெளிப்படையான பொறுப்பை எடுத்துக்கொள்ளுங்கள்",
            "this is the stretch where you are seen; take the visible role rather than the safe one",
        ),
        action=(
            "உங்கள் பெயரை உங்கள் வேலையின் மீது பதியுங்கள் — இந்தக் காலம் புலப்படுவதையே பலனாக மாற்றும்",
            "put your name on your work — this period converts visibility, not effort alone",
        ),
    ),
    "MOON": _Voice(
        nature=_Line(
            "யாரும் பேசுவதற்கு முன்பே சூழலை நீங்கள் புரிந்துகொள்கிறீர்கள்; அதனால் மற்றவர்கள் தங்கள் "
            "கவலைகளை உங்களிடம் கொண்டு வருகிறார்கள் — ஆனால் பிறரின் மனநிலை தேவைக்கும் அதிக நேரம் "
            "உங்களுடன் தங்கிவிடுகிறது.",
            "You read a room before anyone speaks, and people bring you their troubles — though other "
            "people's moods stay with you longer than they should.",
            # Receiving and absorbing, not projecting. The room acts on them.
            Orientation.INWARD,
        ),
        gift=(
            "மற்றவர்களுக்கு என்ன தேவை என்பதை அவர்கள் சொல்வதற்கு முன்பே அறிதல்",
            "reading what people need before they say it",
        ),
        shadow=(
            "அழுத்தத்தில் நிலைத்திருத்தல் — உங்கள் மனநிலை சூழலின் மனநிலையைப் பின்தொடர்கிறது",
            "steadiness under pressure; your mood follows the room's more than you would like",
        ),
        life_lesson=(
            "எல்லாவற்றையும் சுமக்காமலேயே அக்கறை காட்ட முடியும் என்பதை வாழ்க்கை உங்களுக்குத் "
            "திரும்பத் திரும்பக் கற்பிக்கிறது.",
            "Life keeps asking you to care without carrying all of it.",
        ),
        past_texture=(
            "அது அடிக்கடி நகர்ந்தது — இடம், மனநிலை, மனிதர்கள் — அதற்குள் நிலையாக இருக்கும்படி கேட்டது",
            "it moved often — homes, moods, people — and asked you to stay steady inside all of it",
        ),
        now_texture=(
            "இந்தக் காலம் மனிதர்கள் மற்றும் மனநிலையின் மீது நடக்கிறது; உங்கள் சொந்த தாளத்தைக் காத்தால் நன்றாக நடக்கும்",
            "this stretch runs on people and mood; keep your own rhythm and it goes well",
        ),
        action=(
            "உங்கள் தூக்கத்தையும் நீர் பழக்கத்தையும் காத்துக்கொள்ளுங்கள் — இந்தக் காலம் உங்கள் நிலைத்தன்மையின் மீது நடக்கிறது",
            "protect your sleep and your water; this period runs on your steadiness",
        ),
    ),
    "MARS": _Voice(
        nature=_Line(
            "முதலில் செயல்படுபவர், விரைவாக முடிவெடுப்பவர் — உங்களைச் சுற்றி வேலைகள் நடப்பதற்குக் "
            "காரணமே அதுதான். ஆனால் கடைசித் தகவல் வருவதற்கு முன்பே முடிவெடுத்துவிடுகிறீர்கள்.",
            "You move first and decide fast, which is why things around you actually get done — though "
            "you commit before the last fact is in.",
            Orientation.OUTWARD,
        ),
        gift=(
            "மற்றவர்கள் இன்னும் விவாதித்துக்கொண்டிருக்கும்போது செயல்படுதல்",
            "acting while other people are still discussing",
        ),
        shadow=(
            "பொறுமை — தானாகவே வந்திருக்கக்கூடிய முடிவை நீங்கள் வலுக்கட்டாயமாக வரவழைக்கிறீர்கள்",
            "patience; you force a decision that would have come to you on its own",
        ),
        life_lesson=(
            "ஒவ்வொரு போரும் உங்கள் பலத்திற்குத் தகுதியானது அல்ல என்பதை வாழ்க்கை உங்களுக்குத் "
            "திரும்பத் திரும்பக் கற்பிக்கிறது.",
            "Life keeps teaching you that not every battle deserves your strength.",
        ),
        past_texture=(
            "அது செயலுக்குப் பலன் தந்தது, தயக்கத்திற்குத் தண்டனை தந்தது — உங்களைக் களைப்படையவும் வைத்தது",
            "it rewarded action and punished hesitation, and it left you tired",
        ),
        now_texture=(
            "இந்தக் காலம் முதலில் நகர்பவருக்குப் பலன் தரும்; ஆபத்து என்பது தவறான இலக்கில் சக்தியைச் செலவிடுவது",
            "this stretch rewards moving first; the risk is spending the energy on the wrong target",
        ),
        action=(
            "ஒன்றை மட்டும் தேர்ந்தெடுத்து முன்னெடுங்கள்; மற்ற மூன்றைத் தள்ளுவதை நிறுத்துங்கள்",
            "pick one thing to push, and stop pushing the other three",
        ),
    ),
    "MERCURY": _Voice(
        nature=_Line(
            "வார்த்தைகளில் சிந்திப்பவர்; எந்தச் சூழலையும் பேச்சால் கடந்துவிடுவீர்கள் — ஆனால் ஏற்கனவே "
            "சரியாக எடுத்த முடிவை மீண்டும் யோசித்து மாற்றிக்கொள்கிறீர்கள்.",
            "You think in words and can talk your way through most rooms — though you often reason "
            "yourself out of a decision you had already got right.",
            # Talking their way through rooms is done AT people.
            Orientation.OUTWARD,
        ),
        gift=(
            "சிக்கலான ஒன்றை எளிமையாக விளக்குதல்",
            "explaining a complicated thing simply",
        ),
        shadow=(
            "முடிவெடுத்தல் — இரு பக்கத்தையும் நன்றாக வாதிடுவதால் எதுவும் வெல்வதில்லை",
            "deciding; you can argue both sides so well that neither one wins",
        ),
        # Answers the GRIEVANCE ("why am I still explaining things people should
        # already understand") rather than restating the shadow. The first draft
        # was "understanding more is not the same as deciding better", which
        # closed on the shadow's own noun and left the complaint unanswered.
        life_lesson=(
            "எல்லாவற்றையும் இன்னும் நன்றாக விளக்குவதன் மூலம் தீர்த்துவிட முடியாது என்பதை "
            "வாழ்க்கை உங்களுக்குத் திரும்பத் திரும்பக் காட்டுகிறது.",
            "Life keeps showing you that not everything is settled by explaining it better.",
        ),
        past_texture=(
            "அது பேச்சு, கற்றல், ஆவணங்கள் நிறைந்த காலம் — நுணுக்கங்களைச் சரியாகச் செய்ததில் வெற்றி வந்தது",
            "it was a stretch of talking, learning and paperwork, where the wins came from getting the "
            "details right",
        ),
        now_texture=(
            "இந்தக் காலம் வார்த்தை, கற்றல், தெளிவான ஆவணங்களுக்குப் பலன் தரும் — உழைப்புக்கு மட்டும் அல்ல",
            "this stretch pays for words, learning and clear paperwork more than for effort alone",
        ),
        action=(
            "ஒப்புக்கொள்வதற்கு முன் எழுதி வையுங்கள் — இந்தக் காலம் நுணுக்கங்களில் தீர்மானமாகிறது",
            "write it down before you agree to it; this period settles in the details",
        ),
    ),
    "JUPITER": _Voice(
        nature=_Line(
            "தீர்ப்புக்காக மக்கள் உங்களிடம் வருகிறார்கள்; நீங்கள் தாராளமாகக் கொடுக்கிறீர்கள் — ஆனால் "
            "ஒருவரால் தாங்கக்கூடியதை விட அதிகமாக வாக்குறுதி அளிக்கிறீர்கள்.",
            "People come to you for judgment and you give it generously — though you promise more than "
            "one person can reasonably carry.",
            # Giving outward, and over-giving. Guru faces the room.
            Orientation.OUTWARD,
        ),
        gift=(
            "மற்றவர்கள் நம்பிச் செயல்படும் அளவுக்கான தீர்ப்பு",
            "judgment people trust enough to act on",
        ),
        shadow=(
            "மறுத்துச் சொல்வது — அதனால் உங்கள் சம்மதம் பல இடங்களில் மெலிந்துவிடுகிறது",
            "saying no, so your yes gets spread thin",
        ),
        life_lesson=(
            "வரம்பின்றி அல்ல, விவேகத்துடன் கொடுக்கும்படி வாழ்க்கை உங்களைத் திரும்பத் "
            "திரும்பக் கேட்கிறது.",
            "Life keeps asking you to give wisely rather than endlessly.",
        ),
        past_texture=(
            "அது கதவுகளைத் திறந்தது, உங்கள் வட்டத்தை விரிவாக்கியது — நீங்கள் உள்ளே நுழைந்த அளவுக்கு",
            "it opened doors and widened your circle, to the extent that you walked through them",
        ),
        now_texture=(
            "இந்தக் காலம் விரிவடைகிறது — கற்பித்தல், பிள்ளைகள், உங்களை விட மூத்தவர்களின் உதவி கிடைக்கும்",
            "this stretch widens things — teaching, children, and people senior to you tend to help",
        ),
        action=(
            "ஒருவருக்குக் கற்பிக்கச் சம்மதியுங்கள் — இங்கே அது செலவை விட அதிகமாகத் திரும்பும்",
            "say yes to teaching someone; here it returns more than it costs",
        ),
    ),
    "VENUS": _Voice(
        nature=_Line(
            "சூழலையும் மனிதர்களையும் இதமாக வைத்திருப்பவர்; திறமை மட்டும் திறக்காத கதவுகளை அது "
            "திறக்கும் — ஆனால் தெளிவைக் கொடுக்கும் அந்த ஒரு உரையாடலைத் தவிர்க்கிறீர்கள்.",
            "You make things pleasant and people comfortable, and that opens doors ability alone would "
            "not — though you avoid the one conversation that would clear the air.",
            # Acting ON the room to keep it pleasant, even where the cost is
            # avoidance. The avoidance is a withdrawal from ONE conversation,
            # not a disposition to withdraw.
            Orientation.OUTWARD,
        ),
        gift=(
            "மனிதர்களிடம் காட்டும் பொறுமையும், அது ஈட்டித் தரும் நல்லெண்ணமும்",
            "patience with people, and the good will it earns",
        ),
        shadow=(
            "நேரடி மோதல் — எதிர்த்துச் சொல்வதை விட உள்ளுக்குள் தாங்கிக்கொள்கிறீர்கள், அது சேர்ந்துகொண்டே வரும்",
            "confrontation; you tend to absorb rather than object, and it accumulates",
        ),
        life_lesson=(
            "மௌனத்தால் வாங்கிய அமைதி நீடிப்பதில்லை என்பதை வாழ்க்கை உங்களுக்குத் திரும்பத் "
            "திரும்ப நினைவூட்டுகிறது.",
            "Life keeps reminding you that peace bought with silence does not hold.",
        ),
        past_texture=(
            "அது பொறுமைக்கு வசதியைத் திருப்பித் தந்தது, அதை மிகைப்படுத்தாமல் அனுபவிக்கும்படி கேட்டது",
            "it repaid patience with comfort, and asked you to enjoy it without over-spending it",
        ),
        now_texture=(
            "இது தாராளமான காலம் — உறவுகள், வசதி, பணம் இப்போது எளிதாக நகர்கின்றன",
            "this is a generous stretch — relationships, comfort and money move more easily now",
        ),
        action=(
            "முக்கியமானதை வெள்ளிக்கிழமை தொடங்குங்கள்; நீங்கள் தவிர்த்துவரும் அந்த உரையாடலை முடியுங்கள்",
            "start what matters on a Friday, and finish the conversation you have been avoiding",
        ),
    ),
    "SATURN": _Voice(
        nature=_Line(
            "தொடங்கியதை முடிப்பவர்; முதலில் இருப்பதை விட உறுதியாக இருப்பதையே விரும்புவீர்கள் — ஆனால் "
            "ஒரு வழிமுறையை ஏற்ற பிறகு, அது பலன் தராத நிலையிலும் விட்டு விலகுவது கடினம்.",
            "You finish what you start and would rather be sure than first — though once committed "
            "to a way of working, you find it hard to let go.",
            # Sureness before speed, holding rather than reaching. Sani works
            # against himself, not on the room.
            Orientation.INWARD,
        ),
        gift=(
            "வேகமானவர்களைத் தோற்கடிக்கும் பிரச்சினைகளை விடத் தாக்குப்பிடித்தல்",
            "outlasting problems that defeat faster people",
        ),
        shadow=(
            "தொடங்குவது — வராத ஒரு உறுதிக்காகக் காத்திருக்கிறீர்கள்",
            "starting; you wait for a certainty that does not arrive",
        ),
        # NOT "life keeps teaching you patience". That is the obvious Sani
        # sentence and it is the wrong one here: this graha's shadow is that it
        # waits too long, so a lesson prescribing more patience would endorse
        # the cost the two sentences above have just named. Sani's own grievance
        # is "why is it still taking so long" — the honest answer is that some
        # of the delay is the waiting. Cf. the KETU soft-spot defect, which was
        # this same failure one facet earlier.
        life_lesson=(
            "உறுதி வரும்வரை காத்திருப்பதன் விலை, உறுதியின்றித் தொடங்குவதை விட அதிகம் "
            "என்பதை வாழ்க்கை உங்களுக்குக் கற்பிக்கிறது.",
            "Life keeps teaching you that waiting for certainty costs more than starting "
            "without it.",
        ),
        # Reclassified 2026-08-05. The clause that stood here — "what you built
        # then was built slowly, and mostly alone" — is E, not R: it asserts
        # that the reader built something and that they were unsupported while
        # they did. Neither is in the chart. A Saturn stretch is a rule about
        # what the PERIOD asks for; the moment a sentence says what the reader
        # did inside it, it has left the rule and started inventing a
        # biography. The replacement stays on the period, where the rule is.
        past_texture=(
            "அது பலனை விடப் பொறுமையையே அதிகம் கேட்டது; அங்கே எதுவும் அவசரத்திற்கு இணங்கவில்லை",
            "it asked for endurance more than it offered reward, and nothing in it yielded to haste",
        ),
        now_texture=(
            "இந்தக் காலம் தாமதமாகத் தரும், ஆனால் தரும் — அவசரப்பட்டு செய்வதை விட இப்போது கட்டுவது நீடிக்கும்",
            "this stretch pays late, but it does pay; what you build now outlasts what you rush",
        ),
        action=(
            "ஒரு சிறிய உறுதிமொழியை நாற்பது நாட்கள் தினமும் காப்பாற்றுங்கள் — இந்தக் காலம் அளக்கக்கூடியதற்கே பலன் தரும்",
            "keep one small commitment daily for forty days; this period only pays what it can measure",
        ),
    ),
    "RAHU": _Voice(
        nature=_Line(
            "உங்களுக்குக் கொடுக்கப்பட்ட இடத்தை விட அதிகம் வேண்டும் என்பவர்; மற்றவர் காணாத வழிகளைக் "
            "கண்டுபிடிப்பீர்கள் — ஆனால் சென்றடைந்ததை அனுபவிக்க நிற்பதே இல்லை.",
            "You want more than the room you were given and you find routes other people do not see — "
            "though you rarely stop long enough to enjoy arriving.",
            Orientation.OUTWARD,
        ),
        gift=(
            "மற்றவர்கள் சுவரைக் காணும் இடத்தில் ஒரு வழியைக் காணுதல்",
            "seeing an opening where other people see a wall",
        ),
        shadow=(
            "முடிப்பது — நடப்பதை விட அடுத்தது எப்போதும் சுவாரஸ்யமாக இருக்கிறது",
            "finishing; the next thing is always more interesting than the current one",
        ),
        life_lesson=(
            "அடுத்ததாக நீங்கள் தேடுவது உண்மையில் நீங்கள் விரும்பியதுதானா என்று வாழ்க்கை "
            "திரும்பத் திரும்பக் கேட்கிறது.",
            "Life keeps asking whether the next thing is the one you actually wanted.",
        ),
        past_texture=(
            "அது வழக்கத்திற்கு மாறான திருப்பங்கள் நிறைந்தது — நீங்கள் சென்ற பாதை திட்டமிட்டது அல்ல",
            "it was a stretch of unusual turns — the route you took was not the one you planned",
        ),
        now_texture=(
            "இந்தக் காலம் வழக்கத்திற்கு மாறான வழிகளைத் தருகிறது; தோன்றியதால் அல்ல, தேர்ந்தெடுத்து எடுங்கள்",
            "this stretch offers unconventional routes; take them deliberately, not because they appeared",
        ),
        action=(
            "வழியைத் தேர்ந்தெடுத்து எடுங்கள் — தோன்றியது என்பதற்காக மட்டும் எடுக்க வேண்டாம்",
            "choose the route deliberately; do not take one just because it appeared",
        ),
    ),
    "KETU": _Voice(
        nature=_Line(
            "எதையும் விரைவில் ஊடுருவிப் பார்ப்பவர்; எளிதில் வியப்படைவதில்லை — ஆனால் கேட்டே "
            "தெரிந்துகொள்ளக்கூடிய ஒன்றிலிருந்தும் விலகிவிடுகிறீர்கள்.",
            "You see through things quickly and are not easily impressed — though you withdraw from "
            "what you could simply have asked about.",
            Orientation.INWARD,
        ),
        gift=(
            "உண்மையில் முக்கியமானது எது என்பதை நேராக அடைதல்",
            "cutting straight to what actually matters",
        ),
        shadow=(
            "தங்கியிருப்பது — சூழலுக்குத் தேவை அதுவாக இருக்கும்போதும் விலகிவிடுகிறீர்கள்",
            # The English used to stop at "...is what the situation needs", which
            # dropped the verb its own Tamil carries (விலகிவிடுகிறீர்கள் — "you
            # withdraw"). Rendered into the frame it read "Where it costs you is
            # staying, at the times when staying is what the situation needs":
            # the cost is staying, and staying is what is needed. Every other
            # soft_spot in this table names the behaviour after the noun; this
            # was the one that did not.
            "staying — you withdraw at the times when staying is what the situation needs",
        ),
        life_lesson=(
            "இன்னும் உங்கள் கவனத்திற்குத் தகுதியானதை விட்டு விலகாதீர்கள் என்பதை வாழ்க்கை "
            "உங்களுக்குத் திரும்பத் திரும்ப நினைவூட்டுகிறது.",
            "Life keeps reminding you not to leave what still deserves your attention.",
        ),
        past_texture=(
            "அது அமைதியாகப் பலவற்றை முடித்து வைத்தது; சேர்ப்பதை விட விட்டுவிடும்படி கேட்டது",
            "it quietly closed things off, and asked you to let go more than to acquire",
        ),
        now_texture=(
            "இந்தக் காலம் திறப்பதை விட முடிக்கிறது — அது இழப்பு அல்ல; தொடங்குவதை விட முடியுங்கள்",
            "this stretch closes more than it opens, which is not a loss; finish things rather than "
            "start them",
        ),
        action=(
            "நீண்ட நாட்களாக முடிக்காமல் இருக்கும் ஒன்றை முடித்து மூடுங்கள்; புதிதாக ஒன்றைத் தொடங்க வேண்டாம்",
            "close one long-open thing rather than starting a new one",
        ),
    ),
}


# ── The signature voice: how the reading opens, and the question it names ────
#
# Keyed on the chart's DOMINANT graha (app/reasoning/chart_signature.py), which
# is a different input from the nakshatra lord and the strength ranking above —
# hence a separate table rather than two more fields on _Voice.
#
# Two devices, both borrowed from how a jodhidar actually opens and both made
# chart-derived so they can be WRONG, which is the only thing that makes being
# right worth anything:
#
#   `opening`   — places the reader in one of two kinds of life. A reader
#                 self-identifies far faster than they accept being told a
#                 trait. Every one of these is falsifiable: a person can read it
#                 and say "no, that is not me".
#   `grievance` — the private complaint, quoted back as the reader's own inner
#                 question. This is the single highest-value sentence in the
#                 feature. It is also the one most easily abused: a generic
#                 grievance ("why is it taking so long") is true of everyone who
#                 ever consulted an astrologer, which is why it is keyed on the
#                 signature and not printed unconditionally.
_SIGNATURE_OPENING: dict[str, _Line] = {
    "SUN": _Line(
        "சிலர் கவனிக்கப்படாத இடத்தில் சிறப்பாகச் செயல்படுவார்கள். சிலர் பார்க்கப்படும்போதுதான் "
        "முழுமையாகத் தங்களாக இருப்பார்கள். நீங்கள் இரண்டாவது வகை.",
        "Some people do their best work out of sight. Others are only fully themselves when they "
        "are being watched. You are the second kind.",
        # Needs to be seen. The most outward line in the table.
        Orientation.OUTWARD,
    ),
    "MOON": _Line(
        "சிலர் திட்டங்களை வைத்து வாழ்க்கையைக் கடப்பார்கள். சிலர் சூழலை உணர்ந்து கடப்பார்கள் — "
        "சொல்லப்படுவதற்கு முன்பே மாற்றத்தை உணர்பவர்கள். நீங்கள் இரண்டாவது வகை.",
        "Some people move through life on plans. Others move on atmosphere — reading a room, "
        "feeling a shift before it is announced. You are the second kind.",
        # Sensing rather than acting; the room reaches them first.
        Orientation.INWARD,
    ),
    "MARS": _Line(
        "சிலர் சரியான தருணத்திற்குக் காத்திருப்பார்கள். சிலர் அதை உருவாக்கிவிட்டு விளைவுகளைச் "
        "சமாளிப்பார்கள். நீங்கள் இரண்டாவது வகை.",
        "Some people wait for the right moment. Others create it and deal with the consequences "
        "afterwards. You are the second kind.",
        Orientation.OUTWARD,
    ),
    "MERCURY": _Line(
        "சிலர் தங்கள் இருப்பால் மற்றவர்களை நம்பவைப்பார்கள். சிலர் விளக்கத்தால் நம்பவைப்பார்கள். "
        "நீங்கள் இரண்டாவது வகை.",
        "Some people convince others by sheer presence. Others convince by explaining. You are the "
        "second kind.",
        # Convincing is done to somebody.
        Orientation.OUTWARD,
    ),
    "JUPITER": _Line(
        "சிலர் ஒவ்வொரு கதவையும் தள்ளித் திறக்க வேண்டியிருக்கும். சிலருக்குக் கதவுகள் திறக்கும் — "
        "எளிதாக வந்ததை மதிக்காமல் விடுவதுதான் அவர்களின் ஆபத்து. நீங்கள் இரண்டாவது வகை.",
        "Some people force every door. Others find doors tend to open — and their real risk is not "
        "valuing what came easily. You are the second kind.",
        # A judgement call worth recording: doors OPENING is something the world
        # does to them, which argues INWARD. It is tagged OUTWARD because the
        # line is about their standing among people — Guru's fortune arrives
        # through patronage, and the reader placed here is being told they are
        # well-received, not that they are receptive.
        Orientation.OUTWARD,
    ),
    "VENUS": _Line(
        "சிலர் தாங்கள் விரும்புவதை அழுத்தத்தால் அடைவார்கள். சிலர், மற்றவர்கள் கொடுக்க "
        "விரும்புவதால் அடைவார்கள். நீங்கள் இரண்டாவது வகை.",
        "Some people get what they want by pushing for it. Others get it because people want to "
        "give it to them. You are the second kind.",
        Orientation.OUTWARD,
    ),
    "SATURN": _Line(
        "சிலருக்கு வாய்ப்புகள் தானாக வந்து சேரும். சிலர் ஒவ்வொரு வாய்ப்பையும் போராடி வெல்ல "
        "வேண்டியிருக்கும். நீங்கள் இரண்டாவது வகை.",
        "Some people find that opportunities arrive on their own. Others have to win each one. You "
        "are the second kind.",
        # Winning each one is endurance turned on the self, not display.
        Orientation.INWARD,
    ),
    "RAHU": _Line(
        "சிலர் தங்களுக்குக் கிடைத்த வாழ்க்கைக்குள் நிறைவாக இருப்பார்கள். சிலர் அதன் எல்லையைத் "
        "தாண்டியே கை நீட்டிக்கொண்டிருப்பார்கள். நீங்கள் இரண்டாவது வகை.",
        "Some people are content inside the life they were handed. Others spend it reaching past "
        "the edge of it. You are the second kind.",
        Orientation.OUTWARD,
    ),
    "KETU": _Line(
        "சிலருக்கு அறைக்குள் இருப்பது அவசியம். சிலருக்கு சற்று வெளியே நின்றால்தான் அது தெளிவாகத் "
        "தெரியும். நீங்கள் இரண்டாவது வகை.",
        "Some people need to be in the room. Others see it more clearly from just outside it. You "
        "are the second kind.",
        # Standing outside the room is the definition of the inward pole.
        Orientation.INWARD,
    ),
}

# ── The two nouns beat 1 printed and never used ──────────────────────────────
#
# Until 2026-08-07 the opening named three things — the janma nakshatra, the
# Moon's rasi and the lagna rasi — and only the first of them said anything: the
# nature line is keyed on the nakshatra lord, and the other two were decoration.
# Two readers with different stars and different Moon rasis got the SAME opening
# and the SAME character paragraph whenever their signature and strongest graha
# happened to coincide, which is common. Naming a thing to the reader's face and
# then deriving nothing from it is worse than not naming it: the reader can see
# the noun, so the silence after it is legible to them and to nobody else.
#
# KEYED ON THE RASI, NOT ON THE RASI'S LORD, and that is the load-bearing
# choice. A lord-keyed table would be nine entries and would collide with
# ``_VOICE`` by construction — Moon in Mithunam gives Mercury, and a reader whose
# janma nakshatra is also Mercury's would be told the same thing twice in
# consecutive clauses with no way for either sentence to know. Twelve rasi
# entries cannot collide with a nine-graha table at all, and the rasi is the unit
# a Tamil reader already knows themselves by.
#
# WHERE THEY DO NOT GO. The ``parent`` and ``other`` registers keep the bare fact
# sentence. Both of those are deliberate silences and neither is a length
# problem: a child's reading is a different artifact rather than the adult one
# rephrased, and an adult who is not in the room gets the chart facts and no
# character note at all (§3.1). A disposition clause is exactly the material
# those two registers exist to withhold.

# Chandra is manah-karaka; the rasi it occupies is the classical colour of the
# manas. So this table describes the MIND — never the life, never the outcome —
# which is also what keeps it inside the teen register's content rule.
_MOON_MIND: dict[int, tuple[str, str]] = {
    1: ("முடிவெடுத்து முடிக்கும் முன்பே தொடங்கிவிடும்",
        "a mind that starts before it has finished deciding"),
    2: ("மெதுவாக நிலைபெறும்; பிறகு அசையாது",
        "a mind slow to settle and then immovable"),
    3: ("சூழ்நிலையை விட வேகமாக ஓடும்",
        "a mind that runs ahead of your circumstances"),
    4: ("உணர்ந்த அனைத்தையும் வைத்திருக்கும்",
        "a mind that keeps everything it has felt"),
    5: ("நடைமுறையாகப் பார்ப்பதற்கு முன் தன்னைச் சார்ந்ததாகப் பார்க்கும்",
        "a mind that takes things personally first, practically second"),
    6: ("முழுமையைக் காண்பதற்கு முன் குறையைக் காணும்",
        "a mind that sees the flaw before the whole"),
    7: ("பதில் தெரிந்த பிறகும் நிறுத்தி நிறுத்திப் பார்க்கும்",
        "a mind still weighing after the answer is obvious"),
    # Moon is debilitated here and the copy carries that without naming it: the
    # holding-on IS the neecha, read as disposition rather than as a verdict.
    8: ("விடாமல் பிடிக்கும்; நினைத்ததை விட ஆழமாகச் செல்லும்",
        "a mind that grips, and goes deeper than intended"),
    9: ("பதிலை மட்டுமல்ல, அதன் பின்னுள்ள நெறியையும் தேடும்",
        "a mind that wants the principle behind the answer"),
    10: ("லாபத்தைக் கணக்கிடும் முன் விலையைக் கணக்கிடும்",
         "a mind that counts the cost before the gain"),
    11: ("சற்று விலகி நின்று கவனிக்கும்",
         "a mind that stands a little apart and watches"),
    12: ("இருக்கும் இடத்தின் உணர்வை உள்வாங்கும்",
         "a mind that absorbs whatever room it is in"),
}

# The lagna is the body and the first impression — how the person is MET, which
# is a claim about other people's reading of them and not about their character.
# That distinction is why this can sit next to the nature line without competing
# with it: one says how you come across, the other says what you do.
#
# The frame supplies "so people meet you" / "லக்னத்தால்" so the attribution is
# unambiguous. Left to the entries, twelve strings would each have to re-state
# which of the two nouns they belong to, and the first one written without it
# would silently attach the outer impression to the Moon clause beside it.
_LAGNA_FACE: dict[int, tuple[str, str]] = {
    1: ("ஏற்கனவே நகர்ந்துகொண்டிருப்பவராகத் தெரிகிறீர்கள்",
        "already in motion"),
    2: ("அவசரமற்றவராகத் தெரிகிறீர்கள்; அதை உறுதி என்று படிக்கிறார்கள்",
        "unhurried, and they read that as certainty"),
    3: ("விரைவானவராகவும் பேச எளியவராகவும் தெரிகிறீர்கள்",
        "quick, and easy to talk to"),
    4: ("யாரை அருகில் விடுவது என்பதில் கவனமானவராகத் தெரிகிறீர்கள்",
        "careful about who gets close"),
    5: ("கேட்காமலேயே பொறுப்பில் இருப்பவராகத் தெரிகிறீர்கள்",
        "as someone in charge, asked or not"),
    6: ("நுணுக்கமானவராக — சில நேரம் திருத்துபவராக — தெரிகிறீர்கள்",
        "exact, and sometimes correcting"),
    7: ("உங்கள் கருத்து தெரிவதற்கு முன்பே இணக்கமானவராகத் தெரிகிறீர்கள்",
        "agreeable long before they meet your opinion"),
    8: ("படிக்க முடியாதவராகத் தெரிகிறீர்கள்; ஆழம் இருக்கும் என்று எண்ணுகிறார்கள்",
        "hard to read, and they assume depth"),
    9: ("வெளிப்படையானவராகத் தெரிகிறீர்கள்; நேரடித்தன்மை நம்பிக்கையாகப் படுகிறது",
        "open, and they read directness as confidence"),
    10: ("உங்கள் வயதை விட மூத்தவராகத் தெரிகிறீர்கள்",
         "serious, and older than you are"),
    11: ("கூட்டத்திற்குள் இருந்தாலும் சற்று தனித்தவராகத் தெரிகிறீர்கள்",
         "slightly apart, even from inside the group"),
    12: ("நீங்கள் இருப்பதை விட மென்மையானவராகத் தெரிகிறீர்கள்",
         "softer than you are"),
}


# Renamed from _SIGNATURE_GRIEVANCE 2026-08-07. It is no longer keyed on the
# signature: the grievance now closes the strongest graha's gift→shadow chain in
# _beat_strength_and_cost, so it must come from that graha or "Which is why" is
# asserting a cause it does not have. The old name would have been a standing
# invitation to key it back.
_GRIEVANCE: dict[str, tuple[str, str]] = {
    "SUN": ("இதை நான் ஏன் திரும்பத் திரும்ப நிரூபிக்க வேண்டியிருக்கிறது",
            "why do I have to keep proving this"),
    "MOON": ("மற்றவர்களின் மனநிலை ஏன் என் சுமையாகிறது",
             "why does everyone else's mood end up being mine to carry"),
    "MARS": ("ஒவ்வொரு முறையும் நான்தான் ஏன் தொடங்க வேண்டியிருக்கிறது",
             "why am I always the one who has to start it"),
    "MERCURY": ("ஏற்கனவே புரிந்திருக்க வேண்டியதை ஏன் நான் விளக்கிக்கொண்டே இருக்கிறேன்",
                "why am I still explaining things people should already understand"),
    "JUPITER": ("எல்லோரும் என்னிடம் வருகிறார்கள் — எனக்காக யார் வருகிறார்கள்",
                "everyone comes to me, so who comes for me"),
    "VENUS": ("சமாதானம் காப்பது நான் — காயப்படுவதும் ஏன் நான்",
              "why do I keep the peace and still end up the one who is hurt"),
    "SATURN": ("இவ்வளவு முயற்சி செய்கிறேனே — ஏன் இன்னும் தாமதமாகிறது",
               "I am putting in this much, so why is it still taking so long"),
    "RAHU": ("எதுவும் ஏன் போதுமானதாக இருப்பதே இல்லை",
             "why does none of it ever feel like enough"),
    "KETU": ("நான் வாழும் வாழ்க்கைக்கு வெளியே நிற்பது போல் ஏன் தோன்றுகிறது",
             "why do I feel like I am standing outside a life I am supposedly living"),
}

# Validate before reframing. One clause, and it is what turns the grievance from
# an accusation into recognition. Borrowed wording — it is simply the right line.
_VALIDATION: tuple[str, str] = (
    "அந்த உணர்வு வீணானது அல்ல.",
    "That feeling is not misplaced.",
)

# ── The falsifiability offer ─────────────────────────────────────────────────
#
# Spec v2 Part 3, substitute #4, and the strongest of the four things that
# replace "in fifty years of practice" — which does not port, because software
# has no practice and borrowing the phrasing is a straightforward lie about what
# the user is talking to.
#
# This one is available ONLY to software. A practitioner cannot say "the whole
# reading may rest on bad input" without losing the room; saying it costs us
# nothing and converts the honest weakness into the credibility the borrowed
# fifty years was faking.
#
# We already computed the input and were putting the output in the wrong place.
# _lagna_is_reliable decided whether to open on the lagna, and when it said no we
# wrote "lagna withheld — birth time is not confirmed" into `basis` — the
# disclosure the plain reader never opens. So the reader most affected by the
# uncertainty was the one least likely to hear about it.
#
# Two forms, not one, and this is where we can beat v2's own specification: v2
# prints the same boilerplate on every reading. We know which case we are in, so
# the confirmed reading offers a CHECK and the unconfirmed one states its
# UNCERTAINTY BAND (Part 3 substitute #3) and says what it stood on instead.
# Boilerplate that appears identically on every reading is read as a disclaimer
# and skipped; a sentence that could only have been written about this reader is
# read.
#
# THE ANTECEDENT HAD TO BE WIDENED, and this is the correction v2's own wording
# needs before it can be used here. v2's specimen places the offer immediately
# before a paragraph DESCRIBING the lagnam, so "if that doesn't sound like you,
# the birth time is off" is a sound inference there. Our beat 1 is not that
# paragraph: its two claims come from the janma nakshatra and the chart
# signature, and the rising sign is only NAMED. The Moon covers ~0.55° an hour
# against a 13°20' nakshatra, so twenty minutes essentially never moves the
# star — meaning a reader who says "that is not me" has said almost nothing
# about the birth TIME, and pointing them at it would have sent them to check
# the one input their objection was not evidence about. The lagna does turn on
# it (~15°/hour against a 30° rasi), which is why the unconfirmed form is the
# one that gets to say "twenty minutes".
#
# Keyed on REGISTER rather than on ``addressed_to`` directly: a guardian reading
# a child's chart and a daughter reading her father's are the same speech act
# here — somebody checking a description against a person who is not them — and
# the copy does not care which.
_FALSIFIABILITY: dict[tuple[str, bool], tuple[str, str]] = {
    ("self", True): (
        "இது உங்களைப் பற்றியதாக இல்லை என்று தோன்றினால் — சிறிதளவும் அல்ல, உண்மையிலேயே இல்லை "
        "என்றால் — தொடர்வதற்கு முன் பிறந்த தேதியையும் நேரத்தையும் சரிபாருங்கள். இருபது "
        "நிமிடங்கள் லக்னத்தை மாற்றிவிடும்.",
        "If that does not sound like you — not partly, genuinely not — check the birth date and "
        "time before reading on. Twenty minutes can move the rising sign.",
    ),
    # "…which the rest is built on" USED TO STAND HERE AND IT WAS FALSE. The
    # sentence claims the reading rests on the star alone once the lagna is
    # withheld, and two of this register's beats do not: `_signature_lord` and
    # `_strongest_and_weakest` both key on `strength_score`, and
    # chart_strength.explain_natal_planet_score takes `natal_lagna_rasi` and
    # swings house strength 25→80 on it. So the opening line and the whole
    # strength/cost beat stood on the input this sentence had just disclaimed —
    # in the one register whose entire job is to be honest about that. The claim
    # is now narrowed to what actually holds without a lagna, and
    # `_LAGNA_STRENGTH_CAVEAT` says what does not.
    ("self", False): (
        "பிறந்த நேரம் உறுதிப்படுத்தப்படவில்லை; அதனால் இந்த வாசிப்பு லக்னத்தை விட்டுவிடுகிறது — "
        "இருபது நிமிடங்கள் அதை மாற்றிவிடும். உங்கள் நட்சத்திரமும் இங்குள்ள காலக் "
        "கணக்குகளும் அதைச் சாராமல் நிற்கின்றன.",
        "The birth time is not confirmed, so this reading leaves the rising sign out — twenty "
        "minutes can move it. Your star and every date here stand without it.",
    ),
    ("third_person", True): (
        "இது {name}-ஐப் பற்றியதாக இல்லை என்று தோன்றினால் — சிறிதளவும் அல்ல, உண்மையிலேயே இல்லை "
        "என்றால் — தொடர்வதற்கு முன் பிறந்த தேதியையும் நேரத்தையும் சரிபாருங்கள். இருபது "
        "நிமிடங்கள் லக்னத்தை மாற்றிவிடும்.",
        "If that does not sound like {name} — not partly, genuinely not — check the birth date "
        "and time before reading on. Twenty minutes can move the rising sign.",
    ),
    # This one KEEPS the strong claim, and the asymmetry is the point rather
    # than an oversight. `third_person` is the parent and third-party registers,
    # and neither emits `strength_and_cost` or the signature opening — the child
    # note is keyed on the nakshatra lord and the third-party reading carries no
    # character material at all. So in these two registers the star and the dasa
    # arithmetic really are the whole of what is left, and saying so is true.
    ("third_person", False): (
        "{name}-இன் பிறந்த நேரம் உறுதிப்படுத்தப்படவில்லை; அதனால் இந்த வாசிப்பு லக்னத்தை "
        "விட்டுவிடுகிறது — இருபது நிமிடங்கள் அதை மாற்றிவிடும். அவரின் நட்சத்திரத்தை அது "
        "மாற்றுவதில்லை; மீதி அதன் மீதுதான் நிற்கிறது.",
        "{name}'s birth time is not confirmed, so this reading leaves the rising sign out — "
        "twenty minutes can move it. It does not move their star, which the rest is built on.",
    ),
}

# Appended to the unconfirmed-time offer on the SELF register only, because it
# is the only register carrying strength-derived material. `client_with_guardian`
# maps to the "self" key above (it is second person) and yet contains neither the
# signature opening nor the strength beat, so keying this on the falsifiability
# REGISTER would have told a teenager to discount a sentence their reading does
# not contain. It keys on `addressed_to` instead.
#
# The device here is v2 Part 3 substitute #3 — state the uncertainty band rather
# than pick a side — applied to our own inputs instead of to a disagreement
# between classical sources. A practitioner cannot say "take this specific part
# of what I just told you less seriously"; software can, it costs nothing, and
# it is worth more than the confident version because a reader who checks it
# finds it was true.
# It names the STRENGTH AND THE COST rather than "which graha scores highest",
# and that is the jargon rule doing real work rather than being obeyed: "graha"
# is on the English lint, and a reader told to discount "the graha ranking"
# would not know which sentence that was. Naming the beat by what it says to
# them is both plainer and more actionable. "Named next" is exact — on the self
# path `strength_and_cost` is always the beat immediately after this one.
_LAGNA_STRENGTH_CAVEAT: tuple[str, str] = (
    "அடுத்து வரும் பலமும் அதன் விலையும் லக்னத்தைச் சார்ந்தவை; அவற்றை மட்டும் சற்று "
    "தளர்வாக எடுத்துக்கொள்ளுங்கள்.",
    "The strength and the cost named next do rest on it, so hold those more lightly.",
)

# ── The invitation: v2's E→R conversion operator, second half ────────────────
#
# Spec v2 Part 1. The operator converts a banned event claim ("between
# twenty-five and twenty-eight there was a loan") into a rule plus an invitation
# ("the sixth-house emphasis from twenty-five to twenty-eight is the chart's
# marker for obligation or borrowing — whether it took that form for you, you
# will know"). We have been shipping the FIRST half only since this feature
# launched: `past_texture` is exactly that rule, correctly dated, and then the
# beat stops.
#
# Stopping there is safe and it undersells. The rule on its own is a statement
# ABOUT A PERIOD that the reader has to decide what to do with; the invitation
# tells them what to do with it, which is to check it against a decade they
# actually lived. That check is the entire trust mechanism of the past beat —
# "trust is earned on the checkable past" is this module's first sentence — and
# until now nothing in the copy asked the reader to perform it.
#
# It is also the one device here that gets STRONGER the less certain we are. An
# assertion that misses is wrong; an invitation that misses has said nothing
# false, and an invitation that lands was matched by the reader rather than
# accepted from us. That asymmetry is why v2 rates it above every other
# substitute for practitioner authority, and why it belongs on the beat that
# carries dates rather than on the beat that carries character.
#
# Eleven words, and the brevity is deliberate. The spec's own specimen runs to
# twenty-five ("...you'll recognise better than I can state"), which in a piece
# this short reads as the engine apologising for itself. Said once, briefly, at
# the close of the beat, it reads as a practitioner handing the floor back.
#
# It drafted as "…you will know" and the event-claim lint rejected it, which was
# correct and is worth recording. "You will know" is semantically an invitation
# and grammatically a future assertion about the reader — the exact construction
# `\byou will\b` exists to keep out, because the sentence one edit away from it
# is "you will marry". The right response to a lint firing on a string you like
# is to change the string: an exception carved for one entry is an exception
# available to the next one. "Only you can say" carries the same meaning in the
# present, and is closer to how the handing-back is actually spoken.
_PAST_INVITATION: tuple[str, str] = (
    "அது உங்களுக்கு எந்த வடிவத்தில் வந்தது என்பதை நீங்கள்தான் சொல்ல முடியும்.",
    "Whether it took that form for you, only you can say.",
)

# ── Minor forms: an adult life surface named to somebody who has no such life ─
#
# `now_texture` is the only vocabulary the teen register shares verbatim with
# the adult one, and two of its nine entries name a domain a sixteen-year-old
# does not have. Jupiter's widening ran "teaching, children, and people senior
# to you tend to help" and Venus's ran "relationships, comfort and money move
# more easily now" — both printed to a teenager holding their own account, and
# both read by a Tamil parent looking over that shoulder as a claim about
# romance and progeny.
#
# The doctrine does not change and must not: Guru IS putra-karaka and Sukra IS
# kalatra-karaka, and rewriting the ADULT strings to dodge the teen case would
# delete real karakatva from the readings where it belongs. What changes is
# which life surface the same karakatva is read onto — the identical move
# age_phase_service:128 already makes for house themes. A Guru period over a
# student's years is the classical vidya/guru window, and a Sukra period is
# arts, ease and companionship. Those are not softenings of the adult copy; they
# are the more accurate reading for the age.
#
# ONLY these two, and the boundary is drawn by the lint rather than by taste:
# tests/test_one_minute_reading.py scans a teen reading for the adult-life
# vocabulary, so a future edit that reintroduces "money" into, say, Mercury's
# adult copy fails the suite even though nobody thought to add Mercury here.
# The gap in this shape of fix is always the table, never the guard.
_MINOR_NOW_TEXTURE: dict[str, tuple[str, str]] = {
    "JUPITER": (
        "இந்தக் காலம் விரிவடைகிறது — கற்றல், ஆசிரியர்கள், உங்களை விட மூத்தவர்களின் உதவி கிடைக்கும்",
        "this stretch widens things — learning, teachers, and people older than you tend to help",
    ),
    "VENUS": (
        "இது எளிதான காலம் — நட்பு, கலை, ரசனை சார்ந்தவை இப்போது எளிதாக நகர்கின்றன",
        "this is an easier stretch — friendships, art and anything with taste in it move more "
        "easily now",
    ),
}


def _now_texture(lord: str, addressed_to: str) -> tuple[str, str]:
    """``(ta, en)`` for what a stretch under ``lord`` offers, in this register."""
    if addressed_to == "client_with_guardian" and lord in _MINOR_NOW_TEXTURE:
        return _MINOR_NOW_TEXTURE[lord]
    return _VOICE[lord].now_texture

# ── Reading a chart that belongs to somebody else ────────────────────────────
#
# §3.1 of docs/AGE_GATED_READING_AUDIT_2026-08-05.md, and the source document's
# hardest cross-gate prohibition: NOBODY WHO IS NOT IN THE ROOM GETS READ IN
# ACHIEVEMENT TERMS — not a spouse, not a child, not a business partner.
#
# The family vault is member-centric and this reading was placed as its first
# section per member, so a 52-year-old father opening his 26-year-old daughter's
# card was handed her full adult reading: the signature opening, her private
# grievance quoted back as her own inner question, her soft spot, and her
# marriage-timing beat — every one of them addressed as "you".
#
# The close is not an apology for a shorter reading. A reading that simply stops
# reads as broken, and the honest sentence is available: the material we are
# withholding is not missing, it is HERS, and a chart read at second hand has a
# natural end. It doubles as the invite loop, which is not the reason it is here
# but is not nothing either.
#
# It cannot say what the source document says — "bring them here and I will talk
# to them" — because that is a first-person claim to practice, which is v2 ship
# blocker #5 and does not port for the same reason "in fifty years" does not.
_THIRD_PARTY_CLOSE: tuple[str, str] = (
    "தன்னைப் பற்றி வாசிக்காத ஒருவரைப் பற்றி ஜாதகம் இவ்வளவுதான் சொல்லும். மீதி "
    "{name}-க்குச் சொந்தமானது; அவர் கேட்கும்போது அது திறக்கும்.",
    "That is as far as a reading goes for someone who is not the one reading it. The rest is "
    "{name}'s own, and it opens when they ask for it.",
)

# Provenance for the copy that does not live on a _Voice — see _Voice.PROVENANCE
# for the model, and tests/test_one_minute_reading.py for the enforcement. The
# test discovers these tables by reflection rather than from a list, so a new
# table of Tamil/English copy fails the suite until it is classified here.
_TABLE_PROVENANCE: dict[str, tuple[Provenance, BaseRate]] = {
    # Nine keyed variants, each falsifiable: a reader can meet one and say "no,
    # that is not me", which is the only thing that makes meeting it worth
    # anything.
    "_SIGNATURE_OPENING": (Provenance.TENDENCY, BaseRate.KEYED),
    # T rather than R, and the call is worth recording. The derivation ("Moon in
    # Viruchigam", "Meenam rising") is D and lives in the frame beside them; what
    # these tables add is the classical characterological inference drawn from
    # that placement, which is the definition of T. Calling them R would claim
    # they are a rule application whose output is checkable, and a disposition
    # is not — it is exactly the kind of claim the falsifiability beat invites
    # the reader to reject.
    #
    # KEYED, not COMMON, and unlike _GRIEVANCE this one is easy: each entry is
    # true of a twelfth of the population by construction, and the reader is
    # told which twelfth they are in and why in the same sentence.
    "_MOON_MIND": (Provenance.TENDENCY, BaseRate.KEYED),
    "_LAGNA_FACE": (Provenance.TENDENCY, BaseRate.KEYED),
    # COMMON, and this is the honest entry in the table. The grievance is the
    # highest-value sentence in the feature and the one carrying the most
    # Barnum risk — the module comment above already says so. Keying it on a
    # graha was the FORM fix and it worked; it is not the base-rate fix.
    # Saturn's "why is it still taking so long" is true of most people who ever
    # consulted an astrologer, whatever their chart. It stays, because a
    # recognised complaint earns attention that the reading then spends on
    # chart-derived material — but it is marked, so nobody mistakes it for
    # proof and nobody builds the next trust mechanism on top of it.
    "_GRIEVANCE": (Provenance.TENDENCY, BaseRate.COMMON),
    # Claims nothing. Responds to the sentence before it.
    "_VALIDATION": (Provenance.FRAME, BaseRate.KEYED),
    # The three transitions. F, and unusually purely so — a connective is the
    # one kind of string whose entire content is the relation between two OTHER
    # strings. It makes no claim about the reader at all, which is exactly why
    # choosing it from the grahas rather than from the sentences was wrong.
    "_CONTRAST": (Provenance.FRAME, BaseRate.KEYED),
    "_CONTINUATION": (Provenance.FRAME, BaseRate.KEYED),
    "_NO_TRANSITION": (Provenance.FRAME, BaseRate.KEYED),
    # D, and unusually literally so: the only claims it makes are about our own
    # inputs (whether the birth time is confirmed) and about the ephemeris
    # (twenty minutes moves the lagna). It says nothing about the reader, which
    # is exactly why it can be trusted to say the reading might be wrong.
    "_FALSIFIABILITY": (Provenance.DERIVED, BaseRate.KEYED),
    # D for the same reason, one level finer: it reports which of OUR OWN
    # computations take the lagna as an input. That is a fact about this
    # codebase, checkable in chart_strength.py, and not a claim about anybody.
    "_LAGNA_STRENGTH_CAVEAT": (Provenance.DERIVED, BaseRate.KEYED),
    # F, and it is worth being exact about why, because the temptation is to
    # call it T. It asserts nothing about the reader — it explicitly declines
    # to, which is the whole device. It is a conversational move that hands the
    # judgement back, and the class system stops meaning anything the moment a
    # refusal to claim is filed as a claim.
    "_PAST_INVITATION": (Provenance.FRAME, BaseRate.KEYED),
    # Same class as the `now_texture` facet it substitutes for: a rule about
    # what a period under this lord offers, read onto the life surface the
    # subject actually has.
    "_MINOR_NOW_TEXTURE": (Provenance.RULE, BaseRate.KEYED),
    # Claims nothing about anybody. States where the reading stops, and why.
    "_THIRD_PARTY_CLOSE": (Provenance.FRAME, BaseRate.KEYED),
    # Not a claim about the reader or the chart — a statement of what this
    # service will not do, and why. The only string here whose value is that it
    # is identical for everyone, which is exactly what a declared principle is.
    "_LONGEVITY_REFUSAL": (Provenance.FRAME, BaseRate.KEYED),
    # The dasha/area affinity read out loud — a rule applied to the running
    # lord, and the one place a date reaches the body text.
    "_OUTLOOK_SUPPORTIVE": (Provenance.RULE, BaseRate.KEYED),
    "_OUTLOOK_MIXED": (Provenance.FRAME, BaseRate.KEYED),
    "_OUTLOOK_SLOW": (Provenance.RULE, BaseRate.KEYED),
}

# ── A child's reading is a different artifact, not the adult one rephrased ───
#
# The first build of this module composed a minor's reading from the adult
# facets above and ran the result through a second-person -> third-person string
# rewrite. It produced "they carry yourself as someone in charge", which is the
# visible symptom; the real defect is that the adult copy is about a life the
# child does not have. "Your soft spot is confrontation" is a character verdict
# on an eight-year-old, and "the last ten years asked you for endurance" is a
# description of their parents' decade, not theirs.
#
# So the minor path uses its own vocabulary, written natively in third person
# and addressed to the parent, and it drops the strength/past beats entirely
# rather than softening them. Same rule as the house-theme rewrite in
# age_phase_service:128 — same graha, different life surface.
@dataclass(frozen=True, slots=True)
class _ChildVoice:
    """``note`` — the child's temperament. ``action`` — what a parent can do."""

    PROVENANCE: ClassVar[dict[str, tuple[Provenance, BaseRate]]] = {
        # Present-tense behaviour a guardian can recognise today, which is also
        # this gate's whole trust mechanism: a parent checks the note against
        # the child in front of them, and nothing else in the reading has to be
        # taken on faith.
        "note": (Provenance.TENDENCY, BaseRate.KEYED),
        "action": (Provenance.RULE, BaseRate.KEYED),
    }

    note: tuple[str, str]
    action: tuple[str, str]


_CHILD_VOICE: dict[str, _ChildVoice] = {
    "SUN": _ChildVoice(
        note=(
            "{name} சீக்கிரமே தன்னை மற்றவர்கள் மதிக்க வேண்டும் என்று விரும்புவார்; பொறுப்பு "
            "கொடுத்தால் சிறப்பாகச் செய்வார் — ஆனால் மற்றவர்கள் முன்னிலையில் திருத்தப்படுவது "
            "எதிர்பார்ப்பதை விட ஆழமாகப் பாதிக்கும்.",
            "{name} will want to be taken seriously early and does better with responsibility than "
            "without it — though being corrected in front of others lands harder than you would expect.",
        ),
        action=(
            "அவருக்கே சொந்தமான ஒரு பொறுப்பைக் கொடுங்கள்; திருத்த வேண்டியதைத் தனியாகச் சொல்லுங்கள்",
            "give them one real responsibility that is theirs alone, and correct them privately",
        ),
    ),
    "MOON": _ChildVoice(
        note=(
            "யாரும் விளக்குவதற்கு முன்பே {name} வீட்டின் மனநிலையை உணர்ந்துகொள்வார் — அது ஒரு "
            "வரம்; அதனாலேயே ஒரு கலக்கமான வாரம் மற்ற எல்லோரையும் விட முதலில் அவரிடம் தெரியும்.",
            "{name} picks up the mood of a room before anyone explains it — a real gift, and the "
            "reason an unsettled week shows up in them before it shows in anyone else.",
        ),
        action=(
            "தூக்கமும் உணவு நேரமும் சலிப்பூட்டும் அளவுக்கு ஒரே சீராக இருக்கட்டும் — இந்தக் காலம் "
            "அவரின் நிலைத்தன்மையின் மீது நடக்கிறது",
            "keep sleep and mealtimes boringly regular; this period runs on their steadiness",
        ),
    ),
    "MARS": _ChildVoice(
        note=(
            "{name} முதலில் செயல்பட்டு பிறகு கேட்பார்; அந்தச் சக்தியை அடக்குவதை விட வழிநடத்துவதே "
            "சரி — ஒரு அறிவுரைக்காகக் காத்திருக்கும் பொறுமைதான் பயிற்சி தேவைப்படும் இடம்.",
            "{name} moves first and asks later, which is energy worth steering rather than damping — "
            "the patience to wait for an instruction is what will need practice.",
        ),
        action=(
            "அந்தச் சக்திக்குத் தினமும் ஒரு வழி கொடுங்கள் — திரையல்ல, விளையாட்டு",
            "give the energy somewhere to go every day — a sport, not a screen",
        ),
    ),
    "MERCURY": _ChildVoice(
        note=(
            "{name} பேசிப் பேசியே கற்பார், வாதிடுவதிலேயே ஒரு சுவை காண்பார் — ஒரு சிந்தனையை "
            "முடிப்பது, மூன்றைத் தொடங்குவதல்ல, வளர்க்க வேண்டிய திறன்.",
            "{name} learns by talking and will argue for the pleasure of it — the skill to build is "
            "finishing one thought rather than starting three.",
        ),
        action=(
            "கற்றதை வாய்விட்டுச் சொல்லச் சொல்லுங்கள்; மீண்டும் படிப்பதை விட அது நன்றாக நிற்கும்",
            "let them explain what they learned out loud; it settles far better than re-reading",
        ),
    ),
    "JUPITER": _ChildVoice(
        note=(
            "{name} நியாயத்தை முக்கியமாக எடுத்துக்கொள்வார்; ஒரு விதி சமமாகப் பயன்படுத்தப்படாதபோது "
            "உடனே கவனிப்பார் — கொடுப்பது எளிது, நண்பரிடம் மறுத்துச் சொல்வது அல்ல.",
            "{name} takes fairness seriously and notices when a rule is applied unevenly — generosity "
            "comes easily; saying no to a friend does not.",
        ),
        action=(
            "நியாயம் பற்றிய கேள்விகளைத் தட்டிக்கழிக்காமல் முறையாகப் பதில் சொல்லுங்கள்",
            "answer the fairness questions properly rather than deflecting them",
        ),
    ),
    "VENUS": _ChildVoice(
        note=(
            "தன்னைச் சுற்றியுள்ளவர்கள் நிம்மதியாக இருக்க வேண்டும் என்பதற்காக {name} சிக்கல்களை "
            "மென்மையாக மறைத்துவிடுவார் — அதனால் ஒரு வருத்தம் நன்றாக மறைந்திருக்கக்கூடும்.",
            "{name} wants the people around them at ease and will smooth trouble over to get it — "
            "which means an upset can stay well hidden.",
        ),
        action=(
            "என்ன பிரச்சினை என்று இரண்டு முறை கேளுங்கள்; முதல் பதில் வசதியானதாகவே இருக்கும்",
            "ask what is wrong twice; the first answer will be the comfortable one",
        ),
    ),
    "SATURN": _ChildVoice(
        note=(
            "{name} தொடங்குவதில் மெதுவாக இருப்பார், தொடங்கிய பிறகு நிலையாக இருப்பார்; ஆரம்ப "
            "ஆண்டுகள் அவசரமில்லாமல் தெரிந்து பின்னர் உறுதிப்படும். வேகத்திற்காக அழுத்துவது "
            "காத்திருப்பதை விட விலை அதிகம்.",
            "{name} is slower to start and steadier once started; the early years can look unhurried "
            "and then hold. Pushing for speed costs more here than waiting does.",
        ),
        action=(
            "மெதுவாக இருக்க அனுமதியுங்கள்; வேகத்தை அல்ல, முடித்ததைப் பாராட்டுங்கள்",
            "let them be slow, and praise finishing rather than speed",
        ),
    ),
    "RAHU": _ChildVoice(
        note=(
            "எட்டாத தூரத்தில் இருப்பதன் மீதே {name}க்கு ஈர்ப்பு; அதை அடைய வழக்கத்திற்கு மாறான "
            "வழியைக் கண்டுபிடிப்பார் — ஆர்வம் சூடாக இருக்கும், அதை ஒன்றிலேயே நிலைநிறுத்துவதே வேலை.",
            "{name} is drawn to whatever is just out of reach and will find an unusual route to it — "
            "the interest runs hot, and holding it to one thing is the work.",
        ),
        action=(
            "புதிது ஒன்று தோன்றினாலும், ஒரு ஆர்வத்தை ஒரு முழு ஆண்டு தொடரச் செய்யுங்கள்",
            "keep one interest going for a full year, even when a newer one appears",
        ),
    ),
    "KETU": _ChildVoice(
        note=(
            "{name} தன்னிறைவானவர்; கலந்துகொள்வதை விடக் கவனிப்பது அதிகம் — தனியாக இருப்பதில் "
            "சங்கடமில்லை, ஆனால் தேவைப்படும்போதும் உதவி கேட்பது தாமதமாகும்.",
            "{name} is self-contained and observes more than they join in — comfortable alone, and "
            "slower to ask for help than they need to be.",
        ),
        action=(
            "அவரே கேட்கும் வரை காத்திருக்காமல், நீங்களே அழைத்துச் சேர்த்துக்கொள்ளுங்கள்",
            "invite them in rather than waiting for them to ask",
        ),
    ),
}


# ── Beat 5: the topic the reader's age is actually asking about ──────────────
#
# ONE topic, never a list. Routing is on FACTS WE HOLD, not on age alone: a
# 28-year-old PhD student is a student, and a married 40-year-old must never be
# told when they will marry. app.core.age_gate is the canonical gate module for
# every other marriage/career surface and stays canonical here.

TOPIC_CHILD_GROWTH = "CHILD_GROWTH"
# 13-17 reading their OWN chart. Separate from EDUCATION because that topic
# opens "You are studying", which is an inference from age — true of most Tamil
# teenagers and humiliating for the one it is wrong about. This frame says what
# the chart is weighted toward and asserts nothing about where they spend
# their days.
TOPIC_TEEN = "TEEN"
TOPIC_EDUCATION = "EDUCATION"
TOPIC_MARRIAGE = "MARRIAGE"
TOPIC_MARRIED_LIFE = "MARRIED_LIFE"
TOPIC_CAREER = "CAREER"
TOPIC_ELDER = "ELDER"
# A status that records an ended marriage or relationship. Not "remarriage
# timing" — see _focus_topic for why this surface must not volunteer that.
TOPIC_STEADYING = "STEADYING"
# Not a topic: the marker that we cannot pick one without a fact we do not hold.
# Beat 5 is withheld, and the reading asks instead of guessing.
TOPIC_UNKNOWN = "UNKNOWN"
# Also not a topic: the marker that the subject is an adult who is not the
# reader, so there is no question of theirs for us to raise with somebody else.
# Distinct from TOPIC_UNKNOWN deliberately — UNKNOWN means "ask", and asking is
# precisely what must not happen here. Emitted on the wire so a client can tell
# a short reading from a broken one.
TOPIC_THIRD_PARTY = "THIRD_PARTY"

# The declined answer (app.schemas.birth_profiles._VALID_MARITAL_STATUSES). It
# withholds beat 5 exactly as a blank does, and additionally stops the question:
# re-asking someone who has already said "I would rather not" turns their answer
# into a non-answer, and offering the decline at all is what makes the other
# options trustworthy rather than a form to be got past.
STATUS_UNDISCLOSED = "undisclosed"

# Deliberately HIGHER than age_gate.MARRIAGE_UPPER_AGE (50). That constant
# answers "may we still talk about marriage timing"; this one answers "is health
# and legacy now the question this chart is being asked", and 50 is far too
# early for the second. Two different questions need two different thresholds.
ELDER_TOPIC_AGE = 60

# Topic -> the life area whose dasha affinity decides the outlook clause. Reuses
# life_areas_service._DASHA_AREA_SCORE so the two surfaces cannot drift into
# saying opposite things about the same period.
_TOPIC_AREA: dict[str, str] = {
    TOPIC_CHILD_GROWTH: "EDUCATION",
    TOPIC_TEEN: "EDUCATION",
    TOPIC_EDUCATION: "EDUCATION",
    TOPIC_MARRIAGE: "RELATIONSHIPS",
    TOPIC_MARRIED_LIFE: "FAMILY_HARMONY",
    TOPIC_CAREER: "CAREER",
    TOPIC_ELDER: "HEALTH",
    TOPIC_STEADYING: "FAMILY_HARMONY",
}

# Where the withheld beat 5 would have stood. The pending question is rendered
# there, so the gap the question explains is the gap the question fills.
_QUESTION_ANCHOR_BEAT = "next_ten_years"

# ── G6's trust mechanism: a principle declared rather than quietly kept ──────
#
# §1.1(g) of the audit. We have always omitted longevity; nobody could tell we
# omitted it ON PURPOSE, and a silence is indistinguishable from an oversight —
# or from not knowing. Saying it is worth more than doing it: one sentence, no
# chart data, the highest trust-per-word in the source document.
#
# The source's wording is *"I do not read longevity. Not because the chart is
# silent on it. Because I have watched what that answer does."* The third
# sentence is a first-person claim to practice — v2 ship blocker #5 — and does
# not port. What replaces it is the REASON, stated without a claimant, which is
# the same substitution Part 3 makes everywhere else: move the authority from
# the speaker to the argument.
#
# Elder only. Declared at every gate it would be a disclaimer answering a
# question nobody asked; declared at the gate where the question is actually
# live, it is a position. It is also the one thing Part 5 item 5 warns us to
# take carefully — the source refuses longevity and then frames the close of
# life anyway ("the work of your remaining years"). We take the refusal and
# leave the framing.
_LONGEVITY_REFUSAL: tuple[str, str] = (
    "இந்த வாசிப்பு ஆயுளைக் கணிப்பதில்லை. ஜாதகம் அதைப் பற்றி மௌனமாக இருப்பதால் அல்ல — "
    "அந்தப் பதில், மிச்சமிருக்கும் காலத்தை ஒருவர் எப்படிக் கழிக்கிறார் என்பதையே மாற்றிவிடும்.",
    "This reading does not read length of life. Not because the chart is silent on it — because "
    "that answer changes how a person spends the years they have.",
)

# "The current period is behind this" stood here and it is ambiguous in exactly
# the wrong direction: "behind" reads as "lagging" as readily as "supporting",
# and it lands immediately after a sentence about where the chart's weight sits,
# where either reading is plausible. A reader who takes the wrong one is told
# the opposite of what the dasa/area affinity computed.
#
# The Tamil was never ambiguous — ஆதரவாக இருக்கிறது is unmistakably "is
# supportive" — so only the English moved. That is the second time on this
# surface that the English was the copy at risk while the Tamil was correct
# (the other was KETU's soft_spot), against the usual assumption that the
# translated language is the fragile one.
_OUTLOOK_SUPPORTIVE = (
    "நடப்புக் காலம் இதற்கு ஆதரவாக இருக்கிறது.",
    "The period running now supports that.",
)
# The neutral case says nothing, and it was appearing in most readings — a
# sentence that costs thirteen words to report an absence of signal. Silence is
# the honest rendering of "no signal", and the words buy the grievance instead.
_OUTLOOK_MIXED = ("", "")
_OUTLOOK_SLOW = (
    "நடப்புக் காலம் இங்கே பொறுமையைக் கேட்கிறது; {date} க்குப் பிறகு நிலை தளர்கிறது.",
    "The current period asks for patience here; conditions ease after {date}.",
)


def _proper(name: str) -> str:
    """Chart-layer star and rasi names arrive uppercase ("MIRUGASEERIDAM").

    Left alone they read as an error message inside a sentence, which undoes the
    "a person wrote this" effect at the first noun the reader meets. They are
    proper nouns in prose, so they are title-cased here rather than at the chart
    layer, where the uppercase form is the stable machine value other surfaces
    match on.
    """
    return name.title()


def _cap(clause: str) -> str:
    """Capitalise a facet clause that is being used to open a sentence.

    The facets are written as clauses ("this stretch pays late, but it does
    pay") so a frame can place them mid-sentence or at the start. Used at the
    start without this, the reading is littered with lowercase sentence
    openings — the single most obvious tell that a template produced it.
    """
    return clause[:1].upper() + clause[1:] if clause else clause


def _first_name(display_name: str) -> str:
    """An astrologer reading a child's chart uses the given name, not the full one."""
    return display_name.split()[0] if display_name.split() else display_name


def _month_year(value: date, lang: str) -> str:
    if lang == "ta":
        return f"{_MONTH_TA[value.month]} {value.year}"
    return value.strftime("%B %Y")


def _word_count(text: str) -> int:
    return len(text.split())


# ── Dasha window helpers ─────────────────────────────────────────────────────


def _period_covering(periods: tuple[DashaPeriod, ...], moment: date) -> DashaPeriod | None:
    for period in periods:
        if period.start_date <= moment < period.end_date:
            return period
    return None


def _period_before(
    periods: tuple[DashaPeriod, ...], period: DashaPeriod
) -> DashaPeriod | None:
    """The period that handed over TO ``period``.

    Deliberately not "the period covering the window start": with two handovers
    inside one window the opening lord is two turns back, and naming it against
    the latest turn's year erases the lord that ran in between.
    """
    preceding = [p for p in periods if p.end_date <= period.start_date]
    return preceding[-1] if preceding else None


def _handovers_within(
    periods: tuple[DashaPeriod, ...], window_start: date, window_end: date
) -> list[DashaPeriod]:
    """Periods that BEGIN inside the window — i.e. the moments a person felt.

    A person does not experience "being in a mahadasha"; they experience the
    handover. That is why every backward/forward beat is built from starts
    rather than from whichever lord happens to hold the most days.
    """
    return [p for p in periods if window_start <= p.start_date <= window_end]


def _antardashas(maha: DashaPeriod) -> tuple[DashaPeriod, ...]:
    # _build_subperiods is module-private but it is the only correct way to get
    # a mahadasha's bhuktis (it reconstructs the unclipped parent span, which
    # matters for the opening mahadasha). Reaching for a private calculation
    # helper from a service is established practice here — chart_explanation_
    # service does the same with chart_strength._dignity_score.
    return _build_subperiods(maha, "antar")


# ── Beat composition ─────────────────────────────────────────────────────────
#
# Most of this reading's words are NOT in the vocabulary tables above — they are
# the frames the beat builders write around them ("From 2019 to 2026 you were
# under Saturn", "At 34, marriage is the question the chart is being asked").
# §6.5 of the audit classified the tables and stopped there, so the frames were
# the unclassified half, and they are also where a contributor would actually
# write an event claim: a frame has a date in it already, and adding what
# happened on that date is one clause of work.
#
# So each beat declares the classes its own frames and tables contribute, and
# the test asserts every beat the service emits is declared and that the union
# is emittable. Adding a beat fails the suite until it is classified.
_BEAT_PROVENANCE: dict[str, frozenset[Provenance]] = {
    # Star, rasi, lagna (D) + the signature opening and nature (T).
    "who_you_are": frozenset({Provenance.DERIVED, Provenance.TENDENCY, Provenance.FRAME}),
    # Claims nothing about the reader — only about our inputs and the ephemeris.
    # `_LAGNA_STRENGTH_CAVEAT` joins it on the unconfirmed self path and is D for
    # the same reason: it reports which of our computations take the lagna.
    "what_this_rests_on": frozenset({Provenance.DERIVED}),
    # Strength ranking (D) + capacity/soft-spot/grievance (T) + validation (F).
    "strength_and_cost": frozenset({Provenance.DERIVED, Provenance.TENDENCY, Provenance.FRAME}),
    # `what_life_keeps_teaching` IS ABSENT ON PURPOSE, and its absence here is
    # the §6.17 length ruling rather than an oversight. This table means "the
    # classes the beats this service EMITS contribute" — the test asserts both
    # directions, so a declared beat nothing emits fails the suite exactly as an
    # emitted beat nothing declares does. Its classification has moved onto
    # `_beat_what_life_keeps_teaching`, which is held for the longer reading;
    # re-wiring the builder fails this test until the entry comes back, which is
    # the behaviour we want and the reason not to leave a dormant row here.
    #
    # Dated dasa spans (D) + past_texture (R) + the invitation (F). The dates
    # are the beat's whole value and also its whole risk — this is the beat
    # v2's E→R+invitation operator is written for, and the one Rule 1 has
    # always guarded. As of 2026-08-07 it carries BOTH halves of that operator:
    # the rule, and the clause that hands the reader the judgement on it.
    "last_ten_years": frozenset(
        {Provenance.DERIVED, Provenance.RULE, Provenance.FRAME}
    ),
    "right_now": frozenset({Provenance.DERIVED, Provenance.RULE}),
    # Age and the topic routing (D) + the topic frame and outlook clause (R).
    "your_age_question": frozenset({Provenance.DERIVED, Provenance.RULE}),
    "next_ten_years": frozenset({Provenance.DERIVED, Provenance.RULE}),
    # The minor path's forward beat carries NO texture claim by design — the
    # handover and its date, and nothing about a person who does not exist yet.
    # That is why it is D-only, and the absence of R here is the design.
    "years_ahead": frozenset({Provenance.DERIVED}),
    "one_thing": frozenset({Provenance.RULE, Provenance.FRAME}),
    # The third-party register. D-only and F-only respectively, and that is the
    # whole safety property: the reading of an absent adult contains no
    # interpretation of them at all, only chart facts and a statement of where
    # it stops. Anything added here that is not D has to answer §3.1 first.
    "period_now": frozenset({Provenance.DERIVED}),
    "third_party_close": frozenset({Provenance.FRAME}),
}


def _beat_who_you_are(
    *,
    display_name: str,
    nakshatra: int,
    nakshatra_name: str,
    moon_rasi_name: str,
    moon_rasi: int,
    lagna_rasi_name: str,
    lagna_rasi: int,
    nakshatra_lord: str,
    signature_lord: str,
    lagna_reliable: bool,
    addressed_to: str,
) -> OneMinuteBeat:
    # ONE display name per language, never one shared between them. The star and
    # rasi are the first nouns in the reading, and until now both languages were
    # handed `_proper(nakshatra_name)` — so the Tamil opened "நீங்கள் Anusham
    # நட்சத்திரத்தில், Viruchigam ராசியில்", English proper nouns inside Tamil
    # prose in the one sentence that has to sound like a person speaking.
    #
    # The Tamil side falls back to the English form rather than to nothing: a
    # number this table has no row for is a bug, but an empty noun in the
    # opening sentence is a worse way to report it than a legible wrong one.
    star = _proper(nakshatra_name)
    star_ta = nakshatra_ta(nakshatra) or star
    moon_rasi_display = _proper(moon_rasi_name)
    moon_rasi_ta_display = rasi_ta(moon_rasi) or moon_rasi_display
    lagna_rasi_display = _proper(lagna_rasi_name)
    lagna_rasi_ta_display = rasi_ta(lagna_rasi) or lagna_rasi_display

    # THE OPENING NAMES ONE PLACEMENT, AND IT IS THE ONE THE READING READS FROM.
    #
    # It named three — star, Moon rasi, lagna — and for one day it read from all
    # three, which was defect 22's fix. §6.17 cut the two rasi clauses for
    # length, and cutting a clause obliges cutting its noun: a named placement
    # with nothing read from it is the defect 22 the clauses were added to fix,
    # and it is the worse half of it. The reader can SEE the noun, so the
    # silence after it is legible to them and to nobody else.
    #
    # The star stays because `_VOICE` is keyed on its lord — the nature sentence
    # two clauses later is what it is read from, so the noun is earning its
    # place in the sentence rather than decorating it.
    placement_ta = f"நீங்கள் {star_ta} நட்சத்திரத்தில் பிறந்தவர்."
    placement_en = f"You were born under {star}."

    # `parent` and `other` keep all three placements, and the rule above is not
    # being bent for them. Those two registers are DEFINED as chart facts with
    # the interpretation withheld (§3.1) — the facts are what the reader asked
    # for, so a noun with no clause after it is the deliverable rather than an
    # unkept promise. The self reading is the opposite case: there the noun
    # promises a reading of itself, which is why it now has to keep it.
    lagna_ta = f", {lagna_rasi_ta_display} லக்னத்தில்" if lagna_reliable else ""
    lagna_en = f", {lagna_rasi_display} rising" if lagna_reliable else ""

    if addressed_to == "other":
        # An adult who is not the reader gets the chart FACTS and no character
        # note at all. There is a third-person nature vocabulary to be written
        # (§4.2 item 1, deferred to the second review sitting in §4.3), and
        # until it exists the only two candidates are both wrong: the adult
        # facets are second person, and rewriting them in a string pass is the
        # exact defect that produced "they carry yourself as someone in charge";
        # the child facets describe a life this person is decades past. Saying
        # less is the correct interim, and the close says so out loud.
        given = _first_name(display_name)
        ta = f"{given} {star_ta} நட்சத்திரத்தில், {moon_rasi_ta_display} ராசியில்{lagna_ta} பிறந்தவர்."
        en = f"{given} was born under {star}, Moon in {moon_rasi_display}{lagna_en}."
    elif addressed_to == "parent":
        child = _CHILD_VOICE[nakshatra_lord]
        given = _first_name(display_name)
        ta = (
            f"{given} {star_ta} நட்சத்திரத்தில், {moon_rasi_ta_display} ராசியில்{lagna_ta} பிறந்தவர். "
            f"{child.note[0].format(name=given)}"
        )
        en = (
            f"{given} was born under {star}, Moon in {moon_rasi_display}{lagna_en}. "
            f"{child.note[1].format(name=given)}"
        )
    else:
        # Contrast first, then the chart facts, then the concrete behaviour. The
        # contrast makes the reader place themselves; the behavioural line stops
        # that placement from being a horoscope anyone would accept. Neither
        # works alone — the contrast on its own is the Forer effect with better
        # rhythm, and the behaviour on its own opens cold.
        voice = _VOICE[nakshatra_lord]
        if addressed_to == "client_with_guardian":
            # Plainer, per §4.2 item 2. The nature line stays — a 13-to-17-year-
            # old does have a temperament, and the facets are dispositional
            # rather than about a life they have not had. What goes is the
            # signature opening: "Some people are content inside the life they
            # were handed / you are the second kind" is a verdict on a life
            # shape, delivered to someone who has not chosen one yet, and it is
            # the most rhetorical device in the feature besides.
            ta = f"{placement_ta} {voice.nature.ta}"
            en = f"{placement_en} {voice.nature.en}"
        else:
            opening = _SIGNATURE_OPENING[signature_lord]
            # THE CONNECTIVE COMES FROM THE MEANING, NOT FROM THE GRAHAS. It
            # used to be `signature_lord != nakshatra_lord`, which is
            # "different graha" and not "opposing content" — with nine grahas
            # that fires almost always, and a sweep found it claiming a tension
            # that was not there in seven readings out of nine. A Rahu opening
            # ("reaching past the edge of it") followed by "And yet: you carry
            # yourself as someone in charge" announces a contradiction between
            # two sentences that plainly agree, and a reader who looks for the
            # contradiction and finds none concludes the app is generating
            # rather than reading. See ``Orientation`` and ``_transition``.
            hinge = _transition(opening, voice.nature)
            hinge_ta = f"{hinge[0]} " if hinge[0] else ""
            hinge_en = f"{hinge[1]} " if hinge[1] else ""
            # Lower-cased only when a connective precedes it, because then the
            # facet is continuing a sentence rather than opening one.
            nature_ta = voice.nature.ta if not hinge_ta else voice.nature.ta
            nature_en = (
                voice.nature.en
                if not hinge_en
                else voice.nature.en[:1].lower() + voice.nature.en[1:]
            )
            ta = f"{opening.ta} {placement_ta} {hinge_ta}{nature_ta}"
            en = f"{opening.en} {placement_en} {hinge_en}{nature_en}"

    # The basis takes the same treatment as the prose. It is the "show the
    # astrology" disclosure, not a debug dump — a Tamil reader who opens it is
    # the reader most likely to know these names in Tamil.
    basis_ta = f"{star_ta} நட்சத்திரம் (அதிபதி {planet_ta(nakshatra_lord)})"
    basis_en = f"{star} nakshatra, lord {planet_en(nakshatra_lord)}"
    # The signature is only named in `basis` when it was used in the text.
    if addressed_to == "self":
        basis_ta += f"; ஜாதகத்தின் மைய கிரகம் {planet_ta(signature_lord)}"
        basis_en += f"; chart signature {planet_en(signature_lord)}"
    # The Moon's rasi has LEFT the basis, and by the rule that put it there. It
    # was listed only for the registers that printed the mind clause, because
    # for the others it was a bare fact and claiming it as a derivation would
    # claim a reading those registers withhold. With the mind clause gone that
    # condition is now true of every register, so the line goes with it — a
    # basis that lists an input nothing was read from is the same broken promise
    # as a noun with no clause, made to the reader who cared enough to open it.
    if lagna_reliable:
        basis_ta += f"; {lagna_rasi_ta_display} லக்னம்"
        basis_en += f"; {lagna_rasi_display} lagna"
    else:
        basis_ta += "; பிறந்த நேரம் உறுதிப்படுத்தப்படாததால் லக்னம் இங்கே பயன்படுத்தப்படவில்லை"
        basis_en += "; lagna withheld — birth time is not confirmed"

    return OneMinuteBeat(
        id="who_you_are",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(ta=basis_ta, en=basis_en),
    )


def _beat_what_this_rests_on(
    *, display_name: str, lagna_reliable: bool, addressed_to: str, birth_time_source: str | None
) -> OneMinuteBeat:
    """The falsifiability offer — see _FALSIFIABILITY for why it exists.

    Placed SECOND, immediately after the opening and before anything is asked of
    the reader's trust. That position is the whole device: it arrives while the
    opening is still the only thing they have been told, so "that is not me" is
    still a live and cheap response. Moved any later it becomes a disclaimer
    attached to a reading already delivered, which is a different speech act and
    buys nothing.

    It is a beat rather than a clause on beat 1 because it is not part of the
    reading — it is the terms the reading is offered under, and a client that
    wants to set it in a different register needs it separable.
    """
    given = _first_name(display_name)
    # "third_person" is for somebody checking a description against a person who
    # is NOT them — a guardian on a child's card, a daughter on her father's.
    # `client_with_guardian` is not that: it is only ever reached when the
    # teenager holds the account (see the register block in the builder), and
    # every other beat addresses them as "you". Mapping it here by "anything
    # that is not self" put the one third-person sentence in the middle of a
    # second-person reading — the teen was told "You were born under Uthiram"
    # and then, in the very next line, "If that does not sound like Sweep".
    register = "third_person" if addressed_to in ("parent", "other") else "self"
    ta, en = _FALSIFIABILITY[(register, lagna_reliable)]

    # Keyed on `addressed_to`, NOT on `register` — see _LAGNA_STRENGTH_CAVEAT.
    # Only the adult self reading contains strength-derived material, and the
    # teenager shares the register without sharing the beats.
    if addressed_to == "self" and not lagna_reliable:
        ta = f"{ta} {_LAGNA_STRENGTH_CAVEAT[0]}"
        en = f"{en} {_LAGNA_STRENGTH_CAVEAT[1]}"

    source = (birth_time_source or "unknown").upper()
    return OneMinuteBeat(
        id="what_this_rests_on",
        text=OneMinuteText(ta=ta.format(name=given), en=en.format(name=given)),
        basis=OneMinuteText(
            ta=f"பிறந்த நேரத்தின் ஆதாரம்: {source}",
            en=f"Birth time source: {source}",
        ),
    )


def _beat_strength_and_cost(*, strongest: str) -> OneMinuteBeat:
    """Gift → shadow → consequence, and ALL THREE COME FROM ONE GRAHA.

    Adult path only — a soft-spot sentence is a character verdict, and a child
    has not lived long enough to have earned one.

    THIS BEAT USED TO DRAW ON THREE GRAHAS: the gift from the strongest, the
    cost from the weakest, the grievance from the signature, with "Which is why"
    asserting that the second caused the third. They coincided in one reading
    out of nine, and worse than chance — the signature is the DOMINANT graha by
    construction and the cost came from the WEAKEST, so the two were actively
    anti-correlated. What it produced was three separate observations wearing
    the grammar of one:

        "Your real strength is reading what people need before they say it"
        [Moon]. "Where it costs you is patience; you force a decision that
        would have come to you on its own" [Mars]. "Which is why you have asked
        yourself, more than once, 'why do I have to keep proving this?'" [Sun].

    Forcing decisions early does not cause having to keep proving yourself, and
    an attuned reader of rooms is not the same person as an impatient forcer.

    A jodhidar does not speak that way. He says: Sevvai is your strength;
    BECAUSE Sevvai is strong you move before others; and BECAUSE of that you
    wonder why people resisted something obvious to you. One graha, one voice,
    one observation that happens to have three parts. So the whole chain is the
    strongest graha's now — its capacity, its own soft spot, its own grievance —
    and "Which is why" is true by construction rather than by luck.

    THE CHAIN NOW STOPS AT THE SHADOW — see §6.17. The grievance and its
    validation were the third and fourth sentences here, and the reasoning above
    is why they were RIGHT to be built and still right to hold: one graha, one
    voice. What removed them was not a flaw in them but the length ruling. This
    is the beat the reader is most likely to quote back, and at four sentences it
    was also the beat competing hardest with beats 5-7 for a minute they do not
    have.

    ``_GRIEVANCE``, ``_VALIDATION`` and ``_VOICE.life_lesson`` are deliberately
    left in place, reviewed and intact. They are not dead — they are the seed of
    the longer reading this surface now hands off to, and deleting nine
    astrologer-approved lines to save nine unused dict rows would be trading
    something scarce for something free.
    """
    voice = _VOICE[strongest]

    ta = f"உங்கள் உண்மையான பலம் {voice.gift[0]}. விலை என்பது {voice.shadow[0]}."
    en = f"Your real strength is {voice.gift[1]}. Where it costs you is {voice.shadow[1]}."

    return OneMinuteBeat(
        id="strength_and_cost",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(
            ta=f"வலிமையான கிரகம் {planet_ta(strongest)} — பலமும் விலையும் இதிலிருந்தே",
            en=f"Strongest graha {planet_en(strongest)} — both the gift and its cost from it",
        ),
    )


def _beat_what_life_keeps_teaching(*, strongest: str) -> OneMinuteBeat:
    """NOT IN THE ONE-MINUTE READING as of §6.17 — held for the longer one.

    It is kept rather than deleted for the same reason its vocabulary is: this
    beat was ruled in by the astrologer one day before the length ruling cut it,
    the nine ``life_lesson`` phrases are reviewed archetypal copy, and the
    surface that will call this is the one the closing hand-off now points at.
    A builder held for a named consumer is not dead code; re-deriving it in a
    fortnight would be.

    ITS PROVENANCE, held here rather than in `_BEAT_PROVENANCE` because that
    table is keyed on what the service emits and a dormant row there fails the
    bidirectional test: **D + T.** D for which graha is strongest, T for the
    lesson itself — still a disposition, still present tense. The frame around it
    is deliberately not a claim that anything HAPPENED, which is the line this
    beat sits closest to: "life keeps teaching you" is one clause away from "life
    taught you X in 2019", and that clause is an event assertion. Whoever wires
    this beat up copies this paragraph back into the table.

    Everything below is the reasoning that put it here, unchanged.

    ---

    The fourth link, and it CLOSES the previous beat rather than opening a topic.

        gift → shadow → repeated consequence → what the consequence is teaching

    This beat briefly belonged to the WEAKEST graha, and the correction is the
    sharper version of the same rule that fixed beat 3. Beat 3 ends on the
    reader's own recurring complaint; a beat that answers it gives the section
    an ending, while a beat that raises a different graha's difficulty leaves
    the complaint hanging and starts again. The reader should finish this
    section feeling shown the meaning of the three sentences before it, not
    handed a fourth observation.

    That the copy is keyed on the same graha is what makes the closure real
    rather than rhetorical: Guru's chain ends "everyone comes to me, so who
    comes for me?" and Guru's lesson answers exactly that — "give wisely rather
    than endlessly". Keyed on the weakest graha the pairing was arbitrary, and
    with nine grahas it would have been arbitrary eight times in nine.

    ITS OWN VOCABULARY, not a reused facet. ``shadow`` answers "where does this
    strength become excessive"; ``life_lesson`` answers "what does that keep
    teaching". Different questions, so different sentences — the same rule that
    gave minors their own copy rather than a rephrasing of the adults'. Reusing
    ``shadow`` here also read as generated, and showed in the punctuation: "One
    lesson keeps returning: starting; you wait for a certainty that does not
    arrive" carries a colon and a semicolon inside nine words.

    The frame is gone with it. These sentences are self-contained by design, so
    there is nothing to introduce them with — a lead-in would be the beat
    apologising for itself.
    """
    return OneMinuteBeat(
        id="what_life_keeps_teaching",
        text=OneMinuteText(
            ta=_VOICE[strongest].life_lesson[0],
            en=_VOICE[strongest].life_lesson[1],
        ),
        basis=OneMinuteText(
            ta=f"வலிமையான கிரகம் {planet_ta(strongest)} — அதன் விலை கற்பிப்பது",
            en=f"Strongest graha {planet_en(strongest)} — what its shadow keeps teaching",
        ),
    )


def _beat_last_ten_years(
    *, timeline: VimshottariTimeline, as_of: date, birth_date: date
) -> tuple[OneMinuteBeat, tuple[int, str] | None]:
    """The proof beat, plus the year and LEVEL of the turn the next beat hinges on.

    Adult path only. A twelve-year-old's "last ten years" describes their
    parents' decade, not theirs, so the minor path drops this beat rather than
    rewording it.

    The window is clamped to age 15 for the same reason at the other end: told
    to a 22-year-old, "the last ten years repaid your patience with comfort" is
    a claim about a twelve-year-old. Naming the real span ("From 2019") is both
    accurate and more checkable, which is the entire job of this beat.

    Rule 1 lives here: this names the TEXTURE of a stretch and never an event.
    """
    decade_ago = date(as_of.year - 10, as_of.month, min(as_of.day, 28))
    earliest = date(birth_date.year + 15, birth_date.month, min(birth_date.day, 28))
    window_start = max(decade_ago, earliest)
    handovers = _handovers_within(timeline.mahadashas, window_start, as_of)

    if handovers:
        # A mahadasha changed inside the window — that is what the person felt.
        latest = handovers[-1]
        previous = _period_before(timeline.mahadashas, latest)
        hinge_year = latest.start_date.year
        # The stretch is dated from where IT began, never from the window edge.
        # A chart with Venus to 2020, Sun 2020-2026 and Moon from Mar 2026 was
        # told "From 2016 to 2026 you were under Venus": the window's opening
        # lord carried the latest turn's year, the six Sun years in between
        # vanished, and the prose contradicted its own basis line ("Venus
        # mahadasha 2000-2020") one row below it.
        span_start = max(window_start, previous.start_date) if previous else window_start
        # ...and only if the outgoing lord actually held a meaningful share of
        # the window. A Ketu mahadasha ending in 2017 inside a 2016-2026 window
        # produced "From 2016 to 2017 you were under Ketu" — a beat about the
        # last ten years that described ONE of them and silently dropped the
        # nine-year Venus stretch the reader actually lived. Below the share
        # threshold, the long stretch is the story and the turn is read at the
        # bhukti level by the branch further down.
        held_enough = (
            previous is not None
            and (latest.start_date - span_start).days
            >= _DOMINANT_STRETCH_SHARE * (as_of - window_start).days
        )
        if previous is not None and previous.lord != latest.lord and held_enough:
            voice = _VOICE[previous.lord]
            ta = (
                f"{span_start.year} முதல் {hinge_year} வரை உங்களுக்கு {planet_ta(previous.lord)} "
                f"காலம் நடந்தது. {_cap(voice.past_texture[0])}. {_PAST_INVITATION[0]}"
            )
            en = (
                f"From {span_start.year} to {hinge_year} you were under "
                f"{planet_en(previous.lord)}. {_cap(voice.past_texture[1])}. "
                f"{_PAST_INVITATION[1]}"
            )
            return (
                OneMinuteBeat(
                    id="last_ten_years",
                    text=OneMinuteText(ta=ta, en=en),
                    basis=OneMinuteText(
                        ta=(
                            f"{planet_ta(previous.lord)} மகாதசை "
                            f"{previous.start_date.year}–{previous.end_date.year}"
                        ),
                        en=(
                            f"{planet_en(previous.lord)} mahadasha "
                            f"{previous.start_date.year}-{previous.end_date.year}"
                        ),
                    ),
                ),
                (hinge_year, "maha"),
            )

    # No mahadasha handover inside the window: a long mahadasha covers it, so the
    # texture the person actually felt came from the bhukti level. Without this
    # branch a 20-year Venus mahadasha would leave the proof beat with nothing
    # to say, which is precisely when it is needed most.
    maha = _period_covering(timeline.mahadashas, as_of) or timeline.current_mahadasha
    antars = _antardashas(maha)
    antar_handovers = _handovers_within(antars, window_start, as_of)
    voice = _VOICE[maha.lord]

    if antar_handovers:
        recent = antar_handovers[-1]
        hinge_year = recent.start_date.year
        # The stretch's own start when it began inside the window, not the
        # window edge — "From 2016" is simply wrong when the mahadasha began in
        # 2017, and this beat's whole value is that its dates are checkable.
        span_year = max(window_start.year, maha.start_date.year)
        # The invitation sits BEFORE the turn sentence here, not at the close.
        # It qualifies the texture claim, so it belongs against it; and the turn
        # sentence has to stay last because it is the only place `hinge_year` is
        # introduced and beat 4 opens on that year. Moving the invitation to the
        # end would put ten words between the hinge and its pick-up.
        ta = (
            f"{span_year} முதல் இதுவரை நீங்கள் {planet_ta(maha.lord)} காலத்திற்குள்ளேயே "
            f"இருக்கிறீர்கள். {_cap(voice.past_texture[0])}. {_PAST_INVITATION[0]} "
            f"அதற்குள் {hinge_year}-ல் ஒரு திருப்பம் வந்தது."
        )
        en = (
            f"From {span_year} until now you have been inside one long "
            f"{planet_en(maha.lord)} stretch. {_cap(voice.past_texture[1])}. "
            f"{_PAST_INVITATION[1]} Within it, {hinge_year} marked a turn."
        )
        return (
            OneMinuteBeat(
                id="last_ten_years",
                text=OneMinuteText(ta=ta, en=en),
                basis=OneMinuteText(
                    ta=(
                        f"{planet_ta(maha.lord)} மகாதசை {maha.start_date.year}–{maha.end_date.year}; "
                        f"{planet_ta(recent.lord)} புத்தி {recent.start_date.year}"
                    ),
                    en=(
                        f"{planet_en(maha.lord)} mahadasha {maha.start_date.year}-{maha.end_date.year}; "
                        f"{planet_en(recent.lord)} antardasha from {recent.start_date.year}"
                    ),
                ),
            ),
            (hinge_year, "antar"),
        )

    ta = (
        f"{window_start.year} முதல் இதுவரை {planet_ta(maha.lord)} காலமே தொடர்ந்திருக்கிறது. "
        f"{_cap(voice.past_texture[0])}. {_PAST_INVITATION[0]}"
    )
    en = (
        f"From {window_start.year} until now you have been under {planet_en(maha.lord)} "
        f"throughout. {_cap(voice.past_texture[1])}. {_PAST_INVITATION[1]}"
    )
    return (
        OneMinuteBeat(
            id="last_ten_years",
            text=OneMinuteText(ta=ta, en=en),
            basis=OneMinuteText(
                ta=f"{planet_ta(maha.lord)} மகாதசை {maha.start_date.year}–{maha.end_date.year}",
                en=f"{planet_en(maha.lord)} mahadasha {maha.start_date.year}-{maha.end_date.year}",
            ),
        ),
        None,
    )


def _beat_right_now(
    *, timeline: VimshottariTimeline, hinge: tuple[int, str] | None, addressed_to: str
) -> OneMinuteBeat:
    maha = timeline.current_mahadasha
    antar = timeline.current_antardasha
    texture = _now_texture(maha.lord, addressed_to)

    # The hinge: this beat opens on the year the previous one closed on. It is
    # what turns seven facts into one piece of writing rather than seven
    # paragraphs, and it is the highest-leverage copy rule here.
    #
    # But it MUST match what actually changed. An earlier build wrote "That
    # changed in 2026. You are in a Venus period now" off a turn that was only
    # a bhukti change inside an unbroken Venus mahadasha — the reader is told
    # something changed and then told it is the same graha, in consecutive
    # sentences. Two levels of turn, two different connectives.
    if hinge is None:
        # This lead NAMES THE END, and the other two do not have to because they
        # open on a year the reader has just been given. Without a hinge there
        # is no year anywhere in the beat, so a lord whose texture is a
        # difficulty — Saturn's "pays late", Ketu's "closes more than it opens"
        # — was an unbounded negative: told they are in a slow stretch with no
        # indication of how long. That is the cross-gate rule "every negative
        # statement carries an expiry date", and it broke here.
        #
        # The no-hinge branch used to be rare. It is now the live path for every
        # elder, because G6 drops last_ten_years and the hinge with it.
        hinge_ta = hinge_en = ""
        ta_lead = f"இப்போது உங்களுக்கு {planet_ta(maha.lord)} காலம், {maha.end_date.year} வரை."
        en_lead = f"You are in a {planet_en(maha.lord)} period now, and it runs to {maha.end_date.year}."
    elif hinge[1] == "maha":
        hinge_ta = f"{hinge[0]}-ல் அது மாறியது. "
        hinge_en = f"That changed in {hinge[0]}. "
        ta_lead = f"இப்போது உங்களுக்கு {planet_ta(maha.lord)} காலம்."
        en_lead = f"You are in a {planet_en(maha.lord)} period now."
    else:
        hinge_ta = f"{hinge[0]} முதல் அதன் தன்மை மாறியிருக்கிறது. "
        hinge_en = f"Since {hinge[0]} the tone inside it has shifted. "
        ta_lead = f"{planet_ta(maha.lord)} காலம் தொடர்கிறது."
        en_lead = f"You are still under {planet_en(maha.lord)}."

    ta = f"{hinge_ta}{ta_lead} {_cap(texture[0])}."
    en = f"{hinge_en}{en_lead} {_cap(texture[1])}."

    return OneMinuteBeat(
        id="right_now",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(
            ta=(
                f"{planet_ta(maha.lord)} மகாதசை / {planet_ta(antar.lord)} புத்தி "
                f"({antar.start_date.isoformat()} – {antar.end_date.isoformat()})"
            ),
            en=(
                f"{planet_en(maha.lord)} mahadasha / {planet_en(antar.lord)} antardasha "
                f"({antar.start_date.isoformat()} to {antar.end_date.isoformat()})"
            ),
        ),
    )


def _focus_topic(
    *, age: int, marital_status: str | None, employment_type: str | None, addressed_to: str
) -> str:
    """The ONE topic this reader's age is actually asking about.

    Precedence is deliberate and the order is the safety property:
    minors first (nothing about work, money or marriage may reach them at all),
    then students (a 28-year-old PhD student is a student), then elders, then
    the married (who must never be told when they will marry), and only then
    the statuses that decide between marriage and everything else.

    Two rules below matter more than the routing that implements them.

    **UNKNOWN IS NOT "NEVER MARRIED".** An earlier build read a blank
    ``marital_status`` under 36 as an unmarried reader and printed "At 30,
    marriage is the question the chart is actually being asked" — on no evidence
    at all, to a reader who may well have been married for eight years. That is
    the same inference-from-absence that let progeny be read off age, and the
    same answer applies: a field we never asked about answers nothing. The topic
    is TOPIC_UNKNOWN, beat 5 is withheld rather than guessed, and the reading
    asks. Which is what the schema docstring had been promising all along.

    **A STATUS THAT RECORDS A LOSS NEVER VOLUNTEERS REMARRIAGE.** ``widowed``
    and ``divorced`` sit in ``age_gate.REMARRIAGE_SEEKING_STATUSES``, and that
    is right for the marriage surface a reader NAVIGATES TO — it frames the
    reading as a second chapter, and they went looking for it. It is wrong here,
    where the reading opens by itself: it told a 45-year-old widow "At 45,
    marriage is the question the chart is actually being asked — not only when,
    but with whom." Volunteered, unasked, possibly weeks after a funeral. So an
    ended marriage or relationship routes to TOPIC_STEADYING on this surface,
    and marriage_service keeps the remarriage reading for readers who ask for it.
    """
    if is_minor_age(age):
        # The topic follows the REGISTER, not the age, and that coupling is the
        # point: TOPIC_TEEN's frame is second person, so it may only be picked
        # when the reading is addressed to the teen. A 15-year-old in somebody
        # else's family vault is read to their guardian and keeps the
        # third-person frame.
        return TOPIC_TEEN if addressed_to == "client_with_guardian" else TOPIC_CHILD_GROWTH
    if (employment_type or "").strip().lower() == "student":
        return TOPIC_EDUCATION
    # Elder is checked BEFORE married. An earlier build had it after, and a
    # married 66-year-old was told the chart's weight sits on home "rather than
    # on reinventing your work" — a sentence that is not wrong so much as
    # faintly absurd at 66. What a chart is asked at that age is health and
    # what gets handed on.
    if age >= ELDER_TOPIC_AGE:
        return TOPIC_ELDER

    status = (marital_status or "").strip().lower()
    if is_married_settled(status):
        return TOPIC_MARRIED_LIFE
    # Blank covers "never asked" and a row that stored an empty string;
    # "undisclosed" is a reader who was asked and declined. None of the three is
    # a statement about this reader's marriage, so all three withhold the beat.
    # Only the question differs: a decline is an answer, and asking again would
    # make it a non-answer.
    if not status or status == STATUS_UNDISCLOSED:
        return TOPIC_UNKNOWN
    if is_seeking_marriage(status):
        return TOPIC_STEADYING
    # Only an explicit "single" now reaches the marriage beat, and only below
    # the age where marriage timing stops being the question at all.
    if status == "single" and not is_past_prime_marriage_age(age):
        return TOPIC_MARRIAGE
    return TOPIC_CAREER


def _outlook(topic: str, maha_lord: str, lang_date: tuple[str, str]) -> tuple[str, str]:
    """Supportive / mixed / slow, decided by the running lord's affinity for the topic's area."""
    area = _TOPIC_AREA[topic]
    score = _DASHA_AREA_SCORE.get(area, {}).get(maha_lord, 55)
    if score >= 65:
        return _OUTLOOK_SUPPORTIVE
    if score >= 50:
        return _OUTLOOK_MIXED
    return (
        _OUTLOOK_SLOW[0].format(date=lang_date[0]),
        _OUTLOOK_SLOW[1].format(date=lang_date[1]),
    )


def _beat_age_question(
    *,
    topic: str,
    display_name: str,
    age: int,
    age_band: dict[str, str],
    timeline: VimshottariTimeline,
) -> OneMinuteBeat:
    next_change = timeline.current_antardasha.end_date
    outlook_ta, outlook_en = _outlook(
        topic,
        timeline.current_mahadasha.lord,
        (_month_year(next_change, "ta"), _month_year(next_change, "en")),
    )

    if topic == TOPIC_CHILD_GROWTH:
        display_name = _first_name(display_name)
        # Says what the reading IS about, never what it is not. An earlier draft
        # closed with "not about work or marriage, which belong to a later
        # reading" — accurate, and still the only sentence in a small child's
        # reading that put those words in front of a parent at all. A negation
        # is not a safe way to keep a topic out of a minor's chart.
        ta = (
            f"இந்த வயதில் ஜாதகம் சொல்வது {display_name} எப்படிக் கற்கிறார், எது அவரை "
            f"நிலைப்படுத்துகிறது, சுற்றியுள்ள வீடு எவ்வளவு அமைதியாக இருக்கிறது என்பதைத்தான். "
            f"பிற்காலத்தில் வருவதை எல்லாம் வடிவமைப்பவை இவைதான். {outlook_ta}"
        )
        en = (
            f"At this age the chart is about how {display_name} learns, what settles them, and how "
            f"steady the home around them is. Those are the things that shape everything that comes "
            f"later. {outlook_en}"
        )
    elif topic == TOPIC_TEEN:
        # Second person, and it names no life the reader may not have. "You are
        # studying" (TOPIC_EDUCATION) is an inference from age — true of most
        # Tamil teenagers and wrong in a way that stings for the one it misses.
        # What the chart is weighted toward is a claim about the chart.
        ta = (
            f"{age} வயதில், ஜாதகத்தின் கவனம் நீங்கள் கற்பதன் மீதும், உங்களை நிலைப்படுத்துவதன் "
            f"மீதும் இருக்கிறது — அடுத்து வருவதை இவை இரண்டுமே தீர்மானிக்கின்றன. {outlook_ta}"
        )
        en = (
            f"At {age}, the chart's weight is on what you are learning and what steadies you — "
            f"those two decide what comes next. {outlook_en}"
        )
    elif topic == TOPIC_EDUCATION:
        ta = (
            "நீங்கள் படித்துக்கொண்டிருப்பதால், ஜாதகத்தில் இப்போது முக்கியமான பகுதி கற்றல்தான் — இந்தக் "
            f"காலத்தில் நீங்கள் முடிப்பதே அடுத்து எதை நோக்கிச் செல்ல முடியும் என்பதை நிர்ணயிக்கும். {outlook_ta}"
        )
        en = (
            "You are studying, so the part of the chart that matters most right now is learning: what "
            f"you finish in this stretch sets what you can reach for next. {outlook_en}"
        )
    elif topic == TOPIC_MARRIAGE:
        ta = (
            f"{age} வயதில், திருமணம்தான் ஜாதகத்திடம் உண்மையில் கேட்கப்படும் கேள்வி — நேரம் மட்டும் அல்ல, "
            f"யாருடன் என்பதும் சேர்த்து. {outlook_ta}"
        )
        en = (
            f"At {age}, marriage is the question the chart is actually being asked — not only when, "
            f"but with whom. {outlook_en}"
        )
    elif topic == TOPIC_MARRIED_LIFE:
        # "…rather than on reinventing your work" used to close this, and it is
        # the same defect TOPIC_STEADYING below was deliberately written without:
        # a claim we have not computed, attached to one we have. Nothing in the
        # chart says this reader's work is NOT the question; the dasa/area
        # affinity says family is well-supported, which is a different sentence.
        # It is also the clause that produced the "reinventing your work" absurdity
        # at 66 — the fix then was to route elders elsewhere, which left the
        # claim standing for everyone under 60.
        #
        # Say what the chart IS being asked, and stop. That rule was already
        # written down twelve lines below; it just had not been applied here.
        ta = (
            f"திருமணமானவர், {age_band['ta']} நிலையில் இருப்பவர் என்பதால், ஜாதகத்தின் கவனம் இப்போது "
            f"வீடு மற்றும் குடும்பத்தின் மீதே இருக்கிறது. {outlook_ta}"
        )
        en = (
            f"Married, and in the {age_band['en'].lower()} — so the weight of the chart sits on home "
            f"and family. {outlook_en}"
        )
    elif topic == TOPIC_STEADYING:
        # Says what the chart IS being asked, and stops there. The tempting
        # second clause — "rather than about a new beginning" — would be a claim
        # we have not computed, and read to someone who does want to marry again
        # it is a verdict against them. Nothing here names the loss either: the
        # reader told us their status, they do not need it read back.
        ta = (
            f"{age} வயதில், உங்களை நிலைப்படுத்துவதன் மீதே ஜாதகத்தின் கவனம் இருக்கிறது — வீடு, "
            f"உடல்நலம், அருகில் இருப்பவர்கள். {outlook_ta}"
        )
        en = (
            f"At {age}, the chart's weight sits on what steadies you — home, health, and the "
            f"people closest to you. {outlook_en}"
        )
    elif topic == TOPIC_CAREER:
        ta = (
            f"{age} வயதில், ஜாதகத்தின் கவனம் வேலை மற்றும் வருமானத்தின் மீது இருக்கிறது — இப்போது "
            f"நீங்கள் உறுதிப்படுத்துவதே அடுத்த காலம் பெருக்கிக் கொடுப்பது. {outlook_ta}"
        )
        en = (
            f"At {age}, the chart's weight is on work and income: what you consolidate now is what "
            f"the next stretch compounds. {outlook_en}"
        )
    else:  # TOPIC_ELDER
        # The refusal is appended HERE rather than given its own beat, and it
        # replaces this frame's old closing clause rather than being added to
        # it. That clause — "both are worth deliberate attention rather than
        # assumed continuity" — spent nine words telling the reader to pay
        # attention, which is not a claim about anything. The refusal costs
        # about the same and is the gate's whole trust mechanism, so the
        # ceiling did not have to move to fit it.
        # Joined rather than interpolated: the neutral outlook is deliberately
        # the empty string, and it is no longer the LAST thing in the sentence,
        # so an f-string would leave a double space mid-paragraph on every
        # reading whose dasa/area affinity happens to be neutral. The old
        # trailing .strip() covered that only while the outlook came last.
        ta = " ".join(
            part
            for part in (
                "இந்தக் காலத்தில் ஜாதகத்தின் கவனம் உடல்நலத்தின் மீதும், நீங்கள் "
                "ஒப்படைப்பதன் மீதும் நகர்கிறது.",
                outlook_ta,
                _LONGEVITY_REFUSAL[0],
            )
            if part
        )
        en = " ".join(
            part
            for part in (
                "In this stretch the chart's attention moves to health, and to what you hand on.",
                outlook_en,
                _LONGEVITY_REFUSAL[1],
            )
            if part
        )

    return OneMinuteBeat(
        id="your_age_question",
        # Stripped because the neutral outlook is deliberately the empty string.
        text=OneMinuteText(ta=ta.strip(), en=en.strip()),
        basis=OneMinuteText(
            ta=(
                f"வயது {age}; கவனப் பகுதி {_TOPIC_AREA[topic]}; "
                f"{planet_ta(timeline.current_mahadasha.lord)} தசை-பகுதி ஒத்திசைவு"
            ),
            en=(
                f"Age {age}; focus area {_TOPIC_AREA[topic]}; "
                f"{planet_en(timeline.current_mahadasha.lord)} dasha-area affinity"
            ),
        ),
    )


def _beat_next_ten_years(
    *, timeline: VimshottariTimeline, as_of: date, addressed_to: str
) -> OneMinuteBeat:
    horizon = date(as_of.year + 10, as_of.month, min(as_of.day, 28))
    upcoming = _handovers_within(timeline.mahadashas, as_of, horizon)

    if upcoming:
        nxt = upcoming[0]
        texture = _now_texture(nxt.lord, addressed_to)
        ta = (
            f"{_month_year(nxt.start_date, 'ta')} முதல் உங்களுக்கு {planet_ta(nxt.lord)} காலம் "
            f"தொடங்குகிறது. {_cap(texture[0])}."
        )
        en = (
            f"From {_month_year(nxt.start_date, 'en')}, {planet_en(nxt.lord)} takes over. "
            f"{_cap(texture[1])}."
        )
        basis_ta = f"{planet_ta(nxt.lord)} மகாதசை {nxt.start_date.isoformat()} முதல்"
        basis_en = f"{planet_en(nxt.lord)} mahadasha from {nxt.start_date.isoformat()}"
    else:
        maha = timeline.current_mahadasha
        antars = _antardashas(maha)
        upcoming_antars = _handovers_within(antars, as_of, horizon)
        nxt = upcoming_antars[0] if upcoming_antars else timeline.current_antardasha
        texture = _now_texture(nxt.lord, addressed_to)
        ta = (
            f"{maha.end_date.year} வரை {planet_ta(maha.lord)} காலமே தொடர்கிறது; அதற்குள் "
            f"{_month_year(nxt.start_date, 'ta')} முதல் {planet_ta(nxt.lord)} பகுதி வருகிறது. "
            f"{_cap(texture[0])}."
        )
        en = (
            f"You stay under {planet_en(maha.lord)} through {maha.end_date.year}; the shift "
            f"inside it comes in {_month_year(nxt.start_date, 'en')}, when {planet_en(nxt.lord)} "
            f"begins. {_cap(texture[1])}."
        )
        basis_ta = f"{planet_ta(nxt.lord)} புத்தி {nxt.start_date.isoformat()} முதல்"
        basis_en = f"{planet_en(nxt.lord)} antardasha from {nxt.start_date.isoformat()}"

    return OneMinuteBeat(
        id="next_ten_years",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(ta=basis_ta, en=basis_en),
    )


def _beat_years_ahead_for_a_child(
    *, timeline: VimshottariTimeline, as_of: date, display_name: str
) -> OneMinuteBeat:
    """The minor path's forward beat — the SHAPE of the years, with no texture claim.

    A parent wants to know when things change, not a character reading of a
    period their child has not lived through. Naming the handover and its date
    is a fact; saying a coming decade "rewards moving first" would be a claim
    about a person who does not exist yet.
    """
    maha = timeline.current_mahadasha
    horizon = date(as_of.year + 10, as_of.month, min(as_of.day, 28))
    upcoming = _handovers_within(timeline.mahadashas, as_of, horizon)
    display_name = _first_name(display_name)

    if upcoming:
        nxt = upcoming[0]
        ta = (
            f"{maha.end_date.year} வரை {display_name}க்கு {planet_ta(maha.lord)} காலம்; "
            f"{_month_year(nxt.start_date, 'ta')} முதல் {planet_ta(nxt.lord)} காலம் தொடங்கும். "
            f"பள்ளிப் படிப்பின் திசை பெரும்பாலும் அந்த மாற்றத்தைச் சுற்றியே தெளிவாகும்."
        )
        en = (
            f"{display_name} is in a {planet_en(maha.lord)} period until {maha.end_date.year}, and "
            f"{planet_en(nxt.lord)} begins in {_month_year(nxt.start_date, 'en')}. The direction of "
            f"their schooling usually becomes clear around that change."
        )
        basis_ta = f"{planet_ta(nxt.lord)} மகாதசை {nxt.start_date.isoformat()} முதல்"
        basis_en = f"{planet_en(nxt.lord)} mahadasha from {nxt.start_date.isoformat()}"
    else:
        ta = (
            f"{maha.end_date.year} வரை {display_name}க்கு {planet_ta(maha.lord)} காலமே தொடர்கிறது — "
            f"பள்ளிப் பருவம் முழுவதும் ஒரே தன்மையுடன் நகரும் என்பது இதன் பொருள்."
        )
        en = (
            f"{display_name} stays in one {planet_en(maha.lord)} period through "
            f"{maha.end_date.year}, which means the school years run with a single, consistent "
            f"character rather than in stages."
        )
        basis_ta = f"{planet_ta(maha.lord)} மகாதசை {maha.end_date.isoformat()} வரை"
        basis_en = f"{planet_en(maha.lord)} mahadasha through {maha.end_date.isoformat()}"

    return OneMinuteBeat(
        id="years_ahead",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(ta=basis_ta, en=basis_en),
    )


def _beat_period_for_someone_else(
    *, timeline: VimshottariTimeline, display_name: str
) -> OneMinuteBeat:
    """Which period is running, and nothing about what it offers them.

    §4.2 item 1 keeps the running period for a third-party reading, and the
    dates are the whole of what it keeps. ``now_texture`` cannot come with them:
    six of its nine variants are written in the second person ("what you build
    now outlasts what you rush"), and the three that are not would still be a
    claim about an absent adult's coming years, delivered to their relative.
    Naming the period is a fact about the chart. Describing it is a reading of
    the person, and this is not their reading.
    """
    maha = timeline.current_mahadasha
    given = _first_name(display_name)
    ta = (
        f"{given} இப்போது {planet_ta(maha.lord)} காலத்தில் இருக்கிறார் — "
        f"{maha.start_date.year} முதல் {maha.end_date.year} வரை."
    )
    en = (
        f"{given} is in a {planet_en(maha.lord)} period, running from "
        f"{maha.start_date.year} to {maha.end_date.year}."
    )
    return OneMinuteBeat(
        id="period_now",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(
            ta=(
                f"{planet_ta(maha.lord)} மகாதசை "
                f"{maha.start_date.isoformat()} – {maha.end_date.isoformat()}"
            ),
            en=(
                f"{planet_en(maha.lord)} mahadasha "
                f"{maha.start_date.isoformat()} to {maha.end_date.isoformat()}"
            ),
        ),
    )


def _beat_third_party_close(*, display_name: str) -> OneMinuteBeat:
    """Where a chart read at second hand stops, said out loud — see _THIRD_PARTY_CLOSE."""
    given = _first_name(display_name)
    return OneMinuteBeat(
        id="third_party_close",
        text=OneMinuteText(
            ta=_THIRD_PARTY_CLOSE[0].format(name=given),
            en=_THIRD_PARTY_CLOSE[1].format(name=given),
        ),
    )


def _beat_one_thing(*, timeline: VimshottariTimeline, addressed_to: str) -> OneMinuteBeat:
    lord = timeline.current_mahadasha.lord
    if addressed_to == "parent":
        # An instruction aimed at a child has no valid recipient — the parent is
        # the one who can act. Same rule age_phase_service.remedy_lead_in_for_stage
        # exists to enforce, and the action itself is written for them.
        ta = f"பெற்றோர் செய்யக்கூடிய ஒன்று: {_CHILD_VOICE[lord].action[0]}."
        en = f"One thing parents can do: {_CHILD_VOICE[lord].action[1]}."
    elif addressed_to == "client_with_guardian":
        # The teen is the one acting, and the lead-in puts the family in the
        # room with them rather than around them. The wording is
        # remedy_lead_in_for_stage's own — it already holds the right sentence
        # for STAGE_TEEN, and reusing it is what keeps a fourth register from
        # costing a fourth vocabulary.
        lead_ta, lead_en = remedy_lead_in_for_stage(STAGE_TEEN)
        ta = f"{lead_ta} {_VOICE[lord].action[0]}."
        en = f"{lead_en} {_VOICE[lord].action[1]}."
    else:
        ta = f"ஒரு செயல்: {_VOICE[lord].action[0]}."
        en = f"One thing: {_VOICE[lord].action[1]}."
    return OneMinuteBeat(
        id="one_thing",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(
            ta=f"நடப்பு {planet_ta(lord)} மகாதசையை அடிப்படையாகக் கொண்டது",
            en=f"Anchored on the running {planet_en(lord)} mahadasha",
        ),
    )


# ── Entry point ──────────────────────────────────────────────────────────────


def _relationship_to_owner(session: Session, profile: BirthProfile) -> str:
    """Who this chart belongs to, relative to the account looking at it.

    Resolved exactly as charts.py:233 and predictions.py:171 already resolve it,
    down to the "self" default when there is no family-member row — three
    surfaces asking the same question of the same two columns should not answer
    it three ways.
    """
    if profile.family_member_id is None:
        return "self"
    member = session.get(FamilyMember, profile.family_member_id)
    if member is None:
        return "self"
    return member.relationship_to_owner or "self"


def _lagna_is_reliable(profile: BirthProfile) -> bool:
    if profile.birth_time_local is None:
        return False
    source = (profile.birth_time_source or "unknown").upper()
    if source not in _RELIABLE_TIME_SOURCES:
        return False
    return (profile.birth_time_confidence_minutes or 0) <= _LAGNA_TIME_TOLERANCE_MINUTES


def _signature_lord(
    planets: list, timeline: VimshottariTimeline, *, fallback: str
) -> str:
    """The chart's dominant graha, or the janma nakshatra lord if it cannot be found.

    ``detect_signature`` raises rather than fabricating a "Sun chart" from empty
    inputs (chart_signature.py:151), so a caller that wants to keep serving must
    supply its own fallback. The nakshatra lord is the right one: it is the
    other graha this reading is already built on, it is always available, and it
    is a defensible answer to "which graha is this person's" rather than an
    arbitrary default.
    """
    try:
        signature = detect_signature(
            planet_longitudes={p.graha: p.absolute_longitude for p in planets if p.graha in _VOICE},
            planet_rasis={p.graha: p.rasi for p in planets if p.graha in _VOICE},
            planet_strength={p.graha: p.strength_score for p in planets if p.graha in _VOICE},
            current_maha_lord=timeline.current_mahadasha.lord,
            current_antar_lord=timeline.current_antardasha.lord,
        )
    except ValueError:
        return fallback
    return signature.dominant if signature.dominant in _VOICE else fallback


def _strongest_and_weakest(planets: list) -> tuple[str, str]:
    scored = [p for p in planets if p.graha in _VOICE]
    if not scored:
        raise ValueError("Chart carries no scoreable grahas.")
    ranked = sorted(scored, key=lambda p: (p.strength_score, p.graha))
    return ranked[-1].graha, ranked[0].graha


def build_one_minute_reading(
    session: Session,
    chart_id: UUID,
    *,
    owner_user_id: UUID,
    as_of: date | None = None,
) -> OneMinuteReadingResponse:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
    if profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    today = as_of or datetime.now(tz=UTC).date()
    chart_response = load_persisted_chart_response(session, chart_id)
    moon = next(p for p in chart_response.data.planets if p.graha == "MOON")

    timeline = calculate_vimshottari_timeline(
        chart_response.data.julian_day,
        moon.absolute_longitude,
        utc_datetime_to_julian_day(datetime.combine(today, datetime.min.time(), tzinfo=UTC)),
    )

    age = compute_age(profile.birth_date_local, as_of=today)
    stage = life_stage(age)
    age_band = get_age_phase_label(age)
    # FOUR registers, and they turn on two independent facts — how old the
    # subject is, and whether the person holding the account is that subject.
    #
    # §4.2 item 2 specifies the G2 seam on AGE ALONE: 13-17 becomes
    # "client_with_guardian", addressed directly in the second person. That is
    # right for a consultation, where the teenager is in the room, and wrong
    # here for the same reason §3.1 was wrong: on a family vault the reader is
    # usually the parent, and a second-person teen reading on a child's member
    # card would tell a father "you were born under Rohini" about his son. So
    # the direct register is reached only when the teenager holds the account.
    #
    # The minor check stays outermost. The guardian register is the STRICTER of
    # the two third-party registers — its own vocabulary, two beats dropped, the
    # remedy addressed to somebody who can act on it — so a minor falling
    # through to "other" would be a downgrade.
    is_own_chart = _relationship_to_owner(session, profile) == "self"
    if is_minor_age(age):
        addressed_to = (
            "client_with_guardian" if (is_own_chart and stage == STAGE_TEEN) else "parent"
        )
    elif not is_own_chart:
        addressed_to = "other"
    else:
        addressed_to = "self"

    # _focus_topic answers "what is this reader's age asking about", and for an
    # absent adult there is no reader to ask it of. Calling it anyway and simply
    # not rendering the beat would still put the answer on the wire, where a
    # client is free to render it — which is how a suppression becomes a leak.
    topic = (
        TOPIC_THIRD_PARTY
        if addressed_to == "other"
        else _focus_topic(
            age=age,
            marital_status=profile.marital_status,
            employment_type=profile.employment_type,
            addressed_to=addressed_to,
        )
    )
    strongest, weakest = _strongest_and_weakest(chart_response.data.planets)
    nakshatra_lord = timeline.opening_lord  # the janma nakshatra's lord, by construction
    signature_lord = _signature_lord(
        chart_response.data.planets, timeline, fallback=nakshatra_lord
    )

    lagna_reliable = _lagna_is_reliable(profile)
    # The signature is picked from `strength_score`, which takes the lagna — so
    # with an unconfirmed birth time the "dominant graha" is chosen by a number
    # that moves with the input we have just declared unreliable. `detect_
    # signature` already treats the nakshatra lord as its own fallback, and that
    # is the right answer here for the same reason: it is the one significator a
    # twenty-minute error does not touch (the Moon covers ~0.55° an hour against
    # a 13°20' star).
    #
    # This is what keeps `_LAGNA_STRENGTH_CAVEAT`'s scope exactly true. Without
    # it the caveat would name the strength beat while the OPENING rested on the
    # same withheld input silently — a disclosure that covers one of the two
    # places a problem lives is worse than none, because it reads as complete.
    #
    # A side effect worth naming: on this path `signature_lord == nakshatra_lord`
    # by construction, so `agree` is True and the opening takes no "And yet:".
    # That is correct rather than incidental — there is no second significator
    # here to disagree with.
    if not lagna_reliable:
        signature_lord = nakshatra_lord

    opening = _beat_who_you_are(
        display_name=profile.display_name,
        nakshatra=moon.nakshatra,
        nakshatra_name=moon.nakshatra_name,
        moon_rasi_name=moon.rasi_name,
        moon_rasi=moon.rasi,
        lagna_rasi_name=chart_response.data.lagna.rasi_name,
        lagna_rasi=chart_response.data.lagna.rasi,
        nakshatra_lord=nakshatra_lord,
        signature_lord=signature_lord,
        lagna_reliable=lagna_reliable,
        addressed_to=addressed_to,
    )
    # Second on BOTH paths, and on the minor path it is arguably worth more: a
    # parent checking a behavioural note against the child in front of them is
    # the most checkable form this offer takes anywhere in the feature.
    rests_on = _beat_what_this_rests_on(
        display_name=profile.display_name,
        lagna_reliable=lagna_reliable,
        addressed_to=addressed_to,
        birth_time_source=profile.birth_time_source,
    )
    if addressed_to == "other":
        # Four beats, every one of them D or F, and the omissions are the point.
        # What goes, and why each one had to:
        #   strength_and_cost — the soft spot is a character verdict on somebody
        #     who did not ask for one, and the grievance quotes their private
        #     complaint back to a relative as though they had said it aloud.
        #   last_ten_years — the dated past is G4's trust mechanism and it is
        #     earned from the person whose decade it was, not collected about
        #     them by someone else.
        #   your_age_question — this is where marriage timing lives.
        #   next_ten_years / one_thing — "what they will achieve" and an
        #     instruction with no valid recipient; §4.2 keeps one thing the
        #     READER can do, and that needs the third-party vocabulary the
        #     second review sitting is for.
        beats: list[OneMinuteBeat] = [
            opening,
            rests_on,
            _beat_period_for_someone_else(timeline=timeline, display_name=profile.display_name),
            _beat_third_party_close(display_name=profile.display_name),
        ]
    elif addressed_to == "client_with_guardian":
        # G2, §4.2 item 2. Six beats. The teen band used to receive the guardian
        # reading — copy written ABOUT them, in the third person, for somebody
        # else to read — which is the one thing the source document says the
        # 13-21 gate must never do.
        #
        # last_ten_years and strength_and_cost stay dropped, for two different
        # reasons. The past beat is degenerate here by construction: its window
        # is clamped to age 15, so for a 15-year-old it spans nothing and for a
        # 17-year-old it spans two years. The strength beat is dropped because
        # its second half is a soft spot and a private grievance, and a
        # character verdict is what §4.2 says this gate does not deliver.
        #
        # right_now takes no hinge: the hinge names the year the PREVIOUS beat
        # closed on, and there is no previous beat to close.
        beats = [
            opening,
            rests_on,
            _beat_right_now(timeline=timeline, hinge=None, addressed_to=addressed_to),
            _beat_age_question(
                topic=topic,
                display_name=profile.display_name,
                age=age,
                age_band=age_band,
                timeline=timeline,
            ),
            _beat_next_ten_years(timeline=timeline, as_of=today, addressed_to=addressed_to),
            _beat_one_thing(timeline=timeline, addressed_to=addressed_to),
        ]
    elif addressed_to == "parent":
        # Five beats, all natively third person and addressed to the parent. The
        # strength/soft-spot and last-ten-years beats are absent by design, not
        # softened: one is a character verdict a child has not earned, the other
        # describes the parents' decade rather than the child's.
        # A minor always routes to CHILD_GROWTH, so beat 5 is never the withheld
        # one on this path and never needs the marital question.
        beats = [
            opening,
            rests_on,
            _beat_age_question(
                topic=topic,
                display_name=profile.display_name,
                age=age,
                age_band=age_band,
                timeline=timeline,
            ),
            _beat_years_ahead_for_a_child(
                timeline=timeline, as_of=today, display_name=profile.display_name
            ),
            _beat_one_thing(timeline=timeline, addressed_to=addressed_to),
        ]
    else:
        beats = [opening, rests_on]
        # STAGE_INFANT is unreachable here (every minor takes the branch above);
        # the guard stays so that widening the parent path later cannot silently
        # start claiming a newborn has observable strengths.
        if stage != STAGE_INFANT:
            # ONE GRAHA, TWO LINKS, ONE BEAT: the gift and what it costs.
            #
            # It was four links across two beats — gift, shadow, the grievance
            # that follows, and what the grievance keeps teaching. Every link
            # was true and each was argued for on its own; what was never
            # examined was the four of them arriving together. §6.17 is that
            # examination, and the character section lost half its length to it.
            #
            # `weakest` is deliberately unused here. It is still computed (it is
            # the other half of the ranking, and a future beat's basis line
            # would need it) but nothing in the reading speaks in its voice.
            beats.append(_beat_strength_and_cost(strongest=strongest))
        # THE DATED PAST IS NOT EVERY GATE'S TRUST MECHANISM, and at G6 it is
        # not even a good one. §1.1(d): a 67-year-old knows his own decades
        # better than we do, and reciting them back is not impressive, it is
        # filler. What buys trust at this gate is the declared refusal in the
        # topic beat — one sentence, no chart data, and it is what those
        # thirty-four words are now spent on instead.
        #
        # This is the first gate-keyed trust beat (§4.2 item 3) and it is also
        # what made the refusal affordable: an elder reading was running 300
        # English words against a 285 ceiling with both, and the answer was not
        # a bigger budget.
        if topic == TOPIC_ELDER:
            hinge = None
        else:
            past_beat, hinge = _beat_last_ten_years(
                timeline=timeline, as_of=today, birth_date=profile.birth_date_local
            )
            beats.append(past_beat)
        beats.append(
            _beat_right_now(timeline=timeline, hinge=hinge, addressed_to=addressed_to)
        )
        # Withheld, not defaulted. Every version of this beat is a statement
        # about the reader's marriage — that it is the open question, that it is
        # settled, or that it is behind them — and we hold no fact that picks
        # between them. Six honest beats and a question beat five guessed at.
        if topic != TOPIC_UNKNOWN:
            beats.append(
                _beat_age_question(
                    topic=topic,
                    display_name=profile.display_name,
                    age=age,
                    age_band=age_band,
                    timeline=timeline,
                )
            )
        beats.append(
            _beat_next_ten_years(timeline=timeline, as_of=today, addressed_to=addressed_to)
        )
        beats.append(_beat_one_thing(timeline=timeline, addressed_to=addressed_to))

    # The one question the reading is allowed to ask, raised in exactly the case
    # that withheld a beat. It stands where that beat would have been, and it
    # says so — an unexplained gap reads as a bug, while "held back until this is
    # answered" reads as the restraint it is.
    #
    # FOUR options, not two. The old pair was "Yes, married" / "Not yet", and
    # both halves were wrong: "not yet" writes an expectation onto the reader
    # that they never expressed, and a divorced or widowed person had no button
    # at all — they could make the question go away only by describing
    # themselves as something they are not, which then fed every other surface
    # through the PATCH. Each option below is a real value of
    # birth_profiles._VALID_MARITAL_STATUSES and means what it says.
    #
    # TOPIC_THIRD_PARTY never reaches here, and that is a third instance of the
    # same defect rather than a consequence of the first two. The question
    # PATCHes the birth profile, so on a family-vault card it would have asked a
    # father to declare his adult daughter's marital status — a status she has
    # not disclosed, written by somebody else, and then propagated to
    # life_areas, marriage_service and daily guidance as though she had. Beat 5
    # being absent here is not a gap waiting on an answer; it is the register.
    pending: OneMinutePendingQuestion | None = None
    if topic == TOPIC_UNKNOWN and not (profile.marital_status or "").strip():
        pending = OneMinutePendingQuestion(
            field="maritalStatus",
            before_beat=_QUESTION_ANCHOR_BEAT,
            prompt=OneMinuteText(
                ta=(
                    "இதற்குப் பதில் கிடைக்கும் வரை இந்த வாசிப்பின் ஒரு பகுதி நிறுத்தி "
                    "வைக்கப்பட்டுள்ளது — இவற்றில் எது இப்போது உங்களுக்குப் பொருந்தும்?"
                ),
                en=(
                    "One part of this reading is held back until this is answered — "
                    "which of these fits you now?"
                ),
            ),
            options=[
                OneMinuteQuestionOption(
                    value="married",
                    label=OneMinuteText(ta="திருமணமானவர்", en="Married"),
                ),
                OneMinuteQuestionOption(
                    value="single",
                    label=OneMinuteText(ta="திருமணமாகவில்லை", en="Not married"),
                ),
                OneMinuteQuestionOption(
                    value="divorced",
                    label=OneMinuteText(ta="விவாகரத்து ஆனவர்", en="Divorced"),
                ),
                OneMinuteQuestionOption(
                    # The profile FORM says "விதவை / விதுரர்", which is the
                    # conventional label for a select. Inside a piece of prose
                    # addressed to the reader it lands differently, so this one
                    # says "one who has lost their life partner" — the same
                    # register as the rest of the reading, and what a person
                    # would actually say to someone.
                    value="widowed",
                    label=OneMinuteText(ta="வாழ்க்கைத் துணையை இழந்தவர்", en="Widowed"),
                ),
                OneMinuteQuestionOption(
                    value=STATUS_UNDISCLOSED,
                    label=OneMinuteText(ta="சொல்ல விரும்பவில்லை", en="Prefer not to say"),
                ),
            ],
        )

    run_safety_pass(*[beat.text for beat in beats], source="one_minute_reading")

    return OneMinuteReadingResponse(
        data=OneMinuteReadingData(
            chart_id=chart_id,
            birth_profile_id=profile.birth_profile_id,
            display_name=profile.display_name,
            as_of=today,
            reading_window=OneMinuteReadingWindow(
                from_date=timeline.current_antardasha.start_date,
                to_date=timeline.current_antardasha.end_date,
            ),
            age=age,
            stage=stage,
            age_band=OneMinuteText(ta=age_band["ta"], en=age_band["en"]),
            focus_topic=topic,
            addressed_to=addressed_to,
            beats=beats,
            pending_question=pending,
            word_count=OneMinuteWordCount(
                ta=sum(_word_count(b.text.ta) for b in beats),
                en=sum(_word_count(b.text.en) for b in beats),
            ),
            next_step=OneMinuteNextStep(
                label=OneMinuteText(
                    ta="முழு ஜாதகத்தைப் படிக்க",
                    en="Read the full chart",
                ),
                href=f"/dashboard/family?chart={chart_id}",
            ),
        ),
        meta=OneMinuteMeta(
            calculation_version=CALC_VERSION,
            generated_at=datetime.now(tz=UTC),
        ),
    )


__all__ = [
    "CALC_VERSION",
    "EMITTABLE_PROVENANCE",
    "MAX_WORDS_EN",
    "MAX_WORDS_TA",
    "STATUS_UNDISCLOSED",
    "BaseRate",
    "Provenance",
    "TOPIC_CAREER",
    "TOPIC_CHILD_GROWTH",
    "TOPIC_EDUCATION",
    "TOPIC_ELDER",
    "TOPIC_MARRIAGE",
    "TOPIC_MARRIED_LIFE",
    "TOPIC_STEADYING",
    "TOPIC_TEEN",
    "TOPIC_THIRD_PARTY",
    "TOPIC_UNKNOWN",
    "build_one_minute_reading",
    "word_budget",
]
