"""
Tamil 10-kuta (Porutham) compatibility engine.

Classical 10 kutas scored against a maximum total of 36 points.
Nakshatra numbers are 1-indexed (1 = Aswini … 27 = Revathi).
"""
from __future__ import annotations

from dataclasses import dataclass

from app.calculations.chart_strength import SIGN_LORD

# ---------------------------------------------------------------------------
# Nakshatra → Gana mapping (1-based nakshatra index)
# Deva=1, Manushya=2, Rakshasa=3
# ---------------------------------------------------------------------------
_GANA: dict[int, int] = {
    1: 1, 2: 3, 3: 1, 4: 1, 5: 1,   # Aswini, Bharani, Karthigai, Rohini, Mirugaseer
    6: 3, 7: 1, 8: 1, 9: 3,           # Thiruvathirai, Punarpoosam, Poosam, Ayilyam
    10: 3, 11: 2, 12: 2, 13: 1,       # Magam, Pooram, Uthiram, Hastham
    14: 3, 15: 1, 16: 3, 17: 2,       # Chithirai, Swathi, Visakam, Anusham
    18: 3, 19: 3, 20: 2, 21: 2,       # Kettai, Moolam, Pooradam, Uthiradam
    22: 1, 23: 3, 24: 3,               # Thiruvonam, Avittam, Sadayam
    25: 2, 26: 1, 27: 2,               # Poorattathi, Uthirattathi, Revathi
}

# ---------------------------------------------------------------------------
# Nakshatra → Yoni (animal symbol) mapping
# 14 yoni symbols; each nakshatra is assigned one.
# Coded 1-14:
#  1=Horse, 2=Elephant, 3=Sheep, 4=Serpent, 5=Dog, 6=Cat, 7=Rat,
#  8=Cow, 9=Buffalo, 10=Tiger, 11=Hare, 12=Monkey, 13=Lion, 14=Mongoose
# ---------------------------------------------------------------------------
_YONI: dict[int, int] = {
    1: 1,  2: 2,  3: 3,  4: 4,  5: 4,
    6: 5,  7: 6,  8: 7,  9: 4,  10: 8,
    11: 9, 12: 10, 13: 11, 14: 12, 15: 13,
    16: 14, 17: 3, 18: 5, 19: 5, 20: 6,
    21: 7, 22: 8, 23: 13, 24: 9, 25: 10,
    26: 11, 27: 12,
}

# Friendly yoni pairs (score 4); same yoni = 4; hostile = 0; neutral = 2
_YONI_HOSTILE: frozenset[frozenset[int]] = frozenset(
    frozenset(pair) for pair in [
        {1, 2},   # Horse vs Elephant
        {3, 8},   # Sheep vs Cow
        {4, 5},   # Serpent vs Dog
        {6, 7},   # Cat vs Rat
        {9, 10},  # Buffalo vs Tiger  (was {9, 13} — Tiger/Lion were swapped)
        {11, 13}, # Hare vs Lion      (was {10, 11})
        {12, 14}, # Monkey vs Mongoose
    ]
)
_YONI_FRIENDLY: frozenset[frozenset[int]] = frozenset(
    frozenset(pair) for pair in [
        {1, 9}, {2, 10}, {3, 6}, {4, 11}, {5, 12}, {7, 14}, {8, 13},
    ]
)

# ---------------------------------------------------------------------------
# Nakshatra → Rasi mapping (each nakshatra spans 2½ signs; 1-indexed)
# ---------------------------------------------------------------------------
def _nakshatra_to_rasi(nakshatra: int) -> int:
    """Return the rasi (1-12) that owns the given nakshatra (1-27)."""
    return ((nakshatra - 1) * 3 // 9) % 12 + 1


# Precomputed for speed
_NAK_RASI: dict[int, int] = {n: _nakshatra_to_rasi(n) for n in range(1, 28)}
_NAKSHATRA_NADI: dict[int, str] = {
    n: ("AADHI" if (n - 1) % 9 < 3 else "MADHYA" if (n - 1) % 9 < 6 else "ANTHYA")
    for n in range(1, 28)
}

# ---------------------------------------------------------------------------
# Rasi lord — reuse SIGN_LORD from chart_strength
# (keys 1-12, values uppercase planet names)
# ---------------------------------------------------------------------------

# Graha Maitri table: 1=friend, 0=enemy, 0.5=neutral
_GRAHA_RELATION: dict[tuple[str, str], float] = {}

def _gm(a: str, b: str, rel: float) -> None:
    _GRAHA_RELATION[(a, b)] = rel
    _GRAHA_RELATION[(b, a)] = rel

# Same planet
for _p in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"):
    _GRAHA_RELATION[(_p, _p)] = 1.0

_gm("SUN", "MOON", 1.0)
_gm("SUN", "MARS", 1.0)
_gm("SUN", "JUPITER", 1.0)
_gm("SUN", "MERCURY", 0.5)
_gm("SUN", "VENUS", 0.0)
_gm("SUN", "SATURN", 0.0)
_gm("MOON", "MERCURY", 1.0)
_gm("MOON", "MARS", 0.5)
_gm("MOON", "JUPITER", 1.0)
_gm("MOON", "VENUS", 0.5)
_gm("MOON", "SATURN", 0.5)
_gm("MARS", "JUPITER", 1.0)
_gm("MARS", "VENUS", 0.5)
_gm("MARS", "SATURN", 0.5)
_gm("MARS", "MERCURY", 0.0)
_gm("MERCURY", "JUPITER", 0.5)
_gm("MERCURY", "VENUS", 1.0)
_gm("MERCURY", "SATURN", 1.0)
_gm("JUPITER", "VENUS", 0.0)
_gm("JUPITER", "SATURN", 0.0)
_gm("VENUS", "SATURN", 1.0)


def _graha_maitri_score(lord_a: str, lord_b: str) -> int:
    """Return 5/4/3/0 for mutual friendship score."""
    ab = _GRAHA_RELATION.get((lord_a, lord_b), 0.5)
    ba = _GRAHA_RELATION.get((lord_b, lord_a), 0.5)
    avg = (ab + ba) / 2.0
    if avg >= 1.0:
        return 5
    if avg >= 0.75:
        return 4
    if avg >= 0.5:
        return 3
    return 0


# ---------------------------------------------------------------------------
# Rajju groups (nakshatra groups in cycles of 5)
# Shira=1, Kanta=2, Udara=3, Nabhi=4, Pada=5
# ---------------------------------------------------------------------------
_RAJJU_GROUP: dict[int, int] = {}
_rajju_cycle = [1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 5, 4]
for _i, _rg in enumerate(_rajju_cycle, start=1):
    _RAJJU_GROUP[_i] = _rg

# ---------------------------------------------------------------------------
# Vedha — nakshatra pairs that afflict each other
# ---------------------------------------------------------------------------
_VEDHA_PAIRS: frozenset[frozenset[int]] = frozenset(
    frozenset(p) for p in [
        {1, 19}, {2, 20}, {3, 21}, {4, 22}, {5, 23},
        {6, 24}, {7, 25}, {8, 26}, {9, 27}, {10, 16},
        {11, 17}, {12, 18}, {13, 15}, {14, 27},
    ]
)

# ---------------------------------------------------------------------------
# Vasya — which rasis are vasya to which
# Each key is a rasi; value is a frozenset of rasis under its vasya
# ---------------------------------------------------------------------------
_VASYA: dict[int, frozenset[int]] = {
    1: frozenset({5, 8}),    # Mesham → Simmam, Viruchigam
    2: frozenset({8, 11}),   # Rishabam → Viruchigam, Kumbam
    3: frozenset({9, 6}),    # Mithunam → Dhanusu, Kanni
    4: frozenset({10, 1}),   # Kadagam → Magaram, Mesham
    5: frozenset({11, 2}),   # Simmam → Kumbam, Rishabam
    6: frozenset({12, 3}),   # Kanni → Meenam, Mithunam
    7: frozenset({1, 4}),    # Thulam → Mesham, Kadagam
    8: frozenset({2, 7}),    # Viruchigam → Rishabam, Thulam
    9: frozenset({3, 6}),    # Dhanusu → Mithunam, Kanni
    10: frozenset({4, 7}),   # Magaram → Kadagam, Thulam
    11: frozenset({5, 1}),   # Kumbam → Simmam, Mesham
    12: frozenset({6, 9}),   # Meenam → Kanni, Dhanusu
}


def _dinam_score(nak_boy: int, nak_girl: int) -> int:
    """Dinam (Dhinam): count from girl's nakshatra to boy's, max 3."""
    diff = (nak_boy - nak_girl) % 27
    remainder = diff % 9
    # remainder=0 means same nakshatra group — inauspicious per Tamil Thirukanitham
    return 3 if remainder in {1, 2, 3, 4} else 0


def _ganam_score(nak_boy: int, nak_girl: int) -> int:
    """Ganam: same gana = 6, compatible = 5, incompatible = 0."""
    gb = _GANA[nak_boy]
    gg = _GANA[nak_girl]
    if gb == gg:
        return 6
    # Deva+Manushya allowed with mild reduction; Deva+Rakshasa / Manushya+Rakshasa not
    if frozenset({gb, gg}) == frozenset({1, 2}):
        return 5
    return 0


def _yoni_score(nak_boy: int, nak_girl: int) -> int:
    """Yoni: same=4, friendly=3, neutral=2, hostile=0."""
    yb = _YONI[nak_boy]
    yg = _YONI[nak_girl]
    if yb == yg:
        return 4
    pair = frozenset({yb, yg})
    if pair in _YONI_FRIENDLY:
        return 3
    if pair in _YONI_HOSTILE:
        return 0
    return 2


def _rasi_score(rasi_boy: int, rasi_girl: int) -> int:
    """Rasi kuta: 7 if 7th, 6 if 7th from girl, else 0 for hostile; otherwise 0–5."""
    diff_bg = (rasi_boy - rasi_girl) % 12 + 1   # position of boy from girl
    diff_gb = (rasi_girl - rasi_boy) % 12 + 1   # position of girl from boy
    if diff_bg == 7 or diff_gb == 7:
        return 7
    if diff_bg in {2, 6} or diff_gb in {2, 6}:
        return 5
    if diff_bg in {4, 8} or diff_gb in {4, 8}:
        return 0
    return 4


def _graha_maitri_kuta(rasi_boy: int, rasi_girl: int) -> int:
    """Graha Maitri (Rasyadhipati): lord friendship, max 5."""
    lb = SIGN_LORD[rasi_boy]
    lg = SIGN_LORD[rasi_girl]
    return _graha_maitri_score(lb, lg)


def _rajju_score(nak_boy: int, nak_girl: int) -> int:
    """Rajju: same group = 0 (dosha), different = 2 (max 2)."""
    return 0 if _RAJJU_GROUP[nak_boy] == _RAJJU_GROUP[nak_girl] else 2


def _vedha_score(nak_boy: int, nak_girl: int) -> int:
    """Vedha: if vedha pair, score 0; else 2."""
    return 0 if frozenset({nak_boy, nak_girl}) in _VEDHA_PAIRS else 2


def _vasya_score(rasi_boy: int, rasi_girl: int) -> int:
    """Vasya: mutual = 2, one-sided = 1, none = 0."""
    bg = rasi_girl in _VASYA.get(rasi_boy, frozenset())
    gb = rasi_boy in _VASYA.get(rasi_girl, frozenset())
    if bg and gb:
        return 2
    if bg or gb:
        return 1
    return 0


def _mahendra_score(nak_boy: int, nak_girl: int) -> int:
    """Mahendra: count from girl's nak to boy's (1-based); auspicious at positions 4,7,10,13,16,19,22,25."""
    diff = (nak_boy - nak_girl) % 27 + 1
    return 4 if diff in {4, 7, 10, 13, 16, 19, 22, 25} else 0


def _stree_dirgha_score(nak_boy: int, nak_girl: int) -> int:
    """Stree Dirgha: boy's nak should be > 9 places from girl's for good score."""
    diff = (nak_boy - nak_girl) % 27
    return 5 if diff > 9 else 0


# ---------------------------------------------------------------------------
# Public dataclasses and entry point
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class KutaResult:
    name: str
    name_ta: str
    score: int
    max_score: int
    label: str   # EXCELLENT / GOOD / AVERAGE / POOR


@dataclass(frozen=True, slots=True)
class PorutthamResult:
    kutas: list[KutaResult]
    total_score: int
    max_score: int   # always 36
    percentage: float
    label: str       # EXCELLENT / GOOD / AVERAGE / CAUTION
    rajju_dosha: bool
    vedha_dosha: bool
    nadi_dosha: dict[str, object]
    summary_en: str
    summary_ta: str


def check_nadi_dosha(
    boy_nakshatra: int,
    girl_nakshatra: int,
) -> dict[str, object]:
    boy_nadi = _NAKSHATRA_NADI[boy_nakshatra]
    girl_nadi = _NAKSHATRA_NADI[girl_nakshatra]
    has_dosha = boy_nadi == girl_nadi

    cancellations: list[str] = []
    if has_dosha and boy_nakshatra != girl_nakshatra:
        if _NAK_RASI[boy_nakshatra] != _NAK_RASI[girl_nakshatra]:
            cancellations.append("Different rasi — Nadi Dosha partially mitigated")

    final_has_dosha = has_dosha and not cancellations
    if final_has_dosha:
        severity = "SEVERE"
    elif has_dosha:
        severity = "MILD"
    else:
        severity = "NONE"

    return {
        "boy_nadi": boy_nadi,
        "girl_nadi": girl_nadi,
        "has_nadi_dosha": final_has_dosha,
        "cancellations": cancellations,
        "severity": severity,
        "note_ta": (
            "நாடி தோஷம் உள்ளது — குழந்தைகள் உடல்நலத்தில் கவனம் தேவை. பரிகாரம் குறித்து ஆலோசிக்கவும்."
            if has_dosha else "நாடி தோஷம் இல்லை."
        ),
        "note_en": (
            "Nadi Dosha present — children's health needs extra caution. Seek remedial guidance."
            if has_dosha else "No Nadi Dosha."
        ),
    }


def _kuta_label(score: int, max_score: int) -> str:
    pct = score / max_score if max_score else 0
    if pct >= 0.85:
        return "EXCELLENT"
    if pct >= 0.6:
        return "GOOD"
    if pct >= 0.35:
        return "AVERAGE"
    return "POOR"


def compute_porutham(
    *,
    boy_nakshatra: int,
    girl_nakshatra: int,
    boy_rasi: int,
    girl_rasi: int,
) -> PorutthamResult:
    """
    Compute all 10 kutas.

    Parameters
    ----------
    boy_nakshatra / girl_nakshatra : int  1-27
    boy_rasi / girl_rasi           : int  1-12
    """
    dinam   = _dinam_score(boy_nakshatra, girl_nakshatra)
    ganam   = _ganam_score(boy_nakshatra, girl_nakshatra)
    yoni    = _yoni_score(boy_nakshatra, girl_nakshatra)
    rasi    = _rasi_score(boy_rasi, girl_rasi)
    gm      = _graha_maitri_kuta(boy_rasi, girl_rasi)
    rajju   = _rajju_score(boy_nakshatra, girl_nakshatra)
    vedha   = _vedha_score(boy_nakshatra, girl_nakshatra)
    vasya   = _vasya_score(boy_rasi, girl_rasi)
    mahendra = _mahendra_score(boy_nakshatra, girl_nakshatra)
    stree   = _stree_dirgha_score(boy_nakshatra, girl_nakshatra)

    maxes = {
        "Dinam": 3, "Ganam": 6, "Yoni": 4, "Rasi": 7, "Graha Maitri": 5,
        "Vasya": 2, "Mahendra": 4, "Stree Dirgha": 5,
        # Rajju and Vedha are dosha-only flags; not counted in positive score total
    }
    MAX_SCORE = 36  # 3+6+4+7+5+2+4+5 = 36

    _names_ta = {
        "Dinam": "தினம்", "Ganam": "கணம்", "Yoni": "யோனி", "Rasi": "ராசி",
        "Graha Maitri": "கிரக மைத்திரி", "Rajju": "ரஜ்ஜு", "Vedha": "வேதம்",
        "Vasya": "வாஸ்யம்", "Mahendra": "மகேந்திரம்", "Stree Dirgha": "ஸ்த்ரீ தீர்கம்",
    }

    raw_scores = {
        "Dinam": dinam, "Ganam": ganam, "Yoni": yoni, "Rasi": rasi,
        "Graha Maitri": gm, "Vasya": vasya, "Mahendra": mahendra, "Stree Dirgha": stree,
    }

    kutas: list[KutaResult] = [
        KutaResult(
            name=name,
            name_ta=_names_ta[name],
            score=raw_scores[name],
            max_score=maxes[name],
            label=_kuta_label(raw_scores[name], maxes[name]),
        )
        for name in maxes
    ]

    total = sum(raw_scores.values())
    percentage = round(total / MAX_SCORE * 100, 1)

    rajju_dosha = rajju == 0
    vedha_dosha = vedha == 0
    nadi_dosha = check_nadi_dosha(boy_nakshatra, girl_nakshatra)

    if percentage >= 80:
        label = "EXCELLENT"
        summary_en = (
            f"Porutham score {total}/{MAX_SCORE} ({percentage}%). "
            "Strong overall compatibility across the 10 kutas — traditionally associated with a harmonious union."
        )
        summary_ta = (
            f"பொருத்தம் மதிப்பெண் {total}/{MAX_SCORE} ({percentage}%). "
            "10 கூட்டு பொருத்தங்களிலும் நல்ல ஒத்திசைவு — இணக்கமான வாழ்க்கைக்கு பாரம்பரியமாக சாதகமான அறிகுறி."
        )
    elif percentage >= 60:
        label = "GOOD"
        summary_en = (
            f"Porutham score {total}/{MAX_SCORE} ({percentage}%). "
            "Good compatibility with minor differences — traditionally considered suitable with mindful approach."
        )
        summary_ta = (
            f"பொருத்தம் மதிப்பெண் {total}/{MAX_SCORE} ({percentage}%). "
            "நல்ல ஒத்திசைவு, சில சிறு வேறுபாடுகளுடன் — கவனமான அணுகுமுறையுடன் பாரம்பரியமாக ஏற்புடையது."
        )
    elif percentage >= 40:
        label = "AVERAGE"
        summary_en = (
            f"Porutham score {total}/{MAX_SCORE} ({percentage}%). "
            "Moderate compatibility — some kutas need attention; consultation with a jyotishi is advised."
        )
        summary_ta = (
            f"பொருத்தம் மதிப்பெண் {total}/{MAX_SCORE} ({percentage}%). "
            "நடுத்தர ஒத்திசைவு — சில கூட்டு பொருத்தங்களில் கவனம் தேவை; ஜோதிடர் ஆலோசனை உதவும்."
        )
    else:
        label = "CAUTION"
        summary_en = (
            f"Porutham score {total}/{MAX_SCORE} ({percentage}%). "
            "Significant incompatibilities found — traditional guidance recommends careful consultation before proceeding."
        )
        summary_ta = (
            f"பொருத்தம் மதிப்பெண் {total}/{MAX_SCORE} ({percentage}%). "
            "குறிப்பிடத்தக்க பொருத்தமின்மை கண்டறியப்பட்டுள்ளது — தொடரும் முன் ஜோதிட ஆலோசனை அவசியம்."
        )

    if rajju_dosha:
        suffix_en = " Rajju dosha is present — this is traditionally associated with health/longevity concerns and requires remedial attention."
        suffix_ta = " ரஜ்ஜு தோஷம் உள்ளது — இது பாரம்பரியமாக ஆரோக்கிய/ஆயுள் கவலைகளுடன் தொடர்புடையது; பரிகாரம் பரிந்துரைக்கப்படுகிறது."
        summary_en += suffix_en
        summary_ta += suffix_ta

    if vedha_dosha:
        suffix_en = " Vedha dosha is active — these nakshatras are traditionally considered incompatible pairs."
        suffix_ta = " வேத தோஷம் உள்ளது — இந்த நட்சத்திரங்கள் பாரம்பரியமாக பொருந்தாத ஜோடிகளாக கருதப்படுகின்றன."
        summary_en += suffix_en
        summary_ta += suffix_ta

    return PorutthamResult(
        kutas=kutas,
        total_score=total,
        max_score=MAX_SCORE,
        percentage=percentage,
        label=label,
        rajju_dosha=rajju_dosha,
        vedha_dosha=vedha_dosha,
        nadi_dosha=nadi_dosha,
        summary_en=summary_en,
        summary_ta=summary_ta,
    )
