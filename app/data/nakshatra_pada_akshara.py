"""Nakshatra-pada akshara table (NU-8a) — PROVISIONAL FIXTURE, NOT CANON.

STATUS
------
``CANON_VERSION`` is a ``-draft`` string and every row carries ``verified=False``.
This table exists so schema, loader, matcher and test-harness work can proceed.
It **must not** reach a production runtime: ``app.calculations.numerology_naming``
raises on any unverified row when ``APP_ENV`` is a real user environment. Build
that guard before trusting anything here.

Promotion to canon is row-by-row: check against ONE named printed source
(prefer a Tamil panchangam/jataka text in current use over an online table),
record ``source_ref``, set ``verified_by``/``verified_on``, flip ``verified``.
Where the source disagrees with this draft, the source wins.


WHY THIS SCHEMA DIFFERS FROM THE NU-8a DRAFT
--------------------------------------------
The draft keyed each row on a bare-Latin ``akshara_iast`` string ("Da", "Ti",
"Dha"). Running the 108 drafted rows through a collision check showed that
key is **lossy**: 108 rows collapse to 94 distinct Latin strings — 14 collisions.

The collisions are not noise. Thirteen of the fourteen are retroflex-vs-dental
pairs that **Tamil actually preserves**::

    "Da"  = 8-P4  डा ḍā -> டா   AND  25-P3 दा dā  -> தா
    "Ti"  = 11-P3 टी ṭī -> டீ   AND  16-P1 ती tī  -> தீ
    "Na"  = 13-P3 णा ṇā -> ணா   AND  17-P1 ना nā  -> நா
    "Dha" = 20-P2 धा dhā-> தா   AND  20-P4 ढा ḍhā -> டா   (same nakshatra!)

Measured discriminating power over the 108 rows::

    Devanagari (ground truth)   107 distinct   1 collision group
    bare Latin                   94 distinct  14 collision groups
    Tamil                        80 distinct  21 collision groups
    (bare Latin, Tamil) JOINT   107 distinct   1 collision group

Note Tamil is *more* lossy than Latin overall, not less — the draft's premise
("Tamil cannot represent the Sanskrit inventory") is correct in aggregate. But
the two are lossy in **orthogonal** directions: Latin drops place of
articulation (ṭa/ta, ḍa/da, ṇa/na), Tamil drops voicing and aspiration
(ka/kha/ga/gha all -> கா; four aksharas share டா). Neither is the better script.

Three consequences, all load-bearing:

1. **The uniqueness key is Devanagari, not Latin.** ``akshara_devanagari`` is the
   source-of-truth column; ``akshara_iso`` is diacritic-bearing ISO-15919;
   ``akshara_latin_bare`` is the draft's lossy string, kept for display and
   loose matching but never used as an identity key. Without this,
   Purva Ashadha P2/P4 look like a duplicated row that a well-meaning cleanup
   pass would "fix" — silently destroying a real distinction.

2. **Neither script disambiguates alone; the pair does — exactly.** The joint
   (latin, tamil) key separates the same 107 rows Devanagari does, so it is a
   lossless proxy for akshara identity. That is why the two-script candidate
   model is a correctness requirement, not a UX nicety, and why a candidate
   carrying only one script can never be better than AMBIGUOUS on a lossy row.

3. **The Tamil substitution question is a blocker, not an edge case.** 59 of 108
   rows (55%) are ``tamil_collapse``, spanning 21 of the 27 nakshatras — not the
   "roughly a fifth" the draft estimated, because every ka/ca/ja/ṭa/ta/pa-series
   row is affected, not only the aspirates.

``tests/test_numerology_naming.py`` asserts all of the above so none of it can
silently regress.

The Devanagari and Tamil columns below are MY reconstruction of the akshara
behind each drafted Latin string. They are as unverified as the draft itself and
carry the same ``verified=False``. Verify them in the same pass.


``tamil_collapse``
------------------
Derived, not hand-flagged (a hand-set boolean over 108 rows drifts). True when
the row's Tamil base consonant is shared by more than one Sanskrit consonant, so
Tamil-script evidence alone cannot confirm the pada::

    க <- ka kha ga gha      ச <- ca cha       ஜ <- ja jha
    ட <- ṭa ṭha ḍa ḍha      த <- ta tha da dha    ப <- pa pha ba bha

Everything else (vowels, ங ஞ ண ந ம ய ர ல வ ஸ ஷ ஹ) is unshared. See
``TAMIL_SHARED_BASES``. The open practitioner question the draft raises — what
Tamil practice substitutes for an aspirate with no Tamil letter — is still open;
this flag only marks *where* it bites.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

CANON_NAME = "nakshatra_pada_akshara"
CANON_VERSION = "0.1.0-draft"

#: Tamil base consonants that render more than one Sanskrit consonant. A pada
#: whose Tamil form starts with one of these cannot be confirmed from Tamil
#: script alone. See module docstring.
TAMIL_SHARED_BASES: frozenset[str] = frozenset("கசஜடதப")

#: Confidence tiers carried over from the NU-8a draft. They describe how
#: consistently a row is reproduced across sources, NOT its accuracy — a tier-A
#: row is still ``verified=False``. Tier C rows (6, 20, 22, 26) hold the
#: aspirates and are where published sources most often disagree.
TIER_A, TIER_B, TIER_C = "A", "B", "C"


@dataclass(frozen=True, slots=True)
class PadaAkshara:
    """One nakshatra-pada row, with provenance."""

    nakshatra_id: int
    nakshatra_ta: str
    nakshatra_en: str
    pada: int
    akshara_devanagari: str
    akshara_iso: str
    akshara_latin_bare: str
    akshara_tamil: str
    latin_initial_set: tuple[str, ...]
    tamil_collapse: bool
    confidence_tier: str
    verified: bool
    verified_by: str | None
    verified_on: date | None
    source_ref: str | None
    note: str | None
    #: A competing reading attested by another living tradition, as
    #: (devanagari, iso, latin_bare, tamil). Shravana is the real case: two whole
    #: series are in circulation. A name matching EITHER is valid for the pada —
    #: see module docstring.
    alternate: tuple[str, str, str, str] | None = None
    #: An online/secondary corroboration. Deliberately distinct from
    #: ``source_ref``, which per the NU-8a protocol means a named PRINTED source.
    #: Recording a cross-check raises confidence; it does not promote to canon.
    cross_check_ref: str | None = None

    @property
    def key(self) -> tuple[int, int]:
        return (self.nakshatra_id, self.pada)


# ---------------------------------------------------------------------------
# Raw draft table.
#
# Per nakshatra: (id, tamil_name, english_name, tier, (pada1..pada4))
# Per pada:      (devanagari, iso15919, latin_bare, tamil, latin_initial_set)
#
# ``latin_initial_set`` is HAND-ENTERED per the NU-8a protocol (never derived) —
# one Tamil akshara admits several English openings, and Tamil romanisation is
# loose in practice (தி -> "Thi"/"Ti"/"Tee"). These are provisional and must be
# re-entered during verification, not machine-expanded.
# ---------------------------------------------------------------------------
_RAW: tuple[tuple[int, str, str, str, tuple[tuple[str, str, str, str, tuple[str, ...]], ...]], ...] = (
    (1, "அசுவினி", "Ashwini", TIER_A, (
        ("चु", "cu", "Chu", "சு", ("Chu", "Choo", "Su")),
        ("चे", "ce", "Che", "சே", ("Che", "Chay", "Se")),
        ("चो", "co", "Cho", "சோ", ("Cho", "Choa", "So")),
        ("ला", "lā", "La", "லா", ("La", "Laa")),
    )),
    (2, "பரணி", "Bharani", TIER_A, (
        ("ली", "lī", "Li", "லீ", ("Li", "Lee", "Ly")),
        ("लू", "lū", "Lu", "லூ", ("Lu", "Loo")),
        ("ले", "le", "Le", "லே", ("Le", "Lay")),
        ("लो", "lo", "Lo", "லோ", ("Lo", "Loa")),
    )),
    (3, "கார்த்திகை", "Krittika", TIER_A, (
        ("अ", "a", "A", "அ", ("A", "Aa")),
        ("ई", "ī", "I", "ஈ", ("I", "Ee", "Y")),
        ("उ", "u", "U", "உ", ("U", "Oo")),
        ("ए", "e", "E", "ஏ", ("E", "Ae")),
    )),
    (4, "ரோகிணி", "Rohini", TIER_A, (
        ("ओ", "o", "O", "ஓ", ("O", "Oa")),
        ("वा", "vā", "Va", "வா", ("Va", "Vaa", "Wa")),
        ("वी", "vī", "Vi", "வீ", ("Vi", "Vee", "Wi")),
        ("वू", "vū", "Vu", "வூ", ("Vu", "Voo", "Wu")),
    )),
    (5, "மிருகசீரிடம்", "Mrigashira", TIER_A, (
        ("वे", "ve", "Ve", "வே", ("Ve", "Vay", "We")),
        ("वो", "vo", "Vo", "வோ", ("Vo", "Voa", "Wo")),
        ("का", "kā", "Ka", "கா", ("Ka", "Kaa", "Ca")),
        ("की", "kī", "Ki", "கீ", ("Ki", "Kee", "Ky")),
    )),
    (6, "திருவாதிரை", "Ardra", TIER_C, (
        ("कु", "ku", "Ku", "கு", ("Ku", "Koo", "Cu")),
        ("घा", "ghā", "Gha", "கா", ("Gha", "Ga", "Kha")),
        ("ङ", "ṅa", "Ing", "ங", ("Ing", "Nga", "Ng")),
        ("छा", "chā", "Chha", "சா", ("Chha", "Cha", "Sa")),
    )),
    (7, "புனர்பூசம்", "Punarvasu", TIER_A, (
        ("के", "ke", "Ke", "கே", ("Ke", "Kay")),
        ("को", "ko", "Ko", "கோ", ("Ko", "Koa", "Co")),
        ("हा", "hā", "Ha", "ஹா", ("Ha", "Haa")),
        ("ही", "hī", "Hi", "ஹீ", ("Hi", "Hee", "Hy")),
    )),
    (8, "பூசம்", "Pushya", TIER_B, (
        ("हु", "hu", "Hu", "ஹு", ("Hu", "Hoo")),
        ("हे", "he", "He", "ஹே", ("He", "Hay")),
        ("हो", "ho", "Ho", "ஹோ", ("Ho", "Hoa")),
        ("डा", "ḍā", "Da", "டா", ("Da", "Daa", "Ta")),
    )),
    (9, "ஆயில்யம்", "Ashlesha", TIER_A, (
        ("डी", "ḍī", "Di", "டீ", ("Di", "Dee", "Ti")),
        ("डू", "ḍū", "Du", "டூ", ("Du", "Doo", "Tu")),
        ("डे", "ḍe", "De", "டே", ("De", "Day", "Te")),
        ("डो", "ḍo", "Do", "டோ", ("Do", "Doa", "To")),
    )),
    (10, "மகம்", "Magha", TIER_A, (
        ("मा", "mā", "Ma", "மா", ("Ma", "Maa")),
        ("मी", "mī", "Mi", "மீ", ("Mi", "Mee", "My")),
        ("मू", "mū", "Mu", "மூ", ("Mu", "Moo")),
        ("मे", "me", "Me", "மே", ("Me", "May")),
    )),
    (11, "பூரம்", "Purva Phalguni", TIER_A, (
        ("मो", "mo", "Mo", "மோ", ("Mo", "Moa")),
        ("टा", "ṭā", "Ta", "டா", ("Ta", "Taa", "Da")),
        ("टी", "ṭī", "Ti", "டீ", ("Ti", "Tee", "Di")),
        ("टू", "ṭū", "Tu", "டூ", ("Tu", "Too", "Du")),
    )),
    (12, "உத்திரம்", "Uttara Phalguni", TIER_A, (
        ("टे", "ṭe", "Te", "டே", ("Te", "Tay", "De")),
        ("टो", "ṭo", "To", "டோ", ("To", "Toa", "Do")),
        ("पा", "pā", "Pa", "பா", ("Pa", "Paa", "Ba")),
        ("पी", "pī", "Pi", "பீ", ("Pi", "Pee", "Bi")),
    )),
    (13, "அஸ்தம்", "Hasta", TIER_B, (
        ("पू", "pū", "Pu", "பூ", ("Pu", "Poo", "Bu")),
        ("षा", "ṣā", "Sha", "ஷா", ("Sha", "Sa", "Shaa")),
        ("णा", "ṇā", "Na", "ணா", ("Na", "Naa")),
        ("ठा", "ṭhā", "Tha", "டா", ("Tha", "Ta", "Da")),
    )),
    (14, "சித்திரை", "Chitra", TIER_A, (
        ("पे", "pe", "Pe", "பே", ("Pe", "Pay", "Be")),
        ("पो", "po", "Po", "போ", ("Po", "Poa", "Bo")),
        ("रा", "rā", "Ra", "ரா", ("Ra", "Raa")),
        ("री", "rī", "Ri", "ரீ", ("Ri", "Ree", "Ry")),
    )),
    (15, "சுவாதி", "Swati", TIER_B, (
        ("रू", "rū", "Ru", "ரூ", ("Ru", "Roo")),
        ("रे", "re", "Re", "ரே", ("Re", "Ray")),
        ("रो", "ro", "Ro", "ரோ", ("Ro", "Roa")),
        ("ता", "tā", "Ta", "தா", ("Tha", "Ta", "Thaa")),
    )),
    (16, "விசாகம்", "Vishakha", TIER_A, (
        ("ती", "tī", "Ti", "தீ", ("Thi", "Ti", "Thee")),
        ("तू", "tū", "Tu", "தூ", ("Thu", "Tu", "Thoo")),
        ("ते", "te", "Te", "தே", ("The", "Te", "Thay")),
        ("तो", "to", "To", "தோ", ("Tho", "To", "Thoa")),
    )),
    (17, "அனுஷம்", "Anuradha", TIER_A, (
        ("ना", "nā", "Na", "நா", ("Na", "Naa")),
        ("नी", "nī", "Ni", "நீ", ("Ni", "Nee", "Ny")),
        ("नू", "nū", "Nu", "நூ", ("Nu", "Noo")),
        ("ने", "ne", "Ne", "நே", ("Ne", "Nay")),
    )),
    (18, "கேட்டை", "Jyeshtha", TIER_A, (
        ("नो", "no", "No", "நோ", ("No", "Noa")),
        ("या", "yā", "Ya", "யா", ("Ya", "Yaa")),
        ("यी", "yī", "Yi", "யீ", ("Yi", "Yee")),
        ("यू", "yū", "Yu", "யூ", ("Yu", "Yoo")),
    )),
    (19, "மூலம்", "Mula", TIER_B, (
        ("ये", "ye", "Ye", "யே", ("Ye", "Yay")),
        ("यो", "yo", "Yo", "யோ", ("Yo", "Yoa")),
        ("भा", "bhā", "Bha", "பா", ("Bha", "Ba", "Pa")),
        ("भी", "bhī", "Bhi", "பீ", ("Bhi", "Bi", "Pi")),
    )),
    (20, "பூராடம்", "Purva Ashadha", TIER_C, (
        ("भू", "bhū", "Bhu", "பூ", ("Bhu", "Bu", "Pu")),
        ("धा", "dhā", "Dha", "தா", ("Dha", "Da", "Tha")),
        ("फा", "phā", "Pha", "பா", ("Pha", "Fa", "Pa")),
        ("ढा", "ḍhā", "Dha", "டா", ("Dha", "Da", "Ta")),
    )),
    (21, "உத்திராடம்", "Uttara Ashadha", TIER_B, (
        ("भे", "bhe", "Bhe", "பே", ("Bhe", "Be", "Pe")),
        ("भो", "bho", "Bho", "போ", ("Bho", "Bo", "Po")),
        ("जा", "jā", "Ja", "ஜா", ("Ja", "Jaa")),
        ("जी", "jī", "Ji", "ஜீ", ("Ji", "Jee", "Jy")),
    )),
    (22, "திருவோணம்", "Shravana", TIER_C, (
        ("जु", "ju", "Ju", "ஜு", ("Ju", "Joo")),
        ("जे", "je", "Je", "ஜே", ("Je", "Jay")),
        ("जो", "jo", "Jo", "ஜோ", ("Jo", "Joa")),
        ("घा", "ghā", "Gha", "கா", ("Gha", "Ga", "Kha")),
    )),
    (23, "அவிட்டம்", "Dhanishta", TIER_B, (
        ("गा", "gā", "Ga", "கா", ("Ga", "Gaa", "Ka")),
        ("गी", "gī", "Gi", "கீ", ("Gi", "Gee", "Ki")),
        ("गू", "gū", "Gu", "கூ", ("Gu", "Goo", "Ku")),
        ("गे", "ge", "Ge", "கே", ("Ge", "Gay", "Ke")),
    )),
    (24, "சதயம்", "Shatabhisha", TIER_A, (
        ("गो", "go", "Go", "கோ", ("Go", "Goa", "Ko")),
        ("सा", "sā", "Sa", "ஸா", ("Sa", "Saa")),
        ("सी", "sī", "Si", "ஸீ", ("Si", "See", "Sy")),
        ("सू", "sū", "Su", "ஸூ", ("Su", "Soo")),
    )),
    (25, "பூரட்டாதி", "Purva Bhadrapada", TIER_B, (
        ("से", "se", "Se", "ஸே", ("Se", "Say")),
        ("सो", "so", "So", "ஸோ", ("So", "Soa")),
        ("दा", "dā", "Da", "தா", ("Dha", "Da", "Tha")),
        ("दी", "dī", "Di", "தீ", ("Dhi", "Di", "Thi")),
    )),
    (26, "உத்திரட்டாதி", "Uttara Bhadrapada", TIER_C, (
        ("दू", "dū", "Du", "தூ", ("Dhu", "Du", "Thu")),
        ("था", "thā", "Tha", "தா", ("Tha", "Ta", "Thaa")),
        ("झा", "jhā", "Jha", "ஜா", ("Jha", "Ja")),
        ("ञ", "ña", "Gya", "ஞா", ("Gya", "Gna", "Nya", "Da")),
    )),
    (27, "ரேவதி", "Revati", TIER_A, (
        ("दे", "de", "De", "தே", ("Dhe", "De", "The")),
        ("दो", "do", "Do", "தோ", ("Dho", "Do", "Tho")),
        ("चा", "cā", "Cha", "சா", ("Cha", "Sa", "Chaa")),
        ("ची", "cī", "Chi", "சீ", ("Chi", "Si", "Chee")),
    )),
)

#: Secondary corroboration for the whole table (NOT a printed source — the
#: NU-8a protocol ranks online tables below one, and `verified` stays False).
CROSS_CHECK_REF = (
    "Drik Panchang, Swar Siddhanta — Nakshatra Pada Swar table "
    "(drikpanchang.com/swar-siddhanta/nakshatra/nakshatra-pada-swar-siddhanta.html), "
    "retrieved 2026-07-25."
)

#: Competing readings attested by a second living tradition, keyed
#: (nakshatra_id, pada) -> (devanagari, iso, latin_bare, tamil).
#:
#: Shravana is the only genuine case in the table, and it is a whole-series
#: split rather than a single disputed row: the draft carries the Ja-series
#: (Ju/Je/Jo/Gha) while Drik Panchang's Swar Siddhanta carries the Kha-series
#: (Khi/Khu/Khe/Kho). Both are in current use and neither is an error. The
#: matcher accepts EITHER for nakshatra 22 rather than silently picking one.
#:
#: This matters more in Tamil than in Devanagari: Tamil has no distinct 'kha',
#: so the Kha-series renders கீ/கூ/கே/கோ and collides with the Ga-series at
#: Dhanishta (23) and Shatabhisha (24). The Ja-series renders ஜு/ஜே/ஜோ (Grantha
#: ஜ) and stays distinct. That is a usability observation, NOT a doctrinal
#: argument, and it is deliberately not used to prefer one series.
_ALTERNATES: dict[tuple[int, int], tuple[str, str, str, str]] = {
    (22, 1): ("खी", "khī", "Khi", "கீ"),
    (22, 2): ("खू", "khū", "Khu", "கூ"),
    (22, 3): ("खे", "khe", "Khe", "கே"),
    (22, 4): ("खो", "kho", "Kho", "கோ"),
}

#: Per-row notes carried from the NU-8a draft, keyed (nakshatra_id, pada).
_NOTES: dict[tuple[int, int], str] = {
    (20, 2): "धा dhā vs (20,4) ढा ḍhā — identical bare-Latin 'Dha', DIFFERENT akshara. Not a duplicate row; do not 'fix'.",
    (20, 4): "ढा ḍhā vs (20,2) धा dhā — see note on (20,2).",
    (22, 1): (
        "WHOLE-SERIES SPLIT, not a single disputed row. Draft carries the Ja-series "
        "(Ju/Je/Jo/Gha); Drik Panchang's Swar Siddhanta carries the Kha-series "
        "(Khi/Khu/Khe/Kho). Both are attested and in current use. The matcher accepts "
        "either — see _ALTERNATES. Resolving this needs a Tamil printed source, not a "
        "third online table."
    ),
    (26, 4): (
        "Draft records 'Da/Gya'. Reconstructed as ञ ña; bare-Latin taken as 'Gya' because "
        "'Da' would collide with the genuine dental-da rows (25,3)/(27,x) and misreport this "
        "as a retroflex/dental pair. Both readings kept in latin_initial_set. LEAST CERTAIN "
        "ROW IN THE TABLE — verify first."
    ),
    (6, 2): (
        "घा ghā collides with (22,4) in BOTH Latin and Tamil — the only pada pair the "
        "two-script key cannot separate. NOTE the collision exists only under the "
        "Ja-series reading of Shravana; under the Kha-series alternate (22,4) is खो "
        "and the whole 108-row table becomes uniquely keyed."
    ),
    (22, 4): "घा ghā collides with (6,2) in BOTH scripts. See note on (6,2).",
    (13, 4): "ठा ṭhā -> டா; distinct from (26,2) था thā -> தா despite sharing bare-Latin 'Tha'.",
    (26, 2): "था thā -> தா; distinct from (13,4) ठा ṭhā -> டா.",
}


def _tamil_collapses(tamil_form: str) -> bool:
    """True when the Tamil base consonant renders >1 Sanskrit consonant.

    Derived rather than hand-flagged; see module docstring.
    """
    return bool(tamil_form) and tamil_form[0] in TAMIL_SHARED_BASES


def _build() -> tuple[PadaAkshara, ...]:
    rows: list[PadaAkshara] = []
    for nak_id, nak_ta, nak_en, tier, padas in _RAW:
        for pada_no, (deva, iso, bare, tamil, latin_set) in enumerate(padas, start=1):
            rows.append(
                PadaAkshara(
                    nakshatra_id=nak_id,
                    nakshatra_ta=nak_ta,
                    nakshatra_en=nak_en,
                    pada=pada_no,
                    akshara_devanagari=deva,
                    akshara_iso=iso,
                    akshara_latin_bare=bare,
                    akshara_tamil=tamil,
                    latin_initial_set=latin_set,
                    tamil_collapse=_tamil_collapses(tamil),
                    confidence_tier=tier,
                    # Provenance is uniformly empty by design. Verification is a
                    # row-by-row pass against a named printed source.
                    verified=False,
                    verified_by=None,
                    verified_on=None,
                    source_ref=None,
                    note=_NOTES.get((nak_id, pada_no)),
                    alternate=_ALTERNATES.get((nak_id, pada_no)),
                    cross_check_ref=CROSS_CHECK_REF,
                )
            )
    return tuple(rows)


PADA_AKSHARA_TABLE: tuple[PadaAkshara, ...] = _build()

#: Primary index. Note the key is (nakshatra, pada) — NOT any akshara string,
#: because no single-script akshara string is unique across the table.
PADA_AKSHARA_BY_KEY: dict[tuple[int, int], PadaAkshara] = {
    row.key: row for row in PADA_AKSHARA_TABLE
}


#: Rows carrying an attested competing reading.
PADA_AKSHARA_ALTERNATES: tuple[PadaAkshara, ...] = tuple(
    row for row in PADA_AKSHARA_TABLE if row.alternate is not None
)


def verified_row_count() -> int:
    return sum(1 for row in PADA_AKSHARA_TABLE if row.verified)


def cross_checked_row_count() -> int:
    """Rows corroborated against a secondary (online) source.

    NOT the same as verified. The NU-8a protocol requires a named printed
    source before a row may be trusted for a user-facing recommendation.
    """
    return sum(1 for row in PADA_AKSHARA_TABLE if row.cross_check_ref)


def is_production_ready() -> bool:
    """True only when all 108 rows have been verified against a source."""
    return verified_row_count() == len(PADA_AKSHARA_TABLE) == 108
