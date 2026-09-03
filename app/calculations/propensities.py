"""Life-propensity signatures — the astrology behind "Chances & Cautions".

Pure functions. Each evaluator reads a `PropensityChartInput` (assembled once
from the persisted chart snapshot by propensity_service) and returns a
`Signals` tally of the classical factors it found, plus bilingual factor rows
and what-helps guidance. The service layer grades the tally into an ordinal
level (never a percentage — doctrine D2).

House system: Whole Sign, houses counted from Lagna, consistent with the
chart engine. Signatures follow South-Indian Thirukanitham significations.

Nothing here predicts death, catastrophe, or a medical/psychological
diagnosis. Caution-tier signatures describe *watchfulness seasons* only.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date

from app.calculations.aspects import effective_natural_class
from app.calculations.chart_strength import (
    DEBILITATION_RASI,
    EXALTATION_RASI,
    MOOLATRIKONA_ZONE,
    OWN_SIGN_RASI,
    SIGN_LORD,
)
from app.services.life_area_prediction_models import AstroFactor, BiText

NATURAL_MALEFICS: frozenset[str] = frozenset({"SUN", "MARS", "SATURN", "RAHU", "KETU"})
_UNCONDITIONAL_BENEFICS: frozenset[str] = frozenset({"JUPITER", "VENUS"})
_CONTEXTUAL_GRAHAS: frozenset[str] = frozenset({"MOON", "MERCURY"})
DUSTHANA: frozenset[int] = frozenset({6, 8, 12})
FIXED_SIGNS: frozenset[int] = frozenset({2, 5, 8, 11})  # Rishaba, Simha, Vrischika, Kumbha


@dataclass(frozen=True, slots=True)
class PlanetView:
    rasi: int
    house: int            # house from Lagna (1..12)
    d9_rasi: int
    combust: bool = False
    strength: int = 50    # 0..100-ish strength_score


@dataclass(frozen=True, slots=True)
class PropensityChartInput:
    lagna_rasi: int
    planets: dict[str, PlanetView]
    active_dasha_lords: frozenset[str]   # maha + antardasha lords
    maha_lord: str
    antar_lord: str
    yogas_present: frozenset[str]        # names of yogas that are present
    doshams_active: frozenset[str]       # names of doshams present & not cancelled
    age: int
    sade_sati_active: bool = False
    saturn_transit_house: int | None = None  # transit Saturn's house from Lagna
    # Domain divisional charts, keyed "D2".."D60" → {PLANET: rasi, ..., "LAGNA": rasi}.
    # Already computed on the read path (snapshot.data.vargas); read for corroboration
    # only — a varga vote strengthens or softens the D1 read, never creates one.
    vargas: dict[str, dict[str, int]] = field(default_factory=dict)
    # Phase 2 — real timing (bhukti ∩ gochara ∩ SAV bindus). transit_house_by_planet
    # is each planet's CURRENT transiting house from Lagna (Whole-Sign, same frame as
    # the rest of this module); sav_bindus is the Sarvashtakavarga bindu count per
    # rasi (1..12) right now; current_antardasha_start/end bound the bhukti actually
    # running today. All optional — their absence only means a topic's boolean
    # `window` prose stays un-narrowed into concrete dates, it never manufactures one.
    transit_house_by_planet: dict[str, int] = field(default_factory=dict)
    sav_bindus: dict[int, int] = field(default_factory=dict)
    current_antardasha_start: date | None = None
    current_antardasha_end: date | None = None


@dataclass
class Signals:
    """Mutable factor tally an evaluator fills in.

    `pro` / `con` are ordinal counts, not weights to be averaged (the
    averaging error is banned by the reasoning kernel). For CHANCE
    signatures pro = supporting factors, con = afflicting factors. For
    CAUTION signatures con = risk factors, pro = mitigating factors.
    """

    factors: list[AstroFactor] = field(default_factory=list)
    what_helps: list[BiText] = field(default_factory=list)
    pro: int = 0
    con: int = 0
    window: BiText | None = None
    has_signal: bool = False

    def support(self, key: str, ta: str, en: str, weight: int = 1) -> None:
        self.factors.append(AstroFactor(key=key, status="SUPPORT", detail=BiText(ta=ta, en=en)))
        self.pro += weight
        self.has_signal = True

    def caution(self, key: str, ta: str, en: str, weight: int = 1) -> None:
        self.factors.append(AstroFactor(key=key, status="CAUTION", detail=BiText(ta=ta, en=en)))
        self.con += weight
        self.has_signal = True

    def note(self, key: str, ta: str, en: str) -> None:
        self.factors.append(AstroFactor(key=key, status="NEUTRAL", detail=BiText(ta=ta, en=en)))

    def help(self, ta: str, en: str) -> None:
        self.what_helps.append(BiText(ta=ta, en=en))


# ── Chart-reading primitives ─────────────────────────────────────────────────

def _planet_aspects(planet: str, from_house: int, target_house: int) -> bool:
    """Whole-Sign graha-drishti — shared by the Rasi and every varga reader so
    the aspect rules can never drift between D1 and a divisional chart."""
    diff = (target_house - from_house) % 12
    if diff == 6:  # 7th-house aspect — all planets
        return True
    if planet == "MARS" and diff in (3, 7):        # 4th & 8th
        return True
    if planet == "JUPITER" and diff in (4, 8):     # 5th & 9th
        return True
    if planet == "SATURN" and diff in (2, 9):      # 3rd & 10th
        return True
    # Rahu/Ketu get the same 5th & 9th special aspect as Jupiter (M-3): this
    # must match app/calculations/aspects.py's node row (5, 7, 9) exactly —
    # that module's own docstring exists specifically to stop this kind of
    # drift, and every propensity card's malefic_hits() depends on it.
    if planet in ("RAHU", "KETU") and diff in (4, 8):  # 5th & 9th
        return True
    return False


class _VargaReader:
    """Whole-Sign reader over a single divisional chart (D7/D10/D24/D4…).

    Houses are counted from the varga Lagna, exactly as the Rasi reader counts
    from the natal Lagna. A varga carries no strength_score or combustion, so
    dignity is the strength signal here — deliberately a lighter, corroborating
    read, never a standalone verdict.
    """

    def __init__(self, lagna_rasi: int, rasi_by_planet: dict[str, int]) -> None:
        self.lagna_rasi = lagna_rasi
        self.rasi = rasi_by_planet  # planet -> rasi in this varga (no "LAGNA")

    def house_of(self, planet: str) -> int | None:
        r = self.rasi.get(planet)
        return None if r is None else ((r - self.lagna_rasi) % 12) + 1

    def house_rasi(self, house: int) -> int:
        return ((self.lagna_rasi + house - 2) % 12) + 1

    def lord_of(self, house: int) -> str:
        return SIGN_LORD[self.house_rasi(house)]

    def occupants(self, house: int) -> list[str]:
        return [p for p in self.rasi if self.house_of(p) == house]

    def is_benefic(self, planet: str) -> bool:
        return planet in _UNCONDITIONAL_BENEFICS or (
            planet in _CONTEXTUAL_GRAHAS
            and effective_natural_class(planet, self.rasi) == "BENEFIC"
        )

    def is_malefic(self, planet: str) -> bool:
        return planet in NATURAL_MALEFICS or (
            planet in _CONTEXTUAL_GRAHAS
            and effective_natural_class(planet, self.rasi) == "MALEFIC"
        )

    def malefics_in(self, house: int) -> list[str]:
        return [p for p in self.occupants(house) if self.is_malefic(p)]

    def benefics_in(self, house: int) -> list[str]:
        return [p for p in self.occupants(house) if self.is_benefic(p)]

    def aspects_house(self, planet: str, target_house: int) -> bool:
        h = self.house_of(planet)
        return h is not None and _planet_aspects(planet, h, target_house)

    def malefic_hits(self, house: int) -> list[str]:
        hits = set(self.malefics_in(house))
        for m in self.rasi:
            if not self.is_malefic(m):
                continue
            if self.aspects_house(m, house):
                hits.add(m)
        return sorted(hits)

    def benefic_hits(self, house: int) -> list[str]:
        hits = set(self.benefics_in(house))
        for b in self.rasi:
            if not self.is_benefic(b):
                continue
            if self.aspects_house(b, house):
                hits.add(b)
        return sorted(hits)

    def dignity(self, planet: str) -> str:
        r = self.rasi.get(planet)
        if r is None:
            return "UNKNOWN"
        if EXALTATION_RASI.get(planet) == r:
            return "EXALTED"
        if DEBILITATION_RASI.get(planet) == r:
            return "DEBILITATED"
        if planet in MOOLATRIKONA_ZONE and MOOLATRIKONA_ZONE[planet][0] == r:
            return "MOOLATRIKONA"
        if r in OWN_SIGN_RASI.get(planet, frozenset()):
            return "OWN"
        return "NEUTRAL"

    def is_strong(self, planet: str) -> bool:
        return self.dignity(planet) in ("EXALTED", "MOOLATRIKONA", "OWN")

    def is_afflicted(self, planet: str) -> bool:
        h = self.house_of(planet)
        if h is None:
            return False
        if self.dignity(planet) == "DEBILITATED":
            return True
        if h in DUSTHANA:
            return True
        return any(m != planet and self.house_of(m) == h for m in self.rasi if self.is_malefic(m))


class _Reader:
    """Thin convenience wrapper over PropensityChartInput."""

    def __init__(self, c: PropensityChartInput) -> None:
        self.c = c
        self._varga_cache: dict[str, _VargaReader | None] = {}

    def pv(self, planet: str) -> PlanetView | None:
        return self.c.planets.get(planet)

    def house_of(self, planet: str) -> int | None:
        pv = self.pv(planet)
        return pv.house if pv else None

    def rasi_of(self, planet: str) -> int | None:
        pv = self.pv(planet)
        return pv.rasi if pv else None

    @property
    def rasi_map(self) -> dict[str, int]:
        return {planet: view.rasi for planet, view in self.c.planets.items()}

    def is_benefic(self, planet: str) -> bool:
        return planet in _UNCONDITIONAL_BENEFICS or (
            planet in _CONTEXTUAL_GRAHAS
            and effective_natural_class(planet, self.rasi_map) == "BENEFIC"
        )

    def is_malefic(self, planet: str) -> bool:
        return planet in NATURAL_MALEFICS or (
            planet in _CONTEXTUAL_GRAHAS
            and effective_natural_class(planet, self.rasi_map) == "MALEFIC"
        )

    def house_rasi(self, house: int) -> int:
        return ((self.c.lagna_rasi + house - 2) % 12) + 1

    def lord_of(self, house: int) -> str:
        return SIGN_LORD[self.house_rasi(house)]

    def house_of_lord(self, house: int) -> int | None:
        """Which house the lord of *house* occupies."""
        return self.house_of(self.lord_of(house))

    def in_houses(self, planet: str, houses: set[int]) -> bool:
        h = self.house_of(planet)
        return h is not None and h in houses

    def occupants(self, house: int) -> list[str]:
        return [p for p, pv in self.c.planets.items() if pv.house == house]

    def malefics_in(self, house: int) -> list[str]:
        return [p for p in self.occupants(house) if self.is_malefic(p)]

    def benefics_in(self, house: int) -> list[str]:
        return [p for p in self.occupants(house) if self.is_benefic(p)]

    def conjunct(self, p1: str, p2: str) -> bool:
        h1, h2 = self.house_of(p1), self.house_of(p2)
        return h1 is not None and h1 == h2

    def dignity(self, planet: str) -> str:
        pv = self.pv(planet)
        if pv is None:
            return "UNKNOWN"
        r = pv.rasi
        if EXALTATION_RASI.get(planet) == r:
            return "EXALTED"
        if DEBILITATION_RASI.get(planet) == r:
            return "DEBILITATED"
        if planet in MOOLATRIKONA_ZONE and MOOLATRIKONA_ZONE[planet][0] == r:
            return "MOOLATRIKONA"
        if r in OWN_SIGN_RASI.get(planet, frozenset()):
            return "OWN"
        return "NEUTRAL"

    def is_strong(self, planet: str) -> bool:
        pv = self.pv(planet)
        if pv is None:
            return False
        if self.dignity(planet) in ("EXALTED", "MOOLATRIKONA", "OWN"):
            return True
        return pv.strength >= 60 and not pv.combust

    def is_afflicted(self, planet: str) -> bool:
        pv = self.pv(planet)
        if pv is None:
            return False
        if pv.combust or self.dignity(planet) == "DEBILITATED":
            return True
        if pv.house in DUSTHANA:
            return True
        # conjunct a natural malefic (other than itself)
        return any(m != planet and self.conjunct(planet, m) for m in self.c.planets if self.is_malefic(m))

    def aspects_house(self, planet: str, target_house: int) -> bool:
        h = self.house_of(planet)
        return h is not None and _planet_aspects(planet, h, target_house)

    def malefic_hits(self, house: int) -> list[str]:
        """Malefics occupying OR aspecting a house."""
        hits = set(self.malefics_in(house))
        for m in self.c.planets:
            if not self.is_malefic(m):
                continue
            if self.aspects_house(m, house):
                hits.add(m)
        return sorted(hits)

    def benefic_hits(self, house: int) -> list[str]:
        hits = set(self.benefics_in(house))
        for b in self.c.planets:
            if not self.is_benefic(b):
                continue
            if self.aspects_house(b, house):
                hits.add(b)
        return sorted(hits)

    def dasha_touches(self, planets: set[str]) -> bool:
        return bool(self.c.active_dasha_lords & planets)

    # ── Divisional-chart corroboration (Phase 1) ─────────────────────────────
    # A varga vote reads the *same question* in the topic's divisional chart
    # (children → D7, career → D10, education → D24, property → D4). It is
    # corroborating only: an evaluator applies it after its D1 read and never
    # when the D1 read was silent, so a varga can strengthen or soften a
    # reading but can never conjure one on a QUIET chart.

    def varga(self, key: str) -> _VargaReader | None:
        """The reader for divisional chart *key* ("D7", "D10"…), or None when
        that varga isn't on the snapshot (e.g. an offline input without vargas)."""
        if key in self._varga_cache:
            return self._varga_cache[key]
        div = self.c.vargas.get(key)
        reader: _VargaReader | None = None
        if div:
            lagna = div.get("LAGNA")
            if lagna is not None:
                reader = _VargaReader(lagna, {p: r for p, r in div.items() if p != "LAGNA"})
        self._varga_cache[key] = reader
        return reader

    def varga_house(self, planet: str, key: str) -> int | None:
        """House of *planet* in divisional chart *key*, counted Whole-Sign from
        that varga's Lagna — the varga analogue of ``house_of``."""
        vr = self.varga(key)
        return vr.house_of(planet) if vr else None

    def varga_domain_vote(self, key: str, houses: set[int], karakas: tuple[str, ...]) -> str | None:
        """Single corroborating verdict from divisional chart *key*.

        Reads the topic's principal house(s) and karaka(s) *inside the varga*:
        a house counts positive only when benefic-supported and free of malefic
        contact (and vice-versa); a karaka counts by its varga dignity. Returns
        "SUPPORT", "CAUTION", or None (varga absent, or evenly balanced)."""
        vr = self.varga(key)
        if vr is None:
            return None
        positives = negatives = 0
        for h in houses:
            malefic = bool(vr.malefic_hits(h))
            benefic = bool(vr.benefic_hits(h))
            if benefic and not malefic:
                positives += 1
            elif malefic and not benefic:
                negatives += 1
        for k in karakas:
            if vr.is_strong(k):
                positives += 1
            elif vr.is_afflicted(k):
                negatives += 1
        if positives > negatives:
            return "SUPPORT"
        if negatives > positives:
            return "CAUTION"
        return None

    # ── Hora (D2) wealth corroboration (Phase 3) ──────────────────────────────
    # D2 is NOT a 12-house varga like D7/D10/D24/D12 — the classical Hora
    # splits every sign into only two houses, Chandra Hora (Kataka=4) and
    # Surya Hora (Simha=5) (see app.calculations.divisional_charts.compute_d2).
    # Routing it through varga_domain_vote's Lagna-relative house model would
    # silently misread it — every planet would land in "house 1" or "house 2"
    # of a varga with no real 12-house frame. The classical Hora wealth rule
    # instead reads which Hora each planet falls into directly: benefics in
    # Chandra Hora and malefics in Surya Hora is the auspicious ("Ubhayachara")
    # pattern (BPHS); the reverse is not.

    def hora_wealth_vote(self, planets: tuple[str, ...]) -> str | None:
        hora = self.c.vargas.get("D2")
        if not hora:
            return None
        positives = negatives = 0
        for p in planets:
            h = hora.get(p)
            if h is None:
                continue
            benefic = self.is_benefic(p)
            in_chandra = h == 4
            if benefic == in_chandra:
                positives += 1
            else:
                negatives += 1
        if positives > negatives:
            return "SUPPORT"
        if negatives > positives:
            return "CAUTION"
        return None

    # ── Real timing (Phase 2) ─────────────────────────────────────────────────
    # A topic's boolean `window` (dasha_touches) says only "is a significator's
    # bhukti running now?". This narrows that into concrete dates by requiring
    # two more classical gates on TOP of the dasha match the caller already
    # confirmed: the transiting karaka must actually contact the topic's house
    # (gochara), and the house's own rasi must carry at least one Sarvashtakavarga
    # bindu right now — never a window inside a zero-bindu transit. Deliberately
    # scoped to the *currently running* antardasha only (not a search for a
    # future bhukti span) — see propensity_service._TimingSpec.

    def timing_window(self, house: int, karaka: str, as_of: date) -> tuple[date, date] | None:
        c = self.c
        if c.current_antardasha_start is None or c.current_antardasha_end is None:
            return None
        transit_house = c.transit_house_by_planet.get(karaka)
        if transit_house is None:
            return None
        if transit_house != house and not _planet_aspects(karaka, transit_house, house):
            return None
        sav = c.sav_bindus.get(self.house_rasi(house))
        if sav is not None and sav <= 0:
            return None
        start = max(c.current_antardasha_start, as_of)
        return (start, c.current_antardasha_end)


# ── Evaluators — one per propensity ──────────────────────────────────────────
# Each takes a _Reader and returns a filled Signals. Guidance (`help`) is
# deliberately concrete and non-fatalistic.

def eval_love(r: _Reader) -> Signals:
    s = Signals()
    venus = r.dignity("VENUS")
    venus_pv = r.pv("VENUS")
    if r.is_strong("VENUS") and venus_pv is not None and not venus_pv.combust:
        s.support("venus_strong", "சுக்கிரன் வலுவாக உள்ளார் — அன்பு ஈர்ப்பு நல்லது.",
                  "Venus is strong — natural warmth and attraction.")
    if r.benefic_hits(5):
        s.support("fifth_benefic", "5ஆம் வீட்டில் (காதல்) சுப கிரக பார்வை.",
                  "The 5th house of romance receives benefic support.")
    if r.benefic_hits(7):
        s.support("seventh_benefic", "7ஆம் வீடு (துணை) சுப அமைப்பில்.",
                  "The 7th house of partnership is benefic-supported.")
    fifth_lord_h = r.house_of_lord(5)
    seventh_lord_h = r.house_of_lord(7)
    if fifth_lord_h is not None and fifth_lord_h in {5, 7, 1, 11}:
        s.support("fifth_lord_placed", "5ஆம் அதிபதி நல்ல நிலையில்.",
                  "The 5th lord is well placed for romance.")
    venus_pv = r.pv("VENUS")
    if venus == "DEBILITATED" or (venus_pv is not None and venus_pv.combust):
        s.caution("venus_weak", "சுக்கிரன் பலவீனம் — உறவில் பொறுமை தேவை.",
                  "Venus is weak — relationships need patience.")
    if seventh_lord_h is not None and seventh_lord_h in DUSTHANA:
        s.caution("seventh_lord_dusthana", "7ஆம் அதிபதி கஷ்ட வீட்டில்.",
                  "The 7th lord sits in a difficult house.")
    if r.dasha_touches({"VENUS", r.lord_of(5), r.lord_of(7)}):
        s.window = BiText("சுக்கிரன்/5-7 அதிபதி தசை — காதலுக்கு சாதகமான காலம்.",
                          "A Venus or 5th/7th-lord period favours romance now.")
    s.help("உங்கள் விருப்பங்களுக்கு ஏற்ற இடங்களில் நேரம் செலவிடுங்கள் — தொடர்பு தானாக வரும்.",
           "Spend time in settings that share your values — connection follows.")
    s.help("அவசரப்படாமல் நம்பிக்கையை வளர்க்கவும்.", "Let trust build without rushing.")
    return s


def eval_breakup(r: _Reader) -> Signals:
    s = Signals()
    if r.conjunct("MARS", "VENUS"):
        s.caution("mars_venus", "செவ்வாய்-சுக்கிரன் சேர்க்கை — உணர்ச்சி வேகம்.",
                  "Mars with Venus can bring heat and friction in bonds.")
    if r.malefics_in(7) or "RAHU" in r.occupants(7):
        s.caution("seventh_malefic", "7ஆம் வீட்டில் பாப கிரகம் — உறவில் அழுத்தம்.",
                  "A malefic in the 7th can strain partnership.")
    if r.conjunct("SATURN", "VENUS") or r.aspects_house("SATURN", 7):
        s.caution("saturn_seventh", "சனி பார்வை 7ல் — தூரம்/விலகல் உணர்வு.",
                  "Saturn touching the 7th can bring distance or coolness.")
    if "KALATHRA_DOSHAM" in r.c.doshams_active:
        s.caution("kalathra", "களத்திர தோஷம் செயலில்.", "Kalathra dosham is active.")
    if r.benefic_hits(7):
        s.support("seventh_benefic_mit", "7ல் சுப பார்வை — சமநிலை காக்கும்.",
                  "Benefic support to the 7th steadies the bond.")
    if r.is_strong("JUPITER") and r.aspects_house("JUPITER", 7):
        s.support("jupiter_guards", "குரு பார்வை 7ல் — முதிர்ச்சி காக்கும்.",
                  "Jupiter's grace on the 7th protects with maturity.")
    s.help("கடினமான காலத்தில் திறந்த, அமைதியான உரையாடலைத் தேர்ந்தெடுங்கள்.",
           "In strained seasons choose open, calm conversation over reaction.")
    s.help("தேவைப்பட்டால் தம்பதியர் ஆலோசனை (couples counselling) பயனளிக்கும்.",
           "Couples counselling helps when things feel stuck.")
    return s


def eval_higher_education(r: _Reader) -> Signals:
    s = Signals()
    if r.is_strong("JUPITER"):
        s.support("jupiter_strong", "குரு வலுவாக — உயர் கல்விக்கு ஆசி.",
                  "Jupiter is strong — a blessing for higher study.")
    if r.is_strong("MERCURY"):
        s.support("mercury_strong", "புதன் வலு — கூர்மையான பகுப்பாய்வு.",
                  "Mercury is strong — sharp analytical mind.")
    mercury_pv = r.pv("MERCURY")
    if r.conjunct("SUN", "MERCURY") and not (mercury_pv is not None and mercury_pv.combust):
        s.support("budha_aditya", "புத ஆதித்ய யோகம் — அறிவுத் திறன்.",
                  "Budha-Aditya yoga — intellectual brilliance.")
    if r.benefic_hits(5):
        s.support("fifth_support", "5ஆம் வீடு (அறிவு) சுப அமைப்பில்.",
                  "The 5th house of intelligence is well supported.")
    if r.benefic_hits(9) or r.is_strong(r.lord_of(9)):
        s.support("ninth_support", "9ஆம் வீடு (உயர்கல்வி) ஆதரவில்.",
                  "The 9th house of higher learning is supported.")
    if r.is_afflicted("MERCURY") and r.is_afflicted("JUPITER"):
        s.caution("both_afflicted", "புதன்-குரு இருவரும் அழுத்தத்தில் — கூடுதல் முயற்சி.",
                  "Both Mercury and Jupiter are pressured — study needs extra effort.")
    # D24 (Chaturvimsamsa) — the education varga corroborates the D1 read.
    if s.has_signal:
        vote = r.varga_domain_vote("D24", {5}, ("JUPITER", "MERCURY"))
        if vote == "SUPPORT":
            s.support("d24_confirms", "D24 (சதுர்விம்சாம்சம்) கல்வி பலத்தை உறுதிப்படுத்துகிறது.",
                      "The D24 education chart confirms the strength for higher study.")
        elif vote == "CAUTION":
            s.caution("d24_softens", "D24 (சதுர்விம்சாம்சம்) — கூடுதல் முயற்சி தேவை என்கிறது.",
                      "The D24 education chart asks for extra effort here.")
    if r.dasha_touches({"JUPITER", "MERCURY", r.lord_of(5), r.lord_of(9)}):
        s.window = BiText("குரு/புதன்/5-9 அதிபதி தசை — படிப்புக்கு நல்ல காலம்.",
                          "A Jupiter/Mercury/5th-9th-lord period favours study now.")
    s.help("சரஸ்வதி வழிபாடு மற்றும் நிலையான படிப்பு பழக்கம் உதவும்.",
           "Steady study routines (and, if you wish, Saraswati prayers) help.")
    return s


def eval_dropout_risk(r: _Reader) -> Signals:
    s = Signals()
    if r.malefic_hits(4):
        s.caution("fourth_malefic", "4ஆம் வீடு (முறையான படிப்பு) பாப தாக்கம்.",
                  "Malefic pressure on the 4th house of formal schooling.")
    fourth_lord_h = r.house_of_lord(4)
    if fourth_lord_h is not None and fourth_lord_h in DUSTHANA:
        s.caution("fourth_lord_dusthana", "4ஆம் அதிபதி கஷ்ட வீட்டில்.",
                  "The 4th lord sits in a difficult house.")
    if r.conjunct("MERCURY", "RAHU"):
        s.caution("mercury_rahu", "புதன்-ராகு — கவனச்சிதறல் வாய்ப்பு.",
                  "Mercury with Rahu can scatter focus.")
    if r.is_afflicted("MERCURY"):
        s.caution("mercury_afflicted", "புதன் அழுத்தத்தில்.", "Mercury is under pressure.")
    if r.is_strong(r.lord_of(4)) or r.benefic_hits(4):
        s.support("fourth_protected", "4ஆம் வீடு பாதுகாப்பில் — படிப்பு தொடரும்.",
                  "The 4th house is protected — schooling holds steady.")
    if r.is_strong("JUPITER"):
        s.support("jupiter_guides", "குரு வலு — வழிகாட்டல் கிடைக்கும்.",
                  "A strong Jupiter draws good mentorship.")
    s.help("வழிகாட்டி/மென்டார் மற்றும் கட்டமைக்கப்பட்ட கால அட்டவணை உதவும்.",
           "A mentor and a structured timetable make the difference here.")
    s.help("படிப்பை சிறு இலக்குகளாக பிரிக்கவும்.", "Break study into small, finishable goals.")
    return s


def eval_degree_interruption(r: _Reader) -> Signals:
    """Bhava 9 (higher learning / a degree) continuity — the higher-education
    mirror of `eval_dropout_risk`, which reads Bhava 4 (formal schooling). This
    reads the 9th house of advanced study, its lord, and Jupiter (the vidya-karaka
    for higher learning), plus the classical discontinuity signatures — Rahu/Ketu
    scattering or redirecting the course, Saturn stalling it — that most often sit
    behind a paused, switched, or abandoned degree. Corroborated by D24."""
    s = Signals()
    ninth_lord = r.lord_of(9)
    ninth_lord_h = r.house_of(ninth_lord)
    if r.malefic_hits(9) and not r.benefic_hits(9):
        s.caution("ninth_malefic", "9ஆம் வீடு (உயர்படிப்பு/பட்டம்) பாப தாக்கம் — படிப்பு இடையூறு வாய்ப்பு.",
                  "Malefic pressure on the 9th house of a degree can interrupt higher study.")
    if ninth_lord_h is not None and ninth_lord_h in DUSTHANA:
        s.caution("ninth_lord_dusthana", "9ஆம் அதிபதி கஷ்ட வீட்டில் — பட்டப்படிப்பில் தடை.",
                  "The 9th lord sits in a difficult house — the degree path can stall.")
    if "RAHU" in r.occupants(9) or "KETU" in r.occupants(9):
        s.caution("node_ninth", "ராகு/கேது 9ல் — கவனச்சிதறல் அல்லது திசைமாற்றம்.",
                  "Rahu/Ketu in the 9th can scatter focus or redirect the course midway.")
    if "SATURN" in r.occupants(9) or r.aspects_house("SATURN", 9):
        s.caution("saturn_ninth", "சனி தாக்கம் 9ல் — தாமதம்/இடைநிறுத்தம் சாத்தியம்.",
                  "Saturn touching the 9th can bring delay or a pause in the degree.")
    if r.is_afflicted("JUPITER"):
        s.caution("jupiter_afflicted", "குரு (வித்யா காரகன்) அழுத்தத்தில்.",
                  "Jupiter, the karaka of higher learning, is under pressure.")
    if r.is_strong(ninth_lord) or r.benefic_hits(9):
        s.support("ninth_protected", "9ஆம் வீடு பாதுகாப்பில் — படிப்பு தொடர்ந்து முடியும்.",
                  "The 9th house is protected — the degree runs through to completion.")
    if r.is_strong("JUPITER"):
        s.support("jupiter_sustains", "குரு வலு — படிப்பை முடிக்கும் விடாமுயற்சி.",
                  "A strong Jupiter sustains the resolve to see the degree through.")
    # D24 (Chaturvimsamsa) — the education varga corroborates the continuity read.
    if s.has_signal:
        vote = r.varga_domain_vote("D24", {9}, ("JUPITER",))
        if vote == "SUPPORT":
            s.support("d24_confirms", "D24 (சதுர்விம்சாம்சம்) படிப்பு தொடர்ச்சியை ஆதரிக்கிறது.",
                      "The D24 education chart supports finishing the degree.")
        elif vote == "CAUTION":
            s.caution("d24_softens", "D24 (சதுர்விம்சாம்சம்) — கூடுதல் விடாமுயற்சி தேவை என்கிறது.",
                      "The D24 education chart asks for extra diligence to the finish.")
    if r.dasha_touches({"JUPITER", ninth_lord}) and (r.malefic_hits(9) or r.is_afflicted("JUPITER")):
        s.window = BiText("குரு/9 அதிபதி தசையில் படிப்பு தொடர்ச்சியில் கவனம் தேவை.",
                          "Watch study continuity through this Jupiter/9th-lord period.")
    s.help("பாடத்திட்டத்தை சிறு கட்டங்களாகப் பிரித்து, வழிகாட்டியுடன் தொடர்பில் இருங்கள்.",
           "Break the syllabus into stages and stay in touch with a mentor or advisor.")
    s.help("இடைவேளை தேவைப்பட்டால், முழுமையாக விலகுவதற்குப் பதிலாக முறையான இடைநிறுத்தத்தை (deferral) பரிசீலிக்கவும்.",
           "If a break becomes necessary, a formal deferral beats dropping out outright.")
    return s


def eval_career_mode(r: _Reader) -> Signals:
    """One verdict spanning entrepreneur-fit vs salaried-fit.

    pro leans entrepreneurial (3/7/11 + Mars/Rahu), con leans service
    (6th + Saturn). The service labels the direction from the balance.
    """
    s = Signals()
    third_lord_h = r.house_of_lord(3)
    if r.is_strong("MARS") or (third_lord_h is not None and third_lord_h in {1, 3, 10, 11}):
        s.support("enterprise_drive", "3ஆம் வீடு/செவ்வாய் வலு — சுயமுயற்சி தைரியம்.",
                  "Strong 3rd-house / Mars drive — appetite for self-effort.")
    if r.is_strong(r.lord_of(7)) and r.is_strong(r.lord_of(11)):
        s.support("business_gains", "7-11 அதிபதிகள் வலு — வணிக/லாப யோகம்.",
                  "Strong 7th & 11th lords — business and gains.")
    if "RAHU" in r.occupants(3) or "RAHU" in r.occupants(7) or r.conjunct("RAHU", "MERCURY"):
        s.support("rahu_trade", "ராகு-வணிக அமைப்பு — சந்தை உள்ளுணர்வு.",
                  "A Rahu trade signature — market instinct.")
    if r.in_houses(r.lord_of(10), {6}) or "SATURN" in r.occupants(10) or "SATURN" in r.occupants(6):
        s.caution("service_signature", "10-6/சனி அமைப்பு — நிலையான வேலைக்கு ஏற்றது.",
                  "A 10th-6th / Saturn pattern — suits steady salaried service.")
    if r.is_strong("SATURN") and not r.is_strong("MARS"):
        s.caution("saturn_over_mars", "செவ்வாயை விட சனி வலு — ஒழுங்கான அமைப்பு விருப்பம்.",
                  "Saturn over Mars — thrives inside structure and routine.")
    # NOTE (astrologer review 2026-07-12): deliberately NO D10 vote here. The
    # Dasamsa refines career *strength/status*, not the enterprise-vs-salaried
    # *direction* this card reads — mapping D10 placements onto that axis is a
    # modern heuristic, not a classical rule, and a confident-sounding vote would
    # violate the QUIET-is-silence doctrine. D10 stays wired to the strength reads
    # (government_job, job_loss) where it is classically sound.
    s.help("இரண்டு பாதைகளும் சரியானவை — உங்கள் இயல்பான தாளத்தை மதிக்கவும்.",
           "Both paths are valid — honour the rhythm that fits your temperament.")
    return s


def eval_government_job(r: _Reader) -> Signals:
    s = Signals()
    if r.is_strong("SUN"):
        s.support("sun_strong", "சூரியன் வலு — அரசு/அதிகார யோகம்.",
                  "A strong Sun favours government and authority roles.")
    if "SUN" in r.occupants(10) or r.aspects_house("SUN", 10):
        s.support("sun_tenth", "சூரியன் 10ல் தொடர்பு — பதவி யோகம்.",
                  "The Sun touches the 10th of office and standing.")
    if r.c.yogas_present & {"RAJA_YOGA", "RUCHAKA_YOGA", "SASA_YOGA"}:
        s.support("raja_yoga", "ராஜ/மகாபுருஷ யோகம் — உயர் பதவி வாய்ப்பு.",
                  "A Raja/Mahapurusha yoga raises the chance of high office.")
    if r.is_strong(r.lord_of(10)) and r.is_strong(r.lord_of(9)):
        s.support("tenth_ninth", "10-9 அதிபதிகள் வலு — தேர்வு/அதிர்ஷ்டம்.",
                  "Strong 10th & 9th lords — selection and fortune align.")
    if "SATURN" in r.occupants(6) or r.is_strong("SATURN"):
        s.support("saturn_service", "சனி வலு — போட்டித் தேர்வு/சேவை பொறுமை.",
                  "Saturn strength suits competitive exams and service discipline.")
    if r.is_afflicted("SUN"):
        s.caution("sun_afflicted", "சூரியன் அழுத்தத்தில் — பொறுமை தேவை.",
                  "The Sun is pressured — the path needs patience.")
    # D10 (Dasamsa) — the career varga corroborates the office/authority read.
    if s.has_signal:
        vote = r.varga_domain_vote("D10", {10}, ("SUN",))
        if vote == "SUPPORT":
            s.support("d10_confirms", "D10 (தசாம்சம்) பதவி பலத்தை உறுதிப்படுத்துகிறது.",
                      "The D10 career chart confirms strength for office and standing.")
        elif vote == "CAUTION":
            s.caution("d10_softens", "D10 (தசாம்சம்) — கூடுதல் பொறுமை தேவை.",
                      "The D10 career chart counsels patience on this path.")
    if r.dasha_touches({"SUN", "SATURN", r.lord_of(10)}):
        s.window = BiText("சூரியன்/சனி/10 அதிபதி தசை — அரசு முயற்சிக்கு நல்ல காலம்.",
                          "A Sun/Saturn/10th-lord period favours government attempts now.")
    s.help("போட்டித் தேர்வுகளுக்கு நிலையான தயாரிப்பே முக்கியம்.",
           "Consistent preparation is what turns this chance into a result.")
    return s


def eval_job_loss(r: _Reader) -> Signals:
    s = Signals()
    if r.is_afflicted(r.lord_of(10)):
        s.caution("tenth_lord_afflicted", "10ஆம் அதிபதி அழுத்தத்தில் — தொழில் மாற்றம்.",
                  "The 10th lord is pressured — a career shift may surface.")
    if r.malefic_hits(10):
        s.caution("tenth_malefic", "10ஆம் வீட்டில் பாப தாக்கம்.",
                  "Malefic pressure on the 10th house of work.")
    if r.c.sade_sati_active:
        s.caution("sade_sati", "ஏழரை சனி காலம் — வேலையில் நிலைமாற்றம் சாத்தியம்.",
                  "A Sade-Sati season can reshuffle work — stay adaptable.")
    if r.c.saturn_transit_house == 10:
        s.caution("saturn_transit_tenth", "சனி பெயர்ச்சி 10ல் — பொறுப்பு/அழுத்தம் மாற்றம்.",
                  "Saturn transiting the 10th brings load and change at work.")
    if r.is_strong(r.lord_of(10)) or r.is_strong(r.lord_of(11)):
        s.support("tenth_stable", "10/11 அதிபதி வலு — வருமான நிலைத்தன்மை.",
                  "Strong 10th/11th lords give income resilience.")
    # D10 (Dasamsa) — read the career varga's own 10th (+ its lord) for the
    # steadiness of the work-life. Confirms stability, or flags a change season.
    if s.has_signal:
        d10 = r.varga("D10")
        d10_karakas = (d10.lord_of(10),) if d10 is not None else ("SATURN",)
        vote = r.varga_domain_vote("D10", {10}, d10_karakas)
        if vote == "SUPPORT":
            s.support("d10_stable", "D10 (தசாம்சம்) தொழில் நிலைத்தன்மையை ஆதரிக்கிறது.",
                      "The D10 career chart supports work stability.")
        elif vote == "CAUTION":
            s.caution("d10_change", "D10 (தசாம்சம்) — தொழில் மாற்றத்திற்கு கவனம்.",
                      "The D10 career chart flags a work-change season — stay ready.")
    if r.dasha_touches({"SATURN", "RAHU", "KETU"}) and r.is_afflicted(r.lord_of(10)):
        s.window = BiText("சனி/ராகு தசையில் தொழில் கவனம் தேவை.",
                          "Watch work steadiness during this Saturn/Rahu period.")
    s.help("இந்த காலத்தில் சேமிப்பு மற்றும் திறன் மேம்பாட்டில் கவனம் செலுத்துங்கள்.",
           "Build reserves and upskill through this window — that's the hedge.")
    s.help("முக்கிய முடிவுகளை அவசரப்படாமல் எடுக்கவும்.",
           "Avoid abrupt job moves in a strained season unless well planned.")
    return s


def eval_child_delay(r: _Reader) -> Signals:
    s = Signals()
    if "SATURN" in r.occupants(5) or "KETU" in r.occupants(5):
        s.caution("fifth_saturn_ketu", "5ஆம் வீட்டில் சனி/கேது — குழந்தை பேறில் தாமதம் சாத்தியம்.",
                  "Saturn/Ketu in the 5th can slow the timing of children.")
    fifth_lord_h = r.house_of_lord(5)
    if fifth_lord_h is not None and fifth_lord_h in DUSTHANA:
        s.caution("fifth_lord_dusthana", "5ஆம் அதிபதி கஷ்ட வீட்டில்.",
                  "The 5th lord sits in a difficult house.")
    if r.is_afflicted("JUPITER"):
        s.caution("jupiter_afflicted", "குரு (புத்திர காரகன்) அழுத்தத்தில்.",
                  "Jupiter, the karaka of children, is pressured.")
    if r.is_strong("JUPITER") or r.benefic_hits(5):
        s.support("fifth_blessed", "5ஆம் வீடு/குரு ஆசி — சந்ததி யோகம் நல்லது.",
                  "A blessed 5th / strong Jupiter supports children's fortune.")
    # D7 (Saptamsa) — the progeny varga corroborates the Rasi 5th read. A strong
    # Rasi 5th that the Saptamsa doesn't confirm softens; where the D7 5th is
    # blessed, an anxious Rasi read eases.
    if s.has_signal:
        vote = r.varga_domain_vote("D7", {5}, ("JUPITER",))
        if vote == "SUPPORT":
            s.support("d7_confirms", "D7 (சப்தாம்சம்) சந்ததி யோகத்தை ஆதரிக்கிறது.",
                      "The D7 (Saptamsa) chart supports the children outlook.")
        elif vote == "CAUTION":
            s.caution("d7_softens", "D7 (சப்தாம்சம்) — நேரத்தில் கூடுதல் பொறுமை/வழிகாட்டல்.",
                      "The D7 (Saptamsa) chart counsels more patience and guidance on timing.")
    if r.dasha_touches({"JUPITER", r.lord_of(5)}):
        s.window = BiText("குரு/5 அதிபதி தசை — சந்ததி யோகத்திற்கு சாதக காலம்.",
                          "A Jupiter/5th-lord period is favourable for children.")
    s.help("மருத்துவ வழிகாட்டலுடன் பொறுமையாக இருங்கள் — தாமதம் மறுப்பு அல்ல.",
           "Pair patience with medical guidance — a delay is not a denial.")
    return s


def eval_accident_care(r: _Reader) -> Signals:
    s = Signals()
    if r.conjunct("MARS", "RAHU"):
        s.caution("mars_rahu", "செவ்வாய்-ராகு — அவசர/வேக செயல்பாட்டில் கவனம்.",
                  "Mars with Rahu — take care with haste and rash moves.")
    if r.conjunct("MARS", "SATURN"):
        s.caution("mars_saturn", "செவ்வாய்-சனி — உடல் உழைப்பில் கவனம்.",
                  "Mars with Saturn — mind physical strain and machinery.")
    if r.malefic_hits(8) or r.malefic_hits(6):
        s.caution("eighth_sixth_malefic", "8/6 வீடுகளில் பாப தாக்கம் — கூடுதல் கவனம்.",
                  "Malefic pressure on the 6th/8th — a season for extra care.")
    lagna_lord = r.lord_of(1)
    if r.is_afflicted(lagna_lord):
        s.caution("lagna_lord_afflicted", "லக்ன அதிபதி அழுத்தத்தில் — உடல் கவனம்.",
                  "The Lagna lord is pressured — protect your physical wellbeing.")
    if r.is_strong("JUPITER") and (r.aspects_house("JUPITER", 1) or r.aspects_house("JUPITER", 8)):
        s.support("jupiter_shield", "குரு பார்வை — பாதுகாப்பு கவசம்.",
                  "Jupiter's aspect offers a protective shield.")
    if r.c.sade_sati_active or r.dasha_touches({"MARS", "RAHU", "SATURN"}):
        s.window = BiText("செவ்வாய்/ராகு/சனி காலம் — வாகனம்/உழைப்பில் கூடுதல் கவனம்.",
                          "During this Mars/Rahu/Saturn phase, add care while driving or lifting.")
    s.help("வாகனம், இயந்திரம், சாகச செயல்களில் வழக்கமான பாதுகாப்பை கடைப்பிடிக்கவும்.",
           "Keep normal safety habits with vehicles, machinery, and adventure.")
    return s


def eval_depression_vuln(r: _Reader) -> Signals:
    s = Signals()
    moon_house = r.house_of("MOON")
    if r.conjunct("MOON", "SATURN") or (moon_house is not None and r.aspects_house("SATURN", moon_house)):
        s.caution("moon_saturn", "சந்திரன்-சனி தொடர்பு — மனச்சோர்வு உணர்வு காலங்கள்.",
                  "A Moon-Saturn link can bring heavier, low-energy seasons.")
    if r.conjunct("MOON", "KETU"):
        s.caution("moon_ketu", "சந்திரன்-கேது — தனிமை/விலகல் உணர்வு.",
                  "Moon with Ketu can bring detachment or withdrawal.")
    if r.conjunct("MOON", "RAHU"):
        s.caution("moon_rahu", "சந்திரன்-ராகு — கவலை/அமைதியின்மை.",
                  "Moon with Rahu can stir worry or restlessness.")
    if r.in_houses("MOON", {6, 8, 12}):
        s.caution("moon_dusthana", "சந்திரன் கஷ்ட வீட்டில் — உணர்வு சுமை.",
                  "The Moon in a difficult house can add emotional weight.")
    if "KEMADRUMA_YOGA" in r.c.yogas_present:
        s.caution("kemadruma", "கேமத்ரும யோகம் — மன ஆதரவு உணர்வு குறைவு.",
                  "Kemadruma yoga can leave the mind feeling unsupported.")
    if r.c.sade_sati_active:
        s.caution("sade_sati", "ஏழரை சனி காலம் — உணர்வு சுமை அதிகரிக்கலாம்.",
                  "A Sade-Sati season can raise emotional load.")
    if r.is_strong("MOON") or r.is_strong("JUPITER"):
        s.support("moon_jupiter_steady", "சந்திரன்/குரு வலு — மன உறுதி ஆதரவு.",
                  "A strong Moon/Jupiter lends emotional steadiness.")
    s.help("வழக்கமான தூக்கம், சூரிய ஒளி, உடற்பயிற்சி மனதை காக்கும்.",
           "Regular sleep, sunlight, and movement genuinely steady the mind.")
    s.help("உணர்வுகளை நம்பகமான நபருடன் பகிர்ந்து கொள்ளுங்கள்.",
           "Share what you feel with someone you trust — you needn't carry it alone.")
    return s


def eval_loneliness(r: _Reader) -> Signals:
    s = Signals()
    if r.conjunct("MOON", "SATURN") or r.conjunct("MOON", "KETU"):
        s.caution("moon_saturn_ketu", "சந்திரன்-சனி/கேது — தனிமை உணர்வு காலங்கள்.",
                  "Moon with Saturn/Ketu can bring seasons of feeling alone.")
    if "KEMADRUMA_YOGA" in r.c.yogas_present:
        s.caution("kemadruma", "கேமத்ரும யோகம் — தொடர்பு முயற்சி தேவை.",
                  "Kemadruma yoga — connection takes intentional effort.")
    if r.in_houses("MOON", {12}):
        s.caution("moon_twelfth", "சந்திரன் 12ல் — உள்முக இயல்பு.",
                  "The Moon in the 12th leans inward and private.")
    if r.is_afflicted(r.lord_of(11)) or r.is_afflicted(r.lord_of(4)):
        s.caution("friend_home_lord", "4/11 அதிபதி அழுத்தம் — நட்பு வட்டம் கவனம்.",
                  "Pressure on the 4th/11th lords — nurture your circle of friends.")
    if r.benefic_hits(11) or r.is_strong(r.lord_of(11)):
        s.support("eleventh_support", "11ஆம் வீடு (நண்பர்கள்) ஆதரவில்.",
                  "The 11th house of friends is well supported.")
    s.help("வாரம் ஒரு சிறிய சமூக பழக்கத்தை உருவாக்குங்கள்.",
           "Build one small weekly social habit — it compounds.")
    s.help("பழைய நண்பர்களுடன் தொடர்பை புதுப்பிக்கவும்.", "Reach back to old friends first.")
    return s


def eval_stubbornness(r: _Reader) -> Signals:
    """Personality-strength card — framed as conviction with a growth edge."""
    s = Signals()
    lagna_rasi = r.c.lagna_rasi
    moon_rasi = r.rasi_of("MOON")
    if lagna_rasi in FIXED_SIGNS or (moon_rasi in FIXED_SIGNS):
        s.note("fixed_sign", "நிலையான ராசி மேலோங்கல் — உறுதியான குணம்.",
               "A fixed-sign emphasis — steady, determined temperament.")
    if r.is_strong("SUN") and r.is_strong("MARS"):
        s.note("sun_mars", "சூரியன்-செவ்வாய் வலு — தன்னம்பிக்கை/உறுதி.",
               "Strong Sun and Mars — confidence and firm will.")
    if r.conjunct("SUN", "MARS") or r.conjunct("MARS", "RAHU"):
        s.caution("ego_edge", "சூரியன்/செவ்வாய்-ராகு — உறுதி பிடிவாதமாக மாறலாம்.",
                  "Sun/Mars-Rahu heat can tip conviction into rigidity.")
    if r.is_strong("MERCURY") or r.is_strong("JUPITER"):
        s.support("wisdom_balance", "புதன்/குரு வலு — திறந்த மனது சமநிலை.",
                  "A strong Mercury/Jupiter balances firmness with open listening.")
    s.help("முடிவுக்கு முன் ஒரு எதிர்க் கருத்தை கேட்பதை பழக்கமாக்குங்கள்.",
           "Make a habit of hearing one opposing view before deciding — it's your edge.")
    return s


def eval_severe_loss(r: _Reader) -> Signals:
    """Prudence-season signature. NEVER a death/catastrophe claim (D6)."""
    s = Signals()
    if r.malefic_hits(8):
        s.caution("eighth_pressure", "8ஆம் வீடு (திடீர் மாற்றம்) பாப தாக்கம்.",
                  "Malefic pressure on the 8th house of sudden change.")
    if r.conjunct("RAHU", "SATURN") or r.conjunct("KETU", "SATURN"):
        s.caution("node_saturn", "ராகு/கேது-சனி — எதிர்பாராத மாற்றக் காலம்.",
                  "A node-Saturn link marks a season of unexpected change.")
    if "KALASARPA" in r.c.doshams_active:
        s.caution("kalasarpa", "காலசர்ப்ப அமைப்பு செயலில்.", "A Kalasarpa pattern is active.")
    if r.is_afflicted(r.lord_of(2)) and r.is_afflicted(r.lord_of(11)):
        s.caution("wealth_lords", "2/11 அதிபதி அழுத்தம் — நிதி முன்னெச்சரிக்கை.",
                  "Pressure on the 2nd/11th wealth lords — keep finances prudent.")
    if r.is_strong("JUPITER") and r.aspects_house("JUPITER", 8):
        s.support("jupiter_cushions", "குரு பார்வை 8ல் — பாதுகாப்பு.",
                  "Jupiter's aspect on the 8th cushions and protects.")
    if r.dasha_touches({"SATURN", "RAHU", "KETU"}):
        s.window = BiText("சனி/ராகு/கேது காலம் — முன்னெச்சரிக்கை (சேமிப்பு/காப்பீடு).",
                          "During this Saturn/Rahu/Ketu phase, lean on foresight — reserves and insurance.")
    s.help("காப்பீடு, அவசர சேமிப்பு, அதிக கடன் தவிர்ப்பு — இவையே இதன் நோக்கம்.",
           "Insurance, an emergency fund, and avoiding over-leverage — that's the whole point.")
    return s


# ── Phase 3 evaluators — filling the dark houses ─────────────────────────────
# See docs/PREDICTION_ONTOLOGY_EXPANSION_PLAN_2026-07.md Part 3/5. Each new
# topic follows the same recipe as Phase 0-2 (Bhava + lord + karaka [+ varga
# where the technique genuinely fits + timing]). Two deliberate technique
# gaps, both "don't force it" calls in the same spirit as career_mode's D10
# removal: (1) D9/Navamsa is carried per-planet as `d9_rasi` with no
# Lagna-relative house frame in this input, so marriage/partnership reads stay
# D1 (+D10 where D10 genuinely applies); (2) D6/Shashthamsa is not computed
# anywhere in this codebase (see app.services._chart_planets._VARGA_DIVISIONS)
# — adding it is a separate divisional-chart effort, out of scope here, so the
# Bhava-6 suite stays D1-only.

def eval_marriage_harmony(r: _Reader) -> Signals:
    """Bhava 7 (Kalatra) — the tone of married-life companionship. Distinct
    from `eval_love` (Bhava 5 romance-chance) and `eval_breakup` (general
    relationship-strain): this reads the 7th lord's placement quality and
    the Venus-Jupiter marital-harmony combination specifically."""
    s = Signals()
    seventh_lord = r.lord_of(7)
    seventh_lord_h = r.house_of(seventh_lord)
    venus_h = r.house_of("VENUS")
    if r.is_strong("JUPITER") and ("JUPITER" in r.occupants(7) or r.aspects_house("JUPITER", 7)):
        s.support("jupiter_blesses", "குரு 7ஆம் வீட்டை ஆசீர்வதிக்கிறார் — திருமண மகிழ்ச்சி.",
                  "Jupiter's blessing on the 7th supports a contented marriage.")
    if seventh_lord_h is not None and seventh_lord_h in {1, 4, 5, 7, 9, 10} and not r.is_afflicted(seventh_lord):
        s.support("seventh_lord_placed", "7ஆம் அதிபதி நல்ல வீட்டில் — உறுதியான துணை பிணைப்பு.",
                  "The 7th lord sits in a strong house — a steady partnership bond.")
    if r.conjunct("VENUS", "JUPITER") or (venus_h is not None and r.aspects_house("JUPITER", venus_h)):
        s.support("venus_jupiter", "சுக்கிரன்-குரு தொடர்பு — இணக்கமான தாம்பத்திய வாழ்க்கை.",
                  "A Venus-Jupiter link favours harmonious companionship.")
    if r.is_afflicted(seventh_lord):
        s.caution("seventh_lord_afflicted", "7ஆம் அதிபதி அழுத்தத்தில் — புரிதலுக்கு நேரம் தேவை.",
                  "The 7th lord is under pressure — understanding takes time to build here.")
    if r.malefic_hits(7) and not r.benefic_hits(7):
        s.caution("seventh_malefic_unmitigated", "7ஆம் வீட்டில் பாப தாக்கம், சுப நிவாரணம் இல்லை.",
                  "Malefic pressure on the 7th with no benefic offset — patience and communication help most.")
    s.help("திறந்த உரையாடலும் ஒன்றாக செலவிடும் நேரமும் பிணைப்பை வலுப்படுத்தும்.",
           "Open communication and shared time are what steady a bond most.")
    return s


def eval_business_partnership_fit(r: _Reader) -> Signals:
    """Bhava 7 also governs business partnership classically. Read through
    the career varga (D10), not D9 — commercial fit is the strength/status
    question D10 already answers for government_job/job_disruption."""
    s = Signals()
    seventh_lord = r.lord_of(7)
    if r.is_strong(seventh_lord):
        s.support("seventh_lord_strong", "7ஆம் அதிபதி வலு — கூட்டாண்மை உள்ளுணர்வு.",
                  "A strong 7th lord — good instinct for partnership.")
    if r.is_strong("MERCURY") and (r.conjunct("MERCURY", seventh_lord) or "MERCURY" in r.occupants(7)):
        s.support("mercury_seventh", "புதன் 7ஆம் வீட்டுடன் தொடர்பு — பேச்சுவார்த்தை திறன்.",
                  "Mercury's link to the 7th brings sharp negotiation skill.")
    if r.benefic_hits(7):
        s.support("seventh_benefic", "7ஆம் வீடு சுப ஆதரவில் — கூட்டு முயற்சிக்கு ஏற்றது.",
                  "The 7th house has benefic support for shared ventures.")
    if r.is_afflicted(seventh_lord) or r.malefic_hits(7):
        s.caution("seventh_afflicted", "7ஆம் வீடு/அதிபதி அழுத்தத்தில் — ஒப்பந்தத்தை எழுத்தில் வைக்கவும்.",
                  "Pressure on the 7th — put partnership terms in writing.")
    if r.conjunct("MERCURY", "RAHU") or r.conjunct("MERCURY", "KETU"):
        s.caution("mercury_node", "புதன்-ராகு/கேது — புரிதல் இடைவெளி சாத்தியம்.",
                  "Mercury with a node can bring communication gaps in dealings.")
    if s.has_signal:
        vote = r.varga_domain_vote("D10", {7}, ("MERCURY", seventh_lord))
        if vote == "SUPPORT":
            s.support("d10_confirms", "D10 (தசாம்சம்) கூட்டாண்மை பலத்தை உறுதிப்படுத்துகிறது.",
                      "The D10 career chart confirms strength for partnership.")
        elif vote == "CAUTION":
            s.caution("d10_softens", "D10 (தசாம்சம்) — கூட்டாண்மையில் கூடுதல் விழிப்பு தேவை.",
                      "The D10 career chart counsels extra vigilance in partnership.")
    s.help("பொறுப்புகளை தெளிவாக பகிரவும், ஒப்பந்தங்களை எழுத்தில் வைக்கவும்.",
           "Share responsibilities clearly and keep agreements in writing.")
    return s


def eval_foreign_settlement(r: _Reader) -> Signals:
    s = Signals()
    twelfth_lord = r.lord_of(12)
    twelfth_lord_h = r.house_of(twelfth_lord)
    if "RAHU" in r.occupants(12) or r.aspects_house("RAHU", 12):
        s.support("rahu_twelfth", "ராகு 12ஆம் வீட்டுடன் தொடர்பு — வெளிநாட்டு/தொலைதூர வாய்ப்பு.",
                  "Rahu's link to the 12th favours a foreign or far-from-home chance.")
    if twelfth_lord_h is not None and twelfth_lord_h in {3, 9, 11, 12}:
        s.support("twelfth_lord_travel", "12ஆம் அதிபதி பயண வீடுகளில் — தொலைதூர வாய்ப்பு.",
                  "The 12th lord sits in a travel-linked house — distance draws you.")
    if r.benefic_hits(12):
        s.support("twelfth_benefic", "12ஆம் வீடு சுப ஆதரவில் — புது இடத்தில் செழிப்பு.",
                  "The 12th house is benefic-supported — settling elsewhere can flourish.")
    if r.conjunct("SATURN", "RAHU") and (r.house_of("SATURN") == 12 or r.aspects_house("SATURN", 12)):
        s.support("saturn_rahu_twelfth", "சனி-ராகு 12ல் — நீண்ட கால குடியேற்ற சாத்தியம்.",
                  "Saturn with Rahu near the 12th favours a long-term settlement abroad.")
    if s.has_signal:
        vote = r.varga_domain_vote("D12", {12}, ("SATURN",))
        if vote == "SUPPORT":
            s.support("d12_confirms", "D12 (துவாதசாம்சம்) வெளிநாட்டு வாய்ப்பை உறுதிப்படுத்துகிறது.",
                      "The D12 chart confirms the foreign/settlement chance.")
        elif vote == "CAUTION":
            s.caution("d12_softens", "D12 (துவாதசாம்சம்) — தேவையான தயாரிப்பு அதிகம்.",
                      "The D12 chart counsels more preparation before the move.")
    if r.dasha_touches({"RAHU", twelfth_lord}):
        s.window = BiText("ராகு/12 அதிபதி தசை — வெளிநாட்டு/தொலைதூர முயற்சிக்கு நல்ல காலம்.",
                          "A Rahu/12th-lord period favours a foreign or relocation attempt now.")
    s.help("ஆவணங்கள், மொழி, கலாச்சார தயாரிப்பை முன்கூட்டியே தொடங்குங்கள்.",
           "Start paperwork, language, and cultural preparation well ahead of time.")
    return s


def eval_income_growth(r: _Reader) -> Signals:
    s = Signals()
    eleventh_lord = r.lord_of(11)
    if r.is_strong(eleventh_lord):
        s.support("eleventh_lord_strong", "11ஆம் அதிபதி வலு — வருமான வளர்ச்சி.",
                  "A strong 11th lord favours growing income.")
    if r.benefic_hits(11):
        s.support("eleventh_benefic", "11ஆம் வீடு (லாபம்) சுப ஆதரவில்.",
                  "The 11th house of gains is benefic-supported.")
    if r.is_strong("JUPITER"):
        s.support("jupiter_expands", "குரு வலு — வருமான வாய்ப்புகள் விரிவடையும்.",
                  "A strong Jupiter expands income opportunities over time.")
    if r.is_afflicted(eleventh_lord) and not r.benefic_hits(11):
        s.caution("eleventh_lord_afflicted", "11ஆம் அதிபதி அழுத்தத்தில் — வருமான வளர்ச்சி மெதுவாக இருக்கலாம்.",
                  "The 11th lord is pressured — income growth may be slower and need effort.")
    if s.has_signal:
        vote = r.hora_wealth_vote(("JUPITER", "VENUS", eleventh_lord))
        if vote == "SUPPORT":
            s.support("hora_confirms", "ஹோரா (D2) செல்வ வளர்ச்சியை ஆதரிக்கிறது.",
                      "The Hora (D2) chart supports growing wealth.")
        elif vote == "CAUTION":
            s.caution("hora_softens", "ஹோரா (D2) — கூடுதல் நிதி ஒழுக்கம் தேவை.",
                      "The Hora (D2) chart counsels more financial discipline.")
    if r.dasha_touches({"JUPITER", eleventh_lord}):
        s.window = BiText("குரு/11 அதிபதி தசை — வருமான வளர்ச்சிக்கு நல்ல காலம்.",
                          "A Jupiter/11th-lord period favours income growth now.")
    s.help("பல வருமான வழிகளை படிப்படியாக உருவாக்குங்கள்.",
           "Build multiple income streams gradually — that's what this chance rewards.")
    return s


def eval_savings_capacity(r: _Reader) -> Signals:
    s = Signals()
    second_lord = r.lord_of(2)
    # DHANA_YOGA (classical) and DHANA_SUPPORTIVE_YOGA (split off as its own
    # card 2026-08-28 — YOG-DN-01/YOG-DN-02) both count here, so the card
    # split does not silently narrow this signal.
    if "DHANA_YOGA" in r.c.yogas_present or "DHANA_SUPPORTIVE_YOGA" in r.c.yogas_present:
        s.support("dhana_yoga", "தன யோகம் செயலில் — சேமிப்பு திறன்.",
                  "A Dhana yoga is active — a natural capacity to save.")
    if r.is_strong(second_lord) or r.benefic_hits(2):
        s.support("second_supported", "2ஆம் வீடு (சேமிப்பு) ஆதரவில்.",
                  "The 2nd house of accumulated wealth is well supported.")
    if r.is_strong("JUPITER") or r.is_strong("VENUS"):
        s.support("wealth_karakas_strong", "குரு/சுக்கிரன் வலு — நிதி நிலைத்தன்மை.",
                  "Strong Jupiter/Venus support financial steadiness.")
    if r.is_afflicted(second_lord) or (r.malefic_hits(2) and not r.benefic_hits(2)):
        s.caution("second_afflicted", "2ஆம் வீடு/அதிபதி அழுத்தத்தில் — செலவு கட்டுப்பாடு தேவை.",
                  "Pressure on the 2nd house/lord — expense discipline needs attention.")
    if s.has_signal:
        vote = r.hora_wealth_vote(("JUPITER", "VENUS", second_lord))
        if vote == "SUPPORT":
            s.support("hora_confirms", "ஹோரா (D2) சேமிப்பு திறனை உறுதிப்படுத்துகிறது.",
                      "The Hora (D2) chart confirms the capacity to save.")
        elif vote == "CAUTION":
            s.caution("hora_softens", "ஹோரா (D2) — சேமிப்பில் கூடுதல் கவனம்.",
                      "The Hora (D2) chart asks for extra attention to saving.")
    s.help("வருவாயில் ஒரு பகுதியை தானியங்கி முறையில் சேமிக்கும் பழக்கத்தை உருவாக்குங்கள்.",
           "Automate a fixed share of income into savings — habit beats willpower here.")
    return s


def eval_inheritance_lean(r: _Reader) -> Signals:
    """8th-house wealth channel (inheritance, unearned gains). No Hora vote:
    D2 reads general wealth-flow, not the specific 8th-house inheritance
    channel — a different classical question, so the corroboration used for
    income_growth/savings_capacity doesn't transfer here."""
    s = Signals()
    eighth_lord = r.lord_of(8)
    eighth_lord_h = r.house_of(eighth_lord)
    if r.is_strong(eighth_lord) and eighth_lord_h is not None and eighth_lord_h not in DUSTHANA:
        s.support("eighth_lord_strong", "8ஆம் அதிபதி வலுவாக நல்ல வீட்டில் — பரம்பரை ஆதாய சாத்தியம்.",
                  "A strong, well-placed 8th lord favours inherited or unearned gains.")
    if (eighth_lord_h is not None
            and eighth_lord_h in {r.house_of(r.lord_of(2)), r.house_of(r.lord_of(11))}):
        s.support("eighth_wealth_link", "8-2/11 அதிபதிகள் தொடர்பில் — பரம்பரை செல்வ இணைப்பு.",
                  "A link between the 8th and the 2nd/11th wealth lords — an inheritance channel.")
    if r.benefic_hits(8) or r.aspects_house("JUPITER", 8):
        s.support("eighth_benefic", "8ஆம் வீட்டில் சுப பார்வை — பாதுகாப்பான ஆதாயம்.",
                  "Benefic support to the 8th favours a protected, steady gain.")
    if r.is_afflicted(eighth_lord):
        s.caution("eighth_lord_afflicted", "8ஆம் அதிபதி அழுத்தத்தில் — பரம்பரை விவகாரங்களில் தாமதம் சாத்தியம்.",
                  "The 8th lord is pressured — inheritance matters may involve delay or complication.")
    s.help("பரம்பரை/ஆதாய விவகாரங்களில் சட்ட ஆவணங்களை தெளிவாக வைத்திருங்கள்.",
           "Keep legal paperwork clear and current in any inheritance matter.")
    return s


def eval_litigation_season(r: _Reader) -> Signals:
    s = Signals()
    if ("MARS" in r.malefics_in(6) or r.aspects_house("MARS", 6)
            or "SATURN" in r.malefics_in(6) or r.aspects_house("SATURN", 6)):
        s.caution("sixth_mars_saturn", "6ஆம் வீட்டில் செவ்வாய்/சனி தாக்கம் — சர்ச்சை காலம்.",
                  "Mars/Saturn pressure on the 6th — a season where disputes may need careful handling.")
    sixth_lord_h = r.house_of_lord(6)
    if sixth_lord_h is not None and sixth_lord_h in DUSTHANA:
        s.caution("sixth_lord_dusthana", "6ஆம் அதிபதி கஷ்ட வீட்டில் — நீடித்த சர்ச்சை சாத்தியம்.",
                  "The 6th lord in a difficult house — disputes can drag if not addressed early.")
    if r.conjunct("MARS", "SATURN"):
        s.caution("mars_saturn", "செவ்வாய்-சனி சேர்க்கை — மோதல் தன்மை அதிகரிக்கலாம்.",
                  "Mars-Saturn together can sharpen confrontational moments.")
    if r.is_strong(r.lord_of(6)) or r.benefic_hits(6):
        s.support("sixth_managed", "6ஆம் வீடு கட்டுப்பாட்டில் — சர்ச்சைகளை சமாளிக்கும் திறன்.",
                  "The 6th house is well-managed — a real ability to resolve disputes cleanly.")
    if r.is_strong("JUPITER") and r.aspects_house("JUPITER", 6):
        s.support("jupiter_mediates", "குரு பார்வை 6ல் — சமரச வழி கிடைக்கும்.",
                  "Jupiter's aspect on the 6th opens a path to settlement.")
    s.help("சர்ச்சைகளை ஆவணப்படுத்தி, ஆரம்பத்திலேயே சட்ட ஆலோசனை பெறுங்கள்.",
           "Document disagreements and get legal advice early — before they harden.")
    return s


def eval_debt_watch(r: _Reader) -> Signals:
    """Rina-sthana (debt houses: 2nd wealth-in-hand, 6th debt, 12th outflow)
    read together. A STRONG 6th lord is classically protective — the
    capacity to clear debts — so strength feeds support here, not caution
    (Bhava 6 signifies both debt and the ability to overcome it)."""
    s = Signals()
    sixth_lord = r.lord_of(6)
    second_lord = r.lord_of(2)
    if r.is_afflicted(sixth_lord):
        s.caution("sixth_lord_afflicted", "6ஆம் அதிபதி அழுத்தத்தில் — கடன் தீர்வு தாமதமாகலாம்.",
                  "A pressured 6th lord can slow how easily debts clear.")
    if r.is_afflicted(second_lord):
        s.caution("second_lord_afflicted", "2ஆம் அதிபதி அழுத்தத்தில் — நிதி வெளியேற்றம்.",
                  "The 2nd lord is pressured — outflow can outpace savings.")
    if "SATURN" in r.occupants(6) or "SATURN" in r.occupants(12):
        s.caution("saturn_debt_house", "சனி 6/12ல் — கடன்/செலவு சுமை.",
                  "Saturn in the 6th/12th can add a persistent debt or expense load.")
    if r.is_strong(sixth_lord):
        s.support("sixth_lord_strong", "6ஆம் அதிபதி வலு — கடன்களை தீர்க்கும் திறன்.",
                  "A strong 6th lord — a real capacity to clear debts.")
    if r.is_strong(second_lord) and not r.is_afflicted(second_lord):
        s.support("second_lord_stable", "2ஆம் அதிபதி நிலையாக — நிதி கட்டுப்பாடு எளிதாகும்.",
                  "A stable, unafflicted 2nd lord makes financial discipline easier.")
    s.help("பெரிய கடன் முடிவுகளுக்கு முன் பட்ஜெட் திட்டமிடவும்.",
           "Budget carefully before any major borrowing decision.")
    return s


def eval_competitive_edge(r: _Reader) -> Signals:
    """Bhava 6 read as competitive/rivalry strength (exams, contests) —
    distinct from government_job's Sun/10th office signature and
    job_disruption's Saturn/10th stability read."""
    s = Signals()
    sixth_lord = r.lord_of(6)
    if r.is_strong("MARS"):
        s.support("mars_strong", "செவ்வாய் வலு — போட்டி துணிச்சல்.",
                  "A strong Mars gives real competitive courage.")
    if r.is_strong(sixth_lord):
        s.support("sixth_lord_strong", "6ஆம் அதிபதி வலு — போட்டியில் மேலோங்கல்.",
                  "A strong 6th lord favours winning contests and exams.")
    if "SATURN" in r.occupants(6) and r.is_strong("SATURN"):
        s.support("saturn_discipline", "சனி 6ல் வலுவாக — தொடர் தயாரிப்பு பலன் தரும்.",
                  "A strong Saturn in the 6th rewards sustained, disciplined preparation.")
    if r.is_afflicted(sixth_lord) and not r.is_strong("MARS"):
        s.caution("sixth_lord_weak", "6ஆம் அதிபதி பலவீனம் — கூடுதல் தயாரிப்பு தேவை.",
                  "A weak 6th lord asks for extra preparation before contests.")
    s.help("குறிப்பிட்ட, அளவிடக்கூடிய இலக்குகளுடன் தயாராகுங்கள்.",
           "Prepare against specific, measurable targets — that's what tips a contest.")
    return s


def eval_swabhava_profile(r: _Reader) -> Signals:
    """One synthesized temperament card (plan §4.3) — Lagna sign + Lagna
    lord dignity + Moon sign + Mercury, folded into 4-6 trait notes. Always
    descriptive (status=NEUTRAL via .note()), never a pro/con verdict — the
    PROFILE tier has no grading, see propensity_service.assess_propensities."""
    s = Signals()
    lagna_rasi = r.c.lagna_rasi
    lagna_lord = r.lord_of(1)
    moon_rasi = r.rasi_of("MOON")

    element_ta = {1: "தீ", 2: "நிலம்", 3: "காற்று", 4: "நீர்", 5: "தீ", 6: "நிலம்",
                  7: "காற்று", 8: "நீர்", 9: "தீ", 10: "நிலம்", 11: "காற்று", 12: "நீர்"}
    element_en = {1: "fire", 2: "earth", 3: "air", 4: "water", 5: "fire", 6: "earth",
                  7: "air", 8: "water", 9: "fire", 10: "earth", 11: "air", 12: "water"}
    s.note("lagna_element",
           f"லக்னம் {element_ta[lagna_rasi]} தத்துவம் — உங்கள் இயல்பான அணுகுமுறையின் அடித்தளம்.",
           f"A {element_en[lagna_rasi]}-element Lagna — the base note of how you naturally approach life.")

    if r.is_strong(lagna_lord):
        s.note("lagna_lord_strong", "லக்ன அதிபதி வலு — தன்னம்பிக்கையான, தெளிவான சுய உணர்வு.",
               "A strong Lagna lord — a confident, clearly-defined sense of self.")
    elif r.is_afflicted(lagna_lord):
        s.note("lagna_lord_afflicted", "லக்ன அதிபதி அழுத்தத்தில் — சுய நம்பிக்கை காலப்போக்கில் வளரும்.",
               "The Lagna lord is under some pressure — self-confidence is something you grow into.")

    if moon_rasi in FIXED_SIGNS:
        s.note("moon_fixed", "சந்திரன் நிலையான ராசியில் — உணர்வு நிலைத்தன்மை.",
               "Moon in a fixed sign — emotional steadiness, with a natural resistance to change.")
    elif moon_rasi in {1, 4, 7, 10}:
        s.note("moon_movable", "சந்திரன் சரராசியில் — விரைவான உணர்வு தழுவல், முன்முயற்சி.",
               "Moon in a movable sign — quick emotional adaptability and initiative.")
    elif moon_rasi is not None:
        s.note("moon_dual", "சந்திரன் இருசுப ராசியில் — நெகிழ்வான, பன்முக மனநிலை.",
               "Moon in a dual sign — a flexible, multi-faceted temperament.")

    if r.is_strong("MERCURY"):
        s.note("mercury_strong", "புதன் வலு — கூர்மையான, தெளிவான சிந்தனை.",
               "A strong Mercury — sharp, articulate thinking.")
    if r.conjunct("MERCURY", "MOON"):
        s.note("mercury_moon", "புதன்-சந்திரன் இணைப்பு — உணர்வையும் தர்க்கத்தையும் இணைக்கும் திறன்.",
               "A Mercury-Moon link — the ability to blend feeling and logic.")

    s.has_signal = True  # descriptive card — always shown, never QUIET
    s.help("இந்த போக்குகள் ஒரு தொடக்க புள்ளியே — வளர்ச்சி எப்போதும் சாத்தியம்.",
           "These tendencies are a starting point, not a limit — growth is always possible.")
    return s


# ── Phase 4 (P2-2) evaluators — Career depth / Wealth / Property / Marriage
# timing tranche. Same recipe as Phase 3: Bhava + lord + karaka [+ varga where
# the technique genuinely fits + timing]. Deliberately scoped away from
# Foreign/PR and Litigation sub-topics (P2-3's territory, docs/
# PREDICTION_TAXONOMY.md §5) to avoid two tranches racing on the same houses.

def eval_promotion_recognition(r: _Reader) -> Signals:
    """10th (karma/status) read together with 11th (labha/rewards) and the
    Sun (recognition karaka) — advancement and reward *within* an existing
    role, distinct from government_job's entry-into-service signature and
    job_disruption's stability caution."""
    s = Signals()
    tenth_lord = r.lord_of(10)
    eleventh_lord = r.lord_of(11)
    if r.is_strong("SUN"):
        s.support("sun_strong", "சூரியன் வலு — அங்கீகாரம்/பதவி உயர்வு வாய்ப்பு.",
                  "A strong Sun favours recognition and advancement.")
    if r.benefic_hits(11) or r.is_strong(eleventh_lord):
        s.support("eleventh_rewards", "11ஆம் வீடு (லாபம்) ஆதரவில் — பதவி உயர்வு பலன்.",
                  "The 11th house of rewards is well supported — advancement bears fruit.")
    if r.is_strong("JUPITER") and r.aspects_house("JUPITER", 10):
        s.support("jupiter_mentor", "குரு பார்வை 10ல் — மேலதிகாரி ஆதரவு/வழிகாட்டல்.",
                  "Jupiter's aspect on the 10th brings a supportive superior or mentor.")
    if r.is_afflicted("SUN") and r.is_afflicted(tenth_lord):
        s.caution("sun_tenth_afflicted", "சூரியன்/10ஆம் அதிபதி அழுத்தத்தில் — அங்கீகாரம் தாமதமாகலாம்.",
                  "Both the Sun and the 10th lord are pressured — recognition may take longer to arrive.")
    if r.dasha_touches({"SUN", eleventh_lord, tenth_lord}):
        s.window = BiText("சூரியன்/10-11 அதிபதி தசை — பதவி உயர்வுக்கு நல்ல காலம்.",
                          "A Sun/10th-11th-lord period favours recognition and advancement now.")
    s.help("உங்கள் பங்களிப்புகளை தெளிவாக, தொடர்ந்து தெரியப்படுத்துங்கள்.",
           "Make your contributions visible, consistently — recognition rarely finds silence.")
    return s


def eval_entrepreneurial_timing(r: _Reader) -> Signals:
    """A *timing* read for launching a venture — when career_mode's static
    enterprise-vs-salaried verdict already leans enterprise, this asks
    whether now is a supported window, via 3rd-house self-effort + Mars/
    Mercury dasha activity."""
    s = Signals()
    third_lord = r.lord_of(3)
    eleventh_lord = r.lord_of(11)
    if r.is_strong("MARS") and not r.is_afflicted("MARS"):
        s.support("mars_ready", "செவ்வாய் வலுவாக, அழுத்தமின்றி — தொடங்குவதற்கான துணிவு.",
                  "A strong, unafflicted Mars — the courage to start is well supported.")
    if r.benefic_hits(3) or r.is_strong(third_lord):
        s.support("third_supported", "3ஆம் வீடு (சுயமுயற்சி) ஆதரவில்.",
                  "The 3rd house of self-effort is well supported.")
    if r.is_strong(eleventh_lord):
        s.support("eleventh_gains", "11ஆம் அதிபதி வலு — புதிய முயற்சியில் லாபம்.",
                  "A strong 11th lord favours gains from a new venture.")
    if r.is_afflicted(third_lord) and r.is_afflicted("MARS"):
        s.caution("third_mars_afflicted", "3ஆம் அதிபதி/செவ்வாய் இருவரும் அழுத்தத்தில் — அவசரப்படாதீர்கள்.",
                  "Both the 3rd lord and Mars are pressured — this isn't the season to rush a launch.")
    if r.dasha_touches({"MARS", "MERCURY", third_lord, eleventh_lord}):
        s.window = BiText("செவ்வாய்/புதன்/3-11 அதிபதி தசை — புதிய முயற்சி தொடங்க நல்ல காலம்.",
                          "A Mars/Mercury/3rd-11th-lord period favours starting a new venture now.")
    s.help("சிறிய அளவில் தொடங்கி, சந்தை ஆதரவை சோதித்து விரிவாக்குங்கள்.",
           "Start small, test market support, and scale from there.")
    return s


def eval_workplace_conflict(r: _Reader) -> Signals:
    """6th house (rivals, disputes, service friction) touching the 10th —
    interpersonal workplace tension, distinct from job_disruption's
    stability caution and litigation_season's formal-dispute framing."""
    s = Signals()
    sixth_lord = r.lord_of(6)
    tenth_lord = r.lord_of(10)
    if r.malefic_hits(6):
        s.caution("sixth_malefic", "6ஆம் வீட்டில் பாப தாக்கம் — சக பணியாளர் மோதல் காலம்.",
                  "Malefic pressure on the 6th — a season where colleague friction may surface.")
    if r.conjunct(sixth_lord, tenth_lord) or r.aspects_house(sixth_lord, 10):
        s.caution("sixth_touches_tenth", "6ஆம் அதிபதி 10ஆம் வீட்டுடன் தொடர்பு — பணியிட மன அழுத்தம்.",
                  "The 6th lord's link to the 10th can bring workplace friction into focus.")
    if r.conjunct("SATURN", "MARS") and (r.house_of("SATURN") == 10 or r.house_of("MARS") == 10):
        s.caution("saturn_mars_tenth", "சனி-செவ்வாய் 10ல் — கருத்து வேறுபாடு கூர்மையாகலாம்.",
                  "Saturn-Mars near the 10th can sharpen disagreements at work.")
    if r.is_strong(sixth_lord) or r.benefic_hits(6):
        s.support("sixth_managed", "6ஆம் வீடு கட்டுப்பாட்டில் — மோதல்களை அமைதியாக சமாளிக்கும் திறன்.",
                  "The 6th house is well-managed — a real ability to defuse conflict calmly.")
    if r.is_strong("JUPITER") and r.aspects_house("JUPITER", 10):
        s.support("jupiter_shields_tenth", "குரு பார்வை 10ல் — பாதுகாப்பான பணியிடம்.",
                  "Jupiter's aspect on the 10th offers a protective, fair workplace.")
    if r.dasha_touches({"SATURN", "MARS", sixth_lord}):
        s.window = BiText("சனி/செவ்வாய்/6 அதிபதி தசை — பணியிட உறவுகளில் கூடுதல் பொறுமை தேவை.",
                          "During this Saturn/Mars/6th-lord period, extra patience with colleagues helps.")
    s.help("கருத்து வேறுபாடுகளை ஆவணப்படுத்தி, அமைதியாக, நேரடியாக பேசி தீர்க்கவும்.",
           "Document disagreements and address them calmly and directly, early.")
    return s


def eval_skill_mastery(r: _Reader) -> Signals:
    """Mercury (skill/articulation) + 3rd house (effort) + Saturn
    (discipline/mastery-through-practice) — deep craft development over
    time, distinct from higher_education's formal-schooling signature and
    competitive_edge's contest-winning read."""
    s = Signals()
    third_lord = r.lord_of(3)
    if r.is_strong("MERCURY"):
        s.support("mercury_strong", "புதன் வலு — திறமை கற்றலில் கூர்மை.",
                  "A strong Mercury — sharp, quick skill acquisition.")
    if r.benefic_hits(3) or r.is_strong(third_lord):
        s.support("third_aptitude", "3ஆம் வீடு (முயற்சி/திறமை) இயல்பான ஆற்றல்.",
                  "The 3rd house of effort and skill shows natural aptitude.")
    if r.is_strong("SATURN") and r.aspects_house("SATURN", 3):
        s.support("saturn_discipline", "சனி பார்வை 3ல் — தொடர் பயிற்சியால் தேர்ச்சி.",
                  "Saturn's aspect on the 3rd rewards mastery built through steady, disciplined practice.")
    if r.is_afflicted("MERCURY") and r.is_afflicted(third_lord):
        s.caution("mercury_third_afflicted", "புதன்/3ஆம் அதிபதி அழுத்தத்தில் — கட்டமைக்கப்பட்ட பயிற்சி தேவை.",
                  "Mercury and the 3rd lord are both pressured — structured, guided practice helps most.")
    s.help("ஒரு திறமையில் ஆழமாக கவனம் செலுத்தி, தொடர்ந்து பயிற்சி செய்யுங்கள்.",
           "Focus deeply on one craft and practice it consistently — mastery compounds slowly.")
    return s


def eval_career_networking_influence(r: _Reader) -> Signals:
    """11th house (associations/network) + Mercury-Venus (charm,
    communication) — how much social capital feeds career opportunity,
    distinct from income_growth's 11th-house wealth-gains read."""
    s = Signals()
    eleventh_lord = r.lord_of(11)
    if r.benefic_hits(11) or r.is_strong(eleventh_lord):
        s.support("eleventh_network", "11ஆம் வீடு (நட்பு வட்டம்) ஆதரவில் — வலுவான தொடர்பு வலையமைப்பு.",
                  "The 11th house of associations is well supported — a strong professional network.")
    if r.conjunct("MERCURY", "VENUS"):
        s.support("mercury_venus", "புதன்-சுக்கிரன் இணைப்பு — கவர்ச்சிகரமான தொடர்பாடல்.",
                  "A Mercury-Venus link — persuasive, well-liked communication in professional circles.")
    if r.is_strong("JUPITER") and r.aspects_house("JUPITER", 11):
        s.support("jupiter_generous_ties", "குரு பார்வை 11ல் — தாராள மனப்பான்மையுள்ள தொடர்புகள்.",
                  "Jupiter's aspect on the 11th brings wise, generous connections.")
    if r.is_afflicted(eleventh_lord) and r.malefic_hits(11):
        s.caution("eleventh_afflicted", "11ஆம் வீடு/அதிபதி அழுத்தத்தில் — தொடர்புகளை தீவிரமாக வளர்க்க வேண்டும்.",
                  "The 11th house is pressured — networks here need deliberate, active cultivation.")
    s.help("உண்மையான ஆர்வத்துடன் தொடர்புகளை பராமரிக்கவும் — கொடுத்து பெறும் உறவே நீடிக்கும்.",
           "Nurture connections with genuine interest — reciprocal relationships are the ones that last.")
    return s


def eval_career_change_success(r: _Reader) -> Signals:
    """9th house (fortune in a new direction) + Mercury-Jupiter adaptability
    — whether a lateral career pivot lands well, distinct from
    entrepreneurial_timing's launch-a-venture framing and job_disruption's
    forced-change caution."""
    s = Signals()
    ninth_lord = r.lord_of(9)
    tenth_lord = r.lord_of(10)
    if r.benefic_hits(9) or r.is_strong(ninth_lord):
        s.support("ninth_supported", "9ஆம் வீடு (புதிய திசை/அதிர்ஷ்டம்) ஆதரவில்.",
                  "The 9th house of new direction and fortune is well supported.")
    if r.is_strong("MERCURY") and r.is_strong("JUPITER"):
        s.support("adaptability", "புதன்-குரு இருவரும் வலு — தழுவல் திறனும் விவேகமும்.",
                  "Both Mercury and Jupiter are strong — real adaptability paired with sound judgement.")
    if r.conjunct(ninth_lord, tenth_lord) or r.aspects_house(ninth_lord, 10):
        s.support("ninth_tenth_link", "9-10 அதிபதிகள் தொடர்பில் — புதிய பாதைக்கு அதிர்ஷ்ட ஆதரவு.",
                  "A link between the 9th and 10th lords — fortune actively supports the shift.")
    if r.is_afflicted(ninth_lord):
        s.caution("ninth_afflicted", "9ஆம் அதிபதி அழுத்தத்தில் — மாற்றத்திற்கு முன் அதிக தயாரிப்பு தேவை.",
                  "The 9th lord is pressured — a pivot needs more groundwork before it lands well.")
    if r.dasha_touches({"JUPITER", ninth_lord}):
        s.window = BiText("குரு/9 அதிபதி தசை — தொழில் மாற்றத்திற்கு சாதக காலம்.",
                          "A Jupiter/9th-lord period favours a career pivot now.")
    s.help("புதிய திசைக்கு தாவுவதற்கு முன் திறன் இடைவெளியை நிரப்புங்கள்.",
           "Close any real skill gaps before you leap — preparation is what makes a pivot land well.")
    return s


def eval_property_acquisition(r: _Reader) -> Signals:
    """4th house (Bhoomi/fixed property) + Mars/Venus karaka (mirrors
    life_areas_service._AREA_ROUTING["PROPERTY"]), with D4 (Chaturthamsa)
    corroboration — the property varga."""
    s = Signals()
    fourth_lord = r.lord_of(4)
    if r.benefic_hits(4):
        s.support("fourth_benefic", "4ஆம் வீடு (சொத்து) சுப ஆதரவில்.",
                  "The 4th house of property is benefic-supported.")
    if r.is_strong("MARS") or r.is_strong("VENUS"):
        s.support("karakas_strong", "செவ்வாய்/சுக்கிரன் வலு — சொத்து சேர்க்கை ஆதரவு.",
                  "A strong Mars or Venus favours acquiring property.")
    if r.is_strong(fourth_lord) and not r.is_afflicted(fourth_lord):
        s.support("fourth_lord_stable", "4ஆம் அதிபதி நிலையாக — சொத்து விவகாரம் தடையின்றி.",
                  "A stable, unafflicted 4th lord — property matters move without obstruction.")
    if r.is_afflicted(fourth_lord) or (r.malefic_hits(4) and not r.benefic_hits(4)):
        s.caution("fourth_afflicted", "4ஆம் வீடு/அதிபதி அழுத்தத்தில் — சொத்து சேர்க்கை தாமதமாகலாம்.",
                  "Pressure on the 4th house/lord — acquiring property may take longer than hoped.")
    if s.has_signal:
        vote = r.varga_domain_vote("D4", {4}, ("MARS", "VENUS"))
        if vote == "SUPPORT":
            s.support("d4_confirms", "D4 (சதுர்த்தாம்சம்) சொத்து சேர்க்கையை உறுதிப்படுத்துகிறது.",
                      "The D4 (Chaturthamsa) property chart confirms the acquisition outlook.")
        elif vote == "CAUTION":
            s.caution("d4_softens", "D4 (சதுர்த்தாம்சம்) — கூடுதல் பொறுமை/திட்டமிடல் தேவை.",
                      "The D4 (Chaturthamsa) property chart counsels more patience and planning.")
    if r.dasha_touches({"MARS", "VENUS", fourth_lord}):
        s.window = BiText("செவ்வாய்/சுக்கிரன்/4 அதிபதி தசை — சொத்து சேர்க்கைக்கு நல்ல காலம்.",
                          "A Mars/Venus/4th-lord period favours acquiring property now.")
    s.help("சொத்து ஆவணங்களை முழுமையாக சரிபார்த்த பின்னரே முடிவெடுக்கவும்.",
           "Verify all title documents fully before committing — due diligence is the real protection.")
    return s


def eval_property_investment_timing(r: _Reader) -> Signals:
    """A *timing* read on real-estate investment specifically — 11th house
    (gains) + Venus, corroborated by the Hora (D2) wealth-nature vote,
    distinct from property_acquisition's general ownership-chance read."""
    s = Signals()
    fourth_lord = r.lord_of(4)
    eleventh_lord = r.lord_of(11)
    if r.benefic_hits(11):
        s.support("eleventh_benefic", "11ஆம் வீடு (லாபம்) சுப ஆதரவில் — முதலீட்டு லாபம்.",
                  "The 11th house of gains is benefic-supported — favourable for investment returns.")
    if r.is_strong("VENUS"):
        s.support("venus_strong", "சுக்கிரன் வலு — சொத்து முதலீட்டில் சாதகம்.",
                  "A strong Venus favours property as an investment.")
    if r.conjunct(fourth_lord, eleventh_lord) or r.house_of(fourth_lord) == r.house_of(eleventh_lord):
        s.support("fourth_eleventh_link", "4-11 அதிபதிகள் தொடர்பில் — சொத்தில் இருந்து லாபம்.",
                  "A link between the 4th and 11th lords — gains flow from property specifically.")
    if r.is_afflicted(eleventh_lord):
        s.caution("eleventh_afflicted", "11ஆம் அதிபதி அழுத்தத்தில் — முதலீட்டு லாபம் மெதுவாக இருக்கலாம்.",
                  "The 11th lord is pressured — investment gains here may be slower than hoped.")
    if s.has_signal:
        vote = r.hora_wealth_vote(("VENUS", fourth_lord, eleventh_lord))
        if vote == "SUPPORT":
            s.support("hora_confirms", "ஹோரா (D2) சொத்து முதலீட்டு காலத்தை ஆதரிக்கிறது.",
                      "The Hora (D2) chart supports the timing for a property investment.")
        elif vote == "CAUTION":
            s.caution("hora_softens", "ஹோரா (D2) — முதலீட்டில் கூடுதல் நிதி ஒழுக்கம் தேவை.",
                      "The Hora (D2) chart counsels more financial discipline before investing.")
    if r.dasha_touches({"VENUS", fourth_lord, eleventh_lord}):
        s.window = BiText("சுக்கிரன்/4-11 அதிபதி தசை — சொத்து முதலீட்டிற்கு நல்ல காலம்.",
                          "A Venus/4th-11th-lord period favours a property investment now.")
    s.help("வாடகை வருமானம் மற்றும் மறுவிற்பனை மதிப்பை இரண்டையும் கணக்கில் எடுத்துக்கொள்ளுங்கள்.",
           "Weigh both rental yield and resale value before committing.")
    return s


def eval_ancestral_property_stability(r: _Reader) -> Signals:
    """Stability/continuity of property already held — 4th lord affliction
    or malefic pressure on the 4th — distinct from property_acquisition's
    forward-looking chance-of-acquiring read. A prudence-season signature
    (D6, never a legal-dispute claim — that's litigation_season's territory,
    see docs/PREDICTION_TAXONOMY.md §5)."""
    s = Signals()
    fourth_lord = r.lord_of(4)
    if r.is_afflicted(fourth_lord):
        s.caution("fourth_lord_afflicted", "4ஆம் அதிபதி அழுத்தத்தில் — சொத்து விவகாரங்களில் கவனம்.",
                  "The 4th lord is pressured — property matters call for extra attention.")
    if r.malefic_hits(4) and not r.benefic_hits(4):
        s.caution("fourth_malefic", "4ஆம் வீட்டில் பாப தாக்கம், சுப நிவாரணம் இல்லை.",
                  "Malefic pressure on the 4th with no benefic offset — keep property paperwork current.")
    if "SATURN" in r.occupants(4) or "RAHU" in r.occupants(4):
        s.caution("saturn_rahu_fourth", "சனி/ராகு 4ல் — சொத்து விவகாரம் நீடிக்கலாம்.",
                  "Saturn/Rahu in the 4th can make property matters drag out.")
    if r.is_strong(fourth_lord) or r.benefic_hits(4):
        s.support("fourth_settled", "4ஆம் வீடு/அதிபதி நிலையாக — சொத்து விவகாரங்கள் அமைதியாக.",
                  "A stable, well-supported 4th house — property matters stay settled.")
    s.help("சொத்து ஆவணங்களை புதுப்பித்து வைத்து, குடும்பத்துடன் திறந்த உரையாடலை வைத்திருங்கள்.",
           "Keep title documents current and maintain open communication within the family.")
    return s


def eval_windfall_gains(r: _Reader) -> Signals:
    """11th house (gains) + Jupiter + Rahu — sudden, unearned, or
    speculative gains, distinct from income_growth's steady-earnings read
    and inheritance_lean's 8th-house channel."""
    s = Signals()
    eleventh_lord = r.lord_of(11)
    if "RAHU" in r.occupants(11) or r.aspects_house("RAHU", 11):
        s.support("rahu_eleventh", "ராகு 11ஆம் வீட்டுடன் தொடர்பு — எதிர்பாராத ஆதாய வாய்ப்பு.",
                  "Rahu's link to the 11th favours a sudden or unexpected gain.")
    if r.is_strong("JUPITER") and r.benefic_hits(11):
        s.support("jupiter_eleventh", "குரு வலு, 11ல் சுப ஆதரவு — ஆசீர்வதிக்கப்பட்ட ஆதாயம்.",
                  "A strong Jupiter with benefic support to the 11th favours a blessed windfall.")
    if r.conjunct(eleventh_lord, "RAHU") or r.conjunct(eleventh_lord, "JUPITER"):
        s.support("eleventh_lord_linked", "11ஆம் அதிபதி ராகு/குருவுடன் தொடர்பில்.",
                  "The 11th lord's link to Rahu or Jupiter favours an unearned gain.")
    if r.is_afflicted(eleventh_lord) and not r.is_strong("JUPITER"):
        s.caution("eleventh_afflicted", "11ஆம் அதிபதி அழுத்தத்தில் — எதிர்பாராத ஆதாயம் பொறுமை கேட்கிறது.",
                  "The 11th lord is pressured — an unearned gain here calls for patience, not pursuit.")
    if r.dasha_touches({"RAHU", "JUPITER", eleventh_lord}):
        s.window = BiText("ராகு/குரு/11 அதிபதி தசை — எதிர்பாராத ஆதாயத்திற்கு நல்ல காலம்.",
                          "A Rahu/Jupiter/11th-lord period favours an unexpected gain now.")
    s.help("எதிர்பாராத ஆதாயம் வந்தால், ஒரு பகுதியை உடனே சேமிப்பில் வைக்கவும்.",
           "If a windfall arrives, set a portion aside in savings right away — don't spend it all at once.")
    return s


def eval_speculative_risk(r: _Reader) -> Signals:
    """5th house (speculation, per classical BPHS significance) read for
    Rahu/Mars affliction — a caution against over-leveraged speculative
    risk, the mirror caution to windfall_gains's chance framing."""
    s = Signals()
    fifth_lord = r.lord_of(5)
    if r.malefic_hits(5) and ("MARS" in r.malefics_in(5) or "RAHU" in r.occupants(5)):
        s.caution("fifth_mars_rahu", "5ஆம் வீட்டில் செவ்வாய்/ராகு — ஊகவாதத்தில் அதிக ஆபத்து.",
                  "Mars/Rahu in the 5th can tempt over-leveraged speculative risk.")
    if r.conjunct("RAHU", "MARS"):
        s.caution("rahu_mars", "ராகு-செவ்வாய் சேர்க்கை — அவசர முதலீட்டு முடிவுகள்.",
                  "A Rahu-Mars combination can push hasty, high-risk investment decisions.")
    if r.is_afflicted(fifth_lord):
        s.caution("fifth_lord_afflicted", "5ஆம் அதிபதி அழுத்தத்தில் — ஊக முதலீட்டில் இழப்பு ஆபத்து.",
                  "A pressured 5th lord raises the risk of loss in speculative investment.")
    if r.is_strong("JUPITER") and r.aspects_house("JUPITER", 5):
        s.support("jupiter_protects", "குரு பார்வை 5ல் — ஊக முடிவுகளில் விவேகம்.",
                  "Jupiter's aspect on the 5th lends judgement against reckless speculation.")
    if r.is_strong(fifth_lord):
        s.support("fifth_lord_strong", "5ஆம் அதிபதி வலு — கணக்கிடப்பட்ட அபாயங்கள் மட்டுமே.",
                  "A strong 5th lord keeps risk-taking calculated rather than reckless.")
    s.help("ஊக முதலீட்டிற்கு இழக்கக்கூடிய தொகையை மட்டுமே ஒதுக்குங்கள்.",
           "Only risk money you can genuinely afford to lose on speculative bets.")
    return s


def eval_early_marriage_readiness(r: _Reader) -> Signals:
    """7th-house strength + Venus dignity — a timely-marriage lean, the
    chance-tier counterpart to marriage_delay_watch. Distinct from
    marriage_harmony (which reads the *tone* of a marriage already in
    progress, not its timing)."""
    s = Signals()
    seventh_lord = r.lord_of(7)
    venus_pv = r.pv("VENUS")
    if r.is_strong("VENUS") and not (venus_pv is not None and venus_pv.combust):
        s.support("venus_strong", "சுக்கிரன் வலு, அழுத்தமின்றி — சரியான காலத்தில் திருமணம்.",
                  "A strong, unafflicted Venus favours marriage arriving in good time.")
    if r.benefic_hits(7):
        s.support("seventh_benefic", "7ஆம் வீடு சுப ஆதரவில்.",
                  "The 7th house of partnership is benefic-supported.")
    seventh_lord_h = r.house_of(seventh_lord)
    if seventh_lord_h is not None and seventh_lord_h in {1, 4, 5, 7, 9, 10, 11} and not r.is_afflicted(seventh_lord):
        s.support("seventh_lord_placed", "7ஆம் அதிபதி நல்ல வீட்டில், அழுத்தமின்றி.",
                  "The 7th lord sits in a strong house, free of affliction.")
    if seventh_lord_h is not None and seventh_lord_h in DUSTHANA:
        s.caution("seventh_lord_dusthana", "7ஆம் அதிபதி கஷ்ட வீட்டில் — சற்று காத்திருக்க வேண்டியிருக்கலாம்.",
                  "The 7th lord sits in a difficult house — marriage may need a little more waiting.")
    if r.dasha_touches({"VENUS", "JUPITER", seventh_lord}):
        s.window = BiText("சுக்கிரன்/குரு/7 அதிபதி தசை — திருமணத்திற்கு சாதக காலம்.",
                          "A Venus/Jupiter/7th-lord period favours marriage now.")
    s.help("திருமண முடிவை அவசரப்படுத்தாமல், சரியான பொருத்தத்தில் கவனம் செலுத்துங்கள்.",
           "Don't rush the decision — focus on genuine fit, and timing tends to follow.")
    return s


def eval_marriage_delay_watch(r: _Reader) -> Signals:
    """7th lord in a dusthana, or Saturn touching the 7th/Venus — a
    delay-proneness watch, the caution-tier counterpart to
    early_marriage_readiness. Never a denial of marriage (D3/D6) — only a
    tendency toward it taking longer to arrive."""
    s = Signals()
    seventh_lord = r.lord_of(7)
    seventh_lord_h = r.house_of(seventh_lord)
    if seventh_lord_h is not None and seventh_lord_h in DUSTHANA:
        s.caution("seventh_lord_dusthana", "7ஆம் அதிபதி கஷ்ட வீட்டில் — திருமணம் தாமதமாகலாம்.",
                  "The 7th lord in a difficult house can bring some delay to marriage timing.")
    if r.aspects_house("SATURN", 7) or r.conjunct("SATURN", "VENUS"):
        s.caution("saturn_seventh_venus", "சனி 7/சுக்கிரன் தொடர்பு — பொறுமை தேவைப்படும் காலம்.",
                  "Saturn's touch on the 7th or Venus asks for patience with the timing.")
    if r.is_afflicted("VENUS"):
        s.caution("venus_afflicted", "சுக்கிரன் அழுத்தத்தில் — சரியான பொருத்தம் கிடைக்க நேரம் ஆகலாம்.",
                  "An afflicted Venus can mean the right match takes a bit more time to find.")
    if r.is_strong(seventh_lord) and seventh_lord_h not in DUSTHANA:
        s.support("seventh_lord_strong", "7ஆம் அதிபதி வலுவாக, கஷ்ட வீட்டில் இல்லை.",
                  "The 7th lord is strong and outside the difficult houses.")
    if r.benefic_hits(7):
        s.support("seventh_benefic", "7ஆம் வீடு சுப ஆதரவில்.",
                  "The 7th house has benefic support.")
    s.help("இந்த காலத்தை சுய வளர்ச்சி மற்றும் தெளிவான எதிர்பார்ப்புகளுக்கு பயன்படுத்துங்கள்.",
           "Use this season for self-growth and getting clear on what you're looking for.")
    return s


def eval_spousal_support_strength(r: _Reader) -> Signals:
    """Whether the 7th lord (or Venus, the general kalatra-comfort karaka)
    connects to the 10th house of career — a classically supportive spouse
    who actively backs the native's ambitions, distinct from
    marriage_harmony's general companionship-tone read."""
    s = Signals()
    seventh_lord = r.lord_of(7)
    if "VENUS" in r.occupants(10) or r.aspects_house("VENUS", 10):
        s.support("venus_tenth", "சுக்கிரன் 10ஆம் வீட்டுடன் தொடர்பு — துணையின் ஆதரவு தொழிலில் தெரியும்.",
                  "Venus's link to the 10th shows a partner's support reflected in career.")
    if r.house_of(seventh_lord) == 10 or r.aspects_house(seventh_lord, 10):
        s.support("seventh_lord_tenth", "7ஆம் அதிபதி 10ஆம் வீட்டுடன் தொடர்பில் — துணை தொழிலில் தீவிர பங்கு.",
                  "The 7th lord's link to the 10th — the partner takes an active role in career life.")
    if r.is_strong(seventh_lord) and not r.is_afflicted(seventh_lord):
        s.support("seventh_lord_strong", "7ஆம் அதிபதி வலுவாக, அழுத்தமின்றி — உறுதியான ஆதரவு.",
                  "A strong, unafflicted 7th lord — steady, dependable support from a partner.")
    if r.is_afflicted(seventh_lord) and not (r.aspects_house("VENUS", 10) or "VENUS" in r.occupants(10)):
        s.caution("seventh_lord_afflicted", "7ஆம் அதிபதி அழுத்தத்தில் — ஆதரவு வெளிப்படையாக தெரிய நேரம் ஆகலாம்.",
                  "The 7th lord is pressured — a partner's support may take time to become visible.")
    s.help("உங்கள் இலக்குகளை துணையுடன் தெளிவாக பகிர்ந்துகொள்ளுங்கள் — ஆதரவு தானாக வராது.",
           "Share your goals openly with your partner — support tends to follow clear communication.")
    return s


# ── P2-3 evaluators — Foreign/PR sub-topic + Litigation sub-topics ───────────
# docs/PREDICTION_TAXONOMY.md §5: the existing foreign_settlement card reads
# general travel-or-settle-abroad; PR/immigration status is a distinct
# question (formal residency, not just relocation). Similarly
# litigation_season only reads whether a dispute tends to *arise* (6th house
# rivalry) — these two add whether a dispute *resolves* favourably, and a
# business/contract-specific dispute angle, both reusing DISCLAIMER_LEGAL
# where the tier is CAUTION.

def eval_pr_immigration_prospects(r: _Reader) -> Signals:
    """9th (fortune/dharma abroad) linked to 12th (foreign residence), with
    Saturn read for bureaucratic/legal permanence — distinct from
    foreign_settlement's general travel-or-settle read: this specifically
    asks whether formal residency/immigration status tends to go smoothly."""
    s = Signals()
    ninth_lord = r.lord_of(9)
    twelfth_lord = r.lord_of(12)
    if r.conjunct(ninth_lord, twelfth_lord) or r.house_of(ninth_lord) == 12 or r.house_of(twelfth_lord) == 9:
        s.support("ninth_twelfth_link", "9-12 அதிபதிகள் தொடர்பில் — வெளிநாட்டு அதிர்ஷ்ட இணைப்பு.",
                  "A link between the 9th and 12th lords — fortune actively supports a life abroad.")
    if r.is_strong("SATURN") and not r.is_afflicted("SATURN"):
        s.support("saturn_stable", "சனி வலுவாக, அழுத்தமின்றி — நிரந்தர குடியிருப்பு/அனுமதி செயல்முறை சீராக.",
                  "A strong, unafflicted Saturn favours a smooth residency/immigration process.")
    if r.benefic_hits(9):
        s.support("ninth_benefic", "9ஆம் வீடு சுப ஆதரவில்.",
                  "The 9th house of fortune is benefic-supported.")
    if r.is_afflicted(twelfth_lord) or r.conjunct("SATURN", "KETU"):
        s.caution("twelfth_afflicted", "12ஆம் அதிபதி அழுத்தத்தில் — ஆவண செயல்முறை நீடிக்கலாம்.",
                  "The 12th lord is pressured — paperwork and process may take longer than hoped.")
    if r.dasha_touches({"SATURN", "RAHU", ninth_lord, twelfth_lord}):
        s.window = BiText("சனி/ராகு/9-12 அதிபதி தசை — நிரந்தர குடியிருப்பு முயற்சிக்கு நல்ல காலம்.",
                          "A Saturn/Rahu/9th-12th-lord period favours an immigration attempt now.")
    s.help("ஆவணங்களை முழுமையாக தயார் செய்து, செயல்முறை காலத்தில் பொறுமையாக இருங்கள்.",
           "Prepare documentation thoroughly and stay patient through the process timeline.")
    return s


def eval_legal_outcome_favor(r: _Reader) -> Signals:
    """Whether a dispute, once it arises, tends to resolve favourably — 6th
    house (contest) strength + Sun/Mars fighting-capacity + Jupiter's
    justice-aspect — the chance-tier counterpart to litigation_season's
    general dispute-arising caution."""
    s = Signals()
    sixth_lord = r.lord_of(6)
    if r.is_strong(sixth_lord):
        s.support("sixth_lord_strong", "6ஆம் அதிபதி வலு — வழக்கில் மேலோங்கல்.",
                  "A strong 6th lord favours prevailing in a dispute.")
    if r.is_strong("SUN") or r.is_strong("MARS"):
        s.support("fighting_karakas", "சூரியன்/செவ்வாய் வலு — உறுதியான வாதம்/நிலைப்பாடு.",
                  "A strong Sun or Mars gives a firm, well-argued position.")
    if r.is_strong("JUPITER") and r.aspects_house("JUPITER", 6):
        s.support("jupiter_justice", "குரு பார்வை 6ல் — நியாயமான தீர்ப்பு சாத்தியம்.",
                  "Jupiter's aspect on the 6th favours a fair, just outcome.")
    if r.is_afflicted(sixth_lord) and not r.is_strong("MARS"):
        s.caution("sixth_lord_weak", "6ஆம் அதிபதி பலவீனம் — சமரசம் சிறந்த பாதையாக இருக்கலாம்.",
                  "A weak 6th lord — settlement may be the wiser path over a prolonged fight.")
    s.help("சான்றுகளை முறையாக ஆவணப்படுத்தி, தகுதிவாய்ந்த வழக்கறிஞருடன் ஆலோசிக்கவும்.",
           "Document evidence methodically and consult a qualified lawyer early.")
    return s


def eval_contract_dispute_risk(r: _Reader) -> Signals:
    """7th house (partnership/agreements) read for Mercury (contract
    communication) affliction and node involvement — a business/contractual
    dispute caution, distinct from litigation_season's general 6th-house
    rivalry framing."""
    s = Signals()
    seventh_lord = r.lord_of(7)
    if r.is_afflicted("MERCURY") and (r.house_of("MERCURY") == 7 or r.conjunct("MERCURY", seventh_lord)):
        s.caution("mercury_seventh_afflicted", "புதன் அழுத்தத்தில், 7ஆம் வீட்டுடன் தொடர்பில் — ஒப்பந்த புரிதல் இடைவெளி.",
                  "A pressured Mercury linked to the 7th can bring gaps in contract understanding.")
    if r.conjunct("RAHU", seventh_lord) or r.conjunct("KETU", seventh_lord):
        s.caution("node_seventh_lord", "7ஆம் அதிபதி ராகு/கேதுவுடன் — ஒப்பந்த சர்ச்சை சாத்தியம்.",
                  "The 7th lord linked to a node can bring contractual misunderstanding.")
    if r.malefic_hits(7) and not r.benefic_hits(7):
        s.caution("seventh_malefic_unmitigated", "7ஆம் வீட்டில் பாப தாக்கம், சுப நிவாரணம் இல்லை.",
                  "Malefic pressure on the 7th with no benefic offset — put agreements in writing.")
    if r.is_strong("MERCURY") and r.benefic_hits(7):
        s.support("mercury_seventh_clear", "புதன் வலு, 7ல் சுப ஆதரவு — தெளிவான ஒப்பந்த புரிதல்.",
                  "A strong Mercury with benefic support to the 7th favours clear contract understanding.")
    if r.is_strong(seventh_lord) and not r.is_afflicted(seventh_lord):
        s.support("seventh_lord_stable", "7ஆம் அதிபதி நிலையாக — ஒப்பந்த உறவுகள் உறுதியாக.",
                  "A stable, unafflicted 7th lord — contractual relationships stay dependable.")
    s.help("முக்கியமான ஒப்பந்தங்களை எழுத்தில், தெளிவாக, சாட்சிகளுடன் வைத்திருங்கள்.",
           "Keep important agreements written, clear, and witnessed.")
    return s
