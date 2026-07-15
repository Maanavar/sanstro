"""
Tamil 10-Porutham compatibility engine (Thirukanitham tradition).

Implements the classical Tamil panchangam 10-porutham system as a pass/fail
check on each of the 10 criteria. The result is expressed as a score out of 10
(one point per porutham that passes). Rajju and Vedha are absolute vetoes:
if either is present the union is traditionally considered inauspicious regardless
of the overall score.

The 10 Poruthams (Tamil → calculation rule):
  1. Dinam      (தினம்)           — count boy's nak from girl's (1-based, 1-27); pass only for the classical good-count table (incl. the 9th/18th counts, Parama Mitra tara)
  2. Ganam      (கணம்)            — Deva/Manushya/Rakshasa; Deva+Deva or Deva+Manushya = pass
  3. Mahendra   (மகேந்திரம்)      — count girl's nak from boy's; pass if result ∈ {4,7,10,13,16,19,22,25}
  4. Stree Dirgham (ஸ்திரீ தீர்கம்) — count boy's nak from girl's; pass if count > 7 (≥ 8)
  5. Yoni       (யோனி)            — same or neutral animal pair = pass; hostile pair = fail
  6. Rasi       (ராசி)            — pass unless 6th or 8th position (Shashtashtaka) between rasis
  7. Rasiyathipathi (ராசியாதிபதி) — FAIL if either rasi lord regards the other as an enemy (one-way enmity fails)
  8. Vasya      (வாஸ்யம்)         — at least one rasi must be vasya of the other
  9. Rajju      (ராஜ்ஜு)          — same Rajju group = VETO (widowhood risk)
 10. Vedha      (வேதம்)           — Vedha nakshatra pair = VETO

Nakshatra numbers are 1-indexed (1 = Aswini … 27 = Revathi).
"""
from __future__ import annotations

from dataclasses import dataclass

from app.calculations.astro import nakshatra_to_rasi
from app.calculations.chart_strength import SIGN_LORD

# ---------------------------------------------------------------------------
# Nakshatra → Gana mapping (1-based nakshatra index)
# Deva=1, Manushya=2, Rakshasa=3
# Public (also consumed by app.services.nakshatra_content for the per-star
# profile card's Ganam attribute — same classical table, not duplicated).
# ---------------------------------------------------------------------------
GANA_BY_NAKSHATRA: dict[int, int] = {
    1: 1, 2: 2, 3: 3, 4: 2, 5: 1,
    6: 2, 7: 1, 8: 1, 9: 3,
    10: 3, 11: 2, 12: 2, 13: 1,
    14: 3, 15: 1, 16: 3, 17: 1,
    18: 3, 19: 3, 20: 2, 21: 2,
    22: 1, 23: 3, 24: 3,
    25: 2, 26: 2, 27: 1,
}

# ---------------------------------------------------------------------------
# Nakshatra → Yoni (animal symbol) mapping
# 14 yoni symbols; 1=Horse 2=Elephant 3=Sheep 4=Serpent 5=Dog 6=Cat 7=Rat
#                  8=Cow 9=Buffalo 10=Tiger 11=Deer 12=Monkey 13=Lion 14=Mongoose
# Public (also consumed by app.services.nakshatra_content for the per-star
# profile card's Yoni attribute — same classical table, not duplicated).
# ---------------------------------------------------------------------------
YONI_BY_NAKSHATRA: dict[int, int] = {
    1: 1,  2: 2,  3: 3,  4: 4,  5: 4,
    6: 5,  7: 6,  8: 3,  9: 6,  10: 7,
    11: 7, 12: 8, 13: 9, 14: 10, 15: 9,
    16: 10, 17: 11, 18: 11, 19: 5, 20: 12,
    21: 14, 22: 12, 23: 13, 24: 1, 25: 13,
    26: 8, 27: 2,
}

_YONI_HOSTILE: frozenset[frozenset[int]] = frozenset(
    frozenset(pair) for pair in [
        {8, 10},   # Cow vs Tiger
        {2, 13},   # Elephant vs Lion
        {1, 9},    # Horse vs Buffalo
        {5, 11},   # Dog vs Deer
        {4, 14},   # Serpent vs Mongoose
        {6, 7},    # Cat vs Rat
        {3, 12},   # Sheep vs Monkey
    ]
)

# ---------------------------------------------------------------------------
# Nakshatra → Nadi mapping (1-indexed)
# Classical assignment zigzags in a repeating 6-nakshatra cycle
# (Aadhi, Madhya, Anthya, Anthya, Madhya, Aadhi) — NOT contiguous blocks of 3.
# Aadhi   = 1,6,7,12,13,18,19,24,25
# Madhya  = 2,5,8,11,14,17,20,23,26
# Anthya  = 3,4,9,10,15,16,21,22,27
# ---------------------------------------------------------------------------
_NADI_CYCLE = ("AADHI", "MADHYA", "ANTHYA", "ANTHYA", "MADHYA", "AADHI")
_NAKSHATRA_NADI: dict[int, str] = {
    n: _NADI_CYCLE[(n - 1) % 6] for n in range(1, 28)
}

# ---------------------------------------------------------------------------
# Graha Maitri (planet friendship) table — Parashari Permanent Friendship
# Asymmetric: each entry (A, B) is A's view of B; 1.0=friend 0.5=neutral 0.0=enemy
# ---------------------------------------------------------------------------
_GRAHA_RELATION: dict[tuple[str, str], float] = {}

def _gr(a: str, b: str, a_to_b: float, b_to_a: float) -> None:
    _GRAHA_RELATION[(a, b)] = a_to_b
    _GRAHA_RELATION[(b, a)] = b_to_a

for _p in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"):
    _GRAHA_RELATION[(_p, _p)] = 1.0

#                              A→B   B→A
_gr("SUN",     "MOON",    1.0, 1.0)  # friends both ways
_gr("SUN",     "MARS",    1.0, 1.0)  # friends both ways
_gr("SUN",     "JUPITER", 1.0, 1.0)  # friends both ways
_gr("SUN",     "MERCURY", 0.5, 1.0)  # Sun:neutral, Mercury:friend
_gr("SUN",     "VENUS",   0.0, 0.0)  # enemies both ways
_gr("SUN",     "SATURN",  0.0, 0.0)  # enemies both ways
_gr("MOON",    "MERCURY", 1.0, 0.0)  # Moon:friend, Mercury:enemy
_gr("MOON",    "MARS",    0.5, 1.0)  # Moon:neutral, Mars:friend
_gr("MOON",    "JUPITER", 0.5, 1.0)  # Moon:neutral, Jupiter:friend
_gr("MOON",    "VENUS",   0.5, 0.0)  # Moon:neutral, Venus:enemy
_gr("MOON",    "SATURN",  0.5, 0.0)  # Moon:neutral, Saturn:enemy
_gr("MARS",    "MERCURY", 0.0, 0.5)  # Mars:enemy, Mercury:neutral
_gr("MARS",    "JUPITER", 1.0, 1.0)  # friends both ways
_gr("MARS",    "VENUS",   0.5, 0.5)  # neutral both ways
_gr("MARS",    "SATURN",  0.5, 0.0)  # Mars:neutral, Saturn:enemy
_gr("MERCURY", "JUPITER", 0.5, 0.0)  # Mercury:neutral, Jupiter:enemy
_gr("MERCURY", "VENUS",   1.0, 1.0)  # friends both ways
_gr("MERCURY", "SATURN",  0.5, 1.0)  # Mercury:neutral, Saturn:friend (Parashari; matches chart_strength._NATURAL_FRIENDS)
_gr("JUPITER", "VENUS",   0.0, 0.5)  # Jupiter:enemy, Venus:neutral
_gr("JUPITER", "SATURN",  0.5, 0.5)  # neutral both ways
_gr("VENUS",   "SATURN",  1.0, 1.0)  # friends both ways

# ---------------------------------------------------------------------------
# Rajju groups — "tent" cycle with period 9: Pada,Kati,Udara,Kanta,Sira,Kanta,Udara,Kati,Pada
# ---------------------------------------------------------------------------
_RAJJU_GROUP: dict[int, int] = {}
_rajju_cycle = [1, 2, 3, 4, 5, 4, 3, 2, 1] * 3
for _i, _rg in enumerate(_rajju_cycle, start=1):
    _RAJJU_GROUP[_i] = _rg

# ---------------------------------------------------------------------------
# Vedha — nakshatra pairs that afflict each other (absolute veto)
# ---------------------------------------------------------------------------
_VEDHA_PAIRS: frozenset[frozenset[int]] = frozenset(
    frozenset(p) for p in [
        {1, 18}, {2, 17}, {3, 16}, {4, 15}, {5, 23},
        {6, 22}, {7, 21}, {8, 20}, {9, 19}, {10, 27},
        {11, 26}, {12, 25}, {13, 24},
    ]
)

# ---------------------------------------------------------------------------
# Vasya — rasi-to-rasi vasya table (classical Tamil Thirukanitham tradition)
# Key = rasi (1-based), Value = rasis it controls
# ---------------------------------------------------------------------------
_VASYA: dict[int, frozenset[int]] = {
    1:  frozenset({5, 8}),   # Mesha   → Simha, Vrischika
    2:  frozenset({4, 7}),   # Rishaba → Kataka, Thula
    3:  frozenset({6}),      # Mithuna → Kanni
    4:  frozenset({8, 9}),   # Kataka  → Vrischika, Dhanus
    5:  frozenset({7}),      # Simha   → Thula
    6:  frozenset({3, 12}),  # Kanni   → Mithuna, Meena
    7:  frozenset({10}),     # Thula   → Makara
    8:  frozenset({4}),      # Vrischika → Kataka
    9:  frozenset({12}),     # Dhanus  → Meena
    10: frozenset({1}),      # Makara  → Mesha
    11: frozenset({1}),      # Kumbha  → Mesha
    12: frozenset({10}),     # Meena   → Makara
}


# ---------------------------------------------------------------------------
# Individual porutham checks — each returns 1 (PASS) or 0 (FAIL)
# ---------------------------------------------------------------------------

# Spec §11.4 — count boy's nak from girl's (1-based, 1..27); these counts pass.
# Includes the 9th/18th counts (Parama Mitra tara) as a pass. 17/22/27 are
# deliberately absent: a pure tara-mod-9 rule would pass them, but the locked
# spec table is the 12-count Tamil variant — the product stance.
_DINAM_GOOD_COUNTS = frozenset({2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 24, 26})


def _dinam_score(nak_boy: int, nak_girl: int) -> int:
    """Dinam: count boy's nak from girl's (1-based); PASS if count in the classical good-count table."""
    count = ((nak_boy - nak_girl) % 27) + 1
    return 1 if count in _DINAM_GOOD_COUNTS else 0


def _ganam_score(nak_boy: int, nak_girl: int) -> int:
    """Ganam: same gana or Deva+Manushya = PASS; Rakshasa mix = FAIL."""
    gb = GANA_BY_NAKSHATRA[nak_boy]
    gg = GANA_BY_NAKSHATRA[nak_girl]
    if gb == gg:
        return 1
    if frozenset({gb, gg}) == frozenset({1, 2}):  # Deva + Manushya
        return 1
    return 0


def _mahendra_score(nak_boy: int, nak_girl: int) -> int:
    """Mahendra: count girl's nak from boy's (1-based); PASS if result ∈ {4,7,10,13,16,19,22,25}.

    Convention note: this project counts girl-from-boy. The reference spec
    (§11.5) and some worked examples count boy-from-girl instead. The two
    conventions produce identical PASS/FAIL outcomes here only because
    {4,7,10,13,16,19,22,25} is closed under c -> 29-c (the two count
    directions around a 27-star ring always sum to 29) — see
    test_mahendra_good_set_symmetric_under_direction_reversal. That symmetry
    is an accident of this particular set, not a general guarantee, so do not
    assume any future edit to it preserves direction-independence without
    re-checking. Not changed — documenting the choice per the 2026-07 audit.
    """
    diff = (nak_girl - nak_boy) % 27 + 1
    return 1 if diff in {4, 7, 10, 13, 16, 19, 22, 25} else 0


def _stree_dirgha_score(nak_boy: int, nak_girl: int) -> int:
    """Stree Dirgham: count boy's nak from girl's (0-based); PASS if count > 7 (1-indexed ≥ 8).

    Convention note: this project uses the lenient ≥8 threshold. Some traditions
    require a stricter ≥13 (half the 27-nakshatra circle) before passing. Not
    changed — documenting the choice per the 2026-07 audit.
    """
    diff = (nak_boy - nak_girl) % 27
    return 1 if diff > 6 else 0


def _yoni_score(nak_boy: int, nak_girl: int) -> int:
    """Yoni: hostile pair = FAIL; same or neutral = PASS."""
    yb = YONI_BY_NAKSHATRA[nak_boy]
    yg = YONI_BY_NAKSHATRA[nak_girl]
    if frozenset({yb, yg}) in _YONI_HOSTILE:
        return 0
    return 1


def _rasi_score(rasi_boy: int, rasi_girl: int) -> int:
    """Rasi: Shashtashtaka (6th or 8th) position = FAIL; all others = PASS.

    Convention note: this project only fails Shashtashtaka (6/8). Some
    traditions additionally fail Dwidwadasa (2nd/12th) position. Not changed —
    documenting the choice per the 2026-07 audit.
    """
    diff_bg = (rasi_boy - rasi_girl) % 12 + 1
    diff_gb = (rasi_girl - rasi_boy) % 12 + 1
    if diff_bg in {6, 8} or diff_gb in {6, 8}:
        return 0
    return 1


def _graha_maitri_kuta(rasi_boy: int, rasi_girl: int) -> int:
    """Rasiyathipathi: FAIL if either rasi lord considers the other an enemy."""
    lb = SIGN_LORD[rasi_boy]
    lg = SIGN_LORD[rasi_girl]
    ab = _GRAHA_RELATION.get((lb, lg), 0.5)
    ba = _GRAHA_RELATION.get((lg, lb), 0.5)
    return 0 if (ab == 0.0 or ba == 0.0) else 1


def _rajju_score(nak_boy: int, nak_girl: int) -> int:
    """Rajju: same Rajju group = FAIL (veto); different group = PASS.
    Eka-nakshatra (same birth star) is an accepted exception in Thirukanitham."""
    if nak_boy == nak_girl:
        return 1
    return 0 if _RAJJU_GROUP[nak_boy] == _RAJJU_GROUP[nak_girl] else 1


def _vedha_score(nak_boy: int, nak_girl: int) -> int:
    """Vedha: vedha nakshatra pair = FAIL (veto); else PASS."""
    return 0 if frozenset({nak_boy, nak_girl}) in _VEDHA_PAIRS else 1


def _vasya_score(rasi_boy: int, rasi_girl: int) -> int:
    """Vasya: same rasi, or at least one rasi vasya of the other = PASS; else FAIL."""
    if rasi_boy == rasi_girl:
        return 1
    bg = rasi_girl in _VASYA.get(rasi_boy, frozenset())
    gb = rasi_boy in _VASYA.get(rasi_girl, frozenset())
    return 1 if (bg or gb) else 0


# ---------------------------------------------------------------------------
# Public dataclasses and entry point
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class KutaResult:
    name: str
    name_ta: str
    passed: bool
    score: int      # 1 = pass, 0 = fail (kept for API compatibility)
    max_score: int  # always 1
    label: str      # "PASS" or "FAIL"


@dataclass(frozen=True, slots=True)
class PorutthamResult:
    kutas: list[KutaResult]
    total_score: int   # 0–10
    max_score: int     # always 10
    percentage: float
    label: str         # EXCELLENT / GOOD / AVERAGE / CAUTION
    rajju_dosha: bool
    vedha_dosha: bool
    nadi_dosha: dict[str, object]
    summary_en: str
    summary_ta: str


# ---------------------------------------------------------------------------
# Nadi Dosha cancellation (A-9 v2, astrologer ruling 2026-07-14)
#
# "Different rasi alone" does NOT cancel Nadi Dosha (the old rule was too
# lenient and is retired). Cancellation requires one of:
#   1. A Classical Exception (Parihāra) — applies in every mode:
#        - same nakshatra, different pada (eka nakshatra – bhinna pada)
#        - same rasi, different nakshatra (eka rasi – bhinna nakshatra)
#   2. Rasi-lord friendship (rasi-adhipati maitri), when Moon signs differ —
#      gated by the `nadi_parihara_mode` flag: `classical_lenient` grants a
#      full cancel, `strict` (default) records only a disclosed partial
#      mitigation — the dosha stays flagged.
# Same nakshatra + same pada is an explicit non-exception (never cancels).
# A Rajju hard-fail is surfaced independently of Nadi status in all modes —
# see `rajju_failed` — and `compute_porutham` separately forces the overall
# label to CAUTION whenever Rajju fails, so a Nadi exception can never imply
# the match is clear.
#
# Tamil text below was native-reviewed and approved as-is on 2026-07-15 (A-9
# Tamil pass, docs/tamil-review-nadi-dosha.md, status RESOLVED) — all six new v2
# sentences confirmed native-quality, no corrections. Locked by
# tests/test_nadi_dosha_v2.py::test_nadi_v2_tamil_strings_native_reviewed_locked;
# any edit here must go through review + update that golden test.
# ---------------------------------------------------------------------------

_NADI_PARIHARA_MODES = ("strict", "classical_lenient")

_NADI_PRESENT_EN = "Nadi Dosha present — children's health needs extra caution. Seek remedial guidance."
_NADI_PRESENT_TA = "நாடி தோஷம் உள்ளது — குழந்தைகள் உடல்நலத்தில் கவனம் தேவை. பரிகாரம் குறித்து ஆலோசிக்கவும்."
_NADI_NONE_EN = "No Nadi Dosha."
_NADI_NONE_TA = "நாடி தோஷம் இல்லை."

_NADI_EXCEPTION_PADA_EN = "Classical Exception (Parihāra): same nakshatra, different pada."
_NADI_EXCEPTION_PADA_TA = "பாரம்பரிய விதிவிலக்கு (பரிகாரம்): ஒரே நட்சத்திரம், வேறு பாதம்."
_NADI_EXCEPTION_RASI_EN = "Classical Exception (Parihāra): same rasi, different nakshatra."
_NADI_EXCEPTION_RASI_TA = "பாரம்பரிய விதிவிலக்கு (பரிகாரம்): ஒரே ராசி, வேறு நட்சத்திரம்."
_NADI_LENIENT_CANCEL_EN = (
    "Nadi Dosha may be considered cancelled when the Moon signs differ and the "
    "respective Rasi lords are identical or mutually friendly, subject to the "
    "tradition being followed. Different Rasi alone should not automatically "
    "cancel the dosha."
)
_NADI_LENIENT_CANCEL_TA = (
    "ராசிகள் வேறுபட்டு, அந்தந்த ராசி அதிபதிகள் ஒரே கிரகமாகவோ அல்லது பரஸ்பர "
    "நண்பர்களாகவோ இருக்கும்போது, பின்பற்றப்படும் பாரம்பரியத்தைப் பொறுத்து நாடி "
    "தோஷம் நீங்கியதாகக் கருதப்படலாம். வெறும் ராசி வேறுபாடு மட்டும் தோஷத்தை "
    "தானாக நீக்காது."
)
_NADI_STRICT_PARTIAL_EN = (
    "The Rasi lords are friendly, but under the strict reading followed here "
    "this is only a partial mitigation, not a full clearance of Nadi Dosha."
)
_NADI_STRICT_PARTIAL_TA = (
    "ராசி அதிபதிகள் நட்புடையவர்களாக இருந்தாலும், இங்கு பின்பற்றப்படும் கடுமையான "
    "நடைமுறையின்படி இது ஒரு பகுதி தணிப்பு மட்டுமே — நாடி தோஷம் முழுமையாக நீங்கவில்லை."
)
_NADI_CLOSING_CLAUSE_EN = (
    "This removes only the Nadi objection. Other mandatory poruthams "
    "(Rajju, Vedhai, Mahendra, Yoni, etc.) are evaluated independently."
)
_NADI_CLOSING_CLAUSE_TA = (
    "இது நாடி ஆட்சேபனையை மட்டுமே நீக்குகிறது. மற்ற கட்டாய பொருத்தங்கள் "
    "(ராஜ்ஜு, வேதம், மகேந்திரம், யோனி போன்றவை) தனித்தனியாக மதிப்பிடப்படுகின்றன."
)
_NADI_RAJJU_WARNING_EN = "Rajju Dosha still applies regardless of the Nadi outcome above."
_NADI_RAJJU_WARNING_TA = "மேலே உள்ள நாடி முடிவைப் பொருட்படுத்தாமல் ராஜ்ஜு தோஷம் இன்னும் பொருந்தும்."


def _rasi_lords_mutually_friendly(rasi_a: int, rasi_b: int) -> bool:
    """Rasi-adhipati maitri: identical lord, or friends in BOTH directions
    (Parashari mitra tier — a one-way neutral/friend does not qualify)."""
    lord_a = SIGN_LORD[rasi_a]
    lord_b = SIGN_LORD[rasi_b]
    if lord_a == lord_b:
        return True
    a_to_b = _GRAHA_RELATION.get((lord_a, lord_b), 0.5)
    b_to_a = _GRAHA_RELATION.get((lord_b, lord_a), 0.5)
    return a_to_b >= 1.0 and b_to_a >= 1.0


def check_nadi_dosha(
    boy_nakshatra: int,
    girl_nakshatra: int,
    *,
    boy_rasi: int | None = None,
    girl_rasi: int | None = None,
    boy_pada: int = 1,
    girl_pada: int = 1,
    mode: str = "strict",
    rajju_failed: bool = False,
) -> dict[str, object]:
    if mode not in _NADI_PARIHARA_MODES:
        mode = "strict"

    boy_nadi = _NAKSHATRA_NADI[boy_nakshatra]
    girl_nadi = _NAKSHATRA_NADI[girl_nakshatra]
    has_dosha = boy_nadi == girl_nadi
    boy_resolved_rasi = boy_rasi if boy_rasi is not None else nakshatra_to_rasi(boy_nakshatra, boy_pada)
    girl_resolved_rasi = girl_rasi if girl_rasi is not None else nakshatra_to_rasi(girl_nakshatra, girl_pada)

    nadi_cancelled = False
    mitigation = "NONE"
    cancellations: list[str] = []
    extra_en: list[str] = []
    extra_ta: list[str] = []

    if has_dosha:
        same_nakshatra = boy_nakshatra == girl_nakshatra
        same_pada = boy_pada == girl_pada
        same_rasi = boy_resolved_rasi == girl_resolved_rasi

        if same_nakshatra and same_pada:
            pass  # explicit guard: identical star AND pada never cancels
        elif same_nakshatra and not same_pada:
            nadi_cancelled = True
            mitigation = "FULL"
            cancellations.append("Classical Exception (Parihāra): same nakshatra, different pada")
            extra_en.append(_NADI_EXCEPTION_PADA_EN)
            extra_ta.append(_NADI_EXCEPTION_PADA_TA)
        elif same_rasi and not same_nakshatra:
            nadi_cancelled = True
            mitigation = "FULL"
            cancellations.append("Classical Exception (Parihāra): same rasi, different nakshatra")
            extra_en.append(_NADI_EXCEPTION_RASI_EN)
            extra_ta.append(_NADI_EXCEPTION_RASI_TA)
        elif not same_rasi and _rasi_lords_mutually_friendly(boy_resolved_rasi, girl_resolved_rasi):
            if mode == "classical_lenient":
                nadi_cancelled = True
                mitigation = "FULL"
                cancellations.append("Cancelled (lenient tradition): friendly/identical rasi lords")
                extra_en.append(_NADI_LENIENT_CANCEL_EN)
                extra_ta.append(_NADI_LENIENT_CANCEL_TA)
            else:
                mitigation = "MODERATE"
                cancellations.append("Partial mitigation only: friendly rasi lords (strict mode)")
                extra_en.append(_NADI_STRICT_PARTIAL_EN)
                extra_ta.append(_NADI_STRICT_PARTIAL_TA)
        # else: no cancellation, mitigation stays NONE (regression fix — a
        # difference in rasi alone, with unrelated lords, no longer cancels)

    if nadi_cancelled or mitigation != "NONE":
        cancellations.append(_NADI_CLOSING_CLAUSE_EN)
        extra_en.append(_NADI_CLOSING_CLAUSE_EN)
        extra_ta.append(_NADI_CLOSING_CLAUSE_TA)

    rajju_guard_warning: str | None = None
    if rajju_failed:
        rajju_guard_warning = _NADI_RAJJU_WARNING_EN
        extra_en.append(_NADI_RAJJU_WARNING_EN)
        extra_ta.append(_NADI_RAJJU_WARNING_TA)

    final_has_dosha = has_dosha and not nadi_cancelled
    severity = "SEVERE" if final_has_dosha else ("MILD" if has_dosha else "NONE")

    base_en = _NADI_PRESENT_EN if has_dosha else _NADI_NONE_EN
    base_ta = _NADI_PRESENT_TA if has_dosha else _NADI_NONE_TA
    note_en = " ".join([base_en, *extra_en])
    note_ta = " ".join([base_ta, *extra_ta])

    return {
        "boy_nadi": boy_nadi,
        "girl_nadi": girl_nadi,
        "boy_rasi": boy_resolved_rasi,
        "girl_rasi": girl_resolved_rasi,
        "has_nadi_dosha": final_has_dosha,
        "cancellations": cancellations,
        "severity": severity,
        "mitigation": mitigation,
        "nadi_parihara_mode": mode,
        "rajju_guard_warning": rajju_guard_warning,
        "note_ta": note_ta,
        "note_en": note_en,
    }


def compute_porutham(
    *,
    boy_nakshatra: int,
    girl_nakshatra: int,
    boy_rasi: int,
    girl_rasi: int,
    boy_pada: int = 1,
    girl_pada: int = 1,
    nadi_parihara_mode: str = "strict",
) -> PorutthamResult:
    """
    Compute all 10 Tamil Poruthams (pass/fail each, total out of 10).

    Parameters
    ----------
    boy_nakshatra / girl_nakshatra : int  1–27
    boy_rasi / girl_rasi           : int  1–12
    boy_pada / girl_pada           : int  1–4, real birth pada when known —
        feeds the Nadi "same nakshatra, different pada" Classical Exception
        (A-9 v2). Defaults to 1/1 (conservative: never spuriously grants the
        exception) when the caller doesn't have real pada data.
    nadi_parihara_mode             : "strict" (default) | "classical_lenient"
        — resolved by the caller from the `nadi_parihara_mode` feature flag;
        this module deliberately does not read flags itself (calculations
        layer stays flag-agnostic).
    """
    scores = {
        "Dinam":           _dinam_score(boy_nakshatra, girl_nakshatra),
        "Ganam":           _ganam_score(boy_nakshatra, girl_nakshatra),
        "Mahendra":        _mahendra_score(boy_nakshatra, girl_nakshatra),
        "Stree Dirgha":    _stree_dirgha_score(boy_nakshatra, girl_nakshatra),
        "Yoni":            _yoni_score(boy_nakshatra, girl_nakshatra),
        "Rasi":            _rasi_score(boy_rasi, girl_rasi),
        "Graha Maitri":    _graha_maitri_kuta(boy_rasi, girl_rasi),
        "Vasya":           _vasya_score(boy_rasi, girl_rasi),
        "Rajju":           _rajju_score(boy_nakshatra, girl_nakshatra),
        "Vedha":           _vedha_score(boy_nakshatra, girl_nakshatra),
    }

    _names_ta = {
        "Dinam": "தினம்", "Ganam": "கணம்", "Mahendra": "மகேந்திரம்",
        "Stree Dirgha": "ஸ்திரீ தீர்கம்", "Yoni": "யோனி", "Rasi": "ராசி",
        "Graha Maitri": "ராசியாதிபதி", "Vasya": "வாஸ்யம்",
        "Rajju": "ராஜ்ஜு", "Vedha": "வேதம்",
    }

    kutas: list[KutaResult] = [
        KutaResult(
            name=name,
            name_ta=_names_ta[name],
            passed=bool(sc),
            score=sc,
            max_score=1,
            label="PASS" if sc else "FAIL",
        )
        for name, sc in scores.items()
    ]

    total = sum(scores.values())
    MAX_SCORE = 10
    percentage = round(total / MAX_SCORE * 100, 1)

    rajju_dosha = scores["Rajju"] == 0
    vedha_dosha = scores["Vedha"] == 0

    nadi_dosha = check_nadi_dosha(
        boy_nakshatra,
        girl_nakshatra,
        boy_rasi=boy_rasi,
        girl_rasi=girl_rasi,
        boy_pada=boy_pada,
        girl_pada=girl_pada,
        mode=nadi_parihara_mode,
        rajju_failed=rajju_dosha,
    )

    if total >= 9:
        label = "EXCELLENT"
        summary_en = (
            f"Tamil 10-Porutham: {total}/10 — Outstanding compatibility across all poruthams. "
            "Traditionally considered a highly auspicious match."
        )
        summary_ta = (
            f"தமிழ் 10 பொருத்தம்: {total}/10 — அனைத்து பொருத்தங்களிலும் மிகச் சிறந்த இணக்கம். "
            "பாரம்பரியமாக மிகவும் சாதகமான திருமணமாக கருதப்படுகிறது."
        )
    elif total >= 7:
        label = "GOOD"
        summary_en = (
            f"Tamil 10-Porutham: {total}/10 — Good compatibility with minor differences. "
            "Traditionally considered a suitable match."
        )
        summary_ta = (
            f"தமிழ் 10 பொருத்தம்: {total}/10 — சில சிறு வேறுபாடுகளுடன் நல்ல இணக்கம். "
            "பாரம்பரியமாக ஏற்புடைய திருமணமாக கருதப்படுகிறது."
        )
    elif total >= 5:
        label = "AVERAGE"
        summary_en = (
            f"Tamil 10-Porutham: {total}/10 — Moderate compatibility. "
            "Some poruthams need attention; consultation with a jyotishi is advised."
        )
        summary_ta = (
            f"தமிழ் 10 பொருத்தம்: {total}/10 — நடுத்தர இணக்கம். "
            "சில பொருத்தங்களில் கவனம் தேவை; ஜோதிடர் ஆலோசனை உதவும்."
        )
    else:
        label = "CAUTION"
        summary_en = (
            f"Tamil 10-Porutham: {total}/10 — Significant incompatibilities found. "
            "Traditional guidance recommends careful consultation before proceeding."
        )
        summary_ta = (
            f"தமிழ் 10 பொருத்தம்: {total}/10 — குறிப்பிடத்தக்க பொருத்தமின்மை கண்டறியப்பட்டுள்ளது. "
            "தொடரும் முன் ஜோதிட ஆலோசனை அவசியம்."
        )

    if rajju_dosha:
        suffix_en = " ⚠ Rajju Dosha: same Rajju group — traditionally associated with widowhood risk; requires remedial attention."
        suffix_ta = " ⚠ ராஜ்ஜு தோஷம்: ஒரே ராஜ்ஜு வகுப்பு — வைதவ்ய ஆபத்துடன் தொடர்புடையது; பரிகாரம் அவசியம்."
        summary_en += suffix_en
        summary_ta += suffix_ta

    if vedha_dosha:
        suffix_en = " ⚠ Vedha Dosha: these nakshatras form a vedha pair — traditionally considered inauspicious."
        suffix_ta = " ⚠ வேத தோஷம்: இந்த நட்சத்திரங்கள் வேத ஜோடி — பாரம்பரியமாக சாதகமற்றதாக கருதப்படுகிறது."
        summary_en += suffix_en
        summary_ta += suffix_ta

    # A Rajju/Vedha veto is inauspicious regardless of the numeric score — the
    # label must reflect that at the source, not rely on every consumer to
    # re-derive it from rajju_dosha/vedha_dosha themselves (2026-07 audit A-4).
    if (rajju_dosha or vedha_dosha) and label != "CAUTION":
        label = "CAUTION"

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
