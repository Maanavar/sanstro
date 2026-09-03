"""Family-harmony remedies — a consolidated parigaram read across every chart
in a family vault at once (father + mother + child…), rather than one chart at
a time.

This is the "look at all our charts together and tell us what to do for family
unity" feature. It reads the SAME per-chart signals the app already computes
(combustion / அஸ்தமனம், retrogression / வக்ரம், node house placement, planet
strength) and assembles them into a small, prioritised list of shared remedies.

Design rules held here on purpose:

* **Grounded, never asserted.** Every item names *which* members' charts it was
  read from (`members=[…]`), computed from real `is_combust` / `is_retrograde`
  / house / `strength_score` values — we never claim a placement we didn't
  compute. A public-LLM version of this can hallucinate "Mercury is combust in
  both charts"; this cannot.
* **Warm, but no guarantees.** Copy is affirmative and reassuring (the product
  choice), but stays with *helps / supports / deepens* (உதவும் / மேம்படும் /
  ஆழப்படும்) — never *removes / guarantees* (நீக்கும் / உறுதி). The hard
  no-guarantee + fasting-safety notes ride along via `remedy_disclaimer()` at
  the service layer.
* **Reuses the single remedy catalogue.** Temple / weekday / mantra / daanam
  come from `PLANET_REMEDY_CATALOG` so a planet's remedy reads identically here
  and on the single-chart remedy plan.

The thresholds and the planet→family-domain framing are deliberately explicit
constants — they are the parts most worth an astrologer's eye, and are cheap to
tune without touching the plumbing.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.calculations.display_names import planet_en, planet_ta
from app.calculations.remedies import PLANET_REMEDY_CATALOG

# Planets that can be "burnt" by proximity to the Sun (அஸ்தமனம்). The Sun
# itself causes combustion; the nodes have no disc to be eclipsed, so neither is
# read for combustion here.
BURNABLE_PLANETS: tuple[str, ...] = ("MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")

# Planets whose retrogression (வக்ரம்) is astrologically meaningful. Rahu/Ketu
# are *always* retrograde, so counting them would drown the signal; the Sun and
# Moon are never retrograde. Only the five taragrahas remain.
VAKRA_PLANETS: tuple[str, ...] = ("MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")

# A child's planet at or below this strength is treated as wanting gentle
# strengthening — the "do this small thing in the child's name" remedy.
CHILD_WEAK_STRENGTH_MAX = 40

# Household retrograde load that warrants the shared kula-deivam / family-
# protection remedy: at least one retrograde planet per member on average AND at
# least one member carrying two or more. Tuned to fire on a genuinely
# retrograde-heavy household, not a typical one (~1 vakra planet per chart).
RETROGRADE_LOAD_MIN_TOTAL_PER_MEMBER = 1.0
RETROGRADE_LOAD_MIN_SINGLE = 2

# Relationships whose charts define the household's shared relational field —
# node placements in these charts drive the "words cause small upsets" remedy.
_RELATIONAL_ROLES = frozenset({"self", "spouse", "parent", "grandparent"})

# English weekday for a planet's remedy day (PLANET_REMEDY_CATALOG.day is Tamil
# only). Nodes keep their catalogue framing rather than a single weekday.
_PLANET_DAY_EN: dict[str, str] = {
    "SUN": "Sunday", "MOON": "Monday", "MARS": "Tuesday", "MERCURY": "Wednesday",
    "JUPITER": "Thursday", "VENUS": "Friday", "SATURN": "Saturday",
    "RAHU": "the daily Rahu Kalam", "KETU": "Saturday",
}


def _planet_day_en(planet: str) -> str:
    return _PLANET_DAY_EN.get(planet, "the planet's day")

# The family-life domain each planet colours when it is under strain. Used only
# for warm framing prose — not for any scoring.
_PLANET_FAMILY_DOMAIN: dict[str, tuple[str, str]] = {
    "VENUS":   ("வீட்டு அன்பு, இணக்கம், மனைவி-கணவர் ஒற்றுமை", "affection, comfort and warmth between partners at home"),
    "MERCURY": ("தெளிவான பேச்சு, கற்றல், குழந்தைகளின் படிப்பு", "clear speech, learning and the children's studies"),
    "JUPITER": ("வழிகாட்டுதல், ஞானம், குழந்தை பாக்கியம்", "guidance, wisdom and blessings for the children"),
    "MARS":    ("பொறுமை, ஆற்றல், சகோதர உறவு", "patience over temper, steady energy and sibling bonds"),
    "SATURN":  ("பொறுப்பு, நிலைத்தன்மை, பெரியோர் நலம்", "shared responsibility, steadiness and the elders' wellbeing"),
    "MOON":    ("மன அமைதி, உணர்வுப் பிணைப்பு, தாயின் நலம்", "emotional calm, closeness and the mother's wellbeing"),
}

# Node-occupied houses that touch the family's shared relationships, and the
# domain each one stirs. Only these are surfaced (a node in, say, the 11th is
# real but not a *family-harmony* signal).
_NODE_RELATIONAL_HOUSES: dict[int, tuple[str, str]] = {
    2:  ("வாக்கு — சொல்லால் சிறு மனஸ்தாபங்கள்", "speech — small upsets that start from words"),
    4:  ("வீடு, மன அமைதி, தாயின் நலம்", "the home, peace of mind and the mother"),
    5:  ("குழந்தைகள், அவர்களின் படிப்பு", "the children and their studies"),
    7:  ("வாழ்க்கைத் துணை, கூட்டு உறவுகள்", "the spouse and shared partnerships"),
}


@dataclass(frozen=True)
class MemberPlanet:
    graha: str
    house_from_lagna: int
    rasi: int
    is_combust: bool
    is_retrograde: bool
    strength_score: int


@dataclass(frozen=True)
class MemberChartInput:
    display_name: str
    relationship: str  # self | spouse | child | parent | grandparent | sibling | other
    is_minor: bool
    lagna_rasi: int
    planets: tuple[MemberPlanet, ...]

    def planet(self, graha: str) -> MemberPlanet | None:
        return next((p for p in self.planets if p.graha == graha), None)


@dataclass(frozen=True)
class FamilyHarmonyRemedyItem:
    signal: str  # COMBUST_SHARED | NODE_FRICTION | RETROGRADE_LOAD | CHILD_WEAK_PLANET
    priority: int
    title_ta: str
    title_en: str
    # What the charts actually show — the grounded, verifiable observation.
    finding_ta: str
    finding_en: str
    # The warm, actionable remedy.
    remedy_ta: str
    remedy_en: str
    members: list[str]  # display names of the members this was read from
    planet: str | None = None
    day: str | None = None
    temple_ta: str | None = None
    temple_en: str | None = None
    mantra_ta: str | None = None
    daanam_ta: str | None = None
    daanam_en: str | None = None
    tags: list[str] = field(default_factory=list)


def _join_names(names: list[str], lang: str) -> str:
    """Human name list: 'A', 'A மற்றும் B', 'A, B மற்றும் C'."""
    seen: list[str] = []
    for name in names:
        if name not in seen:
            seen.append(name)
    if not seen:
        return ""
    if len(seen) == 1:
        return seen[0]
    joiner = " மற்றும் " if lang == "ta" else " and "
    return (", ".join(seen[:-1])) + joiner + seen[-1]


def _combust_remedy(planet: str, affected: list[MemberChartInput]) -> FamilyHarmonyRemedyItem:
    catalog = PLANET_REMEDY_CATALOG[planet]
    domain_ta, domain_en = _PLANET_FAMILY_DOMAIN[planet]
    names = [m.display_name for m in affected]
    names_ta = _join_names(names, "ta")
    names_en = _join_names(names, "en")
    shared = len(affected) >= 2

    finding_ta = (
        f"{names_ta} ஆகியோரின் ஜாதகத்தில் {planet_ta(planet)} அஸ்தமனமாகி (சூரியனுக்கு "
        f"மிக அருகில்) உள்ளார். {planet_ta(planet)} {domain_ta} ஆகியவற்றைக் குறிக்கும் "
        f"கிரகம்; அஸ்தமனத்தால் அதன் பலன் சற்று மங்கலாகி, இந்தப் பகுதிகளில் கூடுதல் "
        f"கவனம் தேவைப்படும்."
    )
    subject_en = f"In the charts of {names_en}" if shared else f"In {names_en}'s chart"
    finding_en = (
        f"{subject_en}, {planet_en(planet)} is combust (very close to the Sun). "
        f"{planet_en(planet)} governs {domain_en}, so its light is a little dimmed here — "
        f"an area worth extra warmth and attention."
    )
    remedy_ta = (
        f"{catalog.day} அன்று வீட்டில் ஒரு நெய் தீபம் ஏற்றி, குடும்பமாக இணைந்து "
        f"“{catalog.mantra_full_ta}” என்ற மந்திரத்தை மனமுருகி சொல்லுங்கள். முடிந்தால் "
        f"{catalog.temple_ta} தரிசனம் செய்து, {catalog.daanam_items_ta} தானமாக அளியுங்கள். "
        f"இது {domain_ta} ஆகியவற்றை மேலும் ஆழப்படுத்தி, குடும்ப ஒற்றுமையை மென்மையாக "
        f"வலுப்படுத்த உதவும்."
    )
    remedy_en = (
        f"On {_planet_day_en(planet)}, light a ghee lamp at home and say the mantra "
        f"“{catalog.mantra_full_ta}” together as a family. When you can, visit "
        f"{catalog.temple_en} and offer {catalog.daanam_items_en} as daanam. This gently "
        f"nourishes {domain_en} and helps family closeness grow steadier."
    )
    return FamilyHarmonyRemedyItem(
        signal="COMBUST_SHARED",
        priority=_combust_priority(planet, shared),
        title_ta=f"{planet_ta(planet)} அஸ்தமன நிவர்த்தி",
        title_en=f"{planet_en(planet)} combustion remedy",
        finding_ta=finding_ta,
        finding_en=finding_en,
        remedy_ta=remedy_ta,
        remedy_en=remedy_en,
        members=names,
        planet=planet,
        day=catalog.day,
        temple_ta=catalog.temple_ta,
        temple_en=catalog.temple_en,
        mantra_ta=catalog.mantra_full_ta,
        daanam_ta=catalog.daanam_items_ta,
        daanam_en=catalog.daanam_items_en,
        tags=(["SHARED_ACROSS_FAMILY"] if shared else []),
    )


def _combust_priority(planet: str, shared: bool) -> int:
    base = {"VENUS": 10, "MERCURY": 12, "JUPITER": 16, "MOON": 18, "MARS": 20, "SATURN": 22}.get(planet, 24)
    return base - (4 if shared else 0)  # a pattern shared across ≥2 charts ranks higher


def _node_remedy(node: str, house: int, member: MemberChartInput) -> FamilyHarmonyRemedyItem:
    catalog = PLANET_REMEDY_CATALOG[node]
    domain_ta, domain_en = _NODE_RELATIONAL_HOUSES[house]
    name = member.display_name
    finding_ta = (
        f"{name} அவர்களின் ஜாதகத்தில் {planet_ta(node)} {house}-ஆம் இடத்தில் உள்ளார் — "
        f"இது {domain_ta} தொடர்பான இடம். இதனால் தேவையில்லாத சொற்களால் சிறு சிறு "
        f"மனஸ்தாபங்கள் எழலாம்; சற்று பொறுமை உதவும்."
    )
    finding_en = (
        f"In {name}'s chart, {planet_en(node)} sits in the {_ordinal(house)} house — the "
        f"area of {domain_en}. Little upsets can start from a stray word here, so a "
        f"touch of patience goes a long way."
    )
    remedy_ta = (
        f"செவ்வாய் அல்லது வெள்ளிக்கிழமை ராகு காலத்தில் துர்க்கை அம்மனை நினைத்து "
        f"எலுமிச்சம் பழத்தில் நெய் தீபம் ஏற்றி வழிபடுங்கள். வீட்டில் கடுஞ்சொல் தவிர்த்து, "
        f"நாளுக்கு ஒருமுறை “{catalog.mantra_full_ta}” என்று சொல்வது மனதை அமைதிப்படுத்தி, "
        f"குடும்பத்தில் இருக்கும் திருஷ்டியையும் வீண் விவாதங்களையும் தணிக்க உதவும்."
    )
    remedy_en = (
        f"On a Tuesday or Friday, during Rahu Kalam, light a ghee lamp set in a lemon "
        f"before Durga. Keep harsh words out of the home and say "
        f"“{catalog.mantra_full_ta}” once a day — it settles the mind and helps ease "
        f"drishti and needless arguments in the household."
    )
    return FamilyHarmonyRemedyItem(
        signal="NODE_FRICTION",
        priority=13 if house in (2, 7) else 15,
        title_ta=f"{planet_ta(node)} தோஷ நிவர்த்தி ({name})",
        title_en=f"{planet_en(node)} friction remedy ({name})",
        finding_ta=finding_ta,
        finding_en=finding_en,
        remedy_ta=remedy_ta,
        remedy_en=remedy_en,
        members=[name],
        planet=node,
        day="செவ்வாய் / வெள்ளி (ராகு காலம்)",
        temple_ta="துர்க்கை அம்மன் கோவில்",
        temple_en="Durga temple",
        mantra_ta=catalog.mantra_full_ta,
        daanam_ta=None,
        daanam_en=None,
        tags=["RELATIONAL"],
    )


def _child_weak_remedy(child: MemberChartInput, planet: str, score: int) -> FamilyHarmonyRemedyItem:
    catalog = PLANET_REMEDY_CATALOG[planet]
    domain_ta, domain_en = _PLANET_FAMILY_DOMAIN.get(planet, ("", ""))
    name = child.display_name
    finding_ta = (
        f"{name} அவர்களின் ஜாதகத்தில் {planet_ta(planet)} சற்று பலவீனமாக உள்ளார் "
        f"(பலம் {score}/100). {planet_ta(planet)} {domain_ta} ஆகியவற்றைக் குறிக்கிறார்."
    )
    finding_en = (
        f"In {name}'s chart, {planet_en(planet)} is a little weak (strength {score}/100). "
        f"{planet_en(planet)} governs {domain_en}."
    )
    if planet == "MERCURY":
        remedy_ta = (
            f"{catalog.day}கிழமைகளில் {name} அவர்களின் கைகளால் (அல்லது அவரைத் "
            f"தொட்டுக்கொண்டு) பசு மாட்டிற்கு பச்சைப் பயறு, அகத்திக்கீரை அல்லது வாழைப்பழம் "
            f"கொடுங்கள். இது குழந்தையின் {domain_ta} மேம்பட உதவும் ஒரு அழகான பழக்கம்."
        )
        remedy_en = (
            f"On {_planet_day_en(planet)}s, let {name} feed a cow green gram, agathi "
            f"leaves or a banana with their own hands (or while touching them). It is a "
            f"lovely habit that supports the child's {domain_en}."
        )
    else:
        remedy_ta = (
            f"{catalog.day}கிழமைகளில் {name} அவர்களின் பெயரால் {catalog.daanam_items_ta} "
            f"தானமாக அளித்து, குடும்பமாக “{catalog.mantra_full_ta}” சொல்லுங்கள். இது "
            f"குழந்தையின் {domain_ta} மேம்பட மென்மையாக உதவும்."
        )
        remedy_en = (
            f"On {_planet_day_en(planet)}s, offer {catalog.daanam_items_en} as daanam "
            f"in {name}'s name and say “{catalog.mantra_full_ta}” together. It gently "
            f"supports the child's {domain_en}."
        )
    return FamilyHarmonyRemedyItem(
        signal="CHILD_WEAK_PLANET",
        priority=26,
        title_ta=f"{name} — {planet_ta(planet)} பலப்படுத்தும் பரிகாரம்",
        title_en=f"{name} — strengthening {planet_en(planet)}",
        finding_ta=finding_ta,
        finding_en=finding_en,
        remedy_ta=remedy_ta,
        remedy_en=remedy_en,
        members=[name],
        planet=planet,
        day=catalog.day,
        temple_ta=catalog.temple_ta,
        temple_en=catalog.temple_en,
        mantra_ta=catalog.mantra_full_ta,
        daanam_ta=catalog.daanam_items_ta,
        daanam_en=catalog.daanam_items_en,
        tags=["FOR_CHILD"],
    )


def _retrograde_load_remedy(members: list[MemberChartInput], per_member_counts: dict[str, int]) -> FamilyHarmonyRemedyItem:
    detail_ta = ", ".join(f"{m.display_name}: {per_member_counts[m.display_name]}" for m in members if per_member_counts[m.display_name])
    total = sum(per_member_counts.values())
    finding_ta = (
        f"குடும்பத்தில் மொத்தம் {total} கிரகங்கள் வக்ர நிலையில் (Retrograde) உள்ளன "
        f"({detail_ta}). வக்ர கிரகங்கள் அதிகம் இருக்கும்போது, குலதெய்வ ஆசியும் பூர்வ "
        f"புண்ணிய பலமும் குடும்பத்திற்கு ஒரு அழகான பாதுகாப்பாக அமையும்."
    )
    finding_en = (
        f"Across the family, {total} planets are retrograde (vakra) — {detail_ta}. When "
        f"several planets are retrograde, the blessing of the kula deivam (family deity) "
        f"is a beautiful anchor for the household."
    )
    remedy_ta = (
        "வருடத்திற்கு இரண்டு முறையாவது குடும்பமாக உங்கள் குலதெய்வக் கோவிலுக்குச் சென்று "
        "அபிஷேகம் மற்றும் அன்னதானம் செய்யுங்கள். வீட்டில் தினமும் குலதெய்வத்தை நினைத்து "
        "ஒரு கற்பூரமாவது ஏற்றுவது குடும்பத்திற்கு ஒரு ஆழமான பாதுகாப்பு வளையத்தை "
        "உருவாக்க உதவும்."
    )
    remedy_en = (
        "Visit your kula deivam temple together as a family at least twice a year for "
        "abhishekam and annadhanam. Lighting even a single camphor at home each day while "
        "remembering the family deity helps hold a deep protective circle around everyone."
    )
    return FamilyHarmonyRemedyItem(
        signal="RETROGRADE_LOAD",
        priority=24,
        title_ta="குலதெய்வ வழிபாடு (வக்ர கிரக நிவர்த்தி)",
        title_en="Kula deivam worship (retrograde-load remedy)",
        finding_ta=finding_ta,
        finding_en=finding_en,
        remedy_ta=remedy_ta,
        remedy_en=remedy_en,
        members=[m.display_name for m in members if per_member_counts[m.display_name]],
        planet=None,
        day=None,
        temple_ta="குலதெய்வக் கோவில்",
        temple_en="Kula deivam (family deity) temple",
        tags=["WHOLE_FAMILY"],
    )


_ORDINALS = {
    1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", 6: "6th",
    7: "7th", 8: "8th", 9: "9th", 10: "10th", 11: "11th", 12: "12th",
}


def _ordinal(house: int) -> str:
    return _ORDINALS.get(house, f"{house}th")


def synthesize_family_harmony_remedies(members: list[MemberChartInput]) -> list[FamilyHarmonyRemedyItem]:
    """Read across every member's chart and assemble prioritised shared remedies.

    Pure function — no DB, no I/O. Every returned item is derived from the real
    combust / retrograde / house / strength values on the inputs, and names the
    members it was read from. Ordered by priority (most family-relevant first).
    """
    items: list[FamilyHarmonyRemedyItem] = []
    if not members:
        return items

    # ── 1. Combust planets shared across the household (அஸ்தமனம்) ──
    for planet in BURNABLE_PLANETS:
        affected = [m for m in members if (p := m.planet(planet)) is not None and p.is_combust]
        if affected:
            items.append(_combust_remedy(planet, affected))

    # ── 2. Node placements that stir the shared relational field (ராகு/கேது) ──
    for member in members:
        if member.relationship not in _RELATIONAL_ROLES:
            continue
        for node in ("RAHU", "KETU"):
            p = member.planet(node)
            if p is not None and p.house_from_lagna in _NODE_RELATIONAL_HOUSES:
                items.append(_node_remedy(node, p.house_from_lagna, member))

    # ── 3. Retrograde load across the whole family (வக்ரம் → குலதெய்வம்) ──
    per_member_counts = {
        m.display_name: sum(
            1 for p in m.planets if p.graha in VAKRA_PLANETS and p.is_retrograde
        )
        for m in members
    }
    total_vakra = sum(per_member_counts.values())
    max_single = max(per_member_counts.values()) if per_member_counts else 0
    if (
        total_vakra >= RETROGRADE_LOAD_MIN_TOTAL_PER_MEMBER * len(members)
        and max_single >= RETROGRADE_LOAD_MIN_SINGLE
    ):
        items.append(_retrograde_load_remedy(members, per_member_counts))

    # ── 4. A weak planet in a child → a small remedy in the child's name ──
    for member in members:
        if not (member.relationship == "child" or member.is_minor):
            continue
        weak = [
            p for p in member.planets
            if p.graha in BURNABLE_PLANETS and 0 < p.strength_score <= CHILD_WEAK_STRENGTH_MAX
        ]
        if not weak:
            continue
        weakest = min(weak, key=lambda p: p.strength_score)
        items.append(_child_weak_remedy(member, weakest.graha, weakest.strength_score))

    items.sort(key=lambda item: item.priority)
    return items
