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
        ta="உங்கள் ஜென்ம நட்சத்திரம் அசுவினி. உங்கள் இயல்பான வேகம் இருக்கட்டும்; ஆனால் முடிவுகளை நிதானமாக எடுங்கள்.",
        en="Aswini lens: keep your natural speed, but make decisions with calm pacing.",
    ),
    2: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் பரணி. பொறுப்பு உங்கள் பலம்; ஆனால் தேவைக்கு மேல் சுமையை ஏற்க வேண்டாம்.",
        en="Bharani lens: responsibility is your strength; avoid carrying more than needed.",
    ),
    3: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் கார்த்திகை. தெளிவாக இருப்பது முக்கியம்; தேவையில்லாத சண்டையைத் தவிர்ப்பது நல்லது.",
        en="Karthigai lens: clarity is key; avoid unnecessary conflict.",
    ),
    4: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் ரோகிணி. நிதானமாக, உறுதியாக முயன்றால் இன்று நல்ல பலன் கிடைக்கும்.",
        en="Rohini lens: steady and grounded effort can bring good outcomes today.",
    ),
    5: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் மிருகசீரிடம். தேடும் ஆர்வம் உங்களுக்கு ஒரு வரம்; ஒரு நேரத்தில் ஒரு வேலையில் கவனம் வையுங்கள்.",
        en="Mirugaseeridam lens: curiosity is your gift; focus on one clear task at a time.",
    ),
    6: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் திருவாதிரை. ஆழமாக யோசிக்கும் திறனைப் பயன்படுத்துங்கள்; அளவுக்கு மீறி யோசிக்க வேண்டாம்.",
        en="Thiruvathirai lens: use depth of thought well, while reducing overthinking.",
    ),
    7: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் புனர்பூசம். விழுந்தாலும் மீண்டு எழும் சக்தி உங்களிடம் உண்டு; நம்பிக்கையை விட வேண்டாம்.",
        en="Punarpoosam lens: you recover and rebuild well; protect your optimism.",
    ),
    8: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் பூசம். மற்றவர்களைக் கவனித்துக்கொள்வது உங்கள் பலம்; உங்களுக்கும் ஓய்வு தேவை என்பதை மறக்க வேண்டாம்.",
        en="Poosam lens: nurturing is your strength; also preserve your own recovery time.",
    ),
    9: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் ஆயில்யம். மனதில் தெளிவு முக்கியம்; நீங்களாக ஊகிக்காமல் கேட்டுத் தெரிந்துகொள்ளுங்கள்.",
        en="Ayilyam lens: emotional clarity matters; ask before assuming intent.",
    ),
    10: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் மகம். கண்ணியத்தோடு பணிவும் சேர்ந்தால் இன்று நல்ல பலன் கிடைக்கும்.",
        en="Magam lens: dignity with humility is especially effective today.",
    ),
    11: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் பூரம். உறவுகளில் மகிழ்ச்சியாக இருங்கள்; அதே நேரம் எல்லைகளும் தெளிவாக இருக்கட்டும்.",
        en="Pooram lens: enjoy connection, while keeping boundaries clear.",
    ),
    12: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் உத்திரம். ஒப்பந்தங்களிலும் முடிவுகளிலும் நியாயத்தை விட்டுவிட வேண்டாம்.",
        en="Uthiram lens: in commitments and decisions, hold firm to fairness.",
    ),
    13: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் ஹஸ்தம். கையில் இருப்பதை முழுமையாக முடியுங்கள்; பல வேலைகளை ஒரே நேரத்தில் இழுக்க வேண்டாம்.",
        en="Hastham lens: finish what is in your hands well; avoid excessive multitasking.",
    ),
    14: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் சித்திரை. தரம் முக்கியம்தான்; ஆனால் எல்லாம் முழுமையாக இருக்க வேண்டும் என்று பிடிவாதம் வேண்டாம்.",
        en="Chithirai lens: quality matters; keep perfectionism within healthy limits.",
    ),
    15: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் சுவாதி. உங்கள் சுதந்திரத்தை விடாமல், உறவுகளிலும் இணக்கமாக இருங்கள்.",
        en="Swathi lens: preserve independence while maintaining harmony in relationships.",
    ),
    16: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் விசாகம். இலக்கில் உங்கள் கவனம் வலுவானது; அவசரத்தை விட நிலையான முன்னேற்றமே நல்லது.",
        en="Visakam lens: your goal focus is strong; choose steady progress over haste.",
    ),
    17: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் அனுஷம். நட்பும் அன்பும் ஒழுக்கமும் சமமாக இருந்தால் இன்று நல்ல ஆதரவு கிடைக்கும்.",
        en="Anusham lens: friendship, warmth, and discipline in balance can support today.",
    ),
    18: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் கேட்டை. உறுதியாகப் பேசுங்கள்; அந்த உறுதியில் கருணையும் இருக்கட்டும்.",
        en="Kettai lens: speak with strength, but pair firmness with compassion.",
    ),
    19: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் மூலம். பிரச்சினையின் அடிப்படைக் காரணத்தைக் கண்டுபிடித்துச் சரி செய்வது இன்று நல்ல பலன் தரும்.",
        en="Moolam lens: root-cause understanding and correction are highly useful today.",
    ),
    20: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் பூராடம். உறுதியான நம்பிக்கை உங்கள் பலம்; சொல்லும் செயலும் ஒன்றாக இருக்கட்டும்.",
        en="Pooradam lens: conviction is your strength; keep words and actions aligned.",
    ),
    21: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் உத்திராடம். பலன் தாமதமாக வந்தாலும் நிலைத்து நிற்கும்; பொறுமையையும் ஒழுக்கத்தையும் விட வேண்டாம்.",
        en="Uthiradam lens: results may be delayed but durable; stay with discipline and patience.",
    ),
    22: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் திருவோணம். செயலில் இறங்கும் முன் கவனமாகக் கேட்டுக்கொள்வது இன்று உங்களுக்கு நல்ல துணை.",
        en="Thiruvonam lens: listening carefully before acting gives you strong support today.",
    ),
    23: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் அவிட்டம். குழு வேலைகளில் எல்லோரோடும் ஒத்துப் போங்கள்; அளவுக்கு மேல் பொறுப்பை ஏற்க வேண்டாம்.",
        en="Avittam lens: keep rhythm in team efforts; reduce over-commitment.",
    ),
    24: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் சதயம். புதிய யோசனைகளை வரவேற்கலாம்; ஆனால் சரிபார்த்த பிறகே முன்னேறுங்கள்.",
        en="Sadayam lens: welcome new ideas, and move forward with verification.",
    ),
    25: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் பூரட்டாதி. ஆழமாகப் பார்க்கும் திறன் உங்கள் பலம்; மனதுக்கும் ஓய்வு கொடுங்கள்.",
        en="Poorattathi lens: deep insight is your strength; give the mind recovery space.",
    ),
    26: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் உத்திரட்டாதி. நிதானமும், தொலைநோக்கும், பொறுப்பும் இன்று உங்களுக்கு நல்ல வழி காட்டும்.",
        en="Uthirattathi lens: patience, long view, and responsibility can carry the day.",
    ),
    27: NakshatraLens(
        ta="உங்கள் ஜென்ம நட்சத்திரம் ரேவதி. கருணையும் வழிகாட்டும் குணமும் உங்கள் பலம்; உங்கள் எல்லைகளையும் விட்டுக்கொடுக்க வேண்டாம்.",
        en="Revathi lens: compassion and guidance are your strengths; keep boundaries firm.",
    ),
}

DEFAULT_LENS = NakshatraLens(
    ta="இன்று அமைதியாக, நிதானமாக நடந்துகொண்டால் நாள் நன்றாக அமையும்.",
    en="Janma nakshatra lens: a calm, steady approach can improve today.",
)


def build_nakshatra_perspective(nakshatra_number: int, score_label: str) -> NakshatraLens:
    base = NAKSHATRA_LENS.get(nakshatra_number, DEFAULT_LENS)

    if score_label in {"CAUTION", "RESTORATIVE"}:
        return NakshatraLens(
            ta=f"{base.ta} இன்று பெரிய புதிய முடிவுகளை விட, சின்னச் சின்ன உறுதியான அடிகளே நல்லது.",
            en=f"{base.en} Today, prefer small and stable steps over major new commitments.",
        )

    if score_label in {"STRONG_SUPPORT", "GOOD"}:
        return NakshatraLens(
            ta=f"{base.ta} இன்றைய நல்ல நேரங்களை முதலில் உங்கள் மிக முக்கியமான வேலைகளுக்குப் பயன்படுத்துங்கள்.",
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
    "ANUSHAM": ("அனுஷம்", "Anusham"),
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
            ta="அசுவினி நட்சத்திரத்தில் பிறந்தவர்கள் துடிப்பானவர்கள்; எதையும் முன்னோக்கி யோசிப்பவர்கள். விரைவாக முடிவெடுப்பார்கள்; புதிதாக ஒன்றைத் தொடங்குவதில் சிறந்தவர்கள்.",
            en="Aswini natives are energetic and forward-thinking with a talent for quick action. They excel at initiating new endeavours and bringing fresh energy to any situation.",
        ),
        strengths=[
            NakshatraBiText(ta="துடிப்பான செயல்திறன்", en="Dynamic initiative"),
            NakshatraBiText(ta="குணப்படுத்தும் ஆற்றல்", en="Healing ability"),
            NakshatraBiText(ta="விரைவாக முடிவெடுக்கும் திறன்", en="Quick decision-making"),
        ],
        cautions=[
            NakshatraBiText(ta="அவசரப்பட்டுச் செய்வதைத் தவிர்ப்பது நல்லது", en="Avoid impulsive actions"),
            NakshatraBiText(ta="பொறுமையை வளர்த்துக்கொள்வது நல்லது", en="Cultivate patience"),
        ],
        compatibleGroups=["SATHAYAM", "HASTHA", "ROHINI"],
    ),
    2: NakshatraCard(
        number=2, nameTa="பரணி", nameEn="Bharani",
        deityTa="யமன்", deityEn="Yama (lord of dharma and death)",
        symbolTa="யோனி (கர்ப்பம்)", symbolEn="Yoni (womb, carrying vessel)",
        rulingPlanet="VENUS",
        profile=NakshatraBiText(
            ta="பரணி நட்சத்திரத்தில் பிறந்தவர்கள் கடுமையான உழைப்பாளிகள்; பொறுப்பை முக்கியமாக எடுத்துக்கொள்பவர்கள். படைப்பாற்றல் மிக்கவர்கள்; மாற்றங்களைச் சமாளிக்கத் தெரிந்தவர்கள்.",
            en="Bharani natives are hardworking and take responsibility seriously. They have strong creative energy and the capacity to handle transformation.",
        ),
        strengths=[
            NakshatraBiText(ta="மிகுந்த உழைப்பு", en="Extraordinary diligence"),
            NakshatraBiText(ta="படைப்பு சக்தி", en="Creative force"),
            NakshatraBiText(ta="மாற்றங்களைச் சமாளிக்கும் திறன்", en="Capacity for transformation"),
        ],
        cautions=[
            NakshatraBiText(ta="அளவுக்கு மீறிச் சுமையை ஏற்காமல் இருப்பது நல்லது", en="Avoid taking on excessive burdens"),
        ],
        compatibleGroups=["ROHINI", "REVATHI", "HASTHAM"],
    ),
    3: NakshatraCard(
        number=3, nameTa="கார்த்திகை", nameEn="Karthigai",
        deityTa="அக்னி / முருகன்", deityEn="Agni (fire god) / Murugan",
        symbolTa="சுடர் / கத்தி", symbolEn="Flame / Razor",
        rulingPlanet="SUN",
        profile=NakshatraBiText(
            ta="கார்த்திகை நட்சத்திரத்தில் பிறந்தவர்களுக்கு நோக்கத்தில் தெளிவும், பெரிய கனவுகளும் உண்டு. இயல்பாகவே தலைமை தாங்கும் குணமும், தன்னைப் பற்றிய ஆழமான புரிதலும் கொண்டவர்கள்.",
            en="Karthigai natives possess clarity of purpose and high aspirations. They carry natural leadership quality and deep self-awareness.",
        ),
        strengths=[
            NakshatraBiText(ta="தலைமை குணம்", en="Natural leadership"),
            NakshatraBiText(ta="தெளிவும் நேர்மையும்", en="Clarity and integrity"),
            NakshatraBiText(ta="ஆழமான சிந்தனை", en="Deep thinking"),
        ],
        cautions=[
            NakshatraBiText(ta="கோபத்தைக் கட்டுப்படுத்துவது நல்லது", en="Manage temper"),
            NakshatraBiText(ta="விட்டுக்கொடுக்கும் குணத்தை வளர்த்துக்கொள்வது நல்லது", en="Cultivate flexibility"),
        ],
        compatibleGroups=["UTHIRAM", "UTHIRADAM", "KARTHIGAI"],
    ),
    4: NakshatraCard(
        number=4, nameTa="ரோகிணி", nameEn="Rohini",
        deityTa="பிரம்மா", deityEn="Brahma (creator)",
        symbolTa="சகடம் / தாமரை", symbolEn="Chariot / Lotus",
        rulingPlanet="MOON",
        profile=NakshatraBiText(
            ta="ரோகிணி நட்சத்திரத்தில் பிறந்தவர்கள் பார்ப்பவர்களைக் கவரும் தன்மையும் படைப்பாற்றலும் கொண்டவர்கள். நன்றாகப் பேசுவார்கள்; இவர்களைச் சுற்றி வளமும் சேரும்.",
            en="Rohini natives are charming and highly creative. They are gifted communicators and have a natural capacity to attract prosperity.",
        ),
        strengths=[
            NakshatraBiText(ta="கவரும் குணம்", en="Charming personality"),
            NakshatraBiText(ta="படைப்பாற்றல்", en="Creative talent"),
            NakshatraBiText(ta="வளம் சேர்க்கும் குணம்", en="Prosperity-attracting nature"),
        ],
        cautions=[
            NakshatraBiText(ta="அழகு, வசதிகள் மேலான ஆசையில் அளவோடு இருப்பது நல்லது", en="Balance desire for beauty and comfort"),
        ],
        compatibleGroups=["MIRUGASEERIDAM", "ANUSHAM", "THIRUVONAM"],
    ),
    5: NakshatraCard(
        number=5, nameTa="மிருகசீரிடம்", nameEn="Mirugaseeridam",
        deityTa="சோமா (சந்திரன்)", deityEn="Soma (Moon god)",
        symbolTa="மான் தலை", symbolEn="Deer head",
        rulingPlanet="MARS",
        profile=NakshatraBiText(
            ta="மிருகசீரிடம் நட்சத்திரத்தில் பிறந்தவர்கள் அறிவுத் தாகம் கொண்டவர்கள்; எப்போதும் எதையாவது தேடிக்கொண்டே இருப்பார்கள். மென்மையான மனமும் கூர்மையான புத்தியும் உடையவர்கள்.",
            en="Mirugaseeridam natives are intellectually curious and always seeking. They combine a gentle heart with a sharp, investigative mind.",
        ),
        strengths=[
            NakshatraBiText(ta="அறிவுத் தேடல்", en="Intellectual curiosity"),
            NakshatraBiText(ta="ஆராய்ந்து பார்க்கும் திறன்", en="Investigative ability"),
            NakshatraBiText(ta="மென்மையான மனம்", en="Gentle nature"),
        ],
        cautions=[
            NakshatraBiText(ta="ஒரே விஷயத்தில் நிலைத்து நிற்கப் பழகுவது நல்லது", en="Develop ability to stay focused"),
        ],
        compatibleGroups=["ROHINI", "CHITHIRAI", "UTHIRAM"],
    ),
    6: NakshatraCard(
        number=6, nameTa="திருவாதிரை", nameEn="Thiruvathirai",
        deityTa="ருத்ரன் / சிவன்", deityEn="Rudra / Shiva",
        symbolTa="ஒளிரும் ஒரு நட்சத்திரம்", symbolEn="Single bright star (Betelgeuse)",
        rulingPlanet="RAHU",
        profile=NakshatraBiText(
            ta="திருவாதிரை நட்சத்திரத்தில் பிறந்தவர்கள் மாற்றத்தைக் கொண்டுவரும் சக்தி உடையவர்கள். ஆழமாக யோசிப்பவர்கள்; வழக்கமான எல்லைகளைத் தாண்டிப் பார்க்கத் தெரிந்தவர்கள்.",
            en="Thiruvathirai natives carry transformative energy. They are deep thinkers who see beyond conventional boundaries.",
        ),
        strengths=[
            NakshatraBiText(ta="மாற்றத்தைக் கொண்டுவரும் சக்தி", en="Transformative power"),
            NakshatraBiText(ta="ஆழமான சிந்தனை", en="Deep thinking"),
            NakshatraBiText(ta="அறிவியல் ஆர்வம்", en="Scientific curiosity"),
        ],
        cautions=[
            NakshatraBiText(ta="கோபத்தை நல்ல வழியில் திருப்புவது நல்லது", en="Channel anger constructively"),
        ],
        compatibleGroups=["SATHAYAM", "SWATHI", "KETTAI"],
    ),
    7: NakshatraCard(
        number=7, nameTa="புனர்பூசம்", nameEn="Punarpoosam",
        deityTa="அதிதி", deityEn="Aditi (mother of the gods)",
        symbolTa="அம்புறாத்தூணி / வீடு திரும்புதல்", symbolEn="Quiver of arrows / Return home",
        rulingPlanet="JUPITER",
        profile=NakshatraBiText(
            ta="புனர்பூசம் நட்சத்திரத்தில் பிறந்தவர்களிடம் பழமையும் புதுமையும் சேர்ந்திருக்கும். விழுந்தாலும் மீண்டு எழும் தனி ஆற்றல் உடையவர்கள்; மற்றவர்களுக்கும் நம்பிக்கை தருவார்கள்.",
            en="Punarpoosam natives blend tradition with renewal. They have a unique ability to recover and rise again, offering hope and wisdom to others.",
        ),
        strengths=[
            NakshatraBiText(ta="மீண்டு எழும் சக்தி", en="Resilience"),
            NakshatraBiText(ta="ஞானம்", en="Wisdom"),
            NakshatraBiText(ta="அரவணைக்கும் குணம்", en="Nurturing nature"),
        ],
        cautions=[
            NakshatraBiText(ta="பழைய முறைகளிலேயே தேங்கிவிடாமல் இருப்பது நல்லது", en="Avoid getting stuck in old patterns"),
        ],
        compatibleGroups=["POOSAM", "VISAKAM", "UTHIRATADHI"],
    ),
    8: NakshatraCard(
        number=8, nameTa="பூசம்", nameEn="Poosam",
        deityTa="பிரஹஸ்பதி (குரு)", deityEn="Brihaspati (Jupiter, divine teacher)",
        symbolTa="பசுவின் மடி / அம்பு", symbolEn="Udder of cow / Arrow",
        rulingPlanet="SATURN",
        profile=NakshatraBiText(
            ta="பூசம் நட்சத்திரத்தில் பிறந்தவர்கள் வலிமையும் கருணையும் கொண்டவர்கள். மற்றவர்களுக்கு உதவும் மனம் அதிகம்; இயல்பாகவே மற்றவர்களைக் காத்து அரவணைப்பார்கள்.",
            en="Poosam natives are powerful yet compassionate. They have an extraordinary service orientation and a natural instinct to protect and nourish others.",
        ),
        strengths=[
            NakshatraBiText(ta="உதவும் மனப்பான்மை", en="Service orientation"),
            NakshatraBiText(ta="காக்கும் குணம்", en="Protective instinct"),
            NakshatraBiText(ta="மன உறுதி", en="Inner strength"),
        ],
        cautions=[
            NakshatraBiText(ta="அளவுக்கு மீறிக் கொடுப்பதைக் குறைத்துக்கொள்வது நல்லது", en="Manage tendency to over-give"),
        ],
        compatibleGroups=["ROHINI", "HASTHAM", "SRAVANA"],
    ),
    9: NakshatraCard(
        number=9, nameTa="ஆயில்யம்", nameEn="Ayilyam",
        deityTa="சர்ப்பம் (நாக தேவதை)", deityEn="Sarpa (serpent deity)",
        symbolTa="சர்ப்பம்", symbolEn="Coiled serpent",
        rulingPlanet="MERCURY",
        profile=NakshatraBiText(
            ta="ஆயில்யம் நட்சத்திரத்தில் பிறந்தவர்களுக்கு ஆழமான உள்ளுணர்வு உண்டு. கண்ணுக்குத் தெரியாத விஷயங்களைப் புரிந்துகொள்ளும் இயல்பும், மாற்றம் தரும் ஞானமும் உடையவர்கள்.",
            en="Ayilyam natives possess deep intuition and mystical energy. They have an inherent understanding of hidden forces and a natural connection to transformative wisdom.",
        ),
        strengths=[
            NakshatraBiText(ta="ஆழமான உள்ளுணர்வு", en="Deep intuition"),
            NakshatraBiText(ta="மறைவான விஷயங்களின் ஞானம்", en="Mystical wisdom"),
            NakshatraBiText(ta="குணப்படுத்தும் ஆற்றல்", en="Healing ability"),
        ],
        cautions=[
            NakshatraBiText(ta="யாரை நம்புவது என்பதில் கவனமாக இருப்பது நல்லது", en="Exercise care in matters of trust"),
        ],
        compatibleGroups=["KETTAI", "VISAKAM", "MOOLAM"],
    ),
    10: NakshatraCard(
        number=10, nameTa="மகம்", nameEn="Magam",
        deityTa="பித்ரு (முன்னோர்கள்)", deityEn="Pitru (ancestors)",
        symbolTa="அரியாசனம்", symbolEn="Royal throne",
        rulingPlanet="KETU",
        profile=NakshatraBiText(
            ta="மகம் நட்சத்திரத்தில் பிறந்தவர்கள் மரியாதையையும் குடும்ப வழிமரபையும் பெரிதாக மதிப்பவர்கள். இயல்பாகவே அதிகாரம் உடையவர்கள்; முன்னோர் மீது ஆழ்ந்த பக்தி கொண்டவர்கள்.",
            en="Magam natives value high status and lineage. They carry natural authority and a deep reverence for ancestry and tradition.",
        ),
        strengths=[
            NakshatraBiText(ta="இயல்பான தலைமைப் பண்பு", en="Natural authority"),
            NakshatraBiText(ta="மரபை மதிக்கும் குணம்", en="Respect for tradition"),
            NakshatraBiText(ta="உயர்ந்த தரம் பார்க்கும் குணம்", en="High standards"),
        ],
        cautions=[
            NakshatraBiText(ta="அகங்காரத்தைத் தவிர்ப்பது நல்லது", en="Avoid arrogance"),
        ],
        compatibleGroups=["POORAM", "UTHIRAM", "POORADAM"],
    ),
    11: NakshatraCard(
        number=11, nameTa="பூரம்", nameEn="Pooram",
        deityTa="பகன்", deityEn="Bhaga (god of fortune and marital bliss)",
        symbolTa="இரண்டு நட்சத்திரங்கள் / அத்தி மரம்", symbolEn="Two stars / Fig tree",
        rulingPlanet="VENUS",
        profile=NakshatraBiText(
            ta="பூரம் நட்சத்திரத்தில் பிறந்தவர்கள் துணிச்சலாக முடிவெடுப்பவர்கள். நீடித்து நிற்கும் மாற்றங்களைக் கொண்டுவரும் சக்தியும், பெரிய லட்சியங்களும் உடையவர்கள்.",
            en="Pooram natives are decisive and bold. They have the capacity to create lasting changes and are often drawn to powerful ambitions.",
        ),
        strengths=[
            NakshatraBiText(ta="துணிச்சல்", en="Boldness"),
            NakshatraBiText(ta="முடிவெடுக்கும் திறன்", en="Decisiveness"),
            NakshatraBiText(ta="மன வலிமை", en="Inner strength"),
        ],
        cautions=[
            NakshatraBiText(ta="பிடிவாதத்தைக் குறைத்துக்கொள்வது நல்லது", en="Manage stubbornness"),
        ],
        compatibleGroups=["UTHIRAM", "POORADAM", "MAGAM"],
    ),
    12: NakshatraCard(
        number=12, nameTa="உத்திரம்", nameEn="Uthiram",
        deityTa="ஆர்யமன்", deityEn="Aryaman (god of patronage and nobility)",
        symbolTa="கட்டில் / கட்டிலின் பின்கால்கள்", symbolEn="Bed / Back legs of a cot",
        rulingPlanet="SUN",
        profile=NakshatraBiText(
            ta="உத்திரம் நட்சத்திரத்தில் பிறந்தவர்களுக்குக் கடமை உணர்வும் நியாய உணர்வும் அதிகம். நம்பகமானவர்கள்; உறுதியான கொள்கைகளை உடையவர்கள்.",
            en="Uthiram natives have a strong sense of duty and justice. They are reliable individuals with firm ethical principles.",
        ),
        strengths=[
            NakshatraBiText(ta="நம்பகத்தன்மை", en="Reliability"),
            NakshatraBiText(ta="நீதி உணர்வு", en="Sense of justice"),
            NakshatraBiText(ta="உறுதியான கொள்கை", en="Firm principles"),
        ],
        cautions=[
            NakshatraBiText(ta="கடினமான போக்கைக் கொஞ்சம் தளர்த்திக்கொள்வது நல்லது", en="Soften rigid tendencies"),
        ],
        compatibleGroups=["KARTHIGAI", "UTHIRADAM", "POORAM"],
    ),
    13: NakshatraCard(
        number=13, nameTa="ஹஸ்தம்", nameEn="Hastham",
        deityTa="சவிதர் (சூரியன்)", deityEn="Savitar (the Sun god, animator)",
        symbolTa="கை / பனை இலை விசிறி", symbolEn="Hand / Palm-leaf fan",
        rulingPlanet="MOON",
        profile=NakshatraBiText(
            ta="ஹஸ்தம் நட்சத்திரத்தில் பிறந்தவர்கள் திறமையும் நடைமுறை அறிவும் உடையவர்கள். கைத்திறமை மிக்கவர்கள்; நேரடியாகப் பேசி, எடுத்த வேலையைச் செய்து முடிப்பவர்கள்.",
            en="Hastham natives are skilled and practically intelligent. They are dexterous individuals who communicate directly and accomplish things effectively.",
        ),
        strengths=[
            NakshatraBiText(ta="கைத்திறமை", en="Manual dexterity"),
            NakshatraBiText(ta="நடைமுறை அறிவு", en="Practical intelligence"),
            NakshatraBiText(ta="தெளிவாகப் பேசும் திறன்", en="Effective communication"),
        ],
        cautions=[
            NakshatraBiText(ta="உங்களையும் கவனித்துக்கொள்வது நல்லது", en="Attend to self-care"),
        ],
        compatibleGroups=["ASWINI", "POOSAM", "SRAVANA"],
    ),
    14: NakshatraCard(
        number=14, nameTa="சித்திரை", nameEn="Chithirai",
        deityTa="த்வஷ்டர் / விஸ்வகர்மா", deityEn="Tvashtar / Vishwakarma (divine craftsman)",
        symbolTa="ஒளிரும் மணி / முத்து", symbolEn="Bright jewel / Pearl",
        rulingPlanet="MARS",
        profile=NakshatraBiText(
            ta="சித்திரை நட்சத்திரத்தில் பிறந்தவர்கள் அழகுணர்ச்சியும் கலைத்திறனும் உடையவர்கள். வடிவமைப்பிலும் புதிதாக உருவாக்குவதிலும் சிறந்தவர்கள்.",
            en="Chithirai natives possess refined aesthetic sense and artistic talent. They excel in design, creation, and bringing beauty into the world.",
        ),
        strengths=[
            NakshatraBiText(ta="கலைத்திறன்", en="Artistic ability"),
            NakshatraBiText(ta="அழகுணர்ச்சி", en="Aesthetic sensibility"),
            NakshatraBiText(ta="வடிவமைக்கும் திறன்", en="Design skill"),
        ],
        cautions=[
            NakshatraBiText(ta="மற்றவர்களை எடைபோடும் போக்கைக் குறைத்துக்கொள்வது நல்லது", en="Temper judgmental tendencies"),
        ],
        compatibleGroups=["VISAKAM", "MIRUGASEERIDAM", "SRAVANA"],
    ),
    15: NakshatraCard(
        number=15, nameTa="சுவாதி", nameEn="Swathi",
        deityTa="வாயு", deityEn="Vayu (wind god)",
        symbolTa="காற்றில் அசையும் இளந்தளிர்", symbolEn="Young sprout swaying in wind",
        rulingPlanet="RAHU",
        profile=NakshatraBiText(
            ta="சுவாதி நட்சத்திரத்தில் பிறந்தவர்கள் சுதந்திரமாக யோசிப்பவர்கள்; எதையும் நடுநிலையோடு பார்ப்பவர்கள். சிக்கல்களை வளைந்து கொடுத்துக் கடக்கத் தெரிந்தவர்கள்.",
            en="Swathi natives value independence and are known for their balanced, neutral perspective. They have remarkable flexibility in navigating challenges.",
        ),
        strengths=[
            NakshatraBiText(ta="சுதந்திரமான சிந்தனை", en="Independent thinking"),
            NakshatraBiText(ta="வளைந்து கொடுக்கும் குணம்", en="Flexibility"),
            NakshatraBiText(ta="வியாபார திறன்", en="Business acumen"),
        ],
        cautions=[
            NakshatraBiText(ta="ஒரு தெளிவான இலக்கை விடாமல் பிடிப்பது நல்லது", en="Maintain clear direction"),
        ],
        compatibleGroups=["HASTHAM", "ANUSHAM", "THIRUVATHIRAI"],
    ),
    16: NakshatraCard(
        number=16, nameTa="விசாகம்", nameEn="Visakam",
        deityTa="இந்திரன் மற்றும் அக்னி", deityEn="Indra and Agni (king and fire)",
        symbolTa="கிளைவிட்ட மரம் / தோரண வாயில்", symbolEn="Branched tree / Triumphal arch",
        rulingPlanet="JUPITER",
        profile=NakshatraBiText(
            ta="விசாகம் நட்சத்திரத்தில் பிறந்தவர்கள் இலக்கை நோக்கி விடாமல் உழைப்பவர்கள். நினைத்ததைச் சாதிக்கும் வரை ஓயாதவர்கள்.",
            en="Visakam natives have goal-oriented energy and persistence. They are driven achievers who relentlessly pursue their aims.",
        ),
        strengths=[
            NakshatraBiText(ta="விடாமுயற்சி", en="Persistence"),
            NakshatraBiText(ta="இலக்கை நோக்கிய வேகம்", en="Goal-directed drive"),
            NakshatraBiText(ta="சக்தியை ஒருமுகப்படுத்தும் திறன்", en="Ability to focus energy"),
        ],
        cautions=[
            NakshatraBiText(ta="மற்றவர்களின் முன்னேற்றத்தையும் மனதார ஏற்றுக்கொள்வது நல்லது", en="Accept others' success graciously"),
        ],
        compatibleGroups=["CHITHIRAI", "PUNARPOOSAM", "UTHIRADAM"],
    ),
    17: NakshatraCard(
        number=17, nameTa="அனுஷம்", nameEn="Anusham",
        deityTa="மித்ரன்", deityEn="Mitra (deity of friendship and contracts)",
        symbolTa="தாமரை", symbolEn="Lotus",
        rulingPlanet="SATURN",
        profile=NakshatraBiText(
            ta="அனுஷம் நட்சத்திரத்தில் பிறந்தவர்கள் நட்புக்கு உயிர் கொடுப்பவர்கள்; நேர்மையானவர்கள். அமைப்புகளை உருவாக்கவும், எல்லோரோடும் நல்லுறவில் இருக்கவும் தெரிந்தவர்கள்.",
            en="Anusham natives are devoted friends and honest individuals. They have the ability to build organisations and maintain harmonious relationships.",
        ),
        strengths=[
            NakshatraBiText(ta="நட்பைக் காக்கும் குணம்", en="Friendship capacity"),
            NakshatraBiText(ta="நேர்மை", en="Integrity"),
            NakshatraBiText(ta="அமைப்புகளை உருவாக்கும் திறன்", en="Organisational ability"),
        ],
        cautions=[
            NakshatraBiText(ta="ஒழுங்கில் கொஞ்சம் விட்டுக்கொடுப்பதும் நல்லது", en="Add flexibility to discipline"),
        ],
        compatibleGroups=["SWATHI", "ROHINI", "KETTAI"],
    ),
    18: NakshatraCard(
        number=18, nameTa="கேட்டை", nameEn="Kettai",
        deityTa="இந்திரன்", deityEn="Indra (king of the gods)",
        symbolTa="காதணி / குடை", symbolEn="Earring / Umbrella",
        rulingPlanet="MERCURY",
        profile=NakshatraBiText(
            ta="கேட்டை நட்சத்திரத்தில் பிறந்தவர்கள் தலைமை தாங்கும் திறனும் ஆழ்ந்த பொறுப்புணர்வும் உடையவர்கள். கடுமையான உழைப்பாளிகள்; உயர்ந்த இடத்தை அடைய விரும்புபவர்கள்.",
            en="Kettai natives possess leadership ability and a deep sense of responsibility. They are industrious people who seek high achievement.",
        ),
        strengths=[
            NakshatraBiText(ta="தலைமை தாங்கும் திறன்", en="Leadership"),
            NakshatraBiText(ta="உழைப்பு", en="Industry"),
            NakshatraBiText(ta="பொறுப்புணர்வு", en="Sense of responsibility"),
        ],
        cautions=[
            NakshatraBiText(ta="எல்லாவற்றையும் மறைத்து வைக்கும் போக்கைக் குறைத்துக்கொள்வது நல்லது", en="Manage secretive tendencies"),
        ],
        compatibleGroups=["AYILYAM", "THIRUVATHIRAI", "ANUSHAM"],
    ),
    19: NakshatraCard(
        number=19, nameTa="மூலம்", nameEn="Moolam",
        deityTa="நிர்ருதி", deityEn="Nirriti (goddess of dissolution)",
        symbolTa="வேர்க்கட்டு / சிங்கத்தின் வால்", symbolEn="Bundle of roots / Lion's tail",
        rulingPlanet="KETU",
        profile=NakshatraBiText(
            ta="மூலம் நட்சத்திரத்தில் பிறந்தவர்கள் ஆராய்ந்து பார்ப்பவர்கள்; தத்துவ நாட்டம் உடையவர்கள். எதற்கும் அடிப்படைக் காரணத்தையும் ஆழமான உண்மையையும் தேடுவார்கள்.",
            en="Moolam natives have investigative minds and philosophical inclinations. They are drawn to finding root causes and seeking deep truth.",
        ),
        strengths=[
            NakshatraBiText(ta="ஆராயும் திறன்", en="Research ability"),
            NakshatraBiText(ta="தத்துவ சிந்தனை", en="Philosophical depth"),
            NakshatraBiText(ta="அடிப்படையைத் தேடும் குணம்", en="Root-finding nature"),
        ],
        cautions=[
            NakshatraBiText(ta="தேவையில்லாத அலைச்சலைத் தவிர்ப்பது நல்லது", en="Avoid excessive wandering"),
        ],
        compatibleGroups=["AYILYAM", "POORADAM", "POORATTADHI"],
    ),
    20: NakshatraCard(
        number=20, nameTa="பூராடம்", nameEn="Pooradam",
        deityTa="ஜலம் (வருணன்)", deityEn="Apas / Varuna (water deity)",
        symbolTa="யானைத் தந்தம் / மயில் தோகை", symbolEn="Elephant tusk / Peacock feather",
        rulingPlanet="VENUS",
        profile=NakshatraBiText(
            ta="பூராடம் நட்சத்திரத்தில் பிறந்தவர்கள் குறையாத ஊக்கமும், வெற்றி வரும் என்ற ஆழ்ந்த நம்பிக்கையும் உடையவர்கள். நியாயம் என்று நம்புவதற்காகப் போராடுவார்கள்.",
            en="Pooradam natives have inexhaustible enthusiasm and a deep belief in victory. They are spirited individuals who fight for what they believe is just.",
        ),
        strengths=[
            NakshatraBiText(ta="ஊக்கம்", en="Enthusiasm"),
            NakshatraBiText(ta="வெற்றி நம்பிக்கை", en="Belief in success"),
            NakshatraBiText(ta="நியாய உணர்வு", en="Sense of fairness"),
        ],
        cautions=[
            NakshatraBiText(ta="வீம்பைக் குறைத்துக்கொள்வது நல்லது", en="Manage pride"),
        ],
        compatibleGroups=["MAGAM", "POORAM", "UTHIRADAM"],
    ),
    21: NakshatraCard(
        number=21, nameTa="உத்திராடம்", nameEn="Uthiradam",
        deityTa="விஸ்வேதேவா", deityEn="Vishwadevas (universal gods)",
        symbolTa="யானைத் தந்தம் / கட்டிலின் முன்கால்கள்", symbolEn="Elephant tusk / Front legs of cot",
        rulingPlanet="SUN",
        profile=NakshatraBiText(
            ta="உத்திராடம் நட்சத்திரத்தில் பிறந்தவர்கள் நிலைத்து நிற்கும் வெற்றியை நோக்கி உழைப்பவர்கள். நேர்மையானவர்கள், நல்ல குணம் உடையவர்கள்; ஊருக்கு நன்மை செய்ய விரும்புபவர்கள்.",
            en="Uthiradam natives work toward lasting victory. They are honest, virtuous individuals who wish to contribute to the greater good.",
        ),
        strengths=[
            NakshatraBiText(ta="விடாத உழைப்பு", en="Sustained effort"),
            NakshatraBiText(ta="நேர்மை", en="Honesty"),
            NakshatraBiText(ta="உதவும் குணம்", en="Altruistic nature"),
        ],
        cautions=[
            NakshatraBiText(ta="உங்களையும் கவனித்துக்கொள்வது நல்லது", en="Attend to your own needs too"),
        ],
        compatibleGroups=["KARTHIGAI", "UTHIRAM", "POORADAM"],
    ),
    22: NakshatraCard(
        number=22, nameTa="திருவோணம்", nameEn="Thiruvonam",
        deityTa="விஷ்ணு", deityEn="Vishnu (preserver god)",
        symbolTa="மூன்று அடிகள் / யானையின் காது", symbolEn="Three steps / Ear of the elephant",
        rulingPlanet="MOON",
        profile=NakshatraBiText(
            ta="திருவோணம் நட்சத்திரத்தில் பிறந்தவர்கள் கற்பதில் ஆர்வமும், மற்றவர்களுக்குக் கற்றுக் கொடுக்கும் திறனும் உடையவர்கள். அறிவைப் பரப்புவார்கள்; மனிதர்களை இணைப்பார்கள்.",
            en="Thiruvonam natives have a love of learning and the ability to teach others. They are natural connectors who spread knowledge.",
        ),
        strengths=[
            NakshatraBiText(ta="கற்கும் திறன்", en="Educational ability"),
            NakshatraBiText(ta="மனிதர்களை இணைக்கும் ஆற்றல்", en="Connecting ability"),
            NakshatraBiText(ta="அறிவைப் பரப்பும் குணம்", en="Knowledge spreading"),
        ],
        cautions=[
            NakshatraBiText(ta="கடுமையாக விமர்சிப்பதைத் தவிர்ப்பது நல்லது", en="Avoid harsh criticism"),
        ],
        compatibleGroups=["HASTHAM", "ROHINI", "POOSAM"],
    ),
    23: NakshatraCard(
        number=23, nameTa="அவிட்டம்", nameEn="Avittam",
        deityTa="அஷ்ட வசுக்கள்", deityEn="Ashta Vasus (eight elemental gods)",
        symbolTa="மத்தளம்", symbolEn="Drum",
        rulingPlanet="MARS",
        profile=NakshatraBiText(
            ta="அவிட்டம் நட்சத்திரத்தில் பிறந்தவர்கள் எல்லோரோடும் பழகுபவர்கள்; ஆற்றல் மிக்கவர்கள். இலக்கை அடைவதில் எந்தச் சமரசமும் செய்யாத உறுதி உடையவர்கள்.",
            en="Avittam natives are sociable and energetic. They possess uncompromising determination in pursuing their goals.",
        ),
        strengths=[
            NakshatraBiText(ta="நட்பு குணம்", en="Friendly nature"),
            NakshatraBiText(ta="உறுதி", en="Determination"),
            NakshatraBiText(ta="சக்தி", en="Energy"),
        ],
        cautions=[
            NakshatraBiText(ta="அவசர முடிவுகளைத் தவிர்ப்பது நல்லது", en="Avoid hasty decisions"),
        ],
        compatibleGroups=["SATHAYAM", "POORATTADHI", "KARTHIGAI"],
    ),
    24: NakshatraCard(
        number=24, nameTa="சதயம்", nameEn="Sadayam",
        deityTa="வருணன்", deityEn="Varuna (cosmic law and water)",
        symbolTa="வட்டம் / தாமரை", symbolEn="Circle / Empty circle / Lotus",
        rulingPlanet="RAHU",
        profile=NakshatraBiText(
            ta="சதயம் நட்சத்திரத்தில் பிறந்தவர்கள் தனித்துச் சிந்திப்பவர்கள்; மனிதநேயம் மிக்கவர்கள். பிறரைக் குணப்படுத்தும் இயல்பும், மக்கள் நலனில் ஆர்வமும் உடையவர்கள்.",
            en="Sadayam natives are independent thinkers with humanitarian ideals. They have healing instincts and a natural interest in human welfare.",
        ),
        strengths=[
            NakshatraBiText(ta="தனித்துச் சிந்திக்கும் திறன்", en="Independent thinking"),
            NakshatraBiText(ta="மனிதநேயம்", en="Humanitarianism"),
            NakshatraBiText(ta="குணப்படுத்தும் ஆற்றல்", en="Healing ability"),
        ],
        cautions=[
            NakshatraBiText(ta="அளவுக்கு மீறித் தனிமையில் இருப்பதைத் தவிர்ப்பது நல்லது", en="Avoid excessive isolation"),
        ],
        compatibleGroups=["AVITTAM", "THIRUVATHIRAI", "SWATHI"],
    ),
    25: NakshatraCard(
        number=25, nameTa="பூரட்டாதி", nameEn="Poorattathi",
        deityTa="அஜ ஏகபாத்", deityEn="Aja Ekapada (one-footed goat, cosmic fire)",
        symbolTa="இரண்டு முகங்கள் / கட்டிலின் முன்பகுதி", symbolEn="Two faces / Front of funeral cot",
        rulingPlanet="JUPITER",
        profile=NakshatraBiText(
            ta="பூரட்டாதி நட்சத்திரத்தில் பிறந்தவர்கள் ஆழ்ந்த ஞானமும் தத்துவ நாட்டமும் உடையவர்கள். தனக்குள் மாற்றத்தைத் தேடுவார்கள்; ஆழமான கேள்விகளில் ஈடுபாடு கொண்டவர்கள்.",
            en="Poorattathi natives possess deep wisdom and philosophical thinking. They seek inner transformation and are drawn to profound questions.",
        ),
        strengths=[
            NakshatraBiText(ta="தத்துவ ஞானம்", en="Philosophical wisdom"),
            NakshatraBiText(ta="தனக்குள் மாற்றம் தேடும் குணம்", en="Inner transformation"),
            NakshatraBiText(ta="ஆழமான சிந்தனை", en="Deep thinking"),
        ],
        cautions=[
            NakshatraBiText(ta="ஆன்மீகத்தோடு நடைமுறை விஷயங்களிலும் கவனம் செலுத்துவது நல்லது", en="Balance spiritual focus with practical matters"),
        ],
        compatibleGroups=["UTHIRATTADHI", "PUNARPOOSAM", "VISAKAM"],
    ),
    26: NakshatraCard(
        number=26, nameTa="உத்திரட்டாதி", nameEn="Uthirattathi",
        deityTa="அஹிர்புத்னியன்", deityEn="Ahirbudhnya (serpent of the deep)",
        symbolTa="கட்டிலின் பின்கால்கள் / மீன்", symbolEn="Back legs of funeral cot / Warrior fish",
        rulingPlanet="SATURN",
        profile=NakshatraBiText(
            ta="உத்திரட்டாதி நட்சத்திரத்தில் பிறந்தவர்கள் ஆன்மீக சக்தியும் சேவை மனமும் உடையவர்கள். சமூகத்துக்கு நன்மை செய்வார்கள்; ஆழ்ந்த ஆன்மீக உணர்வு இவர்களை வழிநடத்தும்.",
            en="Uthirattathi natives have spiritual energy and a service-oriented heart. They contribute to community and are guided by a deep spiritual sense.",
        ),
        strengths=[
            NakshatraBiText(ta="ஆன்மீக சக்தி", en="Spiritual strength"),
            NakshatraBiText(ta="சேவை மனம்", en="Service orientation"),
            NakshatraBiText(ta="சமூகத்துக்குச் செய்யும் பங்களிப்பு", en="Community contribution"),
        ],
        cautions=[
            NakshatraBiText(ta="உங்களைக் கவனித்துக்கொள்ள மறக்க வேண்டாம்", en="Do not neglect self-care"),
        ],
        compatibleGroups=["POORATTADHI", "REVATHI", "POOSAM"],
    ),
    27: NakshatraCard(
        number=27, nameTa="ரேவதி", nameEn="Revathi",
        deityTa="பூஷன்", deityEn="Pushan (nourisher, protector of flocks)",
        symbolTa="இரட்டை மீன்கள் / மத்தளம்", symbolEn="Pair of fish / Drum",
        rulingPlanet="MERCURY",
        profile=NakshatraBiText(
            ta="ரேவதி நட்சத்திரத்தில் பிறந்தவர்கள் கனிவும் அன்பும் கலை ஆர்வமும் உடையவர்கள். மற்றவர்களை வழிநடத்துவார்கள்; வழி தவறியவர்களைக் கரை சேர்ப்பார்கள்.",
            en="Revathi natives are nurturing, loving, and artistically inclined. They have the ability to guide others and bring home those who are lost.",
        ),
        strengths=[
            NakshatraBiText(ta="அன்பான குணம்", en="Loving nature"),
            NakshatraBiText(ta="வழிகாட்டும் ஆற்றல்", en="Guiding ability"),
            NakshatraBiText(ta="கலை ஆர்வம்", en="Artistic interest"),
        ],
        cautions=[
            NakshatraBiText(ta="யாரை நம்புவது என்பதில் கவனமாக இருப்பது நல்லது", en="Exercise care in whom you trust"),
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

