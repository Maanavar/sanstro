from __future__ import annotations

from dataclasses import dataclass

from pydantic import BaseModel, ConfigDict, Field

from app.calculations.porutham import GANA_BY_NAKSHATRA, YONI_BY_NAKSHATRA


@dataclass(frozen=True)
class NakshatraLens:
    ta: str
    en: str


# Compact, supportive archetype lines for all 27 janma nakshatras.
# These are interpretation overlays only and never alter computed astrology.
# RP-02 (2026-07-16): the `ta` column was rewritten from romanized Thanglish
# into Tamil script, contemporary register; PENDING NATIVE-TAMIL REVIEW.
NAKSHATRA_LENS: dict[int, NakshatraLens] = {
    1: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் அசுவினி — இயல்பான வேகம் இருக்கட்டும்; ஆனால் முடிவுகளை நிதானமாக எடுங்கள்.",
        en="Aswini lens: keep your natural speed, but make decisions with calm pacing.",
    ),
    2: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் பரணி — பொறுப்பு உங்கள் பலம்; தேவைக்கு மேல் சுமையை ஏற்காதீர்கள்.",
        en="Bharani lens: responsibility is your strength; avoid carrying more than needed.",
    ),
    3: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் கார்த்திகை — தெளிவு முக்கியம்; தேவையில்லாத மோதலைத் தவிர்க்கவும்.",
        en="Karthigai lens: clarity is key; avoid unnecessary conflict.",
    ),
    4: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் ரோகிணி — நிதானமான, உறுதியான முயற்சி இன்று நல்ல பலன் தரும்.",
        en="Rohini lens: steady and grounded effort can bring good outcomes today.",
    ),
    5: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் மிருகசீரிடம் — தேடும் ஆர்வம் உங்கள் வரம்; ஒரு நேரத்தில் ஒரு வேலையில் கவனம் வையுங்கள்.",
        en="Mirugaseeridam lens: curiosity is your gift; focus on one clear task at a time.",
    ),
    6: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் திருவாதிரை — ஆழ்ந்த சிந்தனையைப் பயன்படுத்துங்கள்; அளவுக்கு மீறி யோசிப்பதைத் தவிர்க்கவும்.",
        en="Thiruvathirai lens: use depth of thought well, while reducing overthinking.",
    ),
    7: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் புனர்பூசம் — மீண்டு எழும் சக்தி உங்களிடம் உண்டு; நம்பிக்கையை காத்துக்கொள்ளுங்கள்.",
        en="Punarpoosam lens: you recover and rebuild well; protect your optimism.",
    ),
    8: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் பூசம் — பிறரை பராமரிப்பது உங்கள் பலம்; உங்களுக்கான ஓய்வு நேரத்தையும் காத்துக்கொள்ளுங்கள்.",
        en="Poosam lens: nurturing is your strength; also preserve your own recovery time.",
    ),
    9: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் ஆயில்யம் — உணர்வுகளில் தெளிவு முக்கியம்; ஊகிப்பதற்கு முன் கேட்டுத் தெளியுங்கள்.",
        en="Ayilyam lens: emotional clarity matters; ask before assuming intent.",
    ),
    10: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் மகம் — கண்ணியத்துடன் பணிவும் சேர்ந்தால் இன்று நல்ல பலன்.",
        en="Magam lens: dignity with humility is especially effective today.",
    ),
    11: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் பூரம் — உறவுகளில் மகிழ்ச்சி இருக்கட்டும்; அதே நேரம் எல்லைகள் தெளிவாக இருக்கட்டும்.",
        en="Pooram lens: enjoy connection, while keeping boundaries clear.",
    ),
    12: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் உத்திரம் — ஒப்பந்தங்களிலும் முடிவுகளிலும் நியாயத்தை உறுதியாகப் பிடித்துக்கொள்ளுங்கள்.",
        en="Uthiram lens: in commitments and decisions, hold firm to fairness.",
    ),
    13: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் அஸ்தம் — கையில் இருப்பதை முழுமையாக முடியுங்கள்; பல வேலைகளை ஒரே நேரத்தில் இழுக்காதீர்கள்.",
        en="Hastham lens: finish what is in your hands well; avoid excessive multitasking.",
    ),
    14: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் சித்திரை — தரம் முக்கியம்தான்; ஆனால் முழுமை வேட்கையை அளவுக்குள் வையுங்கள்.",
        en="Chithirai lens: quality matters; keep perfectionism within healthy limits.",
    ),
    15: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் சுவாதி — சுதந்திரத்தை காத்துக்கொண்டே உறவுகளில் இணக்கத்தையும் பேணுங்கள்.",
        en="Swathi lens: preserve independence while maintaining harmony in relationships.",
    ),
    16: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் விசாகம் — இலக்கில் உங்கள் கவனம் வலுவானது; அவசரத்தை விட நிலையான முன்னேற்றத்தைத் தேர்வு செய்யுங்கள்.",
        en="Visakam lens: your goal focus is strong; choose steady progress over haste.",
    ),
    17: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் அனுசம் — நட்பு, அன்பு, ஒழுக்கம் மூன்றும் சமநிலையில் இருந்தால் இன்று நல்ல ஆதரவு.",
        en="Anusham lens: friendship, warmth, and discipline in balance can support today.",
    ),
    18: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் கேட்டை — உறுதியாகப் பேசுங்கள்; ஆனால் உறுதியோடு கருணையும் சேர்ந்திருக்கட்டும்.",
        en="Kettai lens: speak with strength, but pair firmness with compassion.",
    ),
    19: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் மூலம் — அடிப்படைக் காரணத்தைப் புரிந்து திருத்தும் அணுகுமுறை இன்று மிகவும் பயனுள்ளது.",
        en="Moolam lens: root-cause understanding and correction are highly useful today.",
    ),
    20: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் பூராடம் — உறுதியான நம்பிக்கை உங்கள் பலம்; சொல்லும் செயலும் ஒன்றாக இருக்கட்டும்.",
        en="Pooradam lens: conviction is your strength; keep words and actions aligned.",
    ),
    21: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் உத்திராடம் — பலன் தாமதமானாலும் நிலைத்து நிற்கும்; பொறுமையையும் ஒழுக்கத்தையும் கைவிடாதீர்கள்.",
        en="Uthiradam lens: results may be delayed but durable; stay with discipline and patience.",
    ),
    22: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் திருவோணம் — செயல்படும் முன் கவனமாகக் கேட்பது இன்று உங்களுக்கு வலுவான ஆதரவு.",
        en="Thiruvonam lens: listening carefully before acting gives you strong support today.",
    ),
    23: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் அவிட்டம் — குழு வேலைகளில் தாளம் தவறாதீர்கள்; அளவுக்கு மேல் பொறுப்புகளை ஏற்பதைத் தவிர்க்கவும்.",
        en="Avittam lens: keep rhythm in team efforts; reduce over-commitment.",
    ),
    24: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் சதயம் — புதிய யோசனைகளை வரவேற்கலாம்; ஆனால் சரிபார்த்த பின் முன்னேறுங்கள்.",
        en="Sadayam lens: welcome new ideas, and move forward with verification.",
    ),
    25: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் பூரட்டாதி — ஆழமான பார்வை உங்கள் பலம்; மனதுக்கு ஓய்வு நேரமும் கொடுங்கள்.",
        en="Poorattathi lens: deep insight is your strength; give the mind recovery space.",
    ),
    26: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் உத்திரட்டாதி — நிதானம், நீண்ட பார்வை, பொறுப்பு — இவை மூன்றும் இன்று நல்ல வழி காட்டும்.",
        en="Uthirattathi lens: patience, long view, and responsibility can carry the day.",
    ),
    27: NakshatraLens(
        ta="உங்கள் ஜன்ம நட்சத்திரம் ரேவதி — கருணையும் வழிகாட்டுதலும் உங்கள் பலம்; உங்கள் எல்லைகளையும் உறுதியாக காத்துக்கொள்ளுங்கள்.",
        en="Revathi lens: compassion and guidance are your strengths; keep boundaries firm.",
    ),
}

DEFAULT_LENS = NakshatraLens(
    ta="இன்று அமைதியான, நிலையான அணுகுமுறை நாளை மேம்படுத்த உதவும்.",
    en="Janma nakshatra lens: a calm, steady approach can improve today.",
)


def build_nakshatra_perspective(nakshatra_number: int, score_label: str) -> NakshatraLens:
    base = NAKSHATRA_LENS.get(nakshatra_number, DEFAULT_LENS)

    if score_label in {"CAUTION", "RESTORATIVE"}:
        return NakshatraLens(
            ta=f"{base.ta} இன்று பெரிய புதிய முடிவுகளை விட சிறிய, உறுதியான அடிகளே நல்லது.",
            en=f"{base.en} Today, prefer small and stable steps over major new commitments.",
        )

    if score_label in {"STRONG_SUPPORT", "GOOD"}:
        return NakshatraLens(
            ta=f"{base.ta} இன்று சாதகமான நேரங்களை முதலில் உங்கள் மிக முக்கியமான வேலைகளுக்குப் பயன்படுத்துங்கள்.",
            en=f"{base.en} Use supportive windows first for your highest-priority actions today.",
        )

    return base


# ---------------------------------------------------------------------------
# Nakshatra personality cards (merged from nakshatra_content_static.py)
# Full profile cards — used by the content API and share-card service.
# ---------------------------------------------------------------------------

class NakshatraBiText(BaseModel):
    ta: str
    en: str


class NakshatraCompatGroup(BaseModel):
    nakshatra_code: str
    nakshatra_name_ta: str
    nakshatra_name_en: str
    porutham_basis: str


# Display labels for the Gana/Yoni codes in app.calculations.porutham's
# GANA_BY_NAKSHATRA / YONI_BY_NAKSHATRA tables (Deva=1/Manushya=2/Rakshasa=3;
# 14 yoni animals) — same classical Porutham reference, just spelled out for
# the personality-card UI instead of used as a bare match-scoring code.
_GANA_LABELS: dict[int, tuple[str, str]] = {
    1: ("தேவ கணம்", "Deva Gana"),
    2: ("மனுஷ கணம்", "Manushya Gana"),
    3: ("ராட்சத கணம்", "Rakshasa Gana"),
}

_YONI_LABELS: dict[int, tuple[str, str]] = {
    1: ("குதிரை", "Horse"), 2: ("யானை", "Elephant"), 3: ("ஆடு", "Sheep"),
    4: ("பாம்பு", "Serpent"), 5: ("நாய்", "Dog"), 6: ("பூனை", "Cat"),
    7: ("எலி", "Rat"), 8: ("பசு", "Cow"), 9: ("எருமை", "Buffalo"),
    10: ("புலி", "Tiger"), 11: ("மான்", "Deer"), 12: ("குரங்கு", "Monkey"),
    13: ("சிங்கம்", "Lion"), 14: ("கீரி", "Mongoose"),
}


class NakshatraCard(BaseModel):
    number: int
    name_ta: str = Field(alias="nameTa")
    name_en: str = Field(alias="nameEn")
    deity_ta: str = Field(alias="deityTa")
    deity_en: str = Field(alias="deityEn")
    symbol_ta: str = Field(alias="symbolTa")
    symbol_en: str = Field(alias="symbolEn")
    ruling_planet: str = Field(alias="rulingPlanet")
    profile: NakshatraBiText
    strengths: list[NakshatraBiText]
    cautions: list[NakshatraBiText]
    compatible_groups: list[str] = Field(alias="compatibleGroups")
    compatible_groups_rich: list[NakshatraCompatGroup] = Field(alias="compatibleGroupsRich", default_factory=list)
    # Ganam/Yoni are derived from the same classical tables the Porutham engine
    # already uses (app.calculations.porutham) — not authored per-card below,
    # so a default sentinel here is always overwritten in model_post_init.
    ganam: NakshatraBiText = Field(default_factory=lambda: NakshatraBiText(ta="", en=""))
    yoni: NakshatraBiText = Field(default_factory=lambda: NakshatraBiText(ta="", en=""))

    model_config = ConfigDict(populate_by_name=True)

    def model_post_init(self, __context: object) -> None:
        if not self.compatible_groups_rich:
            self.compatible_groups_rich = [
                _build_compat_group(code, index)
                for index, code in enumerate(self.compatible_groups)
            ]
        if not self.ganam.ta:
            gana_ta, gana_en = _GANA_LABELS[GANA_BY_NAKSHATRA[self.number]]
            self.ganam = NakshatraBiText(ta=gana_ta, en=gana_en)
        if not self.yoni.ta:
            yoni_ta, yoni_en = _YONI_LABELS[YONI_BY_NAKSHATRA[self.number]]
            self.yoni = NakshatraBiText(ta=yoni_ta, en=yoni_en)


class NakshatraCardResponse(BaseModel):
    success: bool = True
    data: NakshatraCard


_NAKSHATRA_CODE_NAMES: dict[str, tuple[str, str]] = {
    "ASWINI": ("அசுவினி", "Aswini"),
    "BHARANI": ("பரணி", "Bharani"),
    "KARTHIGAI": ("கார்த்திகை", "Karthigai"),
    "ROHINI": ("ரோகிணி", "Rohini"),
    "MIRUGASEERIDAM": ("மிருகசீரிடம்", "Mirugaseeridam"),
    "THIRUVATHIRAI": ("திருவாதிரை", "Thiruvathirai"),
    "PUNARPOOSAM": ("புனர்பூசம்", "Punarpoosam"),
    "POOSAM": ("பூசம்", "Poosam"),
    "AYILYAM": ("ஆயில்யம்", "Ayilyam"),
    "MAGAM": ("மகம்", "Magam"),
    "POORAM": ("பூரம்", "Pooram"),
    "UTHIRAM": ("உத்திரம்", "Uthiram"),
    "HASTHA": ("ஹஸ்தம்", "Hastham"),
    "HASTHAM": ("ஹஸ்தம்", "Hastham"),
    "CHITHIRAI": ("சித்திரை", "Chithirai"),
    "SWATHI": ("சுவாதி", "Swathi"),
    "VISAKAM": ("விசாகம்", "Visakam"),
    "ANUSHAM": ("அனுசம்", "Anusham"),
    "KETTAI": ("கேட்டை", "Kettai"),
    "MOOLAM": ("மூலம்", "Moolam"),
    "POORADAM": ("பூராடம்", "Pooradam"),
    "UTHIRADAM": ("உத்திராடம்", "Uthiradam"),
    "THIRUVONAM": ("திருவோணம்", "Thiruvonam"),
    "AVITTAM": ("அவிட்டம்", "Avittam"),
    "SATHAYAM": ("சதயம்", "Sadayam"),
    "SADAYAM": ("சதயம்", "Sadayam"),
    "POORATTADHI": ("பூரட்டாதி", "Poorattathi"),
    "POORATTATHI": ("பூரட்டாதி", "Poorattathi"),
    "UTHIRATADHI": ("உத்திரட்டாதி", "Uthirattathi"),
    "UTHIRATTADHI": ("உத்திரட்டாதி", "Uthirattathi"),
    "REVATHI": ("ரேவதி", "Revathi"),
}

_PORUTHAM_BASIS_BY_POSITION = (
    "யோனி, கண ஒற்றுமை",
    "தின, மகேந்திர ஒற்றுமை",
    "ராசி, ரஜ்ஜு சமநிலை",
)


def _build_compat_group(code: str, index: int) -> NakshatraCompatGroup:
    name_ta, name_en = _NAKSHATRA_CODE_NAMES.get(code, (code, code.title()))
    return NakshatraCompatGroup(
        nakshatra_code=code,
        nakshatra_name_ta=name_ta,
        nakshatra_name_en=name_en,
        porutham_basis=_PORUTHAM_BASIS_BY_POSITION[index % len(_PORUTHAM_BASIS_BY_POSITION)],
    )


_CARDS: dict[int, NakshatraCard] = {
    1: NakshatraCard(
        number=1, nameTa="அசுவினி", nameEn="Aswini",
        deityTa="அசுவினி குமாரர்கள்", deityEn="Ashwini Kumaras (divine physicians)",
        symbolTa="குதிரை தலை", symbolEn="Horse head",
        rulingPlanet="KETU",
        profile=NakshatraBiText(
            ta="அசுவினி நட்சத்திரத்தினர் துடிப்பான, முன்னோக்கிய சிந்தனையுடன் செயல்படுவர். இவர்கள் விரைவான முடிவு எடுப்பவர்களாகவும், தொடக்கங்களில் சிறந்தவர்களாகவும் இருப்பர்.",
            en="Aswini natives are energetic and forward-thinking with a talent for quick action. They excel at initiating new endeavours and bringing fresh energy to any situation.",
        ),
        strengths=[
            NakshatraBiText(ta="துடிப்பான செயல்திறன்", en="Dynamic initiative"),
            NakshatraBiText(ta="குணமாக்கும் ஆற்றல்", en="Healing ability"),
            NakshatraBiText(ta="விரைவான முடிவெடுக்கும் திறன்", en="Quick decision-making"),
        ],
        cautions=[
            NakshatraBiText(ta="அவசரமான செயல்களை தவிர்க்கவும்", en="Avoid impulsive actions"),
            NakshatraBiText(ta="பொறுமையை வளர்க்கவும்", en="Cultivate patience"),
        ],
        compatibleGroups=["SATHAYAM", "HASTHA", "ROHINI"],
    ),
    2: NakshatraCard(
        number=2, nameTa="பரணி", nameEn="Bharani",
        deityTa="யமன்", deityEn="Yama (lord of dharma and death)",
        symbolTa="யோனி (கர்ப்பம்)", symbolEn="Yoni (womb, carrying vessel)",
        rulingPlanet="VENUS",
        profile=NakshatraBiText(
            ta="பரணி நட்சத்திரத்தினர் மிகவும் உழைப்பாளிகளும், பொறுப்பான முடிவெடுப்பவர்களும் ஆவர். இவர்கள் படைப்பு ஆற்றலிலும், மாற்றத்தை கையாள்வதிலும் சிறந்தவர்கள்.",
            en="Bharani natives are hardworking and take responsibility seriously. They have strong creative energy and the capacity to handle transformation.",
        ),
        strengths=[
            NakshatraBiText(ta="மிகுந்த உழைப்பு", en="Extraordinary diligence"),
            NakshatraBiText(ta="படைப்பு சக்தி", en="Creative force"),
            NakshatraBiText(ta="மாற்றங்களை சமாளிக்கும் திறன்", en="Capacity for transformation"),
        ],
        cautions=[
            NakshatraBiText(ta="அளவுக்கதிகமான சுமை ஏற்காதீர்", en="Avoid taking on excessive burdens"),
        ],
        compatibleGroups=["ROHINI", "REVATHI", "HASTHAM"],
    ),
    3: NakshatraCard(
        number=3, nameTa="கார்த்திகை", nameEn="Karthigai",
        deityTa="அக்னி / முருகன்", deityEn="Agni (fire god) / Murugan",
        symbolTa="சுடர் / கத்தி", symbolEn="Flame / Razor",
        rulingPlanet="SUN",
        profile=NakshatraBiText(
            ta="கார்த்திகை நட்சத்திரத்தினர் தெளிவான நோக்கமும், உயர்ந்த நோக்கங்களும் கொண்டவர்கள். இவர்கள் தலைமை குணமும், ஆழமான சுய-அறிவும் உடையவர்கள்.",
            en="Karthigai natives possess clarity of purpose and high aspirations. They carry natural leadership quality and deep self-awareness.",
        ),
        strengths=[
            NakshatraBiText(ta="தலைமை குணம்", en="Natural leadership"),
            NakshatraBiText(ta="தெளிவு மற்றும் நேர்மை", en="Clarity and integrity"),
            NakshatraBiText(ta="ஆழமான சிந்தனை", en="Deep thinking"),
        ],
        cautions=[
            NakshatraBiText(ta="கோபத்தை கட்டுப்படுத்தவும்", en="Manage temper"),
            NakshatraBiText(ta="நெகிழ்வுத்தன்மையை வளர்க்கவும்", en="Cultivate flexibility"),
        ],
        compatibleGroups=["UTHIRAM", "UTHIRADAM", "KARTHIGAI"],
    ),
    4: NakshatraCard(
        number=4, nameTa="ரோகிணி", nameEn="Rohini",
        deityTa="பிரம்மா", deityEn="Brahma (creator)",
        symbolTa="சகடம் / தாமரை", symbolEn="Chariot / Lotus",
        rulingPlanet="MOON",
        profile=NakshatraBiText(
            ta="ரோகிணி நட்சத்திரத்தினர் மிகவும் கவர்ச்சியானவர்களும், படைப்பு ஆற்றல் மிக்கவர்களும் ஆவர். இவர்கள் நல்ல சொல்வன்மையாளர்களாகவும், வளம் நல்குவோராகவும் இருப்பர்.",
            en="Rohini natives are charming and highly creative. They are gifted communicators and have a natural capacity to attract prosperity.",
        ),
        strengths=[
            NakshatraBiText(ta="வசீகரமான ஆளுமை", en="Charming personality"),
            NakshatraBiText(ta="படைப்பாற்றல்", en="Creative talent"),
            NakshatraBiText(ta="வளமை நல்கும் குணம்", en="Prosperity-attracting nature"),
        ],
        cautions=[
            NakshatraBiText(ta="அழகு சார்ந்த ஆசைகளில் நடுநிலை வேண்டும்", en="Balance desire for beauty and comfort"),
        ],
        compatibleGroups=["MIRUGASEERIDAM", "ANUSHAM", "THIRUVONAM"],
    ),
    5: NakshatraCard(
        number=5, nameTa="மிருகசீரிடம்", nameEn="Mirugaseeridam",
        deityTa="சோமா (சந்திரன்)", deityEn="Soma (Moon god)",
        symbolTa="மான் தலை", symbolEn="Deer head",
        rulingPlanet="MARS",
        profile=NakshatraBiText(
            ta="மிருகசீரிடம் நட்சத்திரத்தினர் அறிவு தாகம் கொண்டவர்கள், எப்போதும் ஏதாவது தேடிக்கொண்டே இருப்பர். இவர்கள் மென்மையான இதயம் மற்றும் கூர்மையான புத்தி கொண்டவர்கள்.",
            en="Mirugaseeridam natives are intellectually curious and always seeking. They combine a gentle heart with a sharp, investigative mind.",
        ),
        strengths=[
            NakshatraBiText(ta="அறிவுத் தேடல்", en="Intellectual curiosity"),
            NakshatraBiText(ta="ஆய்வு திறன்", en="Investigative ability"),
            NakshatraBiText(ta="மென்மையான இதயம்", en="Gentle nature"),
        ],
        cautions=[
            NakshatraBiText(ta="ஒரே விஷயத்தில் நிலைத்திருக்க கற்கவும்", en="Develop ability to stay focused"),
        ],
        compatibleGroups=["ROHINI", "CHITHIRAI", "UTHIRAM"],
    ),
    6: NakshatraCard(
        number=6, nameTa="திருவாதிரை", nameEn="Thiruvathirai",
        deityTa="ருத்ரன் / சிவன்", deityEn="Rudra / Shiva",
        symbolTa="ஒரே நட்சத்திரம் (ஆர்த்ரா)", symbolEn="Single bright star (Betelgeuse)",
        rulingPlanet="RAHU",
        profile=NakshatraBiText(
            ta="திருவாதிரை நட்சத்திரத்தினர் மாற்றத்தின் சக்தி கொண்டவர்கள். இவர்கள் ஆழமான சிந்தனையாளர்கள், மற்றவர்களை தாண்டி யோசிக்கும் திறன் கொண்டவர்கள்.",
            en="Thiruvathirai natives carry transformative energy. They are deep thinkers who see beyond conventional boundaries.",
        ),
        strengths=[
            NakshatraBiText(ta="மாற்றும் சக்தி", en="Transformative power"),
            NakshatraBiText(ta="ஆழமான சிந்தனை", en="Deep thinking"),
            NakshatraBiText(ta="அறிவியல் ஆர்வம்", en="Scientific curiosity"),
        ],
        cautions=[
            NakshatraBiText(ta="கோபத்தை குணமாக்கலாக மாற்றவும்", en="Channel anger constructively"),
        ],
        compatibleGroups=["SATHAYAM", "SWATHI", "KETTAI"],
    ),
    7: NakshatraCard(
        number=7, nameTa="புனர்பூசம்", nameEn="Punarpoosam",
        deityTa="அதிதி", deityEn="Aditi (mother of the gods)",
        symbolTa="அம்புறாத்தூணி / வீடு மீட்சி", symbolEn="Quiver of arrows / Return home",
        rulingPlanet="JUPITER",
        profile=NakshatraBiText(
            ta="புனர்பூசம் நட்சத்திரத்தினர் தொன்றும் புதுமையும் இணைந்தவர்கள். இவர்கள் மீண்டும் எழுவதில் தனித்தமான ஆற்றல் கொண்டவர்கள், மற்றவர்களுக்கு நம்பிக்கை தருவர்.",
            en="Punarpoosam natives blend tradition with renewal. They have a unique ability to recover and rise again, offering hope and wisdom to others.",
        ),
        strengths=[
            NakshatraBiText(ta="மீண்டெழும் சக்தி", en="Resilience"),
            NakshatraBiText(ta="ஞானம்", en="Wisdom"),
            NakshatraBiText(ta="பாதுகாப்பான இயல்பு", en="Nurturing nature"),
        ],
        cautions=[
            NakshatraBiText(ta="பழைய முறைகளில் தேங்கிவிடாதீர்", en="Avoid getting stuck in old patterns"),
        ],
        compatibleGroups=["POOSAM", "VISAKAM", "UTHIRATADHI"],
    ),
    8: NakshatraCard(
        number=8, nameTa="பூசம்", nameEn="Poosam",
        deityTa="பிரஹஸ்பதி (குரு)", deityEn="Brihaspati (Jupiter, divine teacher)",
        symbolTa="கன்றுக்குட்டி / மடல்", symbolEn="Udder of cow / Arrow",
        rulingPlanet="SATURN",
        profile=NakshatraBiText(
            ta="பூசம் நட்சத்திரத்தினர் மிகவும் சக்திவாய்ந்தவர்களும், பரிவுள்ளவர்களும் ஆவர். இவர்கள் அற்புதமான சேவை மனப்பான்மையும், பிறரை பாதுகாக்கும் இயல்பும் கொண்டவர்கள்.",
            en="Poosam natives are powerful yet compassionate. They have an extraordinary service orientation and a natural instinct to protect and nourish others.",
        ),
        strengths=[
            NakshatraBiText(ta="சேவை மனப்பான்மை", en="Service orientation"),
            NakshatraBiText(ta="பாதுகாப்பு இயல்பு", en="Protective instinct"),
            NakshatraBiText(ta="மன உறுதி", en="Inner strength"),
        ],
        cautions=[
            NakshatraBiText(ta="அதிகமாக செலவழிக்கும் போக்கை கட்டுப்படுத்தவும்", en="Manage tendency to over-give"),
        ],
        compatibleGroups=["ROHINI", "HASTHAM", "SRAVANA"],
    ),
    9: NakshatraCard(
        number=9, nameTa="ஆயில்யம்", nameEn="Ayilyam",
        deityTa="சர்ப்பம் (நாக தேவதை)", deityEn="Sarpa (serpent deity)",
        symbolTa="சர்ப்பம்", symbolEn="Coiled serpent",
        rulingPlanet="MERCURY",
        profile=NakshatraBiText(
            ta="ஆயில்யம் நட்சத்திரத்தினர் ஆழமான உள்ளுணர்வும், மர்ம சக்தியும் கொண்டவர்கள். இவர்கள் குண்டலினி சக்தியை புரிந்துகொள்ளும் திறன் மற்றும் மறைவான விஷயங்களை அறியும் ஞானம் கொண்டவர்கள்.",
            en="Ayilyam natives possess deep intuition and mystical energy. They have an inherent understanding of hidden forces and a natural connection to transformative wisdom.",
        ),
        strengths=[
            NakshatraBiText(ta="ஆழமான உள்ளுணர்வு", en="Deep intuition"),
            NakshatraBiText(ta="மர்ம ஞானம்", en="Mystical wisdom"),
            NakshatraBiText(ta="குணமாக்கும் ஆற்றல்", en="Healing ability"),
        ],
        cautions=[
            NakshatraBiText(ta="நம்பிக்கை விஷயங்களில் கவனமாக இருக்கவும்", en="Exercise care in matters of trust"),
        ],
        compatibleGroups=["KETTAI", "VISAKAM", "MOOLAM"],
    ),
    10: NakshatraCard(
        number=10, nameTa="மகம்", nameEn="Magam",
        deityTa="பித்ரு (முன்னோர்கள்)", deityEn="Pitru (ancestors)",
        symbolTa="அரசன் அரியாசனம்", symbolEn="Royal throne",
        rulingPlanet="KETU",
        profile=NakshatraBiText(
            ta="மகம் நட்சத்திரத்தினர் உயர்ந்த அந்தஸ்து மற்றும் வழிமரபை மதிப்பவர்கள். இவர்கள் இயல்பான அதிகார குணமும், முன்னோர் பக்தியும் கொண்டவர்கள்.",
            en="Magam natives value high status and lineage. They carry natural authority and a deep reverence for ancestry and tradition.",
        ),
        strengths=[
            NakshatraBiText(ta="இயல்பான தலைமை", en="Natural authority"),
            NakshatraBiText(ta="வழிமரபு மதிப்பு", en="Respect for tradition"),
            NakshatraBiText(ta="உயர்ந்த தரம்", en="High standards"),
        ],
        cautions=[
            NakshatraBiText(ta="அகங்காரத்தை தவிர்க்கவும்", en="Avoid arrogance"),
        ],
        compatibleGroups=["POORAM", "UTHIRAM", "POORADAM"],
    ),
    11: NakshatraCard(
        number=11, nameTa="பூரம்", nameEn="Pooram",
        deityTa="பகன்", deityEn="Bhaga (god of fortune and marital bliss)",
        symbolTa="நட்சத்திரங்களின் ஜோடி / அத்திக்கனி", symbolEn="Two stars / Fig tree",
        rulingPlanet="VENUS",
        profile=NakshatraBiText(
            ta="பூரம் நட்சத்திரத்தினர் முடிவு செய்யும் திறன் மற்றும் துணிச்சல் கொண்டவர்கள். இவர்கள் மனதில் நிரந்தரமான மாற்றங்களை உருவாக்கும் சக்தி கொண்டவர்கள்.",
            en="Pooram natives are decisive and bold. They have the capacity to create lasting changes and are often drawn to powerful ambitions.",
        ),
        strengths=[
            NakshatraBiText(ta="துணிச்சல்", en="Boldness"),
            NakshatraBiText(ta="முடிவு திறன்", en="Decisiveness"),
            NakshatraBiText(ta="வலிமை", en="Inner strength"),
        ],
        cautions=[
            NakshatraBiText(ta="அடக்கமின்மையை கட்டுப்படுத்தவும்", en="Manage stubbornness"),
        ],
        compatibleGroups=["UTHIRAM", "POORADAM", "MAGAM"],
    ),
    12: NakshatraCard(
        number=12, nameTa="உத்திரம்", nameEn="Uthiram",
        deityTa="ஆர்யமன்", deityEn="Aryaman (god of patronage and nobility)",
        symbolTa="கட்டில் / சுண்டெலி", symbolEn="Bed / Back legs of a cot",
        rulingPlanet="SUN",
        profile=NakshatraBiText(
            ta="உத்திரம் நட்சத்திரத்தினர் கடமை உணர்வும், நியாய உணர்வும் கொண்டவர்கள். இவர்கள் நம்பகமானவர்களாகவும், உறுதியான தத்துவக் கொள்கைகள் கொண்டவர்களாகவும் இருப்பர்.",
            en="Uthiram natives have a strong sense of duty and justice. They are reliable individuals with firm ethical principles.",
        ),
        strengths=[
            NakshatraBiText(ta="நம்பகத்தன்மை", en="Reliability"),
            NakshatraBiText(ta="நீதி உணர்வு", en="Sense of justice"),
            NakshatraBiText(ta="உறுதியான கொள்கை", en="Firm principles"),
        ],
        cautions=[
            NakshatraBiText(ta="கடினமான தன்மையை கட்டுப்படுத்தவும்", en="Soften rigid tendencies"),
        ],
        compatibleGroups=["KARTHIGAI", "UTHIRADAM", "POORAM"],
    ),
    13: NakshatraCard(
        number=13, nameTa="அஸ்தம்", nameEn="Hastham",
        deityTa="சவிதர் (சூரியன்)", deityEn="Savitar (the Sun god, animator)",
        symbolTa="கை / பனை இலை விசிறி", symbolEn="Hand / Palm-leaf fan",
        rulingPlanet="MOON",
        profile=NakshatraBiText(
            ta="அஸ்தம் நட்சத்திரத்தினர் திறமையும், நடைமுறை அறிவும் கொண்டவர்கள். இவர்கள் கைத்திறமை மிக்கவர்களாகவும், நேரடியாக பேசுவோராகவும் இருப்பர்.",
            en="Hastham natives are skilled and practically intelligent. They are dexterous individuals who communicate directly and accomplish things effectively.",
        ),
        strengths=[
            NakshatraBiText(ta="கைத்திறமை", en="Manual dexterity"),
            NakshatraBiText(ta="நடைமுறை அறிவு", en="Practical intelligence"),
            NakshatraBiText(ta="திறமையான தொடர்பு", en="Effective communication"),
        ],
        cautions=[
            NakshatraBiText(ta="சுயமரியாதை விஷயங்களில் கவனம்", en="Attend to self-care"),
        ],
        compatibleGroups=["ASWINI", "POOSAM", "SRAVANA"],
    ),
    14: NakshatraCard(
        number=14, nameTa="சித்திரை", nameEn="Chithirai",
        deityTa="த்வஷ்டர் / விஸ்வகர்மா", deityEn="Tvashtar / Vishwakarma (divine craftsman)",
        symbolTa="பிரகாசமான ஒளி / முத்து", symbolEn="Bright jewel / Pearl",
        rulingPlanet="MARS",
        profile=NakshatraBiText(
            ta="சித்திரை நட்சத்திரத்தினர் அழகியல் உணர்வும், கலைத்திறனும் கொண்டவர்கள். இவர்கள் வடிவமைப்பிலும், படைப்பு ஆற்றலிலும் சிறந்தவர்கள்.",
            en="Chithirai natives possess refined aesthetic sense and artistic talent. They excel in design, creation, and bringing beauty into the world.",
        ),
        strengths=[
            NakshatraBiText(ta="கலைத்திறன்", en="Artistic ability"),
            NakshatraBiText(ta="அழகியல் உணர்வு", en="Aesthetic sensibility"),
            NakshatraBiText(ta="வடிவமைப்பு திறன்", en="Design skill"),
        ],
        cautions=[
            NakshatraBiText(ta="தீர்ப்பளிக்கும் போக்கை கட்டுப்படுத்தவும்", en="Temper judgmental tendencies"),
        ],
        compatibleGroups=["VISAKAM", "MIRUGASEERIDAM", "SRAVANA"],
    ),
    15: NakshatraCard(
        number=15, nameTa="சுவாதி", nameEn="Swathi",
        deityTa="வாயு", deityEn="Vayu (wind god)",
        symbolTa="மூங்கில் துளி / மதிமயக்கம்", symbolEn="Young sprout swaying in wind",
        rulingPlanet="RAHU",
        profile=NakshatraBiText(
            ta="சுவாதி நட்சத்திரத்தினர் சுதந்திரமான சிந்தனையும், நடுநிலை மனப்பான்மையும் கொண்டவர்கள். இவர்கள் இடர்களை நெகிழ்வுடன் கடக்கும் ஆற்றல் கொண்டவர்கள்.",
            en="Swathi natives value independence and are known for their balanced, neutral perspective. They have remarkable flexibility in navigating challenges.",
        ),
        strengths=[
            NakshatraBiText(ta="சுதந்திர சிந்தனை", en="Independent thinking"),
            NakshatraBiText(ta="நெகிழ்வுத்தன்மை", en="Flexibility"),
            NakshatraBiText(ta="வியாபார திறன்", en="Business acumen"),
        ],
        cautions=[
            NakshatraBiText(ta="திட்டவட்டமான இலக்கை நிலைநிறுத்தவும்", en="Maintain clear direction"),
        ],
        compatibleGroups=["HASTHAM", "ANUSHAM", "THIRUVATHIRAI"],
    ),
    16: NakshatraCard(
        number=16, nameTa="விசாகம்", nameEn="Visakam",
        deityTa="இந்திரன் மற்றும் அக்னி", deityEn="Indra and Agni (king and fire)",
        symbolTa="வளைந்த கிளை / வாயில் கட்டமைப்பு", symbolEn="Branched tree / Triumphal arch",
        rulingPlanet="JUPITER",
        profile=NakshatraBiText(
            ta="விசாகம் நட்சத்திரத்தினர் இலக்கை நோக்கிய சக்தியும், விடாமுயற்சியும் கொண்டவர்கள். இவர்கள் சாதனை நோக்கி பயணிப்பதில் சிறந்தவர்கள்.",
            en="Visakam natives have goal-oriented energy and persistence. They are driven achievers who relentlessly pursue their aims.",
        ),
        strengths=[
            NakshatraBiText(ta="விடாமுயற்சி", en="Persistence"),
            NakshatraBiText(ta="இலக்கு நோக்கிய சக்தி", en="Goal-directed drive"),
            NakshatraBiText(ta="ஆற்றல் திரட்சி", en="Ability to focus energy"),
        ],
        cautions=[
            NakshatraBiText(ta="பிறரின் முன்னேற்றத்தை ஏற்கவும்", en="Accept others' success graciously"),
        ],
        compatibleGroups=["CHITHIRAI", "PUNARPOOSAM", "UTHIRADAM"],
    ),
    17: NakshatraCard(
        number=17, nameTa="அனுசம்", nameEn="Anusham",
        deityTa="மித்ரன்", deityEn="Mitra (deity of friendship and contracts)",
        symbolTa="தாமரை", symbolEn="Lotus",
        rulingPlanet="SATURN",
        profile=NakshatraBiText(
            ta="அனுசம் நட்சத்திரத்தினர் நட்பு உணர்வும், நேர்மையும் கொண்டவர்கள். இவர்கள் அமைப்புகளை கட்டமைக்கும் திறனும், மற்றவர்களுடன் நல்லுறவு பேணும் ஆற்றலும் கொண்டவர்கள்.",
            en="Anusham natives are devoted friends and honest individuals. They have the ability to build organisations and maintain harmonious relationships.",
        ),
        strengths=[
            NakshatraBiText(ta="நட்பு திறன்", en="Friendship capacity"),
            NakshatraBiText(ta="நேர்மை", en="Integrity"),
            NakshatraBiText(ta="கட்டமைப்பு திறன்", en="Organisational ability"),
        ],
        cautions=[
            NakshatraBiText(ta="ஒழுங்கில் நமனீயத்தன்மையை வளர்க்கவும்", en="Add flexibility to discipline"),
        ],
        compatibleGroups=["SWATHI", "ROHINI", "KETTAI"],
    ),
    18: NakshatraCard(
        number=18, nameTa="கேட்டை", nameEn="Kettai",
        deityTa="இந்திரன்", deityEn="Indra (king of the gods)",
        symbolTa="வளையல் / குடை", symbolEn="Earring / Umbrella",
        rulingPlanet="MERCURY",
        profile=NakshatraBiText(
            ta="கேட்டை நட்சத்திரத்தினர் தலைமை ஆற்றலும், ஆழமான பொறுப்பு உணர்வும் கொண்டவர்கள். இவர்கள் மிகவும் உழைப்பாளிகளாகவும், உயர் அந்தஸ்து நாடுவோராகவும் இருப்பர்.",
            en="Kettai natives possess leadership ability and a deep sense of responsibility. They are industrious people who seek high achievement.",
        ),
        strengths=[
            NakshatraBiText(ta="தலைமை திறன்", en="Leadership"),
            NakshatraBiText(ta="உழைப்பு", en="Industry"),
            NakshatraBiText(ta="பொறுப்பு உணர்வு", en="Sense of responsibility"),
        ],
        cautions=[
            NakshatraBiText(ta="கடக்கமான தன்மையை கட்டுப்படுத்தவும்", en="Manage secretive tendencies"),
        ],
        compatibleGroups=["AYILYAM", "THIRUVATHIRAI", "ANUSHAM"],
    ),
    19: NakshatraCard(
        number=19, nameTa="மூலம்", nameEn="Moolam",
        deityTa="நிர்ருதி", deityEn="Nirriti (goddess of dissolution)",
        symbolTa="வேர்களின் கட்டு / அரியாசனம்", symbolEn="Bundle of roots / Lion's tail",
        rulingPlanet="KETU",
        profile=NakshatraBiText(
            ta="மூலம் நட்சத்திரத்தினர் ஆராய்ச்சி திறனும், தத்துவ சிந்தனையும் கொண்டவர்கள். இவர்கள் வேர்களுக்கு திரும்பும் குணமும், ஆழமான உண்மையை தேடும் இயல்பும் கொண்டவர்கள்.",
            en="Moolam natives have investigative minds and philosophical inclinations. They are drawn to finding root causes and seeking deep truth.",
        ),
        strengths=[
            NakshatraBiText(ta="ஆராய்ச்சி திறன்", en="Research ability"),
            NakshatraBiText(ta="தத்துவ சிந்தனை", en="Philosophical depth"),
            NakshatraBiText(ta="வேரை தேடும் குணம்", en="Root-finding nature"),
        ],
        cautions=[
            NakshatraBiText(ta="அதிக அலைச்சலை தவிர்க்கவும்", en="Avoid excessive wandering"),
        ],
        compatibleGroups=["AYILYAM", "POORADAM", "POORATTADHI"],
    ),
    20: NakshatraCard(
        number=20, nameTa="பூராடம்", nameEn="Pooradam",
        deityTa="ஜலம் (வருணன்)", deityEn="Apas / Varuna (water deity)",
        symbolTa="யானை தந்தம் / மயில் தோகை", symbolEn="Elephant tusk / Peacock feather",
        rulingPlanet="VENUS",
        profile=NakshatraBiText(
            ta="பூராடம் நட்சத்திரத்தினர் வற்றாத ஊக்கமும், வெற்றியின் மீது ஆழமான நம்பிக்கையும் கொண்டவர்கள். இவர்கள் நியாயமான போராளிகளாக இருப்பர்.",
            en="Pooradam natives have inexhaustible enthusiasm and a deep belief in victory. They are spirited individuals who fight for what they believe is just.",
        ),
        strengths=[
            NakshatraBiText(ta="ஊக்கம்", en="Enthusiasm"),
            NakshatraBiText(ta="வெற்றி நம்பிக்கை", en="Belief in success"),
            NakshatraBiText(ta="நியாய உணர்வு", en="Sense of fairness"),
        ],
        cautions=[
            NakshatraBiText(ta="வீம்பினை கட்டுப்படுத்தவும்", en="Manage pride"),
        ],
        compatibleGroups=["MAGAM", "POORAM", "UTHIRADAM"],
    ),
    21: NakshatraCard(
        number=21, nameTa="உத்திராடம்", nameEn="Uthiradam",
        deityTa="விஸ்வேதேவா", deityEn="Vishwadevas (universal gods)",
        symbolTa="யானை தந்தம் (முன்) / கட்டில் கால்", symbolEn="Elephant tusk / Front legs of cot",
        rulingPlanet="SUN",
        profile=NakshatraBiText(
            ta="உத்திராடம் நட்சத்திரத்தினர் நிலைத்த வெற்றியை நோக்கி செயல்படுவர். இவர்கள் நேர்மையான, நற்குணம் மிக்க, உலகுக்கு நன்மை செய்ய விரும்பும் தன்மையுடையவர்கள்.",
            en="Uthiradam natives work toward lasting victory. They are honest, virtuous individuals who wish to contribute to the greater good.",
        ),
        strengths=[
            NakshatraBiText(ta="நிலைத்த உழைப்பு", en="Sustained effort"),
            NakshatraBiText(ta="நேர்மை", en="Honesty"),
            NakshatraBiText(ta="உதவும் குணம்", en="Altruistic nature"),
        ],
        cautions=[
            NakshatraBiText(ta="சுயத்தையும் கவனிக்கவும்", en="Attend to your own needs too"),
        ],
        compatibleGroups=["KARTHIGAI", "UTHIRAM", "POORADAM"],
    ),
    22: NakshatraCard(
        number=22, nameTa="திருவோணம்", nameEn="Thiruvonam",
        deityTa="விஷ்ணு", deityEn="Vishnu (preserver god)",
        symbolTa="மூன்று அடிகள் / யானை", symbolEn="Three steps / Ear of the elephant",
        rulingPlanet="MOON",
        profile=NakshatraBiText(
            ta="திருவோணம் நட்சத்திரத்தினர் கற்கும் ஆர்வம் மற்றும் மற்றவர்களை கற்பிக்கும் ஆற்றல் கொண்டவர்கள். இவர்கள் அறிவை பரப்பும் இயல்பும், மற்றவர்களை இணைக்கும் திறனும் கொண்டவர்கள்.",
            en="Thiruvonam natives have a love of learning and the ability to teach others. They are natural connectors who spread knowledge.",
        ),
        strengths=[
            NakshatraBiText(ta="கல்வி திறன்", en="Educational ability"),
            NakshatraBiText(ta="இணைக்கும் ஆற்றல்", en="Connecting ability"),
            NakshatraBiText(ta="அறிவு பரப்பல்", en="Knowledge spreading"),
        ],
        cautions=[
            NakshatraBiText(ta="கடுமையான விமர்சனத்தை தவிர்க்கவும்", en="Avoid harsh criticism"),
        ],
        compatibleGroups=["HASTHAM", "ROHINI", "POOSAM"],
    ),
    23: NakshatraCard(
        number=23, nameTa="அவிட்டம்", nameEn="Avittam",
        deityTa="அஷ்ட வசுக்கள்", deityEn="Ashta Vasus (eight elemental gods)",
        symbolTa="யானை தந்தம் / யானை தலை", symbolEn="Elephant tusk / Drum",
        rulingPlanet="MARS",
        profile=NakshatraBiText(
            ta="அவிட்டம் நட்சத்திரத்தினர் நட்பு மனப்பான்மையும், ஆற்றல் மிகுந்த சக்தியும் கொண்டவர்கள். இவர்கள் இலக்கை அடைவதில் சமரசமற்ற உறுதி கொண்டவர்கள்.",
            en="Avittam natives are sociable and energetic. They possess uncompromising determination in pursuing their goals.",
        ),
        strengths=[
            NakshatraBiText(ta="நட்பு குணம்", en="Friendly nature"),
            NakshatraBiText(ta="உறுதி", en="Determination"),
            NakshatraBiText(ta="சக்தி", en="Energy"),
        ],
        cautions=[
            NakshatraBiText(ta="அவசர முடிவுகளை தவிர்க்கவும்", en="Avoid hasty decisions"),
        ],
        compatibleGroups=["SATHAYAM", "POORATTADHI", "KARTHIGAI"],
    ),
    24: NakshatraCard(
        number=24, nameTa="சதயம்", nameEn="Sadayam",
        deityTa="வருணன்", deityEn="Varuna (cosmic law and water)",
        symbolTa="வட்டம் / தாமரை", symbolEn="Circle / Empty circle / Lotus",
        rulingPlanet="RAHU",
        profile=NakshatraBiText(
            ta="சதயம் நட்சத்திரத்தினர் சுயாதீன சிந்தனையும், மனிதநேய உணர்வும் கொண்டவர்கள். இவர்கள் குணமாக்கும் திறனும், மனித நலனில் ஆர்வமும் கொண்டவர்கள்.",
            en="Sadayam natives are independent thinkers with humanitarian ideals. They have healing instincts and a natural interest in human welfare.",
        ),
        strengths=[
            NakshatraBiText(ta="சுயாதீன சிந்தனை", en="Independent thinking"),
            NakshatraBiText(ta="மனிதநேயம்", en="Humanitarianism"),
            NakshatraBiText(ta="குணமாக்கும் ஆற்றல்", en="Healing ability"),
        ],
        cautions=[
            NakshatraBiText(ta="தனிமையை தவிர்க்கவும்", en="Avoid excessive isolation"),
        ],
        compatibleGroups=["AVITTAM", "THIRUVATHIRAI", "SWATHI"],
    ),
    25: NakshatraCard(
        number=25, nameTa="பூரட்டாதி", nameEn="Poorattathi",
        deityTa="அஜ ஏகபாத்", deityEn="Aja Ekapada (one-footed goat, cosmic fire)",
        symbolTa="இரண்டு அழகான முகங்கள் / கட்டில்", symbolEn="Two faces / Front of funeral cot",
        rulingPlanet="JUPITER",
        profile=NakshatraBiText(
            ta="பூரட்டாதி நட்சத்திரத்தினர் ஆழமான ஞானமும், தத்துவ சிந்தனையும் கொண்டவர்கள். இவர்கள் உள்ளார்ந்த மாற்றத்தை நாடுவோராக இருப்பர்.",
            en="Poorattathi natives possess deep wisdom and philosophical thinking. They seek inner transformation and are drawn to profound questions.",
        ),
        strengths=[
            NakshatraBiText(ta="தத்துவ ஞானம்", en="Philosophical wisdom"),
            NakshatraBiText(ta="உள் மாற்றம்", en="Inner transformation"),
            NakshatraBiText(ta="ஆழமான சிந்தனை", en="Deep thinking"),
        ],
        cautions=[
            NakshatraBiText(ta="நடைமுறை விஷயங்களில் கவனம் செலுத்தவும்", en="Balance spiritual focus with practical matters"),
        ],
        compatibleGroups=["UTHIRATTADHI", "PUNARPOOSAM", "VISAKAM"],
    ),
    26: NakshatraCard(
        number=26, nameTa="உத்திரட்டாதி", nameEn="Uthirattathi",
        deityTa="அஹிர்புத்னியன்", deityEn="Ahirbudhnya (serpent of the deep)",
        symbolTa="கட்டில் / இரண்டு பின் கால்கள்", symbolEn="Back legs of funeral cot / Warrior fish",
        rulingPlanet="SATURN",
        profile=NakshatraBiText(
            ta="உத்திரட்டாதி நட்சத்திரத்தினர் ஆன்மீக சக்தியும், சேவை மனமும் கொண்டவர்கள். இவர்கள் சமூகத்திற்கு பங்களிக்கும் ஆர்வமும், ஆழமான ஆன்மீக உணர்வும் கொண்டவர்கள்.",
            en="Uthirattathi natives have spiritual energy and a service-oriented heart. They contribute to community and are guided by a deep spiritual sense.",
        ),
        strengths=[
            NakshatraBiText(ta="ஆன்மீக சக்தி", en="Spiritual strength"),
            NakshatraBiText(ta="சேவை மனம்", en="Service orientation"),
            NakshatraBiText(ta="சமூக பங்களிப்பு", en="Community contribution"),
        ],
        cautions=[
            NakshatraBiText(ta="சுய கவனிப்பை புறக்கணிக்காதீர்", en="Do not neglect self-care"),
        ],
        compatibleGroups=["POORATTADHI", "REVATHI", "POOSAM"],
    ),
    27: NakshatraCard(
        number=27, nameTa="ரேவதி", nameEn="Revathi",
        deityTa="பூஷன்", deityEn="Pushan (nourisher, protector of flocks)",
        symbolTa="மீன் / டம்ளர்", symbolEn="Pair of fish / Drum",
        rulingPlanet="MERCURY",
        profile=NakshatraBiText(
            ta="ரேவதி நட்சத்திரத்தினர் கனிவும், அன்பும், கலை ஆர்வமும் கொண்டவர்கள். இவர்கள் மற்றவர்களை வழிநடத்தும் திறனும், இழந்தவர்களை மீட்கும் இயல்பும் கொண்டவர்கள்.",
            en="Revathi natives are nurturing, loving, and artistically inclined. They have the ability to guide others and bring home those who are lost.",
        ),
        strengths=[
            NakshatraBiText(ta="அன்பு", en="Loving nature"),
            NakshatraBiText(ta="வழிகாட்டும் ஆற்றல்", en="Guiding ability"),
            NakshatraBiText(ta="கலை ஆர்வம்", en="Artistic interest"),
        ],
        cautions=[
            NakshatraBiText(ta="மற்றவர்களை நம்பும் போக்கில் கவனம்", en="Exercise care in whom you trust"),
        ],
        compatibleGroups=["BHARANI", "HASTHAM", "UTHIRATTADHI"],
    ),
}


def get_nakshatra_card(nakshatra_number: int) -> NakshatraCardResponse:
    card = _CARDS.get(nakshatra_number)
    if card is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Nakshatra {nakshatra_number} not found.")
    return NakshatraCardResponse(data=card)

