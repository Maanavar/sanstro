"""Bilingual numerology corpus (NUM-13, NUM-14).

Two corpora with very different readiness:

* **Root readings 1-9** — drafted here, grounded in the significations of the
  graha each number maps to (``numerology.NUMBER_TO_GRAHA``), deliberately
  short and non-committal. ``CONTENT_REVIEWED`` is ``False``: the Tamil has not
  had a native pass and an astrologer has not signed the framings off.

* **Compound readings 10-52** — sourced (NUM-05 discharged) to *Cheiro, Book of
  Numbers*, 1935 ed., pp. 126-133. All 43 are present: 26 carry distinct
  meanings, 17 are numbers Cheiro explicitly reads as repeating an earlier one
  (``echoes``), which is his structure and not a shortcut of ours.

  **His originals are heavily fatalistic** — "Death", "Shattered Citadel",
  "fatality, accidents, defeat of plans", "disasters through associations". Plan
  §9.3 forbids us speaking that way, so the classical *title* is preserved
  (scholarship) while the *meaning* is re-rendered as tendency and something the
  reader can act on. ``CompoundTone`` records Cheiro's original register on
  every row so the distance between his framing and ours stays auditable rather
  than quietly erased. A cautionary number still reads as cautionary — it just
  does not read as a sentence passed on the user.

Safety (plan §9.3) — the 8-and-4 fear trade is banned
------------------------------------------------------
Scaring users about Sani (8) and Rahu (4) is the most profitable and most
corrosive practice in this trade. Sani is the karaka of longevity, discipline
and earned result; Rahu is ambition and reinvention. Neither is evil. Copy here
frames every number as tendency, never as verdict or threat, and
``tests/test_numerology_core.py`` lints the corpus against ``BANNED_FEAR_TERMS``
so a future edit cannot quietly reintroduce doom-framing.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from app.calculations.display_names import planet_en, planet_ta
from app.calculations.numerology import NUMBER_TO_GRAHA

#: Flip only after (a) a Tamil native review and (b) astrologer sign-off on the
#: framings. Callers that render user-facing prose must check this.
CONTENT_REVIEWED: bool = False


@dataclass(frozen=True, slots=True)
class RootReading:
    """Short, hedged character note for a root number."""

    number: int
    graha: str
    nature_ta: str
    nature_en: str
    strength_ta: str
    strength_en: str
    care_ta: str
    care_en: str

    @property
    def graha_ta(self) -> str:
        return planet_ta(self.graha)

    @property
    def graha_en(self) -> str:
        return planet_en(self.graha)


#: Terms that must never appear in this corpus. Fear-selling on 4/8 is the
#: specific abuse this guards, but the list is not number-scoped — no number
#: gets doom copy.
BANNED_FEAR_TERMS: frozenset[str] = frozenset({
    "unlucky",
    "cursed",
    "doomed",
    "danger",
    "dangerous",
    "evil",
    "disaster",
    "ruin",
    "destroy",
    "avoid this number",
    "must change",
    "guaranteed",
    "will fail",
    "bad number",
})


_ROOT_READINGS: dict[int, RootReading] = {
    1: RootReading(
        1, "SUN",
        "தலைமை, தன்னம்பிக்கை, சுயமாக முடிவெடுக்கும் தன்மை.",
        "Leadership, self-reliance, a habit of deciding alone.",
        "முன்னெடுத்துச் செல்லும் திறன்.",
        "Carries initiative well.",
        "பிறர் கருத்தையும் கேட்பது நல்லது.",
        "Tends to benefit from consulting others.",
    ),
    2: RootReading(
        2, "MOON",
        "மனஉணர்வு, ஒத்துழைப்பு, கற்பனைத் திறன்.",
        "Sensitivity, cooperation, imagination.",
        "இணைந்து செயல்படுவதில் சிறப்பு.",
        "Works well alongside others.",
        "முடிவெடுப்பதில் தயக்கம் வரலாம்.",
        "Decisions can take longer to settle.",
    ),
    3: RootReading(
        3, "JUPITER",
        "அறிவு, வழிகாட்டல், விரிவாக்கம்.",
        "Learning, guidance, expansion.",
        "கற்பதிலும் கற்பிப்பதிலும் ஈடுபாடு.",
        "Inclined to study and to teach.",
        "ஒரே நேரத்தில் பலவற்றை ஏற்பது சிரமம் தரலாம்.",
        "Taking on many things at once can stretch thin.",
    ),
    4: RootReading(
        4, "RAHU",
        "வழக்கத்திற்கு மாறான சிந்தனை, திடீர் திருப்பங்கள்.",
        "Unconventional thinking, sudden turns.",
        "புதிய வழிகளைக் கண்டறியும் திறன்.",
        "Finds routes others do not look for.",
        "திட்டமிடலும் ஒழுங்கும் பயன் தரும்.",
        "Benefits from structure and planning.",
    ),
    5: RootReading(
        5, "MERCURY",
        "தொடர்பு, வணிகத் திறன், விரைவான புரிதல்.",
        "Communication, commerce, quick understanding.",
        "பேச்சிலும் பரிவர்த்தனையிலும் சாதுர்யம்.",
        "Adept in speech and in dealings.",
        "ஒரு விஷயத்தில் நிலைத்திருப்பது பயிற்சி கேட்கும்.",
        "Staying with one thing takes deliberate practice.",
    ),
    6: RootReading(
        6, "VENUS",
        "கலை, இணக்கம், வசதியான சூழல் விருப்பம்.",
        "Art, harmony, a liking for comfortable surroundings.",
        "உறவுகளிலும் ரசனையிலும் வலிமை.",
        "Strong in relationships and in taste.",
        "சௌகரியத்தை நாடுவது தாமதம் தரலாம்.",
        "A pull toward ease can slow things.",
    ),
    7: RootReading(
        7, "KETU",
        "உள்நோக்கு, ஆய்வு, தனிமையில் தெளிவு.",
        "Introspection, research, clarity found alone.",
        "ஆழமாகச் சிந்திக்கும் பழக்கம்.",
        "Habitually thinks deeply.",
        "தன் எண்ணங்களை வெளிப்படுத்துவது பயனளிக்கும்.",
        "Speaking thoughts aloud tends to help.",
    ),
    8: RootReading(
        8, "SATURN",
        "பொறுமை, உழைப்பால் வரும் பலன், நிலைத்தன்மை.",
        "Patience, result earned through work, endurance.",
        "நீண்ட கால முயற்சியில் உறுதி.",
        "Holds steady over long efforts.",
        "பலன் தாமதமாக வரலாம்; அது தோல்வி அல்ல.",
        "Results often arrive late; that is not failure.",
    ),
    9: RootReading(
        9, "MARS",
        "துணிவு, முனைப்பு, செயலில் இறங்கும் வேகம்.",
        "Courage, drive, readiness to act.",
        "தடைகளை எதிர்கொள்ளும் திறன்.",
        "Meets obstacles head-on.",
        "அவசரம் தவிர்த்தால் பலன் கூடும்.",
        "Less haste tends to improve the outcome.",
    ),
}

# ---------------------------------------------------------------------------
# Compound numbers 10-52 (NUM-05)
# ---------------------------------------------------------------------------
#: Source for the classical titles and their original sense.
COMPOUND_SOURCE = (
    "Cheiro, Book of Numbers (London: Herbert Jenkins Ltd, 1935 ed.), pp. 126-133 — "
    "the compound/fadic series 10-52."
)

#: Why the series stops at 52: after the root 9, adding the mystical 7 to the
#: compound 45 gives 52, read as the 52 weeks of the year.


class CompoundTone(StrEnum):
    """Cheiro's original register for a compound number.

    Recorded so the gap between his framing and ours stays auditable. Cheiro's
    cautionary numbers are written fatalistically ("fatality", "disasters",
    "defeat of plans"); plan §9.3 forbids us speaking that way. We keep his
    *title* — that is scholarship — and re-render the *meaning* as tendency and
    something actionable. Sanitising silently would be dishonest; this field is
    how we avoid that.
    """

    FAVOURABLE = "favourable"
    MIXED = "mixed"
    CAUTIONARY = "cautionary"


@dataclass(frozen=True, slots=True)
class CompoundReading:
    number: int
    #: Cheiro's classical title, preserved verbatim where he gave one.
    title_en: str
    reading_en: str
    reading_ta: str
    tone: CompoundTone
    #: Set when Cheiro treats this number as repeating an earlier one's meaning.
    echoes: int | None = None


_COMPOUND_BASE: dict[int, CompoundReading] = {
    10: CompoundReading(10, "Wheel of Fortune",
        "Self-belief and momentum; plans tend to carry.",
        "தன்னம்பிக்கையும் முன்னேற்றமும்; திட்டங்கள் நிறைவேறும் போக்கு.",
        CompoundTone.FAVOURABLE),
    11: CompoundReading(11, "The Clenched Hand",
        "Classically a warning number. Read as: test what you are told before relying on it.",
        "பாரம்பரியமாக எச்சரிக்கை எண். சொல்லப்படுவதைச் சரிபார்த்த பின் நம்புவது நல்லது.",
        CompoundTone.CAUTIONARY),
    12: CompoundReading(12, "The Sacrifice",
        "A tendency to carry other people's plans. Worth asking whose goal you are serving.",
        "பிறரின் திட்டங்களைச் சுமக்கும் போக்கு. யாருடைய இலக்கு என்பதைக் கேட்பது நல்லது.",
        CompoundTone.CAUTIONARY),
    13: CompoundReading(13, "Change",
        "Upheaval and reinvention — classically misread as ill fortune. It marks change, not loss.",
        "மாற்றமும் புதுப்பிப்பும் — தவறாகப் புரிந்துகொள்ளப்படும் எண். இழப்பு அல்ல, மாற்றமே.",
        CompoundTone.MIXED),
    14: CompoundReading(14, "Movement",
        "Motion and risk together. Favours action, asks for care with money and speculation.",
        "இயக்கமும் இடர்பாடும் சேர்ந்தது. செயலுக்கு உகந்தது; பணத்தில் கவனம் தேவை.",
        CompoundTone.MIXED),
    15: CompoundReading(15, "The Magician",
        "Persuasion and charm; strong in speech and in drawing people in.",
        "பேச்சாற்றலும் கவர்ச்சியும்; மக்களை ஈர்க்கும் ஆற்றல்.",
        CompoundTone.FAVOURABLE),
    16: CompoundReading(16, "The Shattered Citadel",
        "Classically the sharpest warning in the series. Read as: check the foundation before you build higher.",
        "வரிசையிலேயே கடுமையான எச்சரிக்கை. மேலே கட்டுவதற்கு முன் அடித்தளத்தைச் சரிபார்.",
        CompoundTone.CAUTIONARY),
    17: CompoundReading(17, "The Star of the Magi",
        "Rising after difficulty; associated with lasting name rather than quick gain.",
        "சிரமத்திற்குப் பின் உயர்வு; விரைவான ஆதாயத்தை விட நிலையான புகழ்.",
        CompoundTone.FAVOURABLE),
    18: CompoundReading(18, "Material and Spirit in Conflict",
        "A pull between material and inner aims. Progress comes from choosing one clearly.",
        "பொருள் நோக்கமும் உள்நோக்கமும் இழுபறி. ஒன்றைத் தெளிவாகத் தேர்வது முன்னேற்றம்.",
        CompoundTone.CAUTIONARY),
    19: CompoundReading(19, "The Sun",
        "Cheiro's most favourable compound — recognition, warmth, things coming right.",
        "சீரோ கூறும் மிகச் சிறந்த எண் — அங்கீகாரம், வெப்பம், சாதகமான முடிவு.",
        CompoundTone.FAVOURABLE),
    20: CompoundReading(20, "The Awakening",
        "A call toward purpose. Strong inwardly, slower in worldly matters.",
        "நோக்கத்தை நோக்கிய அழைப்பு. உள்ளத்தில் வலிமை; உலக விஷயங்களில் தாமதம்.",
        CompoundTone.MIXED),
    21: CompoundReading(21, "The Crown of the Magi",
        "Advancement and honour, characteristically arriving after a long struggle.",
        "முன்னேற்றமும் மரியாதையும்; நீண்ட போராட்டத்திற்குப் பின் வருவது வழக்கம்.",
        CompoundTone.FAVOURABLE),
    22: CompoundReading(22, "The Good Man Blinded",
        "Classically a warning about misjudgement. Read as: seek an outside view before deciding.",
        "தவறான மதிப்பீடு குறித்த எச்சரிக்கை. முடிவெடுக்கும் முன் வெளிக் கருத்து நல்லது.",
        CompoundTone.CAUTIONARY),
    23: CompoundReading(23, "The Royal Star of the Lion",
        "Help arriving from people above you; things opening that were not asked for.",
        "மேலிடத்திலிருந்து உதவி; கேட்காமலே வாய்ப்புகள் திறக்கும்.",
        CompoundTone.FAVOURABLE),
    24: CompoundReading(24, "Assistance",
        "Gain through affection and through people of standing.",
        "அன்பினாலும் உயர்ந்தோர் தொடர்பினாலும் ஆதாயம்.",
        CompoundTone.FAVOURABLE),
    25: CompoundReading(25, "Strength Through Experience",
        "Success that arrives via difficulty rather than around it.",
        "சிரமத்தைத் தவிர்த்து அல்ல, கடந்து வரும் வெற்றி.",
        CompoundTone.MIXED),
    26: CompoundReading(26, "Partnership Warnings",
        "Classically a caution about company kept. Read as: choose partners deliberately.",
        "கூட்டு குறித்த எச்சரிக்கை. துணைவரைக் கவனமாகத் தேர்ந்தெடு.",
        CompoundTone.CAUTIONARY),
    27: CompoundReading(27, "The Sceptre",
        "Authority earned by intellect; reward for one's own thinking.",
        "அறிவால் பெறும் அதிகாரம்; சொந்தச் சிந்தனைக்கான பலன்.",
        CompoundTone.FAVOURABLE),
    28: CompoundReading(28, "Contradictions",
        "A pattern of building, losing ground, and building again. Endurance is the theme.",
        "கட்டுதல், இழத்தல், மீண்டும் கட்டுதல் என்ற சுழற்சி. பொறுமையே கருப்பொருள்.",
        CompoundTone.CAUTIONARY),
    29: CompoundReading(29, "Uncertain Ground",
        "Classically read as trials through others. Read as: verify what you are promised.",
        "பிறரால் வரும் சோதனைகள். வாக்குறுதிகளைச் சரிபார்ப்பது நல்லது.",
        CompoundTone.CAUTIONARY),
    30: CompoundReading(30, "Mental Superiority",
        "Thought above gain — capable, and often indifferent to material reward.",
        "ஆதாயத்தை விட சிந்தனை; திறமை உண்டு, பொருள் மீது ஈர்ப்பு குறைவு.",
        CompoundTone.MIXED),
    31: CompoundReading(31, "The Recluse",
        "Self-contained and solitary; strong inwardly, less so in worldly terms.",
        "தன்னிறைவும் தனிமையும்; உள்ளத்தில் வலிமை, உலகில் குறைவு.",
        CompoundTone.MIXED),
    32: CompoundReading(32, "Magical Power",
        "Persuasive with groups. Works when the person holds to their own judgement.",
        "கூட்டத்தை வசப்படுத்தும் ஆற்றல். சொந்த முடிவில் உறுதியாக இருக்கும்போது பலன்.",
        CompoundTone.FAVOURABLE),
    37: CompoundReading(37, "Good Friendships",
        "Favourable for partnership and affection; good fortune through alliance.",
        "கூட்டுறவுக்கும் அன்புக்கும் உகந்தது; இணைவால் நல்வாய்ப்பு.",
        CompoundTone.FAVOURABLE),
    43: CompoundReading(43, "Upheaval",
        "Classically the least favourable compound. Read as: a period asking for steadiness, not new ventures.",
        "வரிசையில் மிகக் குறைவான சாதகம். புதிய முயற்சிகளை விட நிலைத்தன்மை தேவைப்படும் காலம்.",
        CompoundTone.CAUTIONARY),
    51: CompoundReading(51, "The Warrior",
        "Sudden advancement and a fighting nature; prominence that attracts opposition.",
        "திடீர் முன்னேற்றமும் போராடும் குணமும்; எதிர்ப்பை ஈர்க்கும் முன்னிலை.",
        CompoundTone.MIXED),
}

#: Numbers Cheiro treats as repeating an earlier compound's meaning.
_COMPOUND_ECHOES: dict[int, int] = {
    33: 24, 34: 25, 35: 26, 36: 27,
    38: 29, 39: 30, 40: 31, 41: 32, 42: 24,
    44: 26, 45: 27, 46: 37, 47: 29, 48: 30, 49: 31, 50: 32,
    52: 43,
}

COMPOUND_READINGS: dict[int, CompoundReading] = {
    **_COMPOUND_BASE,
    **{
        number: CompoundReading(
            number=number,
            title_en=_COMPOUND_BASE[base].title_en,
            reading_en=_COMPOUND_BASE[base].reading_en,
            reading_ta=_COMPOUND_BASE[base].reading_ta,
            tone=_COMPOUND_BASE[base].tone,
            echoes=base,
        )
        for number, base in _COMPOUND_ECHOES.items()
    },
}


def root_reading(number: int) -> RootReading:
    if number not in _ROOT_READINGS:
        raise KeyError(f"root number must be 1..9, got {number}")
    return _ROOT_READINGS[number]


def compound_reading(compound: int | None) -> CompoundReading | None:
    """Reading for a compound number, or ``None`` for a single-digit total.

    Never falls back to the root reading — the compound carries different
    meaning from its root, and substituting one for the other is the exact
    silently-wrong behaviour this corpus exists to prevent.
    """
    if compound is None:
        return None
    return COMPOUND_READINGS.get(compound)


def all_compound_readings() -> tuple[CompoundReading, ...]:
    return tuple(COMPOUND_READINGS[n] for n in sorted(COMPOUND_READINGS))


def all_root_readings() -> tuple[RootReading, ...]:
    return tuple(_ROOT_READINGS[n] for n in sorted(_ROOT_READINGS))


def corpus_is_renderable() -> bool:
    """False while the corpus is unreviewed. Gate user-facing prose on this."""
    return CONTENT_REVIEWED


def _assert_graha_mapping_matches_engine() -> None:
    """The corpus must not drift from ``numerology.NUMBER_TO_GRAHA``."""
    for number, reading in _ROOT_READINGS.items():
        expected = NUMBER_TO_GRAHA[number]
        if reading.graha != expected:
            raise RuntimeError(
                f"corpus graha for {number} is {reading.graha}, engine says {expected}"
            )


_assert_graha_mapping_matches_engine()
