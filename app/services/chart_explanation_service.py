from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time
from itertools import combinations
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.aspects import aspect_houses, aspects_house
from app.calculations.astro import RASI_NAMES, house_from_reference, utc_datetime_to_julian_day
from app.calculations.chart_strength import (
    _NATURAL_ENEMIES,
    _NATURAL_FRIENDS,
    DEBILITATION_RASI,
    EXALTATION_RASI,
    MOOLATRIKONA_ZONE,
    OWN_SIGN_RASI,
    _dignity_score,
    compute_all_bhava_bala,
    d9_dignity_tier,
    detect_planetary_wars,
)
from app.calculations.dasha import DashaPeriod, calculate_vimshottari_timeline
from app.constants.astrology import SIGN_LORD
from app.calculations.display_names import planet_en, planet_ta, sani_cycle_en, sani_cycle_ta
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.functional_nature import get_functional_nature
from app.calculations.nakshatra_lord_dynamics import nakshatra_lord, nakshatra_lord_note
from app.calculations.planet_conditions import (
    CAZIMI_MEANING,
    D9_DEBILITATED_MEANING,
    D9_DIGNIFIED_MEANING,
    VARGOTTAMA_MEANING,
    combust_meaning,
    retrograde_meaning,
)
from app.calculations.remedies import PLANET_REMEDY_CATALOG
from app.models import Chart
from app.schemas.chart_explanation import (
    ChartExplanationActivationSignal,
    ChartExplanationAspect,
    ChartExplanationConjunctionGroup,
    ChartExplanationBhava,
    ChartExplanationBhavaSection,
    ChartExplanationCoreIdentity,
    ChartExplanationCurrentActivationSection,
    ChartExplanationDashaLordActivation,
    ChartExplanationData,
    ChartExplanationFacet,
    ChartExplanationHouseGroup,
    ChartExplanationMaitriPair,
    ChartExplanationPeyarchiEvent,
    ChartExplanationPeyarchiSection,
    ChartExplanationPlanet,
    ChartExplanationResponse,
    ChartExplanationScoreTerm,
    ChartExplanationSummarySection,
    ChartExplanationText,
    ChartExplanationYogaDoshamSection,
)
from app.schemas.charts import ChartBirthCondition, PlanetPosition, ResponseMeta
from app.services.age_phase_service import (
    STAGE_ADULT,
    house_theme_for_stage,
    is_minor,
    life_stage,
    remedy_lead_in_for_stage,
)
from app.services.chart_service import load_persisted_chart_response
from app.services.narrative_engine import PLANET_NAME
from app.services.peyarchi_service import get_peyarchi_summary

_NATAL_PLANETS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")
_KENDRA_HOUSES = frozenset({1, 4, 7, 10})
_TRIKONA_HOUSES = frozenset({1, 5, 9})
_DUSTHANA_HOUSES = frozenset({6, 8, 12})

_HOUSE_THEMES: dict[int, ChartExplanationText] = {
    1: ChartExplanationText(ta="உடல், தன்மை, வாழ்க்கை திசை", en="self, body, life direction"),
    2: ChartExplanationText(ta="குடும்பம், பேச்சு, பண அடித்தளம்", en="family, speech, money base"),
    3: ChartExplanationText(ta="முயற்சி, துணிவு, தொடர்பு", en="effort, courage, communication"),
    4: ChartExplanationText(ta="வீடு, மன அமைதி, சொத்து", en="home, inner peace, property"),
    5: ChartExplanationText(ta="கல்வி, புத்தி, குழந்தைகள்", en="learning, intelligence, children"),
    6: ChartExplanationText(ta="சேவை, பழக்கங்கள், ஒழுங்கு", en="service, habits, discipline"),
    7: ChartExplanationText(ta="உறவுகள், கூட்டாண்மை", en="relationships, partnership"),
    8: ChartExplanationText(ta="ஆழமான மாற்றம், ஆராய்ச்சி, கவனம்", en="deep change, research, careful renewal"),
    9: ChartExplanationText(ta="தர்மம், ஆசீர்வாதம், உயர்கல்வி", en="dharma, grace, higher learning"),
    10: ChartExplanationText(ta="தொழில், பொறுப்பு, வெளிப்படை செயல்", en="career, responsibility, public work"),
    11: ChartExplanationText(ta="லாபம், நண்பர்கள், வலையமைப்பு", en="gains, friends, networks"),
    12: ChartExplanationText(ta="ஓய்வு, வெளிநாடு, ஆன்மீக விடுவிப்பு", en="rest, foreign links, spiritual release"),
}


def _bi(ta: str, en: str) -> ChartExplanationText:
    return ChartExplanationText(ta=ta, en=en)


def _house_theme(house: int, stage: str = STAGE_ADULT) -> ChartExplanationText:
    """The house's life area, in terms that apply to THIS reader.

    ``_HOUSE_THEMES`` is written for an adult: house 10 is "career, responsibility,
    public work" and house 2 is "money base". Served unchanged on a child's chart
    those are not simply premature, they are about a life the reader does not have
    — which is how an eight-month-old's reading came to discuss her public standing
    at work. The signification is unchanged; only the surface it lands on moves.
    """
    override = house_theme_for_stage(house, stage)
    if override is None:
        return _HOUSE_THEMES[house]
    return _bi(*override)


def _public_planets(planets: list[PlanetPosition]) -> list[PlanetPosition]:
    return [planet for planet in planets if planet.graha in _NATAL_PLANETS]


def _house_group(house: int) -> str:
    if house in _DUSTHANA_HOUSES:
        return "DUSTHANA"
    if house in _KENDRA_HOUSES and house in _TRIKONA_HOUSES:
        return "KENDRA_TRIKONA"
    if house in _KENDRA_HOUSES:
        return "KENDRA"
    if house in _TRIKONA_HOUSES:
        return "TRIKONA"
    return "OTHER"


def _dignity_label(planet: PlanetPosition) -> str:
    graha = planet.graha
    if DEBILITATION_RASI.get(graha) == planet.rasi:
        return "DEBILITATED"
    if EXALTATION_RASI.get(graha) == planet.rasi:
        return "EXALTED"
    mt = MOOLATRIKONA_ZONE.get(graha)
    if mt:
        mt_rasi, mt_start, mt_end = mt
        if planet.rasi == mt_rasi and mt_start <= planet.degree_in_rasi < mt_end:
            return "MOOLATRIKONA"
    if planet.rasi in OWN_SIGN_RASI.get(graha, frozenset()):
        return "OWN_SIGN"
    sign_lord = {
        1: "MARS",
        2: "VENUS",
        3: "MERCURY",
        4: "MOON",
        5: "SUN",
        6: "MERCURY",
        7: "VENUS",
        8: "MARS",
        9: "JUPITER",
        10: "SATURN",
        11: "SATURN",
        12: "JUPITER",
    }.get(planet.rasi)
    if sign_lord in _NATURAL_FRIENDS.get(graha, frozenset()):
        return "FRIEND_SIGN"
    if sign_lord in _NATURAL_ENEMIES.get(graha, frozenset()):
        return "ENEMY_SIGN"
    return "NEUTRAL_SIGN"


def _dignity_text(dignity: str) -> ChartExplanationText:
    mapping = {
        "EXALTED": _bi("உச்சம்: இயல்பான பலம் தெளிவாக வெளிப்படும்.", "Exalted: natural strength expresses clearly."),
        "DEBILITATED": _bi("நீசம்: மெதுவான ஆதரவும் ஒழுங்கும் தேவை.", "Debilitated: steady support and structure are needed."),
        "MOOLATRIKONA": _bi("மூலத்திரிகோணம்: கிரக சக்தி தெளிவான திசையில் இயங்கும்.", "Moolatrikona: the planet acts with focused strength."),
        "OWN_SIGN": _bi("சொந்த ராசி: நிலையான ஆதரவு கிடைக்கும்.", "Own sign: stable support is available."),
        "FRIEND_SIGN": _bi("நட்பு ராசி: சூழல் ஒத்துழைப்பாக இருக்கும்.", "Friendly sign: the setting is cooperative."),
        "ENEMY_SIGN": _bi("பகை ராசி: கவனமாக கையாளும் போது பலன் சமநிலையாகும்.", "Enemy sign: results balance better with careful handling."),
        "NEUTRAL_SIGN": _bi("சம ராசி: கலந்த பலம் — வீடு, பார்வை, பலம் சேர்ந்து முடிவு செய்யும்.", "Neutral sign: mixed strength, decided together with house, aspects, and strength."),
    }
    return mapping[dignity]


_PERIOD_ROLE_TA = {
    "MAHADASHA": "மகாதசை",
    "BHUKTI": "புக்தி",
    "ANTARAM": "அந்தரம்",
}
_PERIOD_ROLE_EN = {
    "MAHADASHA": "Mahadasha",
    "BHUKTI": "Bhukti",
    "ANTARAM": "Antaram",
}


def _current_period_text(
    current_role: str | None,
    dasha_chain_ta: str,
    dasha_chain_en: str,
) -> tuple[str, str]:
    """Concrete 'what is running now' sentence for a planet — never tells the reader
    to go find their own dasha/transit; it states this planet's role in the live
    period (see issue #2).

    The dasha CHAIN itself is deliberately not repeated here. It is stated once
    at chart level in `_build_current_activation_section`'s `period_summary`,
    and printing it again on every planet card meant the identical string
    ("Moon Mahadasha / Moon Bhukti / Jupiter Antaram") appeared eight times on
    one screen — read as machine-generated filler in review (2026-07-18). What
    stays here is the part that genuinely differs per planet: whether *this*
    graha is one of the running lords.

    ``dasha_chain_ta``/``dasha_chain_en`` are retained in the signature because
    callers still pass them and a future per-planet variant may want them; they
    are intentionally unused in the emitted prose.
    """
    del dasha_chain_ta, dasha_chain_en  # stated once at chart level, not per planet

    if current_role is not None:
        ta = (
            f"இந்த கிரகம் இப்போது நடப்பு {_PERIOD_ROLE_TA[current_role]} அதிபதி — "
            f"அதனால் அதன் வீடு மற்றும் துறை விளைவுகள் இப்போது நேரடியாக இயங்குகின்றன."
        )
        en = (
            f"This planet is currently your running {_PERIOD_ROLE_EN[current_role]} lord, "
            f"so its house and life-area results are directly active right now."
        )
        return ta, en
    ta = (
        "இந்த கிரகம் இப்போது நேரடி தசை/புக்தி/அந்தர அதிபதி அல்ல; "
        "அது தசை அல்லது புக்தியாக வரும்போதும், கோசாரத்தில் குரு/சனி இதைத் தொடும்போதும் அதன் முழு பலன் வெளிப்படும்."
    )
    en = (
        "This planet is not one of the active period lords right now; "
        "its full results surface when it becomes a dasha or bhukti lord, or when transiting Guru/Sani contact it."
    )
    return ta, en


_TRANSIT_SOURCE_PLANETS = ("MARS", "JUPITER", "SATURN", "RAHU", "KETU")

# Implication + traditional remedy for a transiting planet currently contacting a
# natal planet (conjunction or special drishti). Used to answer "what does this
# actually mean for me" instead of a bare house-number list (issue #3/#2).
_TRANSIT_EFFECT: dict[str, ChartExplanationText] = {
    "MARS": _bi(
        "விரைவு, துணிவு, சில நேரம் மோதலைத் தூண்டும்; அவசர முடிவுகளைத் தவிர்த்து, ஒழுங்கான உடல் செயல்பாட்டின் மூலம் இந்த ஆற்றலைச் செலவிடுவது நல்லது",
        "adds urgency and drive, sometimes friction; channel it through disciplined action rather than impulsive decisions",
    ),
    "JUPITER": _bi(
        "வளர்ச்சி, வாய்ப்பு, ஆசீர்வாதத்தைக் கொண்டு வரும்; இந்தக் காலத்தை கற்றல் மற்றும் விரிவாக்கத்திற்குப் பயன்படுத்தலாம்",
        "brings growth, opportunity, and blessings; a good window to learn, expand, or seek guidance in this area",
    ),
    "SATURN": _bi(
        "பொறுப்பையும் சோதனையையும் கொண்டு வரும்; வேகமாக இல்லாமல் பொறுமையுடன் அணுகினால் நீடித்த பலன் கிடைக்கும்",
        "brings responsibility and testing; a slower, patient approach here holds up better than pushing for quick results",
    ),
    "RAHU": _bi(
        "ஆசையையும் திடீர் மாற்றத்தையும் பெரிதாக்கும்; குறுக்குவழிகளைத் தவிர்த்து தெளிவான இலக்குடன் செயல்படுவது நல்லது",
        "amplifies desire and sudden change; stay grounded and avoid shortcuts in this area while it lasts",
    ),
    "KETU": _bi(
        "பற்றின்மையையும் உள்முக சிந்தனையையும் தூண்டும்; இந்த விஷயத்தில் தெளிவின்மை தோன்றினால் அவசரப்படாமல் இருப்பது நல்லது",
        "brings detachment and inward focus; if this area feels unclear right now, avoid forcing a decision",
    ),
}
# English weekday names for the natal remedy line. The catalog's own `day` field
# is Tamil display free-text (RAHU's is "ராகு காலம் (தினமும்)", a daily window
# rather than a weekday), so it cannot be reused for the English string.
_REMEDY_WEEKDAY_EN: dict[str, str] = {
    "SUN": "Sunday",
    "MOON": "Monday",
    "MARS": "Tuesday",
    "MERCURY": "Wednesday",
    "JUPITER": "Thursday",
    "VENUS": "Friday",
    "SATURN": "Saturday",
    "RAHU": "during the daily Rahu Kalam window",
    "KETU": "Saturday",
}


def _natal_remedy_text(graha: str, stage: str) -> ChartExplanationText | None:
    """This graha's OWN classical support — keyed to the natal planet, not to
    whatever happens to be transiting it.

    The facet used to carry ``_TRANSIT_REMEDY[transiting_source]``, so a chart
    where transiting Guru touched three natal planets showed the identical
    Thursday/Vishnu/yellow remedy on all three cards, labelled as each planet's
    "traditional support". Two consequences, both bad: the remedy silently
    changed as the sky moved, and it was never that graha's remedy in the first
    place. Keyed to the natal graha it is stable across dates and correct by
    construction — which is also what the weekly-remedies card already does
    (web deriveWeeklyRemedies, fixed 2026-07-22); the two now agree.

    For a minor the same remedy is addressed to the parents, who are the only
    people who can actually perform it.
    """
    remedy = PLANET_REMEDY_CATALOG.get(graha)
    if remedy is None:
        return None
    lead_ta, lead_en = remedy_lead_in_for_stage(stage)
    prefix_ta = f"{lead_ta} " if lead_ta else ""
    prefix_en = f"{lead_en} " if lead_en else ""
    day_en = _REMEDY_WEEKDAY_EN.get(graha, "")
    on_day_en = day_en if day_en.startswith("during") else f"on {day_en}"
    return _bi(
        (
            f"{prefix_ta}{planet_ta(graha)} பரிகாரம் — {remedy.day} அன்று "
            f"{remedy.daanam_items_ta} தானம், \"{remedy.mantra_seed}\" ஜபம். "
            f"{remedy.seva_ta}"
        ),
        (
            f"{prefix_en}Support for {planet_en(graha)} — {remedy.daanam_items_en.lower()} "
            f"daanam {on_day_en}, with the \"{remedy.mantra_seed}\" seed mantra. {remedy.seva_en}"
        ),
    )


# ── Graha yuddham (planetary war) ────────────────────────────────────────────
# The engine has detected this since before the 2026-07-16 audit and charges the
# losing graha -15 in chart_strength.compute_natal_planet_score. It has never
# been NARRATED: no field, no card, no sentence. A reader with two grahas half a
# degree apart saw an unexplained hole in one score and no mention anywhere that
# the chart's tightest conjunction existed. Detection was never the gap.
#
# Stance: detection is tradition-neutral and always on; what varies between
# lineages is how much phala to attach. This layer states the yuddham as an
# extremely tight yuti that colours both grahas, and names the win/loss because
# the score already acts on it — reporting the penalty without its cause is what
# made the number look arbitrary.
def _yuddham_text(
    graha: str, opponent: str, *, lost: bool, separation: float
) -> ChartExplanationText:
    sep_ta = f"{separation:.2f}°"
    if lost:
        return _bi(
            (
                f"{planet_ta(graha)} {planet_ta(opponent)}-உடன் {sep_ta} இடைவெளியில் "
                "மிக நெருக்கமாக நிற்கிறது — இது கிரக யுத்தம். இவ்வளவு நெருக்கத்தில் இரு "
                f"கிரகங்களின் பலனும் ஒன்றோடொன்று கலக்கும்; இங்கு {planet_ta(graha)} "
                "பின்தங்கி நிற்பதால் அதன் தனித்த வெளிப்பாடு மங்குகிறது, "
                f"{planet_ta(opponent)} வழியாகவே அது செயல்படும்."
            ),
            (
                f"{planet_en(graha)} stands just {sep_ta} from {planet_en(opponent)} — a graha "
                "yuddham (planetary war). At this closeness the two significations run through "
                f"each other rather than separately, and {planet_en(graha)} is the trailing "
                f"graha: its own expression is dimmed and tends to reach you through "
                f"{planet_en(opponent)}'s agenda. This is the -15 you can see in the score breakdown."
            ),
        )
    return _bi(
        (
            f"{planet_ta(graha)} {planet_ta(opponent)}-உடன் {sep_ta} இடைவெளியில் "
            "மிக நெருக்கமாக நிற்கிறது — இது கிரக யுத்தம். இங்கு "
            f"{planet_ta(graha)} முன்னிலை பெறுவதால், இரு துறைகளும் இணையும் இடத்தில் "
            "இதன் தன்மையே மேலோங்கி நிற்கும்."
        ),
        (
            f"{planet_en(graha)} stands just {sep_ta} from {planet_en(opponent)} — a graha "
            f"yuddham (planetary war) in which {planet_en(graha)} leads. Where the two areas of "
            "life meet, this graha's character is the one that sets the terms."
        ),
    )


@dataclass(frozen=True, slots=True)
class _TransitContact:
    source: str
    aspect_house: int
    signal_type: str
    rank: int


# Contact ranking ladder — lower is reported first.
#
# Before this existed the reporting rule was "a conjunction if there is one,
# otherwise whatever came first in _TRANSIT_SOURCE_PLANETS order" — which is
# Mars, always, whenever Mars aspected anything. The ladder puts the classical
# weight in the order a jyotishi would state it, so the one line a card has room
# for is the one worth having.
_RANK_RETURN = 0        # the graha is back over its own natal sign (Guru/Sani return)
_RANK_CONJUNCTION = 1   # a different slow graha sits on it
_RANK_SLOW_SPECIAL = 2  # Guru 5/9, Sani 3/10 — the two that classically decide a period
_RANK_MARS_SPECIAL = 3  # Sevvai 4/8
_RANK_SEVENTH = 4       # standard opposition
_RANK_NODAL = 5         # Rahu/Ketu — ranked last, they aspect very widely

_SLOW_SPECIAL_SOURCES = frozenset({"JUPITER", "SATURN"})
_NODE_SOURCES = frozenset({"RAHU", "KETU"})
_OPPOSITE_NODE = {"RAHU": "KETU", "KETU": "RAHU"}

# How many contacts a planet card reports. One was too few to be honest (a
# Sani return was being hidden behind a Guru aspect); all of them is a list
# nobody reads.
_MAX_REPORTED_CONTACTS = 2


def _contact_rank(source: str, aspect_house: int, is_return: bool) -> int:
    if is_return:
        return _RANK_RETURN
    if aspect_house == 1:
        return _RANK_CONJUNCTION
    if source in _NODE_SOURCES:
        return _RANK_NODAL
    if aspect_house == 7:
        return _RANK_SEVENTH
    if source in _SLOW_SPECIAL_SOURCES:
        return _RANK_SLOW_SPECIAL
    return _RANK_MARS_SPECIAL


def _planet_transit_contacts(
    natal_planet: PlanetPosition,
    transit_bodies: dict[str, object],
) -> list[_TransitContact]:
    """Current gochar contacts on this natal planet's sign, strongest first.

    Computed for every planet, not just the active dasha/bhukti/antaram lords,
    so the position explanation can state real current contact (issue #2).

    The self-contact case used to be skipped outright (``if source ==
    natal_planet.graha: continue``), which silently deleted the single most
    important transit a chart can have: a graha returning to its own natal sign.
    Transiting Guru sitting on natal Guru, or Sani on natal Sani, produced NO
    transit line at all, while a distant Mars aspect on another planet produced
    one — so the cards that most deserved a transit note were the ones that had
    none. Reported here as its own top-ranked ``TRANSIT_RETURN`` signal.
    """
    contacts: list[_TransitContact] = []
    for source in _TRANSIT_SOURCE_PLANETS:
        body = transit_bodies.get(source)
        if body is None:
            continue
        aspect_house = house_from_reference(body.rasi, natal_planet.rasi)
        is_return = source == natal_planet.graha and aspect_house == 1
        if source == natal_planet.graha and not is_return:
            # A graha's own drishti back onto its natal sign is a geometric
            # artefact of where it currently stands, not a contact anyone reads.
            continue
        # A node opposing the OTHER natal node is true by construction — the
        # axis is 180° in both the natal and the transit frame, so this fires
        # exactly when the same node's own return fires and adds nothing to it.
        # Reported, it reads as an insight the engine found; it is arithmetic.
        if (
            source in _NODE_SOURCES
            and natal_planet.graha == _OPPOSITE_NODE[source]
            and aspect_house == 7
        ):
            continue
        if is_return or aspect_house == 1 or aspect_house in aspect_houses(source):
            contacts.append(
                _TransitContact(
                    source=source,
                    aspect_house=aspect_house,
                    signal_type="TRANSIT_RETURN" if is_return else (
                        "TRANSIT_CONJUNCTION" if aspect_house == 1
                        else f"TRANSIT_ASPECT_{aspect_house}TH"
                    ),
                    rank=_contact_rank(source, aspect_house, is_return),
                )
            )
    contacts.sort(key=lambda c: (c.rank, c.source))
    return contacts


def _contact_verb(contact: _TransitContact) -> tuple[str, str]:
    if contact.signal_type == "TRANSIT_RETURN":
        return (
            "தனது சொந்த பிறப்பு ராசிக்கே திரும்பி வந்துள்ளது",
            "has come back onto its own natal sign",
        )
    if contact.signal_type == "TRANSIT_CONJUNCTION":
        return "இணைந்து நிற்கிறது", "is conjunct with this planet"
    return (
        f"{contact.aspect_house}-ஆம் பார்வையில் பார்க்கிறது",
        f"aspects this planet by its {contact.aspect_house}th-house drishti",
    )


def _contact_clause(contact: _TransitContact) -> tuple[str, str]:
    verb_ta, verb_en = _contact_verb(contact)
    effect = _TRANSIT_EFFECT[contact.source]
    if contact.signal_type == "TRANSIT_RETURN":
        # A return is the graha's own cycle closing, so it is described as the
        # planet's theme coming round again rather than an outside influence.
        return (
            f"கோசார {planet_ta(contact.source)} {verb_ta}; அதன் சுழற்சி ஒன்று முடிந்து "
            f"புதிதாகத் தொடங்குகிறது — இது {effect.ta}",
            f"Transiting {planet_en(contact.source)} {verb_en}, closing one full cycle and "
            f"beginning another; this {effect.en}",
        )
    return (
        f"கோசார {planet_ta(contact.source)} இதை {verb_ta}; இது {effect.ta}",
        f"Transiting {planet_en(contact.source)} {verb_en}; this {effect.en}",
    )


def _planet_transit_contact_text(contacts: list[_TransitContact]) -> ChartExplanationText | None:
    if not contacts:
        return None
    clauses = [_contact_clause(c) for c in contacts[:_MAX_REPORTED_CONTACTS]]
    ta = "கவனிக்க: " + ". ".join(c[0] for c in clauses) + "."
    en = "Right now: " + ". ".join(c[1] for c in clauses) + "."
    return _bi(ta, en)


def _split_transit_contact(
    contacts: list[_TransitContact],
) -> tuple[ChartExplanationText | None, int]:
    """(what the transits are doing, how many contacts were not shown).

    Facets render the contact on its own labelled line. The remedy is no longer
    returned alongside it — see ``_natal_remedy_text``: keying a graha's
    "traditional support" to whichever planet happens to be transiting it meant
    the remedy silently changed as the sky moved while being presented as the
    planet's own classical support.
    """
    if not contacts:
        return None, 0
    clauses = [_contact_clause(c) for c in contacts[:_MAX_REPORTED_CONTACTS]]
    return (
        _bi(
            ". ".join(c[0] for c in clauses) + ".",
            ". ".join(c[1] for c in clauses) + ".",
        ),
        max(0, len(contacts) - _MAX_REPORTED_CONTACTS),
    )


def _planet_explanation(
    planet: PlanetPosition,
    dignity: str,
    functional_nature: str,
    *,
    current_role: str | None,
    dasha_chain_ta: str,
    dasha_chain_en: str,
    transit_contact_text: ChartExplanationText | None = None,
    stage: str = STAGE_ADULT,
) -> ChartExplanationText:
    dignity_text = _dignity_text(dignity)
    theme = _house_theme(planet.house_from_lagna, stage)
    fn_context_ta = _functional_context_ta(functional_nature, planet.graha)
    fn_context_en = _functional_context_en(functional_nature, planet.graha)
    period_ta, period_en = _current_period_text(current_role, dasha_chain_ta, dasha_chain_en)
    contact_ta = f" {transit_contact_text.ta}" if transit_contact_text else ""
    contact_en = f" {transit_contact_text.en}" if transit_contact_text else ""
    # Cazimi (heart of the Sun) — a verified strength override: it lifts the
    # combustion penalty, so the "Why" text names the reason the planet reads
    # strong. Mutually exclusive with combustion (see transits.is_cazimi).
    cazimi_ta = (
        " இந்த கிரகம் சூரியனின் இதயத்தில் (கசிமி) அமைந்துள்ளது — எரிப்பு (அஸ்தமன) தோஷம் நீங்கி, மாறாக பலம் பெற்றதாகக் கணிக்கப்படுகிறது."
        if getattr(planet, "is_cazimi", False)
        else ""
    )
    cazimi_en = (
        " This planet is cazimi (in the heart of the Sun): the usual combustion penalty is lifted and it is read as strengthened, not weakened."
        if getattr(planet, "is_cazimi", False)
        else ""
    )
    ta = (
        f"{planet_ta(planet.graha)} உங்கள் ஜாதகத்தில் {planet.house_from_lagna}ஆம் வீட்டில் நிற்கிறது; "
        f"அதனால் {theme.ta} துறை இயல்பாக கவனத்திற்கு வருகிறது. "
        f"{dignity_text.ta} {fn_context_ta}. {period_ta}{contact_ta}{cazimi_ta}"
    )
    en = (
        f"{planet_en(planet.graha)} stands in house {planet.house_from_lagna}, so the chart naturally draws attention to {theme.en}. "
        f"{dignity_text.en} In functional terms it is {fn_context_en}. {period_en}{contact_en}{cazimi_en}"
    )
    return _bi(ta, en)


# Functional-nature copy, shared by the single-paragraph explanation and the
# per-facet "role" line so the two can never drift apart.
_FUNCTIONAL_CONTEXT_TA: dict[str, str] = {
    "YOGAKARAKA": "இது யோககாரகன்; சரியான காலத்தில் நன்மையைத் தெளிவாகத் திறக்கும் கிரகம்",
    "LAGNA_LORD": "இது லக்ன அதிபதி; வாழ்க்கை திசையையும் உட்புற உந்துதலையும் வடிவமைக்கிறது",
    "TRIKONA": "இது திரிகோண அதிபதி; புண்ணியம், திறமை, வளர்ச்சி வழிகளைத் தொடுகிறது",
    "KENDRA": "இது கேந்திர அதிபதி; வெளிப்படையான செயல் மற்றும் பொறுப்பை இயக்குகிறது",
    "DUSTHANA": "இது துஷ்டான அதிபதி; இந்த வீட்டின் விஷயங்களில் ஒழுங்கும் கவனமும் தேவை",
    "MARAKA": "இது மாரக அதிபதி; கட்டுப்பாட்டுடனும் அளவுடனும் அணுகுவது நல்லது",
    "NEUTRAL": "இது நடுநிலை கிரகம்; லக்னத்திற்கு நல்லது-கெட்டது இரண்டையும் சூழ்நிலைக்கு ஏற்ப தரும்",
}
_FUNCTIONAL_CONTEXT_EN: dict[str, str] = {
    "YOGAKARAKA": "a Yogakaraka for this chart, able to open favourable results in the right period",
    "LAGNA_LORD": "the Lagna lord, shaping life direction and inner drive",
    "TRIKONA": "a Trikona lord, linked with grace, talent, and growth",
    "KENDRA": "a Kendra lord, governing visible action and responsibility",
    "DUSTHANA": "a Dusthana lord, asking for care and discipline in its matters",
    "MARAKA": "a Maraka lord, best handled with restraint and proportion",
    "NEUTRAL": "a neutral planet that gives mixed results for this Lagna depending on context",
}


# Rahu and Ketu own no rasi, so they can never be a "lord" of anything. Their
# functional nature is derived from their dispositor and the house they occupy
# (see functional_nature._node_functional_nature) — a real and defensible
# reading, but describing the result as "a Dusthana lord" asserts a lordship
# Parashari does not grant them. These phrasings say *occupies* and *acts
# through*, which is what the engine actually computed. Flagged in the
# 2026-07-18 astrologer review.
_NODE_FUNCTIONAL_CONTEXT_TA: dict[str, str] = {
    "YOGAKARAKA": "இது எந்த ராசிக்கும் அதிபதி இல்லாத சாயா கிரகம்; ஆனால் யோககாரக பலம் உள்ள இடத்தில் அமர்ந்து அந்த பலனை வலுப்படுத்துகிறது",
    "LAGNA_LORD": "இது எந்த ராசிக்கும் அதிபதி இல்லாத சாயா கிரகம்; லக்ன அதிபதியின் வழியாக செயல்பட்டு வாழ்க்கை திசையைத் தொடுகிறது",
    "TRIKONA": "இது எந்த ராசிக்கும் அதிபதி இல்லாத சாயா கிரகம்; திரிகோண ஸ்தானத்தில் அமர்ந்து புண்ணிய, வளர்ச்சி துறைகளைத் தொடுகிறது",
    "KENDRA": "இது எந்த ராசிக்கும் அதிபதி இல்லாத சாயா கிரகம்; கேந்திர ஸ்தானத்தில் அமர்ந்து வெளிப்படையான செயல்பாட்டைத் தொடுகிறது",
    "DUSTHANA": "இது எந்த ராசிக்கும் அதிபதி இல்லாத சாயா கிரகம்; துஷ்டான ஸ்தானத்தில் அமர்ந்திருப்பதால் அந்த துறையில் ஒழுங்கும் கவனமும் தேவை",
    "MARAKA": "இது எந்த ராசிக்கும் அதிபதி இல்லாத சாயா கிரகம்; மாரக ஸ்தானத்தில் அமர்ந்திருப்பதால் கட்டுப்பாட்டுடன் அணுகுவது நல்லது",
    "NEUTRAL": "இது எந்த ராசிக்கும் அதிபதி இல்லாத சாயா கிரகம்; அது அமர்ந்த வீடு மற்றும் அந்த வீட்டு அதிபதியின் வழியே பலன் தருகிறது",
}
_NODE_FUNCTIONAL_CONTEXT_EN: dict[str, str] = {
    "YOGAKARAKA": "a shadow graha that owns no sign; it sits with Yogakaraka strength and amplifies that result rather than ruling it",
    "LAGNA_LORD": "a shadow graha that owns no sign; it acts through the Lagna lord and colours life direction",
    "TRIKONA": "a shadow graha that owns no sign; it occupies a Trikona house, touching grace, talent, and growth",
    "KENDRA": "a shadow graha that owns no sign; it occupies a Kendra house, touching visible action and responsibility",
    "DUSTHANA": "a shadow graha that owns no sign; it occupies a Dusthana house, so those matters ask for care and discipline",
    "MARAKA": "a shadow graha that owns no sign; it occupies a Maraka house, best handled with restraint and proportion",
    "NEUTRAL": "a shadow graha that owns no sign; it delivers through the house it occupies and that house's lord",
}

_NODES: frozenset[str] = frozenset({"RAHU", "KETU"})


def _functional_context_ta(functional_nature: str, planet: str | None = None) -> str:
    table = _NODE_FUNCTIONAL_CONTEXT_TA if planet in _NODES else _FUNCTIONAL_CONTEXT_TA
    return table.get(
        functional_nature,
        "இந்த கிரகத்தின் பலன் அதன் வீடு, பலம், பார்வை ஆகியவற்றோடு சேர்ந்து இயங்குகிறது",
    )


def _functional_context_en(functional_nature: str, planet: str | None = None) -> str:
    table = _NODE_FUNCTIONAL_CONTEXT_EN if planet in _NODES else _FUNCTIONAL_CONTEXT_EN
    return table.get(
        functional_nature,
        "a planet whose role is read together with its house, strength, and aspects",
    )


_FACET_LABELS: dict[str, ChartExplanationText] = {
    "placement": _bi("இப்போதைய நிலை", "Where it sits"),
    "role": _bi("ஜாதகத்தில் பங்கு", "Its role in your chart"),
    "strength": _bi("பலம்", "How strong it is"),
    "condition": _bi("சிறப்பு நிலை", "What to work with"),
    "navamsa": _bi("நவாம்ச நிலை", "In the Navamsa (D9)"),
    "activation": _bi("இப்போது இயங்குகிறதா", "Active right now?"),
    "nakshatra": _bi("நட்சத்திர அதிபதி", "Its star lord"),
    "transit": _bi("நடப்பு கோசாரம்", "Current transit"),
    "remedy": _bi("பரிகாரம்", "Traditional support"),
    "lordship": _bi("அதிபதி நிலை", "What it rules, and from where"),
    "company": _bi("உடன் இருப்பவை", "Shares its house with"),
    "synthesis": _bi("இணைத்துப் பார்த்தால்", "Putting it together"),
}


def _ordinal_en(n: int) -> str:
    if 10 <= n % 100 <= 20:
        return f"{n}th"
    return f"{n}{ {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th') }"


def _lordship_facet_value(
    planet: PlanetPosition,
    owned_houses: list[int],
    stage: str,
) -> ChartExplanationText | None:
    """Bhavat-bhavam: what this graha rules, read THROUGH where it sits.

    Rahu and Ketu own no rasi, so they get no line here — asserting a lordship
    Parashari does not grant them is the same error the functional-nature copy
    was corrected for in the 2026-07-18 review.
    """
    if not owned_houses:
        return None
    sitting = planet.house_from_lagna
    sitting_theme = _house_theme(sitting, stage)
    # A graha standing in a house it OWNS is the swakshetra case, and it breaks
    # the bhavat-bhavam sentence: "matters of rest and retreat pass through rest
    # and retreat" is circular, which is what the first draft emitted. Those
    # houses are stated separately, as running on the graha's own terms.
    elsewhere = [h for h in owned_houses if h != sitting]
    owns_its_seat = sitting in owned_houses

    own_seat_ta = (
        f"தான் ஆளும் {sitting}-ஆம் வீட்டிலேயே அமர்ந்துள்ளது; அந்த வீட்டின் விஷயங்கள் "
        "இதன் சொந்த இயல்பிலேயே நடக்கும்."
        if owns_its_seat
        else ""
    )
    own_seat_en = (
        f"It sits in the {_ordinal_en(sitting)}, a house it rules itself, so those matters "
        "run directly on its own terms."
        if owns_its_seat
        else ""
    )

    if not elsewhere:
        return _bi(own_seat_ta, own_seat_en)

    # Semicolons, not commas: each house theme is itself a comma-separated list,
    # so joining them with commas produced unreadable soup.
    themes_ta = "; ".join(_house_theme(h, stage).ta for h in elsewhere)
    themes_en = "; ".join(_house_theme(h, stage).en for h in elsewhere)
    owned_ta = ", ".join(f"{h}-ஆம்" for h in elsewhere)
    owned_en = _graha_list_en([_ordinal_en(h) for h in elsewhere])
    house_word = "house" if len(elsewhere) == 1 else "houses"

    lead_ta = f"{own_seat_ta} " if own_seat_ta else ""
    lead_en = f"{own_seat_en} " if own_seat_en else ""
    return _bi(
        (
            f"{lead_ta}{owned_ta} வீட்டுக்கும் அதிபதி; {sitting}-ஆம் வீட்டில் "
            f"அமர்ந்திருப்பதால் {themes_ta} — இவை {sitting_theme.ta} வழியாகவே நடைபெறும்."
        ),
        (
            f"{lead_en}As lord of the {owned_en} {house_word} placed in the "
            f"{_ordinal_en(sitting)}, matters of {themes_en} pass through {sitting_theme.en}."
        ),
    )

# Bilingual labels for the score-derivation rows. The engine owns the arithmetic
# and the machine keys; copy lives here, as everywhere else in this layer.
_SCORE_TERM_LABELS: dict[str, ChartExplanationText] = {
    "sthana": _bi("ஸ்தான பலம் (ராசி + வீடு)", "Sthana bala (sign + house)"),
    "dik": _bi("திக் பலம் (திசை)", "Dik bala (direction)"),
    "kala": _bi("கால பலம் (நேரம்)", "Kala bala (time of birth)"),
    "chesta": _bi("சேஷ்டா பலம் (இயக்கம்)", "Chesta bala (motion)"),
    "naisargika": _bi("நைசர்கிக பலம் (இயற்கை)", "Naisargika bala (natural rank)"),
    "drik": _bi("திருக் பலம் (பார்வை)", "Drik bala (aspects received)"),
    "vargottama": _bi("வர்கோத்தமம்", "Vargottama"),
    "d9_dignified": _bi("நவாம்சத்தில் பலம்", "Dignified in Navamsa"),
    "d9_debilitated": _bi("நவாம்சத்தில் நீசம்", "Debilitated in Navamsa"),
    "cazimi": _bi("கசிமி (சூரியனின் இதயம்)", "Cazimi (heart of the Sun)"),
    "combustion": _bi("அஸ்தங்கம் (எரிப்பு)", "Combustion"),
    "sandhi": _bi("ராசி சந்தி (விளிம்பு)", "Rasi sandhi (sign edge)"),
    "gandanta": _bi("கண்டாந்தம்", "Gandanta"),
    "planetary_war": _bi("கிரக யுத்தம்", "Graha yuddham"),
    "synthesis_functional": _bi("செயல்பாட்டு அதிபதித்துவம்", "Functional lordship"),
    "synthesis_yuti": _bi("சேர்க்கை (யுதி)", "Company it keeps (yuti)"),
    "synthesis_drishti": _bi("பார்வை தரம்", "Quality of aspects"),
    "synthesis_bhanga": _bi("நீச பங்கம்", "Neecha bhanga"),
    "clamp": _bi("வரம்பு / முழுமையாக்கல்", "Rounding and 10-95 limit"),
}


def _score_term_detail(detail_key: str | None, value: str | None) -> ChartExplanationText | None:
    """Bilingual rendering of an engine detail token."""
    if detail_key is None:
        return None
    if detail_key == "house":
        return _bi(f"{value}-ஆம் வீடு", f"house {value}")
    if detail_key == "retrograde":
        return _bi("வக்ர கதி இங்கே கணக்கில் வருகிறது", "retrogression is credited here")
    if detail_key == "aspect_counts":
        benefic, _, malefic = (value or "0/0").partition("/")
        return _bi(
            f"{benefic} சுப, {malefic} பாப பார்வைகள்",
            f"{benefic} benefic / {malefic} malefic aspects",
        )
    if detail_key == "orb_severity_pct":
        return _bi(
            f"முழு எரிப்பு எல்லையில் {value}% தீவிரம்",
            f"{value}% of the full combustion weight",
        )
    if detail_key == "degree_in_sign":
        return _bi(f"ராசியில் {value}°", f"{value}° into the sign")
    if detail_key == "lost_to":
        graha = value or ""
        return _bi(f"{planet_ta(graha)}-இடம் தோற்றது", f"lost to {planet_en(graha)}")
    return None


def _score_breakdown(planet: PlanetPosition) -> list[ChartExplanationScoreTerm]:
    """The planet's score, itemised. Empty when the chart predates score terms."""
    return [
        ChartExplanationScoreTerm(
            key=term.key,
            label=_SCORE_TERM_LABELS.get(
                term.key, _bi(term.key, term.key.replace("_", " ").title())
            ),
            points=round(term.points, 1),
            detail=_score_term_detail(term.detail_key, term.detail_value),
        )
        for term in getattr(planet, "score_terms", []) or []
    ]


def _navamsa_facet_value(planet: PlanetPosition) -> tuple[ChartExplanationText | None, str]:
    """The planet's Navamsa (D9) standing, as its own always-on line.

    D9 dignity used to surface only through `_condition_facet_value`, which is a
    priority chain: cazimi, then D9 debilitation, then combustion, then
    retrogression, then vargottama, then D9 dignity — one winner only. That meant
    a combust planet never showed its Navamsa standing at all, even though the
    classical question "does this graha actually deliver?" is answered largely in
    the D9, and a combust planet is exactly the case where a reader needs it.
    Raised in the 2026-07-18 astrologer review.

    Kept separate from the condition facet rather than folded into it, so the two
    can both appear: "burnt by the Sun" and "but vargottama in Navamsa" are
    complementary facts, not competing ones.
    """
    d9_rasi = getattr(planet, "d9_rasi", None)
    if d9_rasi is None:
        return None, "NEUTRAL"

    d9_name = RASI_NAMES.get(d9_rasi, str(d9_rasi))
    tier = d9_dignity_tier(planet.graha, d9_rasi)

    if planet.is_vargottama:
        return (
            _bi(
                f"நவாம்சத்திலும் அதே {d9_name} ராசி — வர்கோத்தமம். ராசியில் தெரியும் பலன் "
                "நவாம்சத்திலும் உறுதிப்படுகிறது; இது நிலைத்தன்மையைக் குறிக்கும்.",
                f"Same sign ({d9_name}) in the Navamsa — vargottama. What the Rasi chart "
                "promises is confirmed in the D9, which points to stability and follow-through.",
            ),
            "BOOST",
        )
    if tier > 0:
        return (
            _bi(
                f"நவாம்சத்தில் {d9_name} — வலுவான நிலை. ராசியில் உள்ள வாக்குறுதி "
                "நவாம்சத்தில் ஆதரவு பெறுகிறது; பலன் முழுமையாக வெளிப்பட வாய்ப்பு உண்டு.",
                f"In the Navamsa it occupies {d9_name}, a dignified position. The Rasi promise "
                "is supported in the D9, so its results have a better chance of arriving in full.",
            ),
            "BOOST",
        )
    if tier < 0:
        return (
            _bi(
                f"நவாம்சத்தில் {d9_name} — நீச நிலை. ராசியில் வலுவாகத் தெரிந்தாலும் "
                "நவாம்சம் அதை ஆதரிக்கவில்லை; பலன் தாமதமாகவோ குறைவாகவோ வரலாம். "
                "வெளித்தோற்றத்தில் பலமாகத் தெரிந்தாலும், பலன் தரும்போது முழுமையாக "
                "நிற்காத நிலை இது.",
                f"In the Navamsa it falls in {d9_name}, a debilitated position. Even where the "
                "Rasi chart looks strong, the D9 does not back it — results can arrive late or "
                "partially. This is the classical 'strong in name, weak in effect' case.",
            ),
            "CAUTION",
        )
    return (
        _bi(
            f"நவாம்சத்தில் {d9_name} — நடுநிலை. ராசி நிலையை நவாம்சம் கூட்டவும் இல்லை, குறைக்கவும் இல்லை.",
            f"In the Navamsa it occupies {d9_name}, a neutral placement — the D9 neither "
            "strengthens nor undercuts what the Rasi chart shows.",
        ),
        "NEUTRAL",
    )


@dataclass(frozen=True, slots=True)
class _ConditionState:
    """One special condition holding on a planet, with its direction."""

    key: str
    ta: str
    en: str
    polarity: int  # +1 strengthening, -1 restraining, 0 descriptive


_SANDHI_MEANING: tuple[str, str] = (
    "ராசியின் விளிம்பில் (சந்தி) அமர்ந்துள்ளது — இதன் விஷயங்கள் ஒரு நிலையிலிருந்து "
    "இன்னொரு நிலைக்கு மாறும் கட்டத்தில் உள்ளன; பலன் முழுமையாக நிலைபெற நேரம் எடுக்கும்.",
    "It sits right at the edge of its sign (sandhi) — its themes are in transition between one "
    "sign's terms and the next, so results here settle later than the placement alone suggests.",
)


def _planet_condition_states(
    planet: PlanetPosition,
    *,
    minor: bool,
    war_opponent: str | None,
    war_lost: bool,
    war_separation: float,
) -> list[_ConditionState]:
    """EVERY special condition holding on this planet, not just the top one.

    This used to be a single-winner priority chain: cazimi, else D9-neecha, else
    combustion, else retrogression, else vargottama, else D9 dignity — first
    match returned, rest discarded. A combust AND retrograde Mercury therefore
    reported combustion only, and a reader was never told about the retrogression
    that the score had already acted on. Conditions genuinely compose (a planet
    can be own-sign, combust and retrograde at once), so they are all collected
    and the caller decides how to say them together.

    Cazimi still SUPPRESSES combustion rather than sitting beside it — those two
    are mutually exclusive by definition, not merely co-occurring.
    """
    graha = planet.graha
    states: list[_ConditionState] = []

    is_cazimi_planet = bool(getattr(planet, "is_cazimi", False))
    if is_cazimi_planet:
        states.append(_ConditionState("cazimi", *CAZIMI_MEANING, polarity=1))

    if war_opponent is not None:
        war = _yuddham_text(graha, war_opponent, lost=war_lost, separation=war_separation)
        states.append(
            _ConditionState(
                "planetary_war", war.ta, war.en, polarity=-1 if war_lost else 1
            )
        )

    if planet.is_combust and not is_cazimi_planet:
        ta, en = combust_meaning(graha, minor=minor)
        if ta:
            states.append(_ConditionState("combust", ta, en, polarity=-1))

    if planet.is_retrograde:
        ta, en = retrograde_meaning(graha, minor=minor)
        if ta:
            # Retrogression is not a penalty here — Chesta Bala already rewards
            # it. Descriptive, so a mixed reading does not treat it as a flaw.
            states.append(_ConditionState("retrograde", ta, en, polarity=0))

    deg_in_sign = planet.absolute_longitude % 30
    if deg_in_sign <= 1.0 or deg_in_sign >= 29.0:
        # Scored (-8 in chart_strength) since long before it was ever said out
        # loud. It is frequently the entire reason an otherwise-dignified graha
        # lands mid-scale, which made the number look wrong.
        states.append(_ConditionState("sandhi", *_SANDHI_MEANING, polarity=-1))

    d9_rasi = getattr(planet, "d9_rasi", None)
    tier = d9_dignity_tier(graha, d9_rasi) if d9_rasi is not None else 0
    if planet.is_vargottama:
        states.append(_ConditionState("vargottama", *VARGOTTAMA_MEANING, polarity=1))
    elif tier < 0:
        states.append(_ConditionState("d9_debilitated", *D9_DEBILITATED_MEANING, polarity=-1))
    elif tier > 0:
        states.append(_ConditionState("d9_dignified", *D9_DIGNIFIED_MEANING, polarity=1))

    return states


def _condition_facet_value(
    states: list[_ConditionState],
) -> tuple[ChartExplanationText | None, str]:
    """All applicable conditions in one line, with an overall tone."""
    if not states:
        return None, "NEUTRAL"
    net = sum(s.polarity for s in states)
    tone = "BOOST" if net > 0 else ("CAUTION" if net < 0 else "NEUTRAL")
    return _bi(" ".join(s.ta for s in states), " ".join(s.en for s in states)), tone


# ── Contradiction synthesis ─────────────────────────────────────────────────
# When strengthening and restraining factors both hold, a reading must NAME the
# disagreement rather than average it away into "moderate" — the same doctrine
# app/reasoning/contradiction.py already applies to promise-vs-timing, applied
# here at planet altitude. Four disconnected facts ("own sign", "combust",
# "8th house", "exalted in Navamsa") are data; the sentence that puts them in
# tension is the reading.
#
# Template: [dignity], but [restraint], [outlet].
_STRONG_DIGNITIES = frozenset({"EXALTED", "MOOLATRIKONA", "OWN_SIGN"})
_WEAK_DIGNITIES = frozenset({"DEBILITATED", "ENEMY_SIGN"})

_DIGNITY_CLAUSE: dict[str, tuple[str, str]] = {
    "EXALTED": ("உச்சம் பெற்று அடிப்படையில் மிகவும் வலுவாக உள்ளது", "is exalted and fundamentally very strong"),
    "MOOLATRIKONA": ("மூலத்திரிகோணத்தில் அமர்ந்து தெளிவான பலத்துடன் உள்ளது", "sits in its Moolatrikona with focused strength"),
    "OWN_SIGN": ("சொந்த ராசியில் அமர்ந்து அடிப்படையில் வலுவாக உள்ளது", "is fundamentally strong in its own sign"),
    "DEBILITATED": ("நீச ராசியில் அமர்ந்து அடிப்படை ஆதரவு குறைவாக உள்ளது", "is debilitated and starts from little natural support"),
    "ENEMY_SIGN": ("பகை ராசியில் அமர்ந்து சூழல் ஒத்துழைக்காத நிலையில் உள்ளது", "sits in an enemy sign, without a cooperative setting"),
}

# The channel a restrained-but-strong graha actually expresses through, by house
# family. This is the "so where does it go" half of the template — without it the
# sentence names a tension and abandons the reader inside it.
_OUTLET_BY_HOUSE: dict[int, tuple[str, str]] = {
    6: ("சேவை, ஒழுங்கான உழைப்பு, தினசரி பயிற்சி வழியாக", "through service, disciplined work and daily practice"),
    8: ("ஆழம், தாங்கும் சக்தி, உள்ளார்ந்த மாற்றம் வழியாக", "through depth, endurance and transformation rather than open action"),
    12: ("தனிமை, ஆய்வு, உள்முக பயிற்சி வழியாக", "through solitude, study and inward practice"),
}


def _synthesis_facet_value(
    planet: PlanetPosition,
    dignity: str,
    states: list[_ConditionState],
    stage: str = STAGE_ADULT,
) -> tuple[ChartExplanationText | None, str]:
    """The one sentence that reconciles this planet's competing signals."""
    restraints = [s for s in states if s.polarity < 0]
    supports = [s for s in states if s.polarity > 0]
    strong_dignity = dignity in _STRONG_DIGNITIES
    weak_dignity = dignity in _WEAK_DIGNITIES

    # Nothing pulls against anything — the individual facets already say it.
    if not restraints and not (weak_dignity and supports):
        return None, "NEUTRAL"
    if not restraints and not supports:
        return None, "NEUTRAL"

    name_ta, name_en = planet_ta(planet.graha), planet_en(planet.graha)
    dignity_ta, dignity_en = _DIGNITY_CLAUSE.get(
        dignity,
        ("கலந்த ராசி பலத்தில் உள்ளது", "carries mixed sign-strength"),
    )

    restraint_names_ta = _CONDITION_SHORT_TA
    restraint_names_en = _CONDITION_SHORT_EN
    restraint_ta = _graha_list_ta([restraint_names_ta[s.key] for s in restraints]) if restraints else ""
    restraint_en = _graha_list_en([restraint_names_en[s.key] for s in restraints]) if restraints else ""

    theme = _house_theme(planet.house_from_lagna, stage)
    outlet_ta, outlet_en = _OUTLET_BY_HOUSE.get(
        planet.house_from_lagna,
        (f"{theme.ta} துறை வழியாக", f"through {theme.en}"),
    )

    # The closing clause is what stops the sentence reading as a verdict: a D9
    # that backs the Rasi promise says the strength is real and arrives later,
    # which is a materially different reading from the same restraints with an
    # unsupportive Navamsa.
    d9_backs = any(s.key in {"vargottama", "d9_dignified"} for s in supports)
    if d9_backs:
        closing_ta = "நவாம்சம் இதை ஆதரிப்பதால் இந்த பலம் உண்மையானது — காலப்போக்கில் முதிர்ந்து வெளிப்படும்."
        closing_en = "The Navamsa backs it, so the strength is real and matures with time."
    elif any(s.key == "d9_debilitated" for s in states):
        closing_ta = "நவாம்சம் இதை ஆதரிக்காததால், வெளித்தோற்ற பலத்தை நம்பாமல் தொடர் முயற்சி தேவை."
        closing_en = "The Navamsa does not back it, so sustained effort matters more here than the outward promise."
    else:
        closing_ta = "இது ஒரு குறையல்ல — வெளிப்படும் வழி வேறு என்பதே பொருள்."
        closing_en = "This is not a defect in the placement, only a different route out."

    if strong_dignity and restraints:
        ta = f"{name_ta} {dignity_ta}; ஆனால் {restraint_ta} அந்த ஆற்றலை உள்நோக்கித் திருப்புகிறது — அது {outlet_ta} வெளிப்படும். {closing_ta}"
        en = f"{name_en} {dignity_en}, but {restraint_en} turns that force inward — it expresses {outlet_en}. {closing_en}"
        return _bi(ta, en), "NEUTRAL"
    if weak_dignity and supports:
        support_ta = _graha_list_ta([restraint_names_ta[s.key] for s in supports])
        support_en = _graha_list_en([restraint_names_en[s.key] for s in supports])
        ta = f"{name_ta} {dignity_ta}; ஆனால் {support_ta} அதற்குப் பாதுகாப்பு தருகிறது — {outlet_ta} இதன் பலன் வெளிப்படும். {closing_ta}"
        en = f"{name_en} {dignity_en}, yet {support_en} protects it — its results still come {outlet_en}. {closing_en}"
        return _bi(ta, en), "NEUTRAL"
    if restraints:
        ta = f"{name_ta} {dignity_ta}; இதனுடன் {restraint_ta} சேர்வதால், பலன் {outlet_ta} மெதுவாக வெளிப்படும். {closing_ta}"
        en = f"{name_en} {dignity_en}, and with {restraint_en} alongside, its results arrive gradually {outlet_en}. {closing_en}"
        return _bi(ta, en), "CAUTION"
    return None, "NEUTRAL"


# Short noun forms used inside the synthesis sentence — the full condition
# meanings are already their own facet and repeating them there would produce a
# paragraph, not a synthesis.
_CONDITION_SHORT_TA: dict[str, str] = {
    "cazimi": "கசிமி நிலை",
    "planetary_war": "கிரக யுத்தம்",
    "combust": "அஸ்தங்கம்",
    "retrograde": "வக்ர கதி",
    "sandhi": "ராசி சந்தி",
    "vargottama": "வர்கோத்தமம்",
    "d9_debilitated": "நவாம்ச நீசம்",
    "d9_dignified": "நவாம்ச பலம்",
}
_CONDITION_SHORT_EN: dict[str, str] = {
    "cazimi": "cazimi",
    "planetary_war": "the planetary war",
    "combust": "combustion",
    "retrograde": "retrogression",
    "sandhi": "the sign-edge placement",
    "vargottama": "vargottama",
    "d9_debilitated": "Navamsa debilitation",
    "d9_dignified": "its Navamsa dignity",
}


def _planet_facets(
    planet: PlanetPosition,
    dignity: str,
    functional_nature: str,
    *,
    current_role: str | None,
    dasha_chain_ta: str,
    dasha_chain_en: str,
    fn_context_ta: str,
    fn_context_en: str,
    transit_contact_text: ChartExplanationText | None,
    condition_states: list[_ConditionState],
    co_tenants: list[str],
    owned_houses: list[int],
    hidden_contacts: int = 0,
    stage: str = STAGE_ADULT,
    lord_house_by_graha: dict[str, int] | None = None,
) -> list[ChartExplanationFacet]:
    """The reading of one planet, split into labelled lines."""
    theme = _house_theme(planet.house_from_lagna, stage)
    dignity_text = _dignity_text(dignity)
    period_ta, period_en = _current_period_text(current_role, dasha_chain_ta, dasha_chain_en)

    facets: list[ChartExplanationFacet] = [
        ChartExplanationFacet(
            key="placement",
            label=_FACET_LABELS["placement"],
            value=_bi(
                f"{planet.house_from_lagna}ஆம் வீடு, {planet.rasi_name} ராசி — {theme.ta}.",
                f"House {planet.house_from_lagna} in {planet.rasi_name} — {theme.en}.",
            ),
        ),
        ChartExplanationFacet(
            key="role",
            label=_FACET_LABELS["role"],
            value=_bi(f"{fn_context_ta}.", f"It is {fn_context_en}."),
            tone="CAUTION" if functional_nature in {"DUSTHANA", "MARAKA"} else "NEUTRAL",
        ),
        ChartExplanationFacet(
            key="strength",
            label=_FACET_LABELS["strength"],
            value=dignity_text,
            tone={"EXALTED": "BOOST", "MOOLATRIKONA": "BOOST", "OWN_SIGN": "BOOST", "DEBILITATED": "CAUTION"}.get(
                dignity, "NEUTRAL"
            ),
        ),
    ]

    # Bhavat-bhavam: "as 5th lord placed in the 8th, learning and children pass
    # through periods of deep change." The card stated lordship (in `role`) and
    # placement (in `placement`) as two separate facts and never joined them,
    # which is the join a jyotishi makes first. house_lords.py has produced this
    # reading for the Jadhagam report since audit T3 — it simply never reached
    # the planet card.
    lordship = _lordship_facet_value(planet, owned_houses, stage)
    if lordship is not None:
        facets.append(
            ChartExplanationFacet(
                key="lordship",
                label=_FACET_LABELS["lordship"],
                value=lordship,
                tone="CAUTION" if planet.house_from_lagna in _DUSTHANA_HOUSES else "NEUTRAL",
            )
        )

    condition_value, condition_tone = _condition_facet_value(condition_states)
    if condition_value is not None:
        facets.append(
            ChartExplanationFacet(
                key="condition",
                label=_FACET_LABELS["condition"],
                value=condition_value,
                tone=condition_tone,
            )
        )

    if co_tenants:
        facets.append(
            ChartExplanationFacet(
                key="company",
                label=_FACET_LABELS["company"],
                value=_bi(
                    f"{_graha_list_ta([planet_ta(g) for g in co_tenants])} இதே வீட்டில் "
                    f"உடன் நிற்கின்றன; இவற்றின் பலன்கள் ஒன்றோடொன்று கலந்தே வெளிப்படும்.",
                    f"It shares this house with {_graha_list_en([planet_en(g) for g in co_tenants])}; "
                    "their significations arrive mixed together rather than separately.",
                ),
            )
        )

    navamsa_value, navamsa_tone = _navamsa_facet_value(planet)
    if navamsa_value is not None:
        facets.append(
            ChartExplanationFacet(
                key="navamsa",
                label=_FACET_LABELS["navamsa"],
                value=navamsa_value,
                tone=navamsa_tone,
            )
        )

    facets.append(
        ChartExplanationFacet(
            key="activation",
            label=_FACET_LABELS["activation"],
            value=_bi(period_ta, period_en),
            tone="BOOST" if current_role is not None else "NEUTRAL",
        )
    )

    # The star lord often decides what the planet actually delivers, and until
    # now the nakshatra was shown as a bare name and pada with no reading.
    star_lord = nakshatra_lord(planet.nakshatra)
    lord_house = (lord_house_by_graha or {}).get(star_lord)
    facets.append(
        ChartExplanationFacet(
            key="nakshatra",
            label=_FACET_LABELS["nakshatra"],
            value=_bi(
                *nakshatra_lord_note(
                    planet.graha,
                    planet.nakshatra,
                    planet.nakshatra_name,
                    lord_house,
                )
            ),
            tone="CAUTION" if lord_house in {6, 8, 12} else "NEUTRAL",
        )
    )

    if transit_contact_text is not None:
        # Only the top two contacts are narrated. Saying how many were left out
        # is the difference between an editorial choice and an omission — a
        # reader who knows Sani is also aspecting this graha should not conclude
        # the engine missed it.
        more_ta = (
            f" (மேலும் {hidden_contacts} தொடுதல் உள்ளது.)" if hidden_contacts else ""
        )
        more_en = (
            f" ({hidden_contacts} further contact{'s' if hidden_contacts > 1 else ''} not shown.)"
            if hidden_contacts
            else ""
        )
        facets.append(
            ChartExplanationFacet(
                key="transit",
                label=_FACET_LABELS["transit"],
                value=_bi(
                    transit_contact_text.ta + more_ta,
                    transit_contact_text.en + more_en,
                ),
            )
        )

    # The remedy is keyed to THIS graha, not to whatever is transiting it, so it
    # is stable across dates — see _natal_remedy_text.
    remedy = _natal_remedy_text(planet.graha, stage)
    if remedy is not None:
        facets.append(
            ChartExplanationFacet(
                key="remedy",
                label=_FACET_LABELS["remedy"],
                value=remedy,
            )
        )

    # Last, because it reconciles everything above it.
    synthesis_value, synthesis_tone = _synthesis_facet_value(
        planet, dignity, condition_states, stage
    )
    if synthesis_value is not None:
        facets.append(
            ChartExplanationFacet(
                key="synthesis",
                label=_FACET_LABELS["synthesis"],
                value=synthesis_value,
                tone=synthesis_tone,
            )
        )
    return facets


def _angular_separation(a: float, b: float) -> float:
    diff = abs((a % 360.0) - (b % 360.0))
    return min(diff, 360.0 - diff)


def _build_planet_sections(
    planets: list[PlanetPosition],
    lagna_rasi: int,
    timeline,
    transit_bodies: dict[str, object],
    stage: str = STAGE_ADULT,
) -> tuple[list[ChartExplanationPlanet], dict[str, str]]:
    node_rasi_map = {p.graha: p.rasi for p in planets if p.graha in ("RAHU", "KETU")}
    functional = {
        planet: get_functional_nature(lagna_rasi, planet, node_rasi_map=node_rasi_map).value
        for planet in _NATAL_PLANETS
    }
    # Map each active period lord to its level so a planet's explanation can state,
    # concretely, whether it is running right now (issue #2). Most-significant level
    # wins if a graha somehow lords more than one level.
    current_role_by_graha: dict[str, str] = {}
    for level, period in (
        ("ANTARAM", timeline.current_pratyantardasha),
        ("BHUKTI", timeline.current_antardasha),
        ("MAHADASHA", timeline.current_mahadasha),
    ):
        current_role_by_graha[period.lord] = level
    def _lord_ta(lord: str) -> str:
        return PLANET_NAME[lord].ta if lord in PLANET_NAME else lord

    dasha_chain_ta = (
        f"{_lord_ta(timeline.current_mahadasha.lord)} மகாதசை / {_lord_ta(timeline.current_antardasha.lord)} புக்தி / "
        f"{_lord_ta(timeline.current_pratyantardasha.lord)} அந்தரம்"
    )
    dasha_chain_en = (
        f"{timeline.current_mahadasha.lord} Mahadasha / {timeline.current_antardasha.lord} Bhukti / "
        f"{timeline.current_pratyantardasha.lord} Antaram"
    )
    # House of every plotted body, so a planet's star-lord note can say where
    # that lord actually sits instead of only naming it.
    lord_house_by_graha = {p.graha: p.house_from_lagna for p in planets}
    longitudes = {p.graha: p.absolute_longitude for p in planets}
    # Graha yuddham. Detected by the same canonical function the scorer uses, so
    # the -15 the reader can see in the breakdown and the sentence explaining it
    # can never disagree about who is at war with whom.
    wars = detect_planetary_wars(longitudes)
    war_partner: dict[str, tuple[str, bool]] = {}
    for loser, winner in wars.items():
        war_partner[loser] = (winner, True)
        war_partner[winner] = (loser, False)
    # Same-sign company, per graha — the other half of the natal yuti reading
    # that until now existed only as a chart-level section.
    by_rasi: dict[int, list[str]] = {}
    for p in planets:
        by_rasi.setdefault(p.rasi, []).append(p.graha)
    # Houses each graha rules from this Lagna. Nodes own nothing.
    owned_by_graha: dict[str, list[int]] = {}
    for house in range(1, 13):
        house_rasi = ((lagna_rasi + house - 2) % 12) + 1
        owned_by_graha.setdefault(_SIGN_LORD_BY_RASI[house_rasi], []).append(house)

    items: list[ChartExplanationPlanet] = []
    for planet in planets:
        dignity = _dignity_label(planet)
        dignity_score = _dignity_score(planet.graha, planet.rasi, planet.absolute_longitude)
        fn = functional.get(planet.graha, "NEUTRAL")
        contacts = _planet_transit_contacts(planet, transit_bodies)
        transit_contact, hidden_contacts = _split_transit_contact(contacts)
        opponent, lost = war_partner.get(planet.graha, (None, False))
        separation = (
            _angular_separation(longitudes[planet.graha], longitudes[opponent])
            if opponent is not None
            else 0.0
        )
        condition_states = _planet_condition_states(
            planet,
            minor=is_minor(stage),
            war_opponent=opponent,
            war_lost=lost,
            war_separation=separation,
        )
        co_tenants = [g for g in by_rasi.get(planet.rasi, []) if g != planet.graha]
        items.append(
            ChartExplanationPlanet(
                graha=planet.graha,
                house_from_lagna=planet.house_from_lagna,
                rasi=planet.rasi,
                rasi_name=planet.rasi_name,
                nakshatra=planet.nakshatra,
                nakshatra_name=planet.nakshatra_name,
                pada=planet.pada,
                nakshatra_lord=nakshatra_lord(planet.nakshatra),
                dignity=dignity,
                dignity_score=dignity_score,
                strength_score=planet.strength_score,
                is_retrograde=planet.is_retrograde,
                is_combust=planet.is_combust,
                is_cazimi=planet.is_cazimi,
                is_vargottama=planet.is_vargottama,
                d9_rasi=planet.d9_rasi,
                house_group=_house_group(planet.house_from_lagna),
                functional_nature=fn,
                is_planetary_war=opponent is not None,
                war_opponent=opponent,
                war_outcome=None if opponent is None else ("LOST" if lost else "WON"),
                co_tenants=co_tenants,
                explanation=_planet_explanation(
                    planet,
                    dignity,
                    fn,
                    current_role=current_role_by_graha.get(planet.graha),
                    dasha_chain_ta=dasha_chain_ta,
                    dasha_chain_en=dasha_chain_en,
                    transit_contact_text=_planet_transit_contact_text(contacts),
                    stage=stage,
                ),
                facets=_planet_facets(
                    planet,
                    dignity,
                    fn,
                    current_role=current_role_by_graha.get(planet.graha),
                    dasha_chain_ta=dasha_chain_ta,
                    dasha_chain_en=dasha_chain_en,
                    fn_context_ta=_functional_context_ta(fn, planet.graha),
                    fn_context_en=_functional_context_en(fn, planet.graha),
                    transit_contact_text=transit_contact,
                    condition_states=condition_states,
                    co_tenants=co_tenants,
                    owned_houses=owned_by_graha.get(planet.graha, []),
                    hidden_contacts=hidden_contacts,
                    stage=stage,
                    lord_house_by_graha=lord_house_by_graha,
                ),
                score_breakdown=_score_breakdown(planet),
            )
        )
    return items, functional


def _relationship(a: str, b: str) -> str:
    if b in _NATURAL_ENEMIES.get(a, frozenset()) or a in _NATURAL_ENEMIES.get(b, frozenset()):
        return "HOSTILE"
    if b in _NATURAL_FRIENDS.get(a, frozenset()) or a in _NATURAL_FRIENDS.get(b, frozenset()):
        return "FRIENDLY"
    return "NEUTRAL"


def _relationship_text(a: str, b: str, relationship: str) -> ChartExplanationText:
    a_ta, b_ta = planet_ta(a), planet_ta(b)
    a_en, b_en = planet_en(a), planet_en(b)
    if relationship == "FRIENDLY":
        return _bi(
            f"{a_ta} மற்றும் {b_ta} இயல்பான நட்பு ஆதரவை பகிர்கின்றன.",
            f"{a_en} and {b_en} share natural friendship support.",
        )
    if relationship == "HOSTILE":
        return _bi(
            f"{a_ta} மற்றும் {b_ta} ஒன்றாக இருந்தால் கவனமாக சமநிலைப்படுத்த வேண்டும்.",
            f"{a_en} and {b_en} together need careful balancing.",
        )
    return _bi(
        f"{a_ta} மற்றும் {b_ta} நடுநிலை கூட்டமாக செயல்படுகின்றன.",
        f"{a_en} and {b_en} act as neutral company.",
    )


def _build_conjunctions(planets: list[PlanetPosition], lagna_rasi: int) -> list[ChartExplanationConjunctionGroup]:
    by_rasi: dict[int, list[PlanetPosition]] = {}
    for planet in planets:
        by_rasi.setdefault(planet.rasi, []).append(planet)

    groups: list[ChartExplanationConjunctionGroup] = []
    for rasi, group_planets in sorted(by_rasi.items()):
        if len(group_planets) < 2:
            continue
        pairs: list[ChartExplanationMaitriPair] = []
        group_tone = "NEUTRAL"
        for a, b in combinations(group_planets, 2):
            relation = _relationship(a.graha, b.graha)
            if relation == "HOSTILE":
                group_tone = "HOSTILE"
            elif relation == "FRIENDLY" and group_tone != "HOSTILE":
                group_tone = "FRIENDLY"
            pairs.append(
                ChartExplanationMaitriPair(
                    planet_a=a.graha,
                    planet_b=b.graha,
                    relationship=relation,
                    explanation=_relationship_text(a.graha, b.graha, relation),
                )
            )
        house = house_from_reference(lagna_rasi, rasi)
        planets_label_ta = ", ".join(planet_ta(p.graha) for p in group_planets)
        planets_label_en = ", ".join(planet_en(p.graha) for p in group_planets)
        tone_ta = {"FRIENDLY": "நட்பு", "HOSTILE": "பகை", "NEUTRAL": "நடுநிலை"}.get(group_tone, "நடுநிலை")
        tone_en = {"FRIENDLY": "friendly", "HOSTILE": "hostile", "NEUTRAL": "neutral"}.get(group_tone, "neutral")
        groups.append(
            ChartExplanationConjunctionGroup(
                rasi=rasi,
                rasi_name=group_planets[0].rasi_name,
                house_from_lagna=house,
                planets=[p.graha for p in group_planets],
                relationship_tone=group_tone,
                pairs=pairs,
                explanation=_bi(
                    f"{planets_label_ta} {house}-ஆம் வீட்டில் ஒன்றாக நிற்கின்றன; இந்த கூட்டம் {tone_ta} தன்மையை காட்டுகிறது.",
                    f"{planets_label_en} stand together in house {house}; this company is {tone_en}.",
                ),
            )
        )
    return groups


def _aspect_type(planet: str, aspect_house: int) -> str:
    if aspect_house == 7:
        return "STANDARD_7TH"
    return f"{planet}_SPECIAL_{aspect_house}TH"


def _build_aspects(planets: list[PlanetPosition]) -> list[ChartExplanationAspect]:
    aspects: list[ChartExplanationAspect] = []
    for source in planets:
        for target in planets:
            if source.graha == target.graha:
                continue
            aspect_house = house_from_reference(source.rasi, target.rasi)
            if aspect_house not in aspect_houses(source.graha):
                continue
            aspects.append(
                ChartExplanationAspect(
                    source_planet=source.graha,
                    target_planet=target.graha,
                    source_house=source.house_from_lagna,
                    target_house=target.house_from_lagna,
                    aspect_house=aspect_house,
                    aspect_type=_aspect_type(source.graha, aspect_house),
                    explanation=_bi(
                        f"{planet_ta(source.graha)} {planet_ta(target.graha)}-ஐ {aspect_house}-ஆம் பார்வையில் பார்க்கிறது.",
                        f"{planet_en(source.graha)} aspects {planet_en(target.graha)} by its {aspect_house}th-house drishti.",
                    ),
                )
            )
    return aspects


def _graha_list_ta(names: list[str]) -> str:
    """Tamil list of grahas.

    A bare comma-join ("செவ்வாய், சூரியன்") reads as a machine dump. Tamil closes
    a list of persons — and grahas take the honorific here — with ஆகியோர்.
    Chosen over the correlative "செவ்வாயும் சூரியனும்" because that requires
    euphonic changes per name, which a join cannot do safely.
    """
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    return f"{', '.join(names)} ஆகியோர்"


def _graha_list_en(names: list[str]) -> str:
    """English list of grahas: "Mars", "Mars and Sun", "Mars, Saturn and Sun"."""
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    return f"{', '.join(names[:-1])} and {names[-1]}"


# One of four copies that carried no equality test at all.
_SIGN_LORD_BY_RASI: dict[int, str] = SIGN_LORD


def _build_bhava_section(
    planets: list[PlanetPosition],
    lagna_rasi: int,
) -> ChartExplanationBhavaSection:
    """Read all twelve bhavas as life areas.

    Deliberately covers EMPTY houses too. The existing drishti list is
    planet-to-planet, so an unoccupied 7th under Saturn's full aspect — a
    first-order fact for any marriage question — appeared nowhere in the
    reading. Here every house reports its lord, where that lord sits, who
    occupies it, and crucially who *aspects* it.
    """
    by_graha = {p.graha: p for p in planets}
    planets_rasi = {p.graha: p.rasi for p in planets}
    planet_scores = {
        p.graha: p.strength_score for p in planets if p.strength_score is not None
    }
    bhava_bala = compute_all_bhava_bala(lagna_rasi, planets_rasi, planet_scores)

    bhavas: list[ChartExplanationBhava] = []
    for house in range(1, 13):
        house_rasi = ((lagna_rasi + house - 2) % 12) + 1
        lord = _SIGN_LORD_BY_RASI[house_rasi]
        lord_planet = by_graha.get(lord)
        lord_house = lord_planet.house_from_lagna if lord_planet else house
        theme = _HOUSE_THEMES[house]

        occupants = sorted(p.graha for p in planets if p.rasi == house_rasi)
        aspecting = sorted(
            p.graha
            for p in planets
            if p.rasi != house_rasi and aspects_house(p.graha, p.rasi, house_rasi)
        )

        occ_ta = _graha_list_ta([planet_ta(g) for g in occupants])
        occ_en = _graha_list_en([planet_en(g) for g in occupants])
        asp_ta = _graha_list_ta([planet_ta(g) for g in aspecting])
        asp_en = _graha_list_en([planet_en(g) for g in aspecting])

        if occupants:
            # Tamil treats grahas with the honorific, as the transit copy already
            # does (சஞ்சரிக்கிறார்), and inflects for count: -ஆர் for one graha,
            # -அனர் for several. The neuter singular "அமர்ந்துள்ளது" was wrong on
            # both axes and read badly for multi-planet houses. English needs the
            # same agreement — "occupies" vs "occupy".
            body_ta = (
                f"{occ_ta} இந்த வீட்டில் அமர்ந்துள்ளார்."
                if len(occupants) == 1
                else f"{occ_ta} இந்த வீட்டில் அமர்ந்துள்ளனர்."
            )
            body_en = f"{occ_en} occupies it." if len(occupants) == 1 else f"{occ_en} occupy it."
        else:
            body_ta = "இந்த வீட்டில் எந்த கிரகமும் இல்லை — அதிபதியின் நிலையும் விழும் பார்வைகளும் இதை தீர்மானிக்கின்றன."
            body_en = (
                "No planet sits here, so this house is judged by its lord's condition "
                "and by the aspects falling on it."
            )

        if aspecting:
            aspect_ta = (
                f" {asp_ta} இதைப் பார்க்கிறார்."
                if len(aspecting) == 1
                else f" {asp_ta} இதைப் பார்க்கின்றனர்."
            )
            aspect_en = f" {asp_en} aspect{'s' if len(aspecting) == 1 else ''} it."
        else:
            aspect_ta = " எந்த கிரகப் பார்வையும் இதன் மேல் விழவில்லை."
            aspect_en = " No planetary aspect falls on it."

        bhavas.append(
            ChartExplanationBhava(
                house=house,
                rasi=house_rasi,
                rasi_name=RASI_NAMES[house_rasi],
                lord=lord,
                lord_house=lord_house,
                lord_strength=planet_scores.get(lord),
                occupants=occupants,
                aspecting_planets=aspecting,
                bhava_bala=bhava_bala.get(house),
                theme=theme,
                explanation=_bi(
                    (
                        f"{house}-ஆம் வீடு ({RASI_NAMES[house_rasi]}) — {theme.ta}. "
                        f"இதன் அதிபதி {planet_ta(lord)}, {lord_house}-ஆம் வீட்டில் உள்ளார். "
                        f"{body_ta}{aspect_ta}"
                    ),
                    (
                        f"House {house} ({RASI_NAMES[house_rasi]}) — {theme.en}. "
                        f"Its lord is {planet_en(lord)}, placed in house {lord_house}. "
                        f"{body_en}{aspect_en}"
                    ),
                ),
            )
        )

    return ChartExplanationBhavaSection(
        bhavas=bhavas,
        explanation=_bi(
            "ஒவ்வொரு வீடும் ஒரு வாழ்க்கைத் துறை. அந்த வீட்டில் கிரகம் இல்லாவிட்டாலும், "
            "அதன் அதிபதி எங்கே இருக்கிறார், யார் அதைப் பார்க்கிறார்கள் என்பதைக் கொண்டு பலன் சொல்லப்படுகிறது.",
            "Each house is one life area. Even with no planet in it, a house is read through "
            "where its lord sits and which planets aspect it.",
        ),
    )


def _house_group_synthesis(name: str, group_planets: list[PlanetPosition]) -> ChartExplanationText:
    """Personalized 'so what' for a Kendra/Trikona/Dusthana card — names the user's
    own planets there and what that combination practically means for them, instead
    of only the abstract group definition (issues #4/#5)."""
    names_ta = ", ".join(planet_ta(p.graha) for p in group_planets)
    names_en = ", ".join(planet_en(p.graha) for p in group_planets)
    count = len(group_planets)
    plural_en = "s" if count != 1 else ""
    if name == "KENDRA":
        if count == 0:
            return _bi(
                "உங்கள் ஜாதகத்தில் கேந்திர வீடுகளில் (1/4/7/10) கிரகம் இல்லை; தொழில், வீடு, உறவுகள், ஆரோக்கியம் போன்ற வெளிப்படைத் துறைகள் அமைதியாக, குறைவான உடனடி அழுத்தத்துடன் இயங்கும்.",
                "No planets sit in your Kendra houses (1/4/7/10); your visible life areas — career, home, relationships, health — tend to move quietly, without much immediate pressure.",
            )
        return _bi(
            f"{names_ta} ({count} கிரகங்கள்) கேந்திர வீடுகளில் (1/4/7/10) உள்ளன. இதனால் உங்கள் தொழில், வீடு, உறவுகள், ஆரோக்கியம் போன்ற வெளிப்படைத் துறைகள் நேரடியாகவும் தெளிவாகவும் செயல்படும்; இங்கு போடும் முயற்சி விரைவில் கண்முன் தெரியும்.",
            f"{names_en} ({count} planet{plural_en}) sit in your Kendra houses (1/4/7/10). This means your visible life areas — career, home, relationships, health — tend to unfold directly and clearly; effort you put in here shows results you can see.",
        )
    if name == "TRIKONA":
        if count == 0:
            return _bi(
                "உங்கள் ஜாதகத்தில் திரிகோண வீடுகளில் (1/5/9) கிரகம் இல்லை; நல்லூழ் தொடர்பான ஆதரவு பெரும்பாலும் தசை/கோசாரம் மூலம் மட்டுமே வெளிப்படும், நிலையான பின்புலமாக இல்லை.",
                "No planets sit in your Trikona houses (1/5/9); grace-related support mostly surfaces only through dasha and transit timing, rather than as a steady background presence.",
            )
        return _bi(
            f"{names_ta} ({count} கிரகங்கள்) திரிகோண வீடுகளில் (1/5/9) உள்ளன. இது திறமை, புண்ணியம், நல்லூழ் ஆகியவை இயல்பாக ஆதரவளிக்கும் என்பதைக் காட்டுகிறது; கல்வி, ஆன்மீகம், நல்ல வாய்ப்புகள் தொடர்பான முயற்சிகள் சிறப்பாக பலனளிக்கும்.",
            f"{names_en} ({count} planet{plural_en}) sit in your Trikona houses (1/5/9). This points to natural support from talent, grace, and good fortune; effort toward learning, spirituality, or good opportunities tends to pay off well.",
        )
    if count == 0:
        return _bi(
            "உங்கள் ஜாதகத்தில் துஷ்டான வீடுகளில் (6/8/12) கிரகம் இல்லை; சேவை, கடன், ஆரோக்கியம் போன்ற துறைகளில் நீண்டகால சிக்கல்கள் குறைவாக இருக்கும்.",
            "No planets sit in your Dusthana houses (6/8/12); areas like service, debt, and health tend to carry fewer long-term complications for you.",
        )
    return _bi(
        f"{names_ta} ({count} கிரகங்கள்) துஷ்டான வீடுகளில் (6/8/12) உள்ளன. இது சேவை, ஆரோக்கியம், கடன், மறைமுக விஷயங்களில் கூடுதல் கவனமும் ஒழுங்கும் தேவை என்பதைக் காட்டுகிறது; ஒழுங்கான பழக்கமும் பொறுமையும் இந்தத் துறைகளை நிலைப்படுத்தும்.",
        f"{names_en} ({count} planet{plural_en}) sit in your Dusthana houses (6/8/12). This means service, health, debt, or behind-the-scenes matters need extra care and structure; steady routines and patience stabilize these areas over time.",
    )


def _build_house_groups(planets: list[PlanetPosition]) -> list[ChartExplanationHouseGroup]:
    groups = [
        ("KENDRA", [1, 4, 7, 10]),
        ("TRIKONA", [1, 5, 9]),
        ("DUSTHANA", [6, 8, 12]),
    ]
    result: list[ChartExplanationHouseGroup] = []
    for name, houses in groups:
        group_planets = [planet for planet in planets if planet.house_from_lagna in houses]
        result.append(
            ChartExplanationHouseGroup(
                group=name,
                houses=houses,
                planets=[planet.graha for planet in group_planets],
                explanation=_house_group_synthesis(name, group_planets),
            )
        )
    return result


def _activation_tone(
    planet: PlanetPosition,
    dignity: str,
    functional_nature: str,
    transit_house_from_moon: int,
    transit_house_from_lagna: int,
) -> str:
    score = planet.strength_score if planet.strength_score is not None else 50
    if functional_nature in {"YOGAKARAKA", "LAGNA_LORD", "TRIKONA"}:
        score += 12
    elif functional_nature in {"DUSTHANA", "MARAKA", "UPACHAYA"}:
        score -= 10

    if dignity in {"EXALTED", "MOOLATRIKONA", "OWN_SIGN"}:
        score += 8
    elif dignity in {"DEBILITATED", "ENEMY_SIGN"}:
        score -= 8

    if transit_house_from_moon in {2, 3, 5, 7, 9, 10, 11}:
        score += 8
    elif transit_house_from_moon in {6, 8, 12}:
        score -= 8

    if transit_house_from_lagna in {1, 5, 9, 10, 11}:
        score += 5
    elif transit_house_from_lagna in {6, 8, 12}:
        score -= 5

    if score >= 70:
        return "SUPPORT"
    if score <= 44:
        return "CAUTION"
    return "STEADY"


def _tone_text(tone: str) -> ChartExplanationText:
    if tone == "SUPPORT":
        return _bi("ஆதரவு", "support")
    if tone == "CAUTION":
        return _bi("கவனத்துடன் செயல்பட வேண்டிய", "needs care")
    return _bi("சமநிலை", "steady")


def _activation_life_areas(natal_house: int, transit_house_from_lagna: int) -> list[str]:
    values = [_HOUSE_THEMES[natal_house].en, _HOUSE_THEMES[transit_house_from_lagna].en]
    result: list[str] = []
    for value in values:
        if value not in result:
            result.append(value)
    return result


def _activation_signal_text(source_planet: str, active_lord: str, signal_type: str) -> ChartExplanationText:
    source_ta, source_en = planet_ta(source_planet), planet_en(source_planet)
    lord_ta, lord_en = planet_ta(active_lord), planet_en(active_lord)
    if signal_type == "TRANSIT_CONJUNCTION":
        return _bi(
            f"கோசார {source_ta} நடப்பு {lord_ta} தசை கிரகத்தின் பிறப்பு ராசியை தொடுகிறது.",
            f"Transit {source_en} touches the natal sign of the active {lord_en} period lord.",
        )
    if signal_type == "DASHA_LORD_RETURN":
        return _bi(
            f"{lord_ta} இப்போது தனது பிறப்பு ராசியை மீண்டும் தொடுகிறது; அந்த கிரகத் துறை அதிக கவனம் பெறுகிறது.",
            f"{lord_en} is transiting its natal sign, so that planet's themes receive extra focus.",
        )
    return _bi(
        f"கோசார {source_ta} நடப்பு {lord_ta} தசை கிரகத்தை பார்வையால் தொடுகிறது.",
        f"Transit {source_en} aspects the natal {lord_en} period lord.",
    )


def _activation_signals(
    active_lord: str,
    natal_planet: PlanetPosition,
    transit_bodies: dict[str, object],
) -> list[ChartExplanationActivationSignal]:
    signals: list[ChartExplanationActivationSignal] = []
    active_transit = transit_bodies.get(active_lord)
    if active_transit is not None and active_transit.rasi == natal_planet.rasi:
        signals.append(
            ChartExplanationActivationSignal(
                source_planet=active_lord,
                signal_type="DASHA_LORD_RETURN",
                explanation=_activation_signal_text(active_lord, active_lord, "DASHA_LORD_RETURN"),
            )
        )

    for source in ("MARS", "JUPITER", "SATURN", "RAHU", "KETU"):
        body = transit_bodies.get(source)
        if body is None:
            continue
        aspect_house = house_from_reference(body.rasi, natal_planet.rasi)
        if aspect_house == 1:
            signal_type = "TRANSIT_CONJUNCTION"
        elif aspect_house in aspect_houses(source):
            signal_type = f"TRANSIT_ASPECT_{aspect_house}TH"
        else:
            continue
        signals.append(
            ChartExplanationActivationSignal(
                source_planet=source,
                signal_type=signal_type,
                explanation=_activation_signal_text(source, active_lord, signal_type),
            )
        )
    return signals


def _activation_explanation(
    level: str,
    period: DashaPeriod,
    natal_planet: PlanetPosition,
    transit_house_from_moon: int,
    transit_house_from_lagna: int,
    tone: str,
) -> ChartExplanationText:
    tone_copy = _tone_text(tone)
    natal_theme = _HOUSE_THEMES[natal_planet.house_from_lagna]
    transit_theme = _HOUSE_THEMES[transit_house_from_lagna]  # noqa: F841 — retained for parity with natal_theme; not yet surfaced
    level_ta = _PERIOD_ROLE_TA.get(level, level)
    level_en = level.title()
    return _bi(
        (
            f"{level_ta} நிலையில் {planet_ta(period.lord)} செயல்படும் கிரகம். பிறப்பு ஜாதகத்தில் இது லக்னத்திலிருந்து "
            f"{natal_planet.house_from_lagna}-ஆம் இடத்தில் இருந்து {natal_theme.ta} துறையை இயக்குகிறது. "
            f"இப்போது கோசாரத்தில் லக்னத்திலிருந்து {transit_house_from_lagna}-ஆம் இடம், சந்திரனிலிருந்து "
            f"{transit_house_from_moon}-ஆம் இடம்; இதனால் இந்த அடுக்கு {tone_copy.ta} போக்கில் படிக்கப்படுகிறது."
        ),
        (
            f"At the {level_en} level, {planet_en(period.lord)} is the operating planet. Natally it sits in house "
            f"{natal_planet.house_from_lagna} from Lagna, activating {natal_theme.en}. Right now it transits "
            f"house {transit_house_from_lagna} from Lagna and house {transit_house_from_moon} from Moon, so this "
            f"layer is read as {tone_copy.en}."
        ),
    )


def _build_current_activation_section(
    planets: list[PlanetPosition],
    lagna_rasi: int,
    moon: PlanetPosition,
    timeline,
    as_of: date,
    transit_bodies: dict[str, object],
) -> ChartExplanationCurrentActivationSection:
    natal_by_planet = {planet.graha: planet for planet in planets}
    # node_rasi_map so a Rahu/Ketu dasha lord resolves via dispositor+house, not
    # the NEUTRAL table fallback — consistent with every other consumer (audit C4).
    _node_rasi_map = {g: natal_by_planet[g].rasi for g in ("RAHU", "KETU") if g in natal_by_planet}
    periods: list[tuple[str, DashaPeriod]] = [
        ("MAHADASHA", timeline.current_mahadasha),
        ("BHUKTI", timeline.current_antardasha),
        ("ANTARAM", timeline.current_pratyantardasha),
    ]

    active_lords: list[ChartExplanationDashaLordActivation] = []
    all_signals: list[ChartExplanationActivationSignal] = []
    tones: list[str] = []

    for level, period in periods:
        natal_planet = natal_by_planet.get(period.lord)
        transit_body = transit_bodies.get(period.lord)
        if natal_planet is None or transit_body is None:
            continue

        dignity = _dignity_label(natal_planet)
        functional_nature = get_functional_nature(lagna_rasi, period.lord, node_rasi_map=_node_rasi_map).value
        transit_house_from_moon = house_from_reference(moon.rasi, transit_body.rasi)
        transit_house_from_lagna = house_from_reference(lagna_rasi, transit_body.rasi)
        tone = _activation_tone(
            natal_planet,
            dignity,
            functional_nature,
            transit_house_from_moon,
            transit_house_from_lagna,
        )
        signals = _activation_signals(period.lord, natal_planet, transit_bodies)
        tones.append(tone)
        all_signals.extend(signals)

        active_lords.append(
            ChartExplanationDashaLordActivation(
                level=level,
                lord=period.lord,
                start_date=period.start_date,
                end_date=period.end_date,
                natal_house_from_lagna=natal_planet.house_from_lagna,
                natal_house_from_moon=house_from_reference(moon.rasi, natal_planet.rasi),
                natal_rasi=natal_planet.rasi,
                natal_rasi_name=natal_planet.rasi_name,
                natal_dignity=dignity,
                natal_strength_score=natal_planet.strength_score if natal_planet.strength_score is not None else 50,
                functional_nature=functional_nature,
                transit_rasi=transit_body.rasi,
                transit_rasi_name=RASI_NAMES[transit_body.rasi],
                transit_house_from_moon=transit_house_from_moon,
                transit_house_from_lagna=transit_house_from_lagna,
                transit_is_retrograde=transit_body.is_retrograde,
                period_tone=tone,
                life_areas=_activation_life_areas(natal_planet.house_from_lagna, transit_house_from_lagna),
                transit_signals=signals,
                explanation=_activation_explanation(
                    level,
                    period,
                    natal_planet,
                    transit_house_from_moon,
                    transit_house_from_lagna,
                    tone,
                ),
            )
        )

    chain_ta = " / ".join(f"{planet_ta(period.lord)} {_PERIOD_ROLE_TA.get(level, level)}" for level, period in periods)
    chain_en = " / ".join(f"{planet_en(period.lord)} {level.title()}" for level, period in periods)
    support_count = sum(1 for tone in tones if tone == "SUPPORT")
    caution_count = sum(1 for tone in tones if tone == "CAUTION")
    period_summary = _bi(
        f"நடப்பு தசைச் சங்கிலி: {chain_ta}. மகாதசை முக்கிய கரு, புக்தி துணை கரு, அந்தரம் உடனடி தூண்டுதல்.",
        f"Current dasha chain: {chain_en}. Mahadasha is the main theme, Bhukti the sub-theme, and Antaram the immediate trigger.",
    )
    transit_summary = _bi(
        (
            f"கோசாரத்தில் {len(all_signals)} முக்கிய தொடுதல்கள் உள்ளன; {support_count} அடுக்குகள் ஆதரவு போக்கிலும் "
            f"{caution_count} அடுக்குகள் கவன போக்கிலும் படிக்கப்படுகின்றன."
        ),
        (
            f"Current gochar shows {len(all_signals)} major contacts to the active period lords; "
            f"{support_count} layers read supportive and {caution_count} layers ask for care."
        ),
    )

    return ChartExplanationCurrentActivationSection(
        as_of=as_of,
        period_summary=period_summary,
        transit_summary=transit_summary,
        active_lords=active_lords,
        explanation=_bi(
            "இந்த பகுதி பிறப்பு ஜாதக வாக்குறுதியையும் நடப்பு தசை/புக்தி/அந்தரம் மற்றும் கோசார இயக்கத்தையும் இணைக்கிறது.",
            "This section connects natal promise with the current Mahadasha, Bhukti, Antaram, and gochar movement.",
        ),
    )


# What the 0-100 planet score actually is, in one line the reader sees next to
# the number. Without an anchor a score is uninterpretable — a reviewer asked
# directly "what does 65/100 mean: Shadbala rupas normalised? benefic capacity?"
# and nothing in the product answered it (2026-07-18).
#
# The honest answer: it is a six-component Shadbala-style POSITIONAL composite
# (sthana, dik, kala, chesta, naisargika, drik — see chart_strength.py), not
# classical rupas and not a measure of how benefic the results will be.
_SCORE_SCALE_NOTE: ChartExplanationText = _bi(
    (
        "மதிப்பெண் விளக்கம்: 0-100 என்பது ஷட்பல முறையை ஒட்டிய *கிரக பலம்* — "
        "ஸ்தான (இடம்), திக் (திசை), கால (நேரம்), சேஷ்டா (இயக்கம்), "
        "நைசர்கிக (இயற்கை), திருக் (பார்வை) ஆகிய ஆறு கூறுகளின் கூட்டு. "
        "இது கிரகம் எவ்வளவு உறுதியாக நிற்கிறது என்பதை சொல்கிறது; அது தரும் பலன் "
        "நல்லதா கெட்டதா என்பதை அல்ல. அதற்கு ராசி நிலை, அஸ்தங்கம், "
        "செயல்பாட்டு தன்மை ஆகியவற்றையும் சேர்த்துப் பார்க்க வேண்டும். "
        "தோராயமாக: 70+ வலிமை, 45-69 மிதமானது, 45க்கு கீழ் ஆதரவு தேவை."
    ),
    (
        "About this score: 0-100 measures *positional strength* on a "
        "Shadbala-style composite of six components (sthana, dik, kala, chesta, "
        "naisargika, drik). It says how firmly a planet stands, not whether its "
        "results will be good — dignity, combustion, and functional nature "
        "decide that, and are read alongside it. As a guide: 70+ strong, "
        "45-69 moderate, below 45 needs support."
    ),
)


def _summary_section(
    planets: list[PlanetPosition],
    birth_conditions: list[ChartBirthCondition] | None = None,
    lagna_rasi: int | None = None,
) -> ChartExplanationSummarySection:
    scored = [planet for planet in planets if planet.strength_score is not None]
    strongest = max(scored, key=lambda planet: planet.strength_score, default=None)
    weakest = min(scored, key=lambda planet: planet.strength_score, default=None)
    kendra_count = sum(1 for planet in planets if planet.house_from_lagna in _KENDRA_HOUSES)
    dusthana_count = sum(1 for planet in planets if planet.house_from_lagna in _DUSTHANA_HOUSES)
    positives = [
        _bi(
            f"{kendra_count} கிரகங்கள் கேந்திரத்தில் உள்ளன; செயல்பாட்டு துறைகள் தெளிவாக இயங்கும் போக்கு உள்ளது.",
            f"{kendra_count} planets are in Kendra houses, indicating a tendency for visible life areas to stay active.",
        )
    ]
    cautions = [
        _bi(
            f"{dusthana_count} கிரகங்கள் துஷ்டான வீடுகளில் உள்ளன; ஓய்வு, ஒழுங்கு, அளவான முடிவுகள் உதவும்.",
            f"{dusthana_count} planets are in Dusthana houses; rest, routines, and measured choices help.",
        )
    ]
    # "Strongest" here means strongest BY POSITION (the Shadbala-style composite
    # in chart_strength.py). That is not the same axis as the capacity to
    # deliver benefic results: a combust planet, a debilitated one, or a
    # functional malefic can top this scale and still need heavy qualification.
    # Saying "X appears strongest" with no such qualifier is what led an
    # astrologer to flag a combust, retrograde 6th-lord Mercury being presented
    # as the chart's strongest graha (2026-07-18).
    strongest_caveat: ChartExplanationText | None = None
    if strongest is not None:
        strongest_dignity = _dignity_label(strongest)
        caveat_reasons_ta: list[str] = []
        caveat_reasons_en: list[str] = []
        if strongest.is_combust:
            caveat_reasons_ta.append("அஸ்தங்கம் (சூரியனுக்கு மிக அருகில் இருந்து பலம் இழந்த நிலை)")
            caveat_reasons_en.append("combust (astangata), burnt by closeness to the Sun")
        if strongest_dignity == "DEBILITATED":
            caveat_reasons_ta.append("நீச ராசி")
            caveat_reasons_en.append("debilitated by sign")
        elif strongest_dignity == "ENEMY_SIGN":
            caveat_reasons_ta.append("பகை ராசி")
            caveat_reasons_en.append("placed in an enemy sign")

        positives.append(
            _bi(
                f"{planet_ta(strongest.graha)} கிரக பலத்தில் அதிக மதிப்பெண் பெற்ற கிரகம்; அதன் வீட்டு துறைகள் ஆதரவாக இயங்கும்.",
                f"{planet_en(strongest.graha)} scores highest on positional strength; its house themes can act as a support channel.",
            )
        )
        if caveat_reasons_ta:
            strongest_caveat = _bi(
                (
                    f"ஆனால் {planet_ta(strongest.graha)} {', '.join(caveat_reasons_ta)} நிலையில் உள்ளது. "
                    "கிரக பலம் என்பது வேறு; பலனைத் தரும் திறன் என்பது வேறு. "
                    "இந்த கிரகத்தின் நல்ல பலன்கள் தாமதமாகவோ, முழுமையின்றியோ வெளிப்படலாம்."
                ),
                (
                    f"Note, however, that {planet_en(strongest.graha)} is {', '.join(caveat_reasons_en)}. "
                    "Positional strength and the capacity to deliver benefic results are different axes — "
                    "this planet holds the position but may deliver its good results late or incompletely."
                ),
            )
            cautions.append(strongest_caveat)
    if weakest is not None:
        cautions.append(
            _bi(
                f"{planet_ta(weakest.graha)} கிரக பலத்தில் மிகக் குறைந்த மதிப்பெண் பெற்றுள்ளது; அந்த துறையில் மெதுவான திட்டம் நல்லது.",
                f"{planet_en(weakest.graha)} scores lowest on positional strength; a slower plan helps that area.",
            )
        )
    # The chart's conjunction structure, stated once at chart level. Two grahas
    # sharing a house is usually the most defining thing about a chart, and the
    # summary previously reported only Kendra/Dusthana COUNTS — so a reading
    # could open without ever mentioning that the 7th holds a pair.
    clusters: dict[int, list[str]] = {}
    for planet in planets:
        clusters.setdefault(planet.rasi, []).append(planet.graha)
    grouped = [
        (rasi, grahas) for rasi, grahas in sorted(clusters.items()) if len(grahas) > 1
    ]
    if grouped and lagna_rasi is not None:
        phrases_ta: list[str] = []
        phrases_en: list[str] = []
        for rasi, grahas in grouped:
            house = house_from_reference(lagna_rasi, rasi)
            phrases_ta.append(
                f"{_graha_list_ta([planet_ta(g) for g in grahas])} {house}-ஆம் வீட்டில்"
            )
            phrases_en.append(
                f"{_graha_list_en([planet_en(g) for g in grahas])} in the {_ordinal_en(house)}"
            )
        positives.append(
            _bi(
                "சேர்க்கை அமைப்பு: " + "; ".join(phrases_ta) + " — இந்த கிரகங்களின் பலன்கள் இணைந்தே வெளிப்படும்.",
                "Conjunctions: " + "; ".join(phrases_en) + " — these grahas deliver together rather than separately.",
            )
        )

    # Graha yuddham at chart level. The score has acted on this for months; this
    # is the first place the reader is told it happened.
    wars = detect_planetary_wars({p.graha: p.absolute_longitude for p in planets})
    for loser, winner in sorted(wars.items()):
        sep = _angular_separation(
            next(p.absolute_longitude for p in planets if p.graha == loser),
            next(p.absolute_longitude for p in planets if p.graha == winner),
        )
        cautions.append(
            _bi(
                f"கிரக யுத்தம்: {planet_ta(winner)} மற்றும் {planet_ta(loser)} வெறும் "
                f"{sep:.2f}° இடைவெளியில் உள்ளன; {planet_ta(loser)} பின்தங்குவதால் அதன் "
                "தனித்த பலன் மங்கி, மற்றதன் வழியாகவே வெளிப்படும்.",
                f"Graha yuddham: {planet_en(winner)} and {planet_en(loser)} stand just "
                f"{sep:.2f}° apart. {planet_en(loser)} is the trailing graha, so its own "
                "results are dimmed and tend to reach you through its opponent's themes.",
            )
        )

    # Border-Alert birth conditions (Sankranti/Grahana boundary births, Cazimi,
    # etc. — app/calculations/birth_conditions.py + transits.is_cazimi). These
    # are verified, display-safe qualitative factors, so they belong in the
    # "Why this prediction?" reasoning. BOOST reads as a positive; ALERT/INFO as
    # a caution/note. They do NOT change the score here — only name the factor.
    for condition in birth_conditions or []:
        if not condition.is_present:
            continue
        text = _bi(
            f"பிறப்பு நேர நிலை — {condition.title_ta}: {condition.description_ta}",
            f"Birth-time condition — {condition.title_en}: {condition.description_en}",
        )
        if condition.severity == "BOOST":
            positives.append(text)
        else:
            cautions.append(text)
    return ChartExplanationSummarySection(
        strongest_planet=strongest.graha if strongest else None,
        weakest_planet=weakest.graha if weakest else None,
        strongest_planet_score=strongest.strength_score if strongest else None,
        weakest_planet_score=weakest.strength_score if weakest else None,
        strongest_planet_caveat=strongest_caveat,
        score_scale_note=_SCORE_SCALE_NOTE,
        positives=positives,
        cautions=cautions,
    )


def _peyarchi_text(planet: str, house_from_moon: int, house_from_lagna: int, sani_cycle_after: str | None) -> ChartExplanationText:
    if planet == "SATURN":
        if sani_cycle_after:
            stage_ta = f"{sani_cycle_ta(sani_cycle_after)} காலம்"
            stage_en = f"The {sani_cycle_en(sani_cycle_after)} period"
        else:
            stage_ta = "இந்த சனி சுழற்சி"
            stage_en = "This Saturn cycle"
        return _bi(
            f"சனி சந்திரனிலிருந்து {house_from_moon}-ஆம் இடத்தையும் லக்னத்திலிருந்து {house_from_lagna}-ஆம் இடத்தையும் தொடுகிறது. {stage_ta} ஒழுங்கு, பொறுப்பு, நீண்டகால சீரமைப்பை வலியுறுத்தும்.",
            f"Saturn touches house {house_from_moon} from Moon and house {house_from_lagna} from Lagna. {stage_en} emphasizes discipline, responsibility, and long-term restructuring.",
        )
    if planet == "JUPITER":
        quality_ta, quality_en = (
            ("சாதகம்", "supportive") if house_from_moon in {2, 5, 7, 9, 11}
            else ("கவனம்", "careful") if house_from_moon in {6, 8, 12}
            else ("நடுநிலை", "steady")
        )
        return _bi(
            f"குரு சந்திரனிலிருந்து {house_from_moon}-ஆம் இடம் ({quality_ta}) மற்றும் லக்னத்திலிருந்து {house_from_lagna}-ஆம் இடம். அறிவு, வளர்ச்சி, வாய்ப்பு துறைகள் இயக்கம் பெறும்.",
            f"Jupiter moves to house {house_from_moon} from Moon ({quality_en}) and house {house_from_lagna} from Lagna. Learning, growth, and opportunity themes are activated.",
        )
    if planet == "RAHU":
        opposite_house = ((house_from_moon + 6 - 1) % 12) + 1
        rahu_theme = _HOUSE_THEMES[house_from_moon]
        ketu_theme = _HOUSE_THEMES[opposite_house]
        return _bi(
            f"ராகு/கேது அச்சு {house_from_moon}-{opposite_house} வீடுகளை இயக்குகிறது. ராகு {house_from_moon}-ஆம் இடத்தில் "
            f"({rahu_theme.ta}) கவனத்தை பெரிதாக்கும்; எதிர் அச்சில் கேது {opposite_house}-ஆம் இடம் ({ketu_theme.ta}) "
            f"விடுவிப்பு மற்றும் உள்ளார்ந்த திருத்தத்தை கேட்கும்.",
            f"The Rahu/Ketu axis activates houses {house_from_moon} and {opposite_house} from Moon. Rahu magnifies "
            f"{rahu_theme.en}, while Ketu trims the opposite axis of {ketu_theme.en}; ambition works best with grounding.",
        )
    opposite_house = ((house_from_moon + 6 - 1) % 12) + 1
    ketu_theme = _HOUSE_THEMES[house_from_moon]
    rahu_theme = _HOUSE_THEMES[opposite_house]
    return _bi(
        f"ராகு/கேது அச்சு {opposite_house}-{house_from_moon} வீடுகளை இயக்குகிறது. கேது {house_from_moon}-ஆம் இடத்தில் "
        f"({ketu_theme.ta}) எளிமை மற்றும் உள்ளார்ந்த திருத்தத்தை தரும்; எதிர் அச்சில் ராகு {opposite_house}-ஆம் இடம் "
        f"({rahu_theme.ta}) ஆசை மற்றும் வெளிப்படை இயக்கத்தை பெரிதாக்கும்.",
        f"The Rahu/Ketu axis activates houses {opposite_house} and {house_from_moon} from Moon. Ketu simplifies "
        f"{ketu_theme.en}, while Rahu magnifies the opposite axis of {rahu_theme.en}; release works best when desire stays measured.",
    )


def _build_peyarchi_section(session: Session, chart_id: UUID, *, as_of: date, window_days: int) -> ChartExplanationPeyarchiSection:
    summary = get_peyarchi_summary(session, chart_id, as_of=as_of, window_days=window_days)
    events = [
        ChartExplanationPeyarchiEvent(
            planet=event.planet,
            event_date=event.peyarchi_date_local,
            from_rasi=event.from_rasi,
            to_rasi=event.to_rasi,
            house_from_moon=event.impact_from_moon,
            house_from_lagna=event.impact_from_lagna,
            sani_cycle_after=event.sani_cycle_after,
            explanation=_peyarchi_text(
                event.planet,
                event.impact_from_moon,
                event.impact_from_lagna,
                event.sani_cycle_after,
            ),
        )
        for event in summary.data
    ]
    return ChartExplanationPeyarchiSection(
        as_of=as_of,
        events=events,
        explanation=_bi(
            "பெயர்ச்சி விளக்கம் சந்திர ராசி மற்றும் லக்னம் இரண்டிலிருந்தும் கணிக்கப்பட்டது.",
            "Peyarchi notes are counted from both natal Moon and Lagna.",
        ),
    )


def _reader_life_stage(chart: Chart, as_of: date) -> str:
    """Life stage of the person this chart belongs to, ADULT when unknowable.

    Defaulting to ADULT on a missing birth date keeps existing behaviour for
    charts we cannot age, rather than silently applying child framing to an
    adult — the failure mode that matters here is the one that already shipped
    (adult copy on a child), and this only ever narrows it.
    """
    profile = getattr(chart, "birth_profile", None)
    birth_date = getattr(profile, "birth_date_local", None) if profile else None
    if birth_date is None:
        return STAGE_ADULT
    age = as_of.year - birth_date.year
    if (as_of.month, as_of.day) < (birth_date.month, birth_date.day):
        age -= 1
    return life_stage(max(age, 0))


def build_chart_explanation(
    session: Session,
    chart_id: UUID,
    *,
    as_of: date,
    peyarchi_window_days: int = 700,
) -> ChartExplanationResponse:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")

    chart_response = load_persisted_chart_response(session, chart_id)
    data = chart_response.data
    planets = _public_planets(data.planets)
    moon = next((planet for planet in planets if planet.graha == "MOON"), None)
    if moon is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Chart is missing Moon position.")

    as_of_dt = datetime.combine(as_of, time(hour=12), tzinfo=UTC)
    as_of_jd = utc_datetime_to_julian_day(as_of_dt)
    timeline = calculate_vimshottari_timeline(
        data.julian_day,
        moon.absolute_longitude,
        as_of_jd,
    )
    # Computed once and shared by the planet positions and current-activation
    # sections so every planet (not just the active dasha/bhukti/antaram lords)
    # can report real current gochar contact (issue #2), without a second
    # ephemeris call.
    transit_bodies = calculate_sidereal_planets(as_of_jd).bodies

    # Who is this reading FOR. Adult second-person guidance ("re-read an
    # important message before sending it", career and income framing) was being
    # served on every chart regardless of age, including infants' — the text was
    # right about the graha and addressed to a person who does not exist yet.
    stage = _reader_life_stage(chart, as_of)

    planet_sections, functional_nature = _build_planet_sections(
        planets, data.lagna.rasi, timeline, transit_bodies, stage
    )
    core_identity = ChartExplanationCoreIdentity(
        lagna_rasi=data.lagna.rasi_name,
        moon_rasi=moon.rasi_name,
        janma_nakshatra=moon.nakshatra_name,
        janma_pada=moon.pada,
        current_mahadasha=timeline.current_mahadasha.lord,
        current_antardasha=timeline.current_antardasha.lord,
        current_pratyantardasha=timeline.current_pratyantardasha.lord,
        explanation=_bi(
            "இந்த பகுதி லக்னம், சந்திர ராசி, நடப்பு தசை ஆகியவற்றை ஒரே அடிப்படையாக இணைக்கிறது.",
            "This section connects Lagna, Moon sign, and the current dasha as the chart's working base.",
        ),
    )

    response = ChartExplanationResponse(
        data=ChartExplanationData(
            chart_id=chart_id,
            core_identity=core_identity,
            planets=planet_sections,
            conjunctions=_build_conjunctions(planets, data.lagna.rasi),
            aspects=_build_aspects(planets),
            house_groups=_build_house_groups(planets),
            bhavas=_build_bhava_section(planets, data.lagna.rasi),
            functional_nature=functional_nature,
            yoga_dosham=ChartExplanationYogaDoshamSection(
                yogas=data.yogas,
                doshams=data.doshams,
                explanation=_bi(
                    "யோகங்கள் மற்றும் தோஷங்கள் ஏற்கனவே கணிக்கப்பட்ட ஜாதக விதிகளிலிருந்து எடுத்தவை.",
                    "Yogas and doshams are reused from the already computed chart rules.",
                ),
            ),
            current_activation=_build_current_activation_section(
                planets,
                data.lagna.rasi,
                moon,
                timeline,
                as_of,
                transit_bodies,
            ),
            summary=_summary_section(planets, data.birth_conditions, data.lagna.rasi),
            peyarchi=_build_peyarchi_section(
                session,
                chart_id,
                as_of=as_of,
                window_days=peyarchi_window_days,
            ),
            method_note=_bi(
                "முறை: லக்னம் முழு ராசி வீடு, இயற்கை கிரக நட்பு, கேந்திர/திரிகோண/துஷ்டான வகை, 7-ஆம் பார்வை மற்றும் செவ்வாய்/குரு/சனி சிறப்பு பார்வைகள். ராகு/கேது 5/7/9 பார்வை மரபு இங்கே ஆவணப்படுத்தப்பட்டு பயன்படுத்தப்படுகிறது.",
                "Method: whole-sign Lagna houses, natural graha friendship, Kendra/Trikona/Dusthana grouping, standard 7th aspects, and special Mars/Jupiter/Saturn aspects. Rahu/Ketu 5/7/9 aspects are documented here as the chosen node tradition.",
            ),
        ),
        meta=ResponseMeta(
            calculation_version=chart.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )
    return response
