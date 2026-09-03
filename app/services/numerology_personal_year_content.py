"""Personal Year cycle meanings (Phase 4, NUM-40 … NUM-41).

Personal Year is a 9-year cycle applied to:
1. Personal Year — derived from birth date + governing year
2. Personal Month — derived from personal year + calendar month
3. Personal Day — derived from personal month + day of month

Each level nests inside the previous: the day's energy flavours the month's,
which flavours the year's. The 9-year cycle repeats — year 9 closes one arc,
year 1 begins the next.

Unlike root/compound readings, Personal Year copy is **directly actionable**
— it names the theme of a period and what to do with it, not the graha's
character. Cheiro (1935) did not codify Personal Year meanings; they are
drawn from modern numerology practice rooted in his compounds.

CONTENT_REVIEWED applies here as it does to root readings: Tamil native
review and astrologer sign-off are both required before this ship.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class PersonalYearMeaning:
    """Theme, action, and cautions for a year number."""

    number: int
    theme_ta: str
    theme_en: str
    action_ta: str
    action_en: str
    watch_ta: str
    watch_en: str
    month_hint_ta: str
    month_hint_en: str


#: Flip only after (a) a Tamil native review and (b) astrologer sign-off.
CONTENT_REVIEWED: bool = False


_PERSONAL_YEAR_MEANINGS: dict[int, PersonalYearMeaning] = {
    1: PersonalYearMeaning(
        1,
        "புதிய ஆரம்பம், தலைமை, சுயமாக முடிவெடுக்கல்.",
        "New beginnings, leadership, self-direction.",
        "புது யோजना தொடங்கவும். தைரியத்துடன் முன்னெடுக்கவும்.",
        "Start new projects. Lead with confidence.",
        "சிறிய பிரச்சினைகளை பெரிதாக்காமல் இருக்கவும். பிறரின் ஆலோசனையையும் கேட்கவும்.",
        "Avoid magnifying small issues. Listen to others' input.",
        "ஒவ்வொரு மாதத்திலும் ஏதோ ஒன்று தொடங்குங்கள். சிறு பদம் பெரு பயனாய் வரும்.",
        "Each month, initiate something. Small steps compound.",
    ),
    2: PersonalYearMeaning(
        2,
        "ஒத்துழைப்பு, பொறுமை, உறவுகளை பலப்படுத்துதல்.",
        "Cooperation, patience, deepening relationships.",
        "பிறருடன் இணைந்து வேலை செய்யவும். வலிமைசாலி கூட்டாளிகளைக் கண்டறியவும்.",
        "Work with others. Find allies for the long journey.",
        "தனிமையில் வாழ்பவர்போல் நடக்க வேண்டாம். முடிவு தாமதமாக வந்தாலும் சரியே.",
        "Avoid going it alone. Slow decisions are not failures.",
        "ஒவ்வொரு மாதத்தையும் ஒரு உறவைப் பழக்கமாக்கவும். மாத நிறைவில் தொடர்பு சரிபார்க்கவும்.",
        "Each month, deepen one connection. Tend relationships.",
    ),
    3: PersonalYearMeaning(
        3,
        "வெளிப்பாடு, மிகுதி, படைப்பக ஆக்கம்.",
        "Expression, abundance, creative communication.",
        "கற்பதையும் கற்பிப்பதையும் விரிவாக்கவும். பேச்சு, எழுத்து, கலைகளில் முயற்சி செய்யவும்.",
        "Expand what you learn and teach. Try writing, speaking, arts.",
        "ஒரே சமயத்தில் பலவற்றை ஏற்றால் சிதறிவிடும். முக்கியமான விஷயங்களை தேர்ந்தெடுக்கவும்.",
        "Spreading too thin scatters results. Prioritize.",
        "ஒவ்வொரு மாதத்தில் ஒரு புது திறன் கற்றுக்கொள்ளவும். மாத இறுதியில் வளர்ச்சி பதிவு செய்யவும்.",
        "Learn one new skill each month. Journal to track growth.",
    ),
    4: PersonalYearMeaning(
        4,
        "அஸ்திவாரம் இடுதல், ஒழுங்குவகை, கடின உழைப்பு.",
        "Foundation-building, structure, solid work.",
        "அடிப்படை விஷயங்களை ஒழுங்குசெய்யவும். தீர்ப்பான பிரிவினையாக்கம் செய்யவும்.",
        "Organize fundamentals. Build systems that last.",
        "பொறுமை நீண்ட கால பலன் தரும். அவசரப்படாமல் முயற்சி தொடரவும்.",
        "Patience yields long-term results. Stick with it.",
        "ஒவ்வொரு மாதத்தில் ஒரு வழக்கை அமைத்துக்கொள்ளவும். நாட்களையே ஒட்டிப்போயிடும் என்பார் பழைய முதியோர்.",
        "Build one routine per month. Consistency creates structure.",
    ),
    5: PersonalYearMeaning(
        5,
        "மாற்றம், பயணம், விரைவான முன்னேற்றம்.",
        "Change, travel, dynamic progress.",
        "பகுதி இடம்பெயர்ந்தாலும் புது தொடர்புகளை உண்டாக்கவும். சுற்றுலாவையும் கற்றலையும் தழுவவும்.",
        "Embrace travel and new connections. Meet people.",
        "மாற்றத்தையே கொண்டாடாமல் வாழ்தல் சிரமம் ஆகும். வேக்கை ஆள்வதற்குக் கற்றுக்கொள்ளவும்.",
        "Change can feel chaotic; learn to lead it, not follow.",
        "ஒவ்வொரு மாதத்திலும் ஒரு நேர்நிலை மாற்றம் செய்யவும். தொடர்புகளின் தொறி உள்ளே வைத்திருங்கள்.",
        "Each month, try a new way of doing something. Stay flexible.",
    ),
    6: PersonalYearMeaning(
        6,
        "பொறுப்பு, சேவை, குடும்ப விஷயங்கள் முக்கியம்.",
        "Responsibility, service, family matters.",
        "குடும்பம் மற்றும் சமூகத்திற்குப் பணிவிடை செய்யவும். உங்களிடம் உள்ளதைப் பிறருடன் பகிர்ந்துகொள்ளவும்.",
        "Tend to family and community. Offer what you have.",
        "சௌகரியத்தை நாடுவது வளர்ச்சியை தள்ளிவைக்கலாம். பொறுப்பும் நிம்மதியும் சமைக்கவும்.",
        "Ease-seeking can stall growth. Balance comfort with duty.",
        "ஒவ்வொரு மாதத்தில் ஒருவரையாவது உதவி செய்யவும். நன்றி நினைத்து நினைவினுள் வைக்கவும்.",
        "Serve one person each month. Gratitude roots belonging.",
    ),
    7: PersonalYearMeaning(
        7,
        "ஆய்வு, உள்நோக்கி சிந்தனை, ஆன்ம வேட்கை.",
        "Study, introspection, spiritual seeking.",
        "தனிமையையும் ஆழ்ந்த சிந்தனையையும் விலை கொடுக்கவும். உள்ளறிவை உணரவும்.",
        "Honor solitude and reflection. Explore inner life.",
        "மிக அதிக தனிமை இதயத்தை தளர்த்தலாம். சிலருடன் தொடர்பு பராமரிக்கவும்.",
        "Too much solitude can isolate. Maintain key connections.",
        "ஒவ்வொரு மாதத்தில் தினசரி எழுதவும். உள்ள கருத்தை வெளியே சொல்லவும்.",
        "Journal each month. Speak your inner thoughts aloud.",
    ),
    8: PersonalYearMeaning(
        8,
        "சக்தி, பொருள் வளர்ச்சி, உழைப்பின் பயன் அறுவடை.",
        "Power, material progress, harvest of effort.",
        "நீண்ட கால உழைப்பின் பயனை கோரவும். பணமும் முறையும் புரிந்துகொள்ளவும்.",
        "Claim results of past effort. Understand money.",
        "சக்தி நேர்மையும் சேர்ந்து வரவேண்டும். விசுவாசம் மற்றும் நீதியை முக்கியம் வைக்கவும்.",
        "Power without integrity corrupts. Keep ethics center.",
        "ஒவ்வொரு மாதத்தில் நிதி நோக்கவும். தொடர்ந்து வேலை செய்து செயலில் இருக்கவும்.",
        "Review finances each month. Honor your commitments.",
    ),
    9: PersonalYearMeaning(
        9,
        "நிறைவு, விடுதல், புதிய வட்டத்திற்கு தயாரிப்பு.",
        "Completion, release, preparing for renewal.",
        "முடிக்கப்படாத வேலைகளை முடிக்கவும். விட்டுவிடுவதை கற்றுக்கொள்ளவும்.",
        "Complete what needs finishing. Practice letting go.",
        "இந்த மாதத்தில் புது விஷயம் தொடங்க வேண்டாம். கடந்த ஆண்டை மனதில் சிந்திக்கவும்.",
        "Avoid starting fresh projects. Reflect on the cycle.",
        "ஒவ்வொரு மாதம் ஒன்றை விடுத்துவிடவும். முதல் வட்டம் நிறைவுக்கு வந்தது என்று நினைக்கவும்.",
        "Release one thing each month. Prepare for renewal.",
    ),
}


def personal_year_meaning(number: int) -> PersonalYearMeaning | None:
    """Fetch meaning for a personal year number."""
    return _PERSONAL_YEAR_MEANINGS.get(number)


def content_is_renderable() -> bool:
    """False while this corpus is unreviewed. Gate user-facing prose on this.

    A function, not a re-export of the constant, for the same reason
    ``numerology_content.corpus_is_renderable`` is one: a consumer that does
    ``from ... import CONTENT_REVIEWED`` binds the *value* at import time, so
    the gate silently stops tracking the flag. This corpus is gated separately
    from the root/compound one — it clears review on its own schedule.
    """
    return CONTENT_REVIEWED
