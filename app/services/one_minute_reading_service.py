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
from app.calculations.display_names import planet_en, planet_ta
from app.core.age_gate import (
    compute_age,
    is_married_settled,
    is_minor_age,
    is_past_prime_marriage_age,
    is_seeking_marriage,
)
from app.models import BirthProfile, Chart
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
    get_age_phase_label,
    life_stage,
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
MAX_WORDS_EN = 285
MAX_WORDS_TA = 212

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


@dataclass(frozen=True, slots=True)
class _Voice:
    """One graha's six narration facets, each as ``(ta, en)``.

    ``nature``      — temperament, when this graha lords the janma nakshatra.
    ``capacity``    — the human capacity, when this graha is strongest.
    ``soft_spot``   — the tendency under pressure, when this graha is weakest.
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
        "capacity": (Provenance.TENDENCY, BaseRate.KEYED),
        "soft_spot": (Provenance.TENDENCY, BaseRate.KEYED),
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

    nature: tuple[str, str]
    capacity: tuple[str, str]
    soft_spot: tuple[str, str]
    past_texture: tuple[str, str]
    now_texture: tuple[str, str]
    action: tuple[str, str]


_VOICE: dict[str, _Voice] = {
    "SUN": _Voice(
        nature=(
            "நீங்கள் பொறுப்பேற்கும் இயல்பு கொண்டவர்; அதை மற்றவர்கள் உடனே உணர்கிறார்கள் — ஆனால் "
            "கருத்து வேறுபாட்டை வெளியே காட்டுவதை விட உள்ளுக்குள் அதிகம் உணர்கிறீர்கள்.",
            "You carry yourself as someone in charge and people read that quickly — though you take "
            "disagreement more personally than you let on.",
        ),
        capacity=(
            "கேட்காமலேயே மற்றவர்கள் உங்களிடம் ஒப்படைக்கும் பொறுப்பு",
            "the authority people hand you without being asked",
        ),
        soft_spot=(
            "தவறு என்று வெளிப்பட நேரும் தருணம் — நீங்கள் நம்பாத நிலைப்பாட்டையும் தொடர்ந்து காப்பாற்றுகிறீர்கள்",
            "being seen to be wrong; you defend a position past the point you believe it",
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
        nature=(
            "யாரும் பேசுவதற்கு முன்பே சூழலை நீங்கள் புரிந்துகொள்கிறீர்கள்; அதனால் மற்றவர்கள் தங்கள் "
            "கவலைகளை உங்களிடம் கொண்டு வருகிறார்கள் — ஆனால் பிறரின் மனநிலை தேவைக்கும் அதிக நேரம் "
            "உங்களுடன் தங்கிவிடுகிறது.",
            "You read a room before anyone speaks, and people bring you their troubles — though other "
            "people's moods stay with you longer than they should.",
        ),
        capacity=(
            "மற்றவர்களுக்கு என்ன தேவை என்பதை அவர்கள் சொல்வதற்கு முன்பே அறிதல்",
            "reading what people need before they say it",
        ),
        soft_spot=(
            "அழுத்தத்தில் நிலைத்திருத்தல் — உங்கள் மனநிலை சூழலின் மனநிலையைப் பின்தொடர்கிறது",
            "steadiness under pressure; your mood follows the room's more than you would like",
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
        nature=(
            "முதலில் செயல்படுபவர், விரைவாக முடிவெடுப்பவர் — உங்களைச் சுற்றி வேலைகள் நடப்பதற்குக் "
            "காரணமே அதுதான். ஆனால் கடைசித் தகவல் வருவதற்கு முன்பே முடிவெடுத்துவிடுகிறீர்கள்.",
            "You move first and decide fast, which is why things around you actually get done — though "
            "you commit before the last fact is in.",
        ),
        capacity=(
            "மற்றவர்கள் இன்னும் விவாதித்துக்கொண்டிருக்கும்போது செயல்படுதல்",
            "acting while other people are still discussing",
        ),
        soft_spot=(
            "பொறுமை — தானாகவே வந்திருக்கக்கூடிய முடிவை நீங்கள் வலுக்கட்டாயமாக வரவழைக்கிறீர்கள்",
            "patience; you force a decision that would have come to you on its own",
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
        nature=(
            "வார்த்தைகளில் சிந்திப்பவர்; எந்தச் சூழலையும் பேச்சால் கடந்துவிடுவீர்கள் — ஆனால் ஏற்கனவே "
            "சரியாக எடுத்த முடிவை மீண்டும் யோசித்து மாற்றிக்கொள்கிறீர்கள்.",
            "You think in words and can talk your way through most rooms — though you often reason "
            "yourself out of a decision you had already got right.",
        ),
        capacity=(
            "சிக்கலான ஒன்றை எளிமையாக விளக்குதல்",
            "explaining a complicated thing simply",
        ),
        soft_spot=(
            "முடிவெடுத்தல் — இரு பக்கத்தையும் நன்றாக வாதிடுவதால் எதுவும் வெல்வதில்லை",
            "deciding; you can argue both sides so well that neither one wins",
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
        nature=(
            "தீர்ப்புக்காக மக்கள் உங்களிடம் வருகிறார்கள்; நீங்கள் தாராளமாகக் கொடுக்கிறீர்கள் — ஆனால் "
            "ஒருவரால் தாங்கக்கூடியதை விட அதிகமாக வாக்குறுதி அளிக்கிறீர்கள்.",
            "People come to you for judgment and you give it generously — though you promise more than "
            "one person can reasonably carry.",
        ),
        capacity=(
            "மற்றவர்கள் நம்பிச் செயல்படும் அளவுக்கான தீர்ப்பு",
            "judgment people trust enough to act on",
        ),
        soft_spot=(
            "மறுத்துச் சொல்வது — அதனால் உங்கள் சம்மதம் பல இடங்களில் மெலிந்துவிடுகிறது",
            "saying no, so your yes gets spread thin",
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
        nature=(
            "சூழலையும் மனிதர்களையும் இதமாக வைத்திருப்பவர்; திறமை மட்டும் திறக்காத கதவுகளை அது "
            "திறக்கும் — ஆனால் தெளிவைக் கொடுக்கும் அந்த ஒரு உரையாடலைத் தவிர்க்கிறீர்கள்.",
            "You make things pleasant and people comfortable, and that opens doors ability alone would "
            "not — though you avoid the one conversation that would clear the air.",
        ),
        capacity=(
            "மனிதர்களிடம் காட்டும் பொறுமையும், அது ஈட்டித் தரும் நல்லெண்ணமும்",
            "patience with people, and the good will it earns",
        ),
        soft_spot=(
            "நேரடி மோதல் — எதிர்த்துச் சொல்வதை விட உள்ளுக்குள் தாங்கிக்கொள்கிறீர்கள், அது சேர்ந்துகொண்டே வரும்",
            "confrontation; you tend to absorb rather than object, and it accumulates",
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
        nature=(
            "தொடங்கியதை முடிப்பவர்; முதலில் இருப்பதை விட உறுதியாக இருப்பதையே விரும்புவீர்கள் — ஆனால் "
            "ஒரு வழிமுறையை ஏற்ற பிறகு, அது பலன் தராத நிலையிலும் விட்டு விலகுவது கடினம்.",
            "You finish what you start and would rather be sure than first — though once committed "
            "to a way of working, you find it hard to let go.",
        ),
        capacity=(
            "வேகமானவர்களைத் தோற்கடிக்கும் பிரச்சினைகளை விடத் தாக்குப்பிடித்தல்",
            "outlasting problems that defeat faster people",
        ),
        soft_spot=(
            "தொடங்குவது — வராத ஒரு உறுதிக்காகக் காத்திருக்கிறீர்கள்",
            "starting; you wait for a certainty that does not arrive",
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
        nature=(
            "உங்களுக்குக் கொடுக்கப்பட்ட இடத்தை விட அதிகம் வேண்டும் என்பவர்; மற்றவர் காணாத வழிகளைக் "
            "கண்டுபிடிப்பீர்கள் — ஆனால் சென்றடைந்ததை அனுபவிக்க நிற்பதே இல்லை.",
            "You want more than the room you were given and you find routes other people do not see — "
            "though you rarely stop long enough to enjoy arriving.",
        ),
        capacity=(
            "மற்றவர்கள் சுவரைக் காணும் இடத்தில் ஒரு வழியைக் காணுதல்",
            "seeing an opening where other people see a wall",
        ),
        soft_spot=(
            "முடிப்பது — நடப்பதை விட அடுத்தது எப்போதும் சுவாரஸ்யமாக இருக்கிறது",
            "finishing; the next thing is always more interesting than the current one",
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
        nature=(
            "எதையும் விரைவில் ஊடுருவிப் பார்ப்பவர்; எளிதில் வியப்படைவதில்லை — ஆனால் கேட்டே "
            "தெரிந்துகொள்ளக்கூடிய ஒன்றிலிருந்தும் விலகிவிடுகிறீர்கள்.",
            "You see through things quickly and are not easily impressed — though you withdraw from "
            "what you could simply have asked about.",
        ),
        capacity=(
            "உண்மையில் முக்கியமானது எது என்பதை நேராக அடைதல்",
            "cutting straight to what actually matters",
        ),
        soft_spot=(
            "தங்கியிருப்பது — சூழலுக்குத் தேவை அதுவாக இருக்கும்போதும் விலகிவிடுகிறீர்கள்",
            "staying, at the times when staying is what the situation needs",
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
_SIGNATURE_OPENING: dict[str, tuple[str, str]] = {
    "SUN": (
        "சிலர் கவனிக்கப்படாத இடத்தில் சிறப்பாகச் செயல்படுவார்கள். சிலர் பார்க்கப்படும்போதுதான் "
        "முழுமையாகத் தங்களாக இருப்பார்கள். நீங்கள் இரண்டாவது வகை.",
        "Some people do their best work out of sight. Others are only fully themselves when they "
        "are being watched. You are the second kind.",
    ),
    "MOON": (
        "சிலர் திட்டங்களை வைத்து வாழ்க்கையைக் கடப்பார்கள். சிலர் சூழலை உணர்ந்து கடப்பார்கள் — "
        "சொல்லப்படுவதற்கு முன்பே மாற்றத்தை உணர்பவர்கள். நீங்கள் இரண்டாவது வகை.",
        "Some people move through life on plans. Others move on atmosphere — reading a room, "
        "feeling a shift before it is announced. You are the second kind.",
    ),
    "MARS": (
        "சிலர் சரியான தருணத்திற்குக் காத்திருப்பார்கள். சிலர் அதை உருவாக்கிவிட்டு விளைவுகளைச் "
        "சமாளிப்பார்கள். நீங்கள் இரண்டாவது வகை.",
        "Some people wait for the right moment. Others create it and deal with the consequences "
        "afterwards. You are the second kind.",
    ),
    "MERCURY": (
        "சிலர் தங்கள் இருப்பால் மற்றவர்களை நம்பவைப்பார்கள். சிலர் விளக்கத்தால் நம்பவைப்பார்கள். "
        "நீங்கள் இரண்டாவது வகை.",
        "Some people convince others by sheer presence. Others convince by explaining. You are the "
        "second kind.",
    ),
    "JUPITER": (
        "சிலர் ஒவ்வொரு கதவையும் தள்ளித் திறக்க வேண்டியிருக்கும். சிலருக்குக் கதவுகள் திறக்கும் — "
        "எளிதாக வந்ததை மதிக்காமல் விடுவதுதான் அவர்களின் ஆபத்து. நீங்கள் இரண்டாவது வகை.",
        "Some people force every door. Others find doors tend to open — and their real risk is not "
        "valuing what came easily. You are the second kind.",
    ),
    "VENUS": (
        "சிலர் தாங்கள் விரும்புவதை அழுத்தத்தால் அடைவார்கள். சிலர், மற்றவர்கள் கொடுக்க "
        "விரும்புவதால் அடைவார்கள். நீங்கள் இரண்டாவது வகை.",
        "Some people get what they want by pushing for it. Others get it because people want to "
        "give it to them. You are the second kind.",
    ),
    "SATURN": (
        "சிலருக்கு வாய்ப்புகள் தானாக வந்து சேரும். சிலர் ஒவ்வொரு வாய்ப்பையும் போராடி வெல்ல "
        "வேண்டியிருக்கும். நீங்கள் இரண்டாவது வகை.",
        "Some people find that opportunities arrive on their own. Others have to win each one. You "
        "are the second kind.",
    ),
    "RAHU": (
        "சிலர் தங்களுக்குக் கிடைத்த வாழ்க்கைக்குள் நிறைவாக இருப்பார்கள். சிலர் அதன் எல்லையைத் "
        "தாண்டியே கை நீட்டிக்கொண்டிருப்பார்கள். நீங்கள் இரண்டாவது வகை.",
        "Some people are content inside the life they were handed. Others spend it reaching past "
        "the edge of it. You are the second kind.",
    ),
    "KETU": (
        "சிலருக்கு அறைக்குள் இருப்பது அவசியம். சிலருக்கு சற்று வெளியே நின்றால்தான் அது தெளிவாகத் "
        "தெரியும். நீங்கள் இரண்டாவது வகை.",
        "Some people need to be in the room. Others see it more clearly from just outside it. You "
        "are the second kind.",
    ),
}

_SIGNATURE_GRIEVANCE: dict[str, tuple[str, str]] = {
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
_FALSIFIABILITY: dict[tuple[str, bool], tuple[str, str]] = {
    ("self", True): (
        "இது உங்களைப் பற்றியதாக இல்லை என்று தோன்றினால் — சிறிதளவும் அல்ல, உண்மையிலேயே இல்லை "
        "என்றால் — தொடர்வதற்கு முன் பிறந்த தேதியையும் நேரத்தையும் சரிபாருங்கள். இருபது "
        "நிமிடங்கள் லக்னத்தை மாற்றிவிடும்.",
        "If that does not sound like you — not partly, genuinely not — check the birth date and "
        "time before reading on. Twenty minutes can move the rising sign.",
    ),
    ("self", False): (
        "பிறந்த நேரம் உறுதிப்படுத்தப்படவில்லை; அதனால் இந்த வாசிப்பு லக்னத்தை விட்டுவிடுகிறது — "
        "இருபது நிமிடங்கள் அதை மாற்றிவிடும். உங்கள் நட்சத்திரத்தை அது மாற்றுவதில்லை; மீதி "
        "அதன் மீதுதான் நிற்கிறது.",
        "The birth time is not confirmed, so this reading leaves the rising sign out — twenty "
        "minutes can move it. It does not move your star, which the rest is built on.",
    ),
    ("parent", True): (
        "இது {name}-ஐப் பற்றியதாக இல்லை என்று தோன்றினால் — சிறிதளவும் அல்ல, உண்மையிலேயே இல்லை "
        "என்றால் — தொடர்வதற்கு முன் பிறந்த தேதியையும் நேரத்தையும் சரிபாருங்கள். இருபது "
        "நிமிடங்கள் லக்னத்தை மாற்றிவிடும்.",
        "If that does not sound like {name} — not partly, genuinely not — check the birth date "
        "and time before reading on. Twenty minutes can move the rising sign.",
    ),
    ("parent", False): (
        "{name}-இன் பிறந்த நேரம் உறுதிப்படுத்தப்படவில்லை; அதனால் இந்த வாசிப்பு லக்னத்தை "
        "விட்டுவிடுகிறது — இருபது நிமிடங்கள் அதை மாற்றிவிடும். அவரின் நட்சத்திரத்தை அது "
        "மாற்றுவதில்லை; மீதி அதன் மீதுதான் நிற்கிறது.",
        "{name}'s birth time is not confirmed, so this reading leaves the rising sign out — "
        "twenty minutes can move it. It does not move their star, which the rest is built on.",
    ),
}

# Provenance for the copy that does not live on a _Voice — see _Voice.PROVENANCE
# for the model, and tests/test_one_minute_reading.py for the enforcement. The
# test discovers these tables by reflection rather than from a list, so a new
# table of Tamil/English copy fails the suite until it is classified here.
_TABLE_PROVENANCE: dict[str, tuple[Provenance, BaseRate]] = {
    # Nine keyed variants, each falsifiable: a reader can meet one and say "no,
    # that is not me", which is the only thing that makes meeting it worth
    # anything.
    "_SIGNATURE_OPENING": (Provenance.TENDENCY, BaseRate.KEYED),
    # COMMON, and this is the honest entry in the table. The grievance is the
    # highest-value sentence in the feature and the one carrying the most
    # Barnum risk — the module comment above already says so. Keying it on the
    # signature was the FORM fix and it worked; it is not the base-rate fix.
    # Saturn's "why is it still taking so long" is true of most people who ever
    # consulted an astrologer, whatever their chart. It stays, because a
    # recognised complaint earns attention that the reading then spends on
    # chart-derived material — but it is marked, so nobody mistakes it for
    # proof and nobody builds the next trust mechanism on top of it.
    "_SIGNATURE_GRIEVANCE": (Provenance.TENDENCY, BaseRate.COMMON),
    # Claims nothing. Responds to the sentence before it.
    "_VALIDATION": (Provenance.FRAME, BaseRate.KEYED),
    "_SECOND_NOTE": (Provenance.FRAME, BaseRate.KEYED),
    # D, and unusually literally so: the only claims it makes are about our own
    # inputs (whether the birth time is confirmed) and about the ephemeris
    # (twenty minutes moves the lagna). It says nothing about the reader, which
    # is exactly why it can be trusted to say the reading might be wrong.
    "_FALSIFIABILITY": (Provenance.DERIVED, BaseRate.KEYED),
    # The dasha/area affinity read out loud — a rule applied to the running
    # lord, and the one place a date reaches the body text.
    "_OUTLOOK_SUPPORTIVE": (Provenance.RULE, BaseRate.KEYED),
    "_OUTLOOK_MIXED": (Provenance.FRAME, BaseRate.KEYED),
    "_OUTLOOK_SLOW": (Provenance.RULE, BaseRate.KEYED),
}

# Beat 1 puts two grahas in consecutive sentences: the chart's dominant graha
# (the opening) and the janma nakshatra's lord (the nature line). They often
# disagree — a Sun-signature chart with a Ketu nakshatra opens "only fully
# yourself when you are being watched" and then says "you withdraw". Printed
# flat, that is whiplash, and it reads as an app that does not know the reader.
#
# The fix is not to suppress one. A jodhidar reading two significators that pull
# apart says so out loud, and naming the tension is more convincing than a flat
# single note, because real people are in fact contradictory. So: silence when
# the two agree (no marker needed), and an explicit hinge when they do not.
_SECOND_NOTE: tuple[str, str] = ("அதே நேரத்தில்:", "And yet:")


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

_OUTLOOK_SUPPORTIVE = (
    "நடப்புக் காலம் இதற்கு ஆதரவாக இருக்கிறது.",
    "The current period is behind this.",
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
    "what_this_rests_on": frozenset({Provenance.DERIVED}),
    # Strength ranking (D) + capacity/soft-spot/grievance (T) + validation (F).
    "strength_and_cost": frozenset({Provenance.DERIVED, Provenance.TENDENCY, Provenance.FRAME}),
    # Dated dasa spans (D) + past_texture (R). The dates are the beat's whole
    # value and also its whole risk — this is the beat v2's E→R+invitation
    # operator is written for, and the one Rule 1 has always guarded.
    "last_ten_years": frozenset({Provenance.DERIVED, Provenance.RULE}),
    "right_now": frozenset({Provenance.DERIVED, Provenance.RULE}),
    # Age and the topic routing (D) + the topic frame and outlook clause (R).
    "your_age_question": frozenset({Provenance.DERIVED, Provenance.RULE}),
    "next_ten_years": frozenset({Provenance.DERIVED, Provenance.RULE}),
    # The minor path's forward beat carries NO texture claim by design — the
    # handover and its date, and nothing about a person who does not exist yet.
    # That is why it is D-only, and the absence of R here is the design.
    "years_ahead": frozenset({Provenance.DERIVED}),
    "one_thing": frozenset({Provenance.RULE, Provenance.FRAME}),
}


def _beat_who_you_are(
    *,
    display_name: str,
    nakshatra_name: str,
    moon_rasi_name: str,
    lagna_rasi_name: str,
    nakshatra_lord: str,
    signature_lord: str,
    lagna_reliable: bool,
    addressed_to: str,
) -> OneMinuteBeat:
    star = _proper(nakshatra_name)
    moon_rasi = _proper(moon_rasi_name)
    lagna_rasi = _proper(lagna_rasi_name)
    lagna_ta = f", {lagna_rasi} லக்னத்தில்" if lagna_reliable else ""
    lagna_en = f", {lagna_rasi} rising" if lagna_reliable else ""

    if addressed_to == "parent":
        child = _CHILD_VOICE[nakshatra_lord]
        given = _first_name(display_name)
        ta = (
            f"{given} {star} நட்சத்திரத்தில், {moon_rasi} ராசியில்{lagna_ta} பிறந்தவர். "
            f"{child.note[0].format(name=given)}"
        )
        en = (
            f"{given} was born under {star}, Moon in {moon_rasi}{lagna_en}. "
            f"{child.note[1].format(name=given)}"
        )
    else:
        # Contrast first, then the chart facts, then the concrete behaviour. The
        # contrast makes the reader place themselves; the behavioural line stops
        # that placement from being a horoscope anyone would accept. Neither
        # works alone — the contrast on its own is the Forer effect with better
        # rhythm, and the behaviour on its own opens cold.
        voice = _VOICE[nakshatra_lord]
        opening = _SIGNATURE_OPENING[signature_lord]
        # Only when the two significators disagree — see _SECOND_NOTE.
        agree = signature_lord == nakshatra_lord
        hinge_ta = "" if agree else f"{_SECOND_NOTE[0]} "
        hinge_en = "" if agree else f"{_SECOND_NOTE[1]} "
        nature_ta = voice.nature[0] if agree else voice.nature[0][:1].lower() + voice.nature[0][1:]
        nature_en = voice.nature[1] if agree else voice.nature[1][:1].lower() + voice.nature[1][1:]
        ta = (
            f"{opening[0]} நீங்கள் {star} நட்சத்திரத்தில், {moon_rasi} ராசியில்{lagna_ta} பிறந்தவர். "
            f"{hinge_ta}{nature_ta}"
        )
        en = (
            f"{opening[1]} You were born under {star}, Moon in {moon_rasi}{lagna_en}. "
            f"{hinge_en}{nature_en}"
        )

    basis_ta = f"{star} நட்சத்திரம் (அதிபதி {planet_ta(nakshatra_lord)})"
    basis_en = f"{star} nakshatra, lord {planet_en(nakshatra_lord)}"
    if addressed_to != "parent":
        basis_ta += f"; ஜாதகத்தின் மைய கிரகம் {planet_ta(signature_lord)}"
        basis_en += f"; chart signature {planet_en(signature_lord)}"
    if lagna_reliable:
        basis_ta += f"; {lagna_rasi} லக்னம்"
        basis_en += f"; {lagna_rasi} lagna"
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
    ta, en = _FALSIFIABILITY[(addressed_to, lagna_reliable)]

    source = (birth_time_source or "unknown").upper()
    return OneMinuteBeat(
        id="what_this_rests_on",
        text=OneMinuteText(ta=ta.format(name=given), en=en.format(name=given)),
        basis=OneMinuteText(
            ta=f"பிறந்த நேரத்தின் ஆதாரம்: {source}",
            en=f"Birth time source: {source}",
        ),
    )


def _beat_strength_and_cost(
    *, strongest: str, weakest: str, signature_lord: str
) -> OneMinuteBeat:
    """Adult path only — a soft-spot sentence is a character verdict, and a
    child has not lived long enough to have earned one.

    Closes on the grievance: the private question this signature actually
    produces, quoted back as the reader's own words, then validated before
    anything is reframed. It sits HERE rather than in the opening because a
    complaint only lands once the cost that causes it has been named — put it
    first and it is a guess, put it after the soft spot and it is a conclusion.
    """
    strong_voice = _VOICE[strongest]
    weak_voice = _VOICE[weakest]
    grievance = _SIGNATURE_GRIEVANCE[signature_lord]

    ta = (
        f"உங்கள் உண்மையான பலம் {strong_voice.capacity[0]}. விலை என்பது {weak_voice.soft_spot[0]}. "
        f"அதனால்தான் ஒன்றுக்கு மேற்பட்ட முறை உங்களுக்குள் “{grievance[0]}?” என்ற கேள்வி "
        f"வந்திருக்கும். {_VALIDATION[0]}"
    )
    en = (
        f"Your real strength is {strong_voice.capacity[1]}. Where it costs you is "
        f"{weak_voice.soft_spot[1]}. Which is why you have asked yourself, more than once, "
        f"“{grievance[1]}?” {_VALIDATION[1]}"
    )

    return OneMinuteBeat(
        id="strength_and_cost",
        text=OneMinuteText(ta=ta, en=en),
        basis=OneMinuteText(
            ta=(
                f"வலிமையான கிரகம் {planet_ta(strongest)}; பலவீனமானது {planet_ta(weakest)}; "
                f"மைய கிரகம் {planet_ta(signature_lord)}"
            ),
            en=(
                f"Strongest graha {planet_en(strongest)}; weakest {planet_en(weakest)}; "
                f"signature {planet_en(signature_lord)}"
            ),
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
                f"காலம் நடந்தது. {_cap(voice.past_texture[0])}."
            )
            en = (
                f"From {span_start.year} to {hinge_year} you were under "
                f"{planet_en(previous.lord)}. {_cap(voice.past_texture[1])}."
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
        ta = (
            f"{span_year} முதல் இதுவரை நீங்கள் {planet_ta(maha.lord)} காலத்திற்குள்ளேயே "
            f"இருக்கிறீர்கள். {_cap(voice.past_texture[0])}. அதற்குள் {hinge_year}-ல் ஒரு "
            f"திருப்பம் வந்தது."
        )
        en = (
            f"From {span_year} until now you have been inside one long "
            f"{planet_en(maha.lord)} stretch. {_cap(voice.past_texture[1])}. Within it, "
            f"{hinge_year} marked a turn."
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
        f"{_cap(voice.past_texture[0])}."
    )
    en = (
        f"From {window_start.year} until now you have been under {planet_en(maha.lord)} "
        f"throughout. {_cap(voice.past_texture[1])}."
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
    *, timeline: VimshottariTimeline, hinge: tuple[int, str] | None
) -> OneMinuteBeat:
    maha = timeline.current_mahadasha
    antar = timeline.current_antardasha
    voice = _VOICE[maha.lord]

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
        hinge_ta = hinge_en = ""
        ta_lead = f"இப்போது உங்களுக்கு {planet_ta(maha.lord)} காலம்."
        en_lead = f"You are in a {planet_en(maha.lord)} period now."
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

    ta = f"{hinge_ta}{ta_lead} {_cap(voice.now_texture[0])}."
    en = f"{hinge_en}{en_lead} {_cap(voice.now_texture[1])}."

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
    *, age: int, marital_status: str | None, employment_type: str | None
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
        return TOPIC_CHILD_GROWTH
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
        ta = (
            f"திருமணமானவர், {age_band['ta']} நிலையில் இருப்பவர் என்பதால், ஜாதகத்தின் கவனம் இப்போது "
            f"வீடு மற்றும் குடும்பத்தின் மீதே இருக்கிறது — தொழிலை மாற்றியமைப்பதன் மீது அல்ல. {outlook_ta}"
        )
        en = (
            f"Married, and in the {age_band['en'].lower()} — so the weight of the chart sits on home "
            f"and family rather than on reinventing your work. {outlook_en}"
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
        ta = (
            "இந்தக் காலத்தில் ஜாதகத்தின் கவனம் உடல்நலத்தின் மீதும், நீங்கள் ஒப்படைப்பதன் மீதும் "
            f"நகர்கிறது — இரண்டும் தானாகவே நடக்கும் என்று விட்டுவிடக்கூடாதவை. {outlook_ta}"
        )
        en = (
            "In this stretch the chart's attention moves to health, and to what you hand on — both "
            f"are worth deliberate attention rather than assumed continuity. {outlook_en}"
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


def _beat_next_ten_years(*, timeline: VimshottariTimeline, as_of: date) -> OneMinuteBeat:
    horizon = date(as_of.year + 10, as_of.month, min(as_of.day, 28))
    upcoming = _handovers_within(timeline.mahadashas, as_of, horizon)

    if upcoming:
        nxt = upcoming[0]
        voice = _VOICE[nxt.lord]
        ta = (
            f"{_month_year(nxt.start_date, 'ta')} முதல் உங்களுக்கு {planet_ta(nxt.lord)} காலம் "
            f"தொடங்குகிறது. {_cap(voice.now_texture[0])}."
        )
        en = (
            f"From {_month_year(nxt.start_date, 'en')}, {planet_en(nxt.lord)} takes over. "
            f"{_cap(voice.now_texture[1])}."
        )
        basis_ta = f"{planet_ta(nxt.lord)} மகாதசை {nxt.start_date.isoformat()} முதல்"
        basis_en = f"{planet_en(nxt.lord)} mahadasha from {nxt.start_date.isoformat()}"
    else:
        maha = timeline.current_mahadasha
        antars = _antardashas(maha)
        upcoming_antars = _handovers_within(antars, as_of, horizon)
        nxt = upcoming_antars[0] if upcoming_antars else timeline.current_antardasha
        voice = _VOICE[nxt.lord]
        ta = (
            f"{maha.end_date.year} வரை {planet_ta(maha.lord)} காலமே தொடர்கிறது; அதற்குள் "
            f"{_month_year(nxt.start_date, 'ta')} முதல் {planet_ta(nxt.lord)} பகுதி வருகிறது. "
            f"{_cap(voice.now_texture[0])}."
        )
        en = (
            f"You stay under {planet_en(maha.lord)} through {maha.end_date.year}; the shift "
            f"inside it comes in {_month_year(nxt.start_date, 'en')}, when {planet_en(nxt.lord)} "
            f"begins. {_cap(voice.now_texture[1])}."
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


def _beat_one_thing(*, timeline: VimshottariTimeline, addressed_to: str) -> OneMinuteBeat:
    lord = timeline.current_mahadasha.lord
    if addressed_to == "parent":
        # An instruction aimed at a child has no valid recipient — the parent is
        # the one who can act. Same rule age_phase_service.remedy_lead_in_for_stage
        # exists to enforce, and the action itself is written for them.
        ta = f"பெற்றோர் செய்யக்கூடிய ஒன்று: {_CHILD_VOICE[lord].action[0]}."
        en = f"One thing parents can do: {_CHILD_VOICE[lord].action[1]}."
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
    addressed_to = "parent" if is_minor_age(age) else "self"
    topic = _focus_topic(
        age=age,
        marital_status=profile.marital_status,
        employment_type=profile.employment_type,
    )
    strongest, weakest = _strongest_and_weakest(chart_response.data.planets)
    nakshatra_lord = timeline.opening_lord  # the janma nakshatra's lord, by construction
    signature_lord = _signature_lord(
        chart_response.data.planets, timeline, fallback=nakshatra_lord
    )

    lagna_reliable = _lagna_is_reliable(profile)
    opening = _beat_who_you_are(
        display_name=profile.display_name,
        nakshatra_name=moon.nakshatra_name,
        moon_rasi_name=moon.rasi_name,
        lagna_rasi_name=chart_response.data.lagna.rasi_name,
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
    if addressed_to == "parent":
        # Five beats, all natively third person and addressed to the parent. The
        # strength/soft-spot and last-ten-years beats are absent by design, not
        # softened: one is a character verdict a child has not earned, the other
        # describes the parents' decade rather than the child's.
        # A minor always routes to CHILD_GROWTH, so beat 5 is never the withheld
        # one on this path and never needs the marital question.
        beats: list[OneMinuteBeat] = [
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
            beats.append(
                _beat_strength_and_cost(
                    strongest=strongest, weakest=weakest, signature_lord=signature_lord
                )
            )
        past_beat, hinge = _beat_last_ten_years(
            timeline=timeline, as_of=today, birth_date=profile.birth_date_local
        )
        beats.append(past_beat)
        beats.append(_beat_right_now(timeline=timeline, hinge=hinge))
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
        beats.append(_beat_next_ten_years(timeline=timeline, as_of=today))
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
    "TOPIC_UNKNOWN",
    "build_one_minute_reading",
]
