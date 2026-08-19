"""Bhinnashtakavarga indications counted from a karaka graha's own rasi.

Every existing BAV consumer in this engine counts from Lagna or from a bhava's
rasi — `get_av_bindu` takes a transit rasi, `life_areas_service` reads the
primary house's rasi, `sade_sati` reads the sign Saturn is crossing. None of
them can express the classical progeny/relative rules, which count the bhava
*from the karaka graha itself*: the 5th from Guru for progeny, the 3rd from
Sevvai for siblings, the 4th from Budhan for the maternal line, the 9th from
Suriyan for the paternal line. That reference point is the only thing this
module adds; the bindu table it reads is the one `compute_bhinnashtakavarga`
has produced all along.

Two rules govern everything here, and both are deliberate:

1. **This layer is age-blind.** It computes all four indications for every
   chart, an infant's and an eighty-year-old's alike, because the bindus do not
   change with age. Whether an indication may be *shown* is a disclosure
   decision made by the calling service against the life-area age band and
   life-phase gate — the same separation `age_gate.py` already states for
   Sevvai Dosham softening ("an interpretive overlay at scoring time, not baked
   into the natal calculation itself, which must stay age-independent").

2. **A bindu is never converted into a count of people.** These rules are
   sometimes quoted as giving an exact number of children or of a father's
   siblings. They do not, the source texts call them general indications, and a
   printed count is instantly checkable by the reader — being wrong about it
   costs more trust than saying nothing. The output is a band on the classical
   0-8 scale, matching the reading the chart-explanation screen already renders
   (`binduReading` in web/components/dashboard-chart-explanation.tsx).

Sourcing note: the Mercury rule for maternal relations deliberately *replaces*
the weaker Moon-BAV-4th formulation. Budhan is matula-karaka; the Moon variant
conflates the mother with her siblings.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.calculations.ashtakavarga import BAV_TABLE

BAND_STRONG = "STRONG"
BAND_NEUTRAL = "NEUTRAL"
BAND_THIN = "THIN"

#: How far from its own expected value a bindu count must sit to be called
#: anything. One full bindu — below that the reading is noise.
BAV_BAND_MARGIN = 1.0


@dataclass(frozen=True)
class BavDerivedRule:
    """One classical indication: a karaka, the bhava counted from it, the domain."""

    key: str
    #: Graha whose Bhinnashtakavarga is read AND from whose natal rasi we count.
    karaka: str
    #: Bhava counted from the karaka's own rasi, 1-based inclusive.
    house: int
    #: Which life area may disclose this, if any gate lets it through.
    domain: str


#: The four rules that are classically defensible and have a gated home.
#:
#: The Nadi-tier association rules (planets conjunct Sevvai / Chandran / Sukran
#: as sibling, mother's-family and spouse's-family clues) are deliberately NOT
#: here: they have no labelled auxiliary surface to land on, their natural
#: output is a count, and the Venus one asserts a spouse the profile may not
#: have. See docs/BAV_DERIVED_INDICATIONS_2026-08-18.md §1.4.
BAV_DERIVED_RULES: tuple[BavDerivedRule, ...] = (
    BavDerivedRule(key="progeny", karaka="JUPITER", house=5, domain="CHILDREN"),
    BavDerivedRule(key="siblings", karaka="MARS", house=3, domain="FAMILY_HARMONY"),
    BavDerivedRule(key="maternal", karaka="MERCURY", house=4, domain="FAMILY_HARMONY"),
    BavDerivedRule(key="paternal", karaka="SUN", house=9, domain="FAMILY_HARMONY"),
)


@dataclass(frozen=True)
class BavIndication:
    """A computed indication. `bindus` is on the 0-8 scale — never a headcount."""

    key: str
    karaka: str
    house: int
    domain: str
    rasi: int
    bindus: int
    band: str


def rasi_from_planet(natal_rasi_map: dict[str, int], planet: str, house: int) -> int | None:
    """Absolute rasi of the `house`-th bhava counted from `planet`'s natal rasi.

    1-based and inclusive — house 1 is the graha's own rasi — which is the same
    convention `compute_bhinnashtakavarga` uses when it walks BAV_TABLE's
    benefic-house lists from each reference point.

    Returns None when the chart does not carry that graha.
    """
    ref_rasi = natal_rasi_map.get(planet)
    if ref_rasi is None:
        return None
    return ((ref_rasi - 1 + house - 1) % 12) + 1


def bav_house_from_planet(
    bav: dict[str, dict[int, int]],
    natal_rasi_map: dict[str, int],
    planet: str,
    house: int,
) -> int | None:
    """Bindus in `planet`'s own Bhinnashtakavarga at the `house`-th rasi from itself.

    Returns None when the graha is missing from the chart or has no BAV table
    (Rahu and Ketu have none classically.) This layer has always refused to
    borrow Saturn's table here; as of doctrine A-15 (ruled 2026-08-19)
    `get_av_bindu` refuses it for transit scoring too, so the two layers now
    agree that a node simply has no bindu rather than a proxied one.
    """
    target_rasi = rasi_from_planet(natal_rasi_map, planet, house)
    if target_rasi is None:
        return None
    planet_bav = bav.get(planet)
    if planet_bav is None:
        return None
    return planet_bav.get(target_rasi)


def expected_bindus(karaka: str, house: int) -> float:
    """Baseline bindu count for "the Nth rasi from `karaka`", derived from BAV_TABLE.

    A flat cut across all four rules is indefensible, and measurably so. Each
    graha's Bhinnashtakavarga has a different total (Guru 56, Budhan 54, Suriyan
    48, Sevvai 39), so the same number of bindus means different things in each,
    and the specific house each rule asks about shifts the baseline again. Two
    effects combine:

    * The **self term.** A graha's own row either does or does not include the
      house in question, and it is counted from that graha's own rasi, so the
      contribution is deterministic — not probabilistic. The 9th from Suriyan is
      in Suriyan's own row, so it *always* collects that bindu; the 5th from
      Guru, the 3rd from Sevvai and the 4th from Budhan are absent from theirs,
      so they never do. That is a structural one-bindu head start for the
      paternal rule alone.
    * The **other seven reference points**, each contributing in proportion to
      how many houses its row marks benefic.

    Baselines that fall out: progeny 4.00, siblings 2.67, maternal 3.83,
    paternal 4.33. Judged against a flat "5 is strong, 3 is thin" cut, 74% of
    charts would have been told their sibling indication is thin — a property of
    Sevvai's small table, not of anybody's chart.

    APPROXIMATION, and an open astrologer question: the non-self terms assume
    the other reference points sit uniformly around the zodiac relative to the
    karaka. That is exact for none of them and least true for Budhan and Sukran,
    which never stray far from Suriyan. The self term — the one that creates the
    largest single distortion — is exact.
    """
    row = BAV_TABLE[karaka]
    total = 1.0 if house in row[karaka] else 0.0
    total += sum(len(houses) for ref, houses in row.items() if ref != karaka) / 12.0
    return total


def classify_bindu_band(bindus: int, karaka: str, house: int) -> str:
    """STRONG / NEUTRAL / THIN, judged against this rule's own baseline."""
    baseline = expected_bindus(karaka, house)
    if bindus >= baseline + BAV_BAND_MARGIN:
        return BAND_STRONG
    if bindus <= baseline - BAV_BAND_MARGIN:
        return BAND_THIN
    return BAND_NEUTRAL


def compute_bav_derived_indications(
    bav: dict[str, dict[int, int]],
    natal_rasi_map: dict[str, int],
) -> dict[str, BavIndication]:
    """All four indications, keyed by rule key. Age-blind by design.

    A rule whose karaka is absent from the chart is omitted rather than
    defaulted — an absent graha is "not evaluated", never "no support".
    """
    out: dict[str, BavIndication] = {}
    for rule in BAV_DERIVED_RULES:
        target_rasi = rasi_from_planet(natal_rasi_map, rule.karaka, rule.house)
        if target_rasi is None:
            continue
        bindus = bav_house_from_planet(bav, natal_rasi_map, rule.karaka, rule.house)
        if bindus is None:
            continue
        out[rule.key] = BavIndication(
            key=rule.key,
            karaka=rule.karaka,
            house=rule.house,
            domain=rule.domain,
            rasi=target_rasi,
            bindus=bindus,
            band=classify_bindu_band(bindus, rule.karaka, rule.house),
        )
    return out


# ── Disclosure ──────────────────────────────────────────────────────────────
#
# The calculation above is age-blind; this is where "may the reader see it"
# lives. It is a pure function of the indication and the caller's gate state so
# it can be tested without a chart, a session, or a date.

#: Rules whose THIN band is withheld. Progeny is the only one, and the reason is
#: not squeamishness: the supportive chip is a harmless chart fact for everyone
#: the age band admits, while its mirror image, delivered undisclaimed to
#: someone who has been trying and failing, is a verdict. Discouraging fertility
#: content has exactly one home in this product — the `child_timing` propensity
#: card, which carries DISCLAIMER_FERTILITY and a 21-50 band — and it does not
#: get a second one as an unlabelled chip. Siblings/maternal/paternal disclose
#: both bands, because a thin bindu count there is descriptive, not a hope being
#: denied.
_SUPPORTIVE_BAND_ONLY: frozenset[str] = frozenset({"progeny"})


def disclosable_indications(
    indications: dict[str, BavIndication],
    domain: str,
    *,
    age_relevant: bool,
) -> list[BavIndication]:
    """Indications the given life area may show, most-specific rules applied.

    `age_relevant` is the caller's existing gate result (life-area age band AND
    life-phase relevance) — this function never re-derives age itself, so there
    is one age gate in the system rather than two that can drift apart.

    NEUTRAL never surfaces: a midpoint bindu count is not a finding, and
    emitting it would push a real factor off the card's three-chip budget.
    """
    if not age_relevant:
        return []
    out: list[BavIndication] = []
    for rule in BAV_DERIVED_RULES:
        if rule.domain != domain:
            continue
        indication = indications.get(rule.key)
        if indication is None or indication.band == BAND_NEUTRAL:
            continue
        if indication.band == BAND_THIN and rule.key in _SUPPORTIVE_BAND_ONLY:
            continue
        out.append(indication)
    return out


def factor_code(indication: BavIndication) -> str:
    """Stable `supportingFactors` / `blockingFactors` key for a disclosed indication.

    e.g. `progeny_bav_strong`, `paternal_bav_thin`. Surfaces map these to copy;
    unknown keys already degrade to humanised text client-side.
    """
    return f"{indication.key}_bav_{indication.band.lower()}"
