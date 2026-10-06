"""Story-view selection, server-side (FTR-21).

The Story view (Family & Charts §9) shows a few facts per chapter, picked by
rules that lived only in `web/components/chart-reading/reading-selectors.ts`.
Mobile could not reuse them, and a second client-side copy is how naming and
ranking fork. This module computes the same picks once, from the explanation
payload, and ships them as the optional `story` field.

It returns keys and engine names, not prose — each surface still renders
names through its own localiser — with one exception: the headline, a
template over chart fields that both surfaces print as-is.

Every rule here mirrors the TypeScript it replaces, and the web suite holds the
two to the same answers on captured synthetic charts
(`web/components/chart-reading/reading-story-parity.test.ts`). The source
tables it needs (house meanings, the adverse-yoga set) are copies with their
own parity tests (`tests/test_reading_story.py`).
"""
from __future__ import annotations

from app.calculations.display_names import planet_en, planet_ta
from app.calculations.yoga_display import yoga_reading_status
from app.schemas.chart_explanation import (
    ChartExplanationData,
    ChartExplanationFacet,
    ChartExplanationPlanet,
    ChartExplanationStory,
    ChartExplanationStoryCare,
    ChartExplanationStoryPlanet,
    ChartExplanationText,
)
from app.schemas.charts import ChartDoshamInsight, ChartYogaInsight

# Mirror of HOUSE_MEANING (web/components/dashboard-chart-explanation-data.ts).
HOUSE_MEANING: dict[int, tuple[str, str]] = {
    1: ("உடல், தன்மை, வாழ்க்கை திசை", "self, body, life direction"),
    2: ("குடும்பம், பேச்சு, பண அடித்தளம்", "family, speech, money base"),
    3: ("முயற்சி, துணிவு, தொடர்பு", "effort, courage, communication"),
    4: ("வீடு, மன அமைதி, சொத்து", "home, inner peace, property"),
    5: ("கல்வி, புத்தி, குழந்தைகள்", "learning, intelligence, children"),
    6: ("சேவை, பழக்கங்கள், ஒழுங்கு", "service, habits, discipline"),
    7: ("உறவுகள், கூட்டாண்மை", "relationships, partnership"),
    8: ("ஆழமான மாற்றம், ஆராய்ச்சி, கவனம்", "deep change, research, careful renewal"),
    9: ("தர்மம், ஆசீர்வாதம், உயர்கல்வி", "dharma, grace, higher learning"),
    10: ("தொழில், பொறுப்பு, வெளிப்படை செயல்", "career, responsibility, public work"),
    11: ("லாபம், நண்பர்கள், வலையமைப்பு", "gains, friends, networks"),
    12: ("ஓய்வு, வெளிநாடு, ஆன்மீக விடுவிப்பு", "rest, foreign links, spiritual release"),
}

# Mirror of ADVERSE_YOGAS (packages/shared/src/yogaDisplay.ts).
ADVERSE_YOGAS: frozenset[str] = frozenset({
    "SAKATA_YOGA",
    "KEMADRUMA_YOGA",
    "DARIDRA_YOGA",
    "DARIDRA_PROXY_YOGA",
    "PAPA_KARTARI_YOGA",
    "CHANDALA_YOGA",
    "CHANDALA_KETU_YOGA",
})


def is_adverse_yoga(name: str) -> bool:
    return name.upper() in ADVERSE_YOGAS


def _ordinal(n: int) -> str:
    if 11 <= n % 100 <= 13:
        return f"{n}th"
    return f"{n}{ {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th') }"


def _planet_names(graha: str) -> tuple[str, str]:
    key = {"SANI": "SATURN", "GURU": "JUPITER"}.get(graha.upper(), graha)
    return planet_ta(key), planet_en(key)


# ── Headline (mirror of storyHeadline) ──────────────────────────────────────

def story_headline(data: ChartExplanationData) -> ChartExplanationText | None:
    """The running mahadasa lord and the house it sat in at birth."""
    maha = next((lord for lord in data.current_activation.active_lords if lord.level == "MAHADASHA"), None)
    if maha is None:
        return None
    ta_name, en_name = _planet_names(maha.lord)
    house = maha.natal_house_from_lagna
    theme_ta, theme_en = HOUSE_MEANING.get(house, ("", ""))
    return ChartExplanationText(
        ta=f"இப்போது {ta_name} தசை நடக்கிறது; பிறப்பில் {ta_name} உங்கள் {house}-ஆம் வீட்டில் ({theme_ta}) அமைந்துள்ளது.",
        en=f"{en_name} sets the tone now: its dasa is running, from your {_ordinal(house)} house — {theme_en}.",
    )


# ── Chapter 2 (mirror of whyFacets / isActiveNow) ───────────────────────────

_WHY_EXCLUDED = frozenset({"placement", "activation", "transit", "remedy", "avastha", "lordship"})
_TONE_RANK = {"CAUTION": 0, "BOOST": 1, "NEUTRAL": 2}


def why_facets(facets: list[ChartExplanationFacet]) -> list[ChartExplanationFacet]:
    """At most two lines that explain a planet's verdict: the synthesis facet
    first (it exists only where signals conflict), then CAUTION before BOOST."""
    synthesis = [f for f in facets if f.key == "synthesis"]
    rest = [
        f for _, f in sorted(
            ((index, f) for index, f in enumerate(facets)
             if f.key != "synthesis" and f.key not in _WHY_EXCLUDED and f.tone != "NEUTRAL"),
            key=lambda pair: (_TONE_RANK.get(pair[1].tone, 2), pair[0]),
        )
    ]
    return [*synthesis, *rest][:2]


def is_active_now(planet: ChartExplanationPlanet) -> bool:
    return any(f.key == "activation" and f.tone == "BOOST" for f in planet.facets)


# ── Yoga ranking (ruling D4 as revised by O-25, 2026-10-05; mirror of
# topNatalYogas / topActiveYogas) ─────────────────────────────────────────────
# Lasting gifts: formed → natal strength → structural reach; activation is
# never a key there. Running now: formed → activation (gate, then tier) →
# natal strength → structural reach → activation score. ADHI_RAJA_GRADE stays
# out of both until Saravali is verified in print.

_STRENGTH_RANK = {"STRONG": 0, "PARTIAL": 1, "WEAK": 2}
_TIER_RANK = {"STRONG": 0, "MODERATE": 1, "NONE": 2}
_NOT_IN_TOP = frozenset({"ADHI_RAJA_GRADE"})


def _running_in_dasha(y: ChartYogaInsight) -> bool:
    # isRunningInDasha({...y, isCancelled: false}): isCurrentlyActive ?? dashaActivated.
    # The payload always carries isCurrentlyActive, so it decides.
    return y.is_present and y.is_currently_active


def _activation_rank(y: ChartYogaInsight) -> int:
    if y.activation_tier:
        return _TIER_RANK.get(y.activation_tier, 2)
    return 1 if _running_in_dasha(y) else 2


def _natal_key(y: ChartYogaInsight) -> tuple[int, int, int]:
    return (
        _STRENGTH_RANK.get(y.strength, 2),
        len(y.cancellation_factors or []),
        -(y.structural_reach or 0),
    )


def _active_key(y: ChartYogaInsight) -> tuple[int, int, int, int, int]:
    return (
        _activation_rank(y),
        _STRENGTH_RANK.get(y.strength, 2),
        len(y.cancellation_factors or []),
        -(y.structural_reach or 0),
        -(y.activation_score or 0),
    )


def _valid_benefic(y: ChartYogaInsight) -> bool:
    return not is_adverse_yoga(y.name) and y.name not in _NOT_IN_TOP and yoga_reading_status(y.is_present, y.strength, y.cancellation_factors) == "PRESENT"


def top_natal_yogas(yogas: list[ChartYogaInsight], limit: int = 3) -> list[ChartYogaInsight]:
    # Python's sort is stable, like Array.prototype.sort, so ties keep payload order.
    return sorted((y for y in yogas if _valid_benefic(y)), key=_natal_key)[:limit]


def top_active_yogas(yogas: list[ChartYogaInsight], limit: int = 3) -> list[ChartYogaInsight]:
    return sorted((y for y in yogas if _valid_benefic(y) and _activation_rank(y) < 2), key=_active_key)[:limit]


# ── Chapter 4 care column (mirror of carePatterns) ──────────────────────────

def _standing_tone_dosham(d: ChartDoshamInsight) -> str:
    # Mirror of the shared `doshamStanding` tone (DD-17): a mitigated dosham
    # with a moderate residual is "mid", not the all-clear "good".
    if not d.is_present:
        return "muted"
    if d.is_cancelled:
        return "mid" if d.residual == "MODERATE" else "good"
    return "caution" if d.strength == "STRONG" else "mid"


def _dosham_needs_care(d: ChartDoshamInsight) -> bool:
    """Present and unmitigated, or mitigated with a moderate residual (DD-17):
    a strong placement only just offset is still a care item."""
    return d.is_present and (not d.is_cancelled or d.residual == "MODERATE")


def _standing_tone_yoga(y: ChartYogaInsight) -> str:
    status = yoga_reading_status(y.is_present, y.strength, y.cancellation_factors)
    if status != "PRESENT":
        return "mid" if status == "CANCELLED" else "muted"
    if is_adverse_yoga(y.name):
        return "caution" if y.strength == "STRONG" else "mid"
    return "good"


def care_patterns(doshams: list[ChartDoshamInsight], yogas: list[ChartYogaInsight]) -> list[ChartExplanationStoryCare]:
    """Doshams that still need care (`_dosham_needs_care`) plus adverse yogas
    the chart has (a formed-and-cancelled yoga is good news and stays out),
    caution first, three."""
    picked: list[tuple[str, ChartExplanationStoryCare]] = [
        (_standing_tone_dosham(d), ChartExplanationStoryCare(name=d.name, kind="DOSHAM"))
        for d in doshams
        if _dosham_needs_care(d)
    ]
    picked += [
        (tone, ChartExplanationStoryCare(name=y.name, kind="YOGA"))
        for y in yogas
        if is_adverse_yoga(y.name) and yoga_reading_status(y.is_present, y.strength, y.cancellation_factors) == "PRESENT"
        for tone in (_standing_tone_yoga(y),)
        if tone in ("caution", "mid")
    ]
    picked.sort(key=lambda pair: 0 if pair[0] == "caution" else 1)
    return [care for _, care in picked[:3]]


# ── Assembly ────────────────────────────────────────────────────────────────

def build_reading_story(data: ChartExplanationData) -> ChartExplanationStory:
    yogas = data.yoga_dosham.yogas
    return ChartExplanationStory(
        headline=story_headline(data),
        planets=[
            ChartExplanationStoryPlanet(
                graha=p.graha,
                why_facet_keys=[f.key for f in why_facets(p.facets)],
                active_now=is_active_now(p),
            )
            for p in data.planets
        ],
        top_natal_yogas=[y.name for y in top_natal_yogas(yogas)],
        top_active_yogas=[y.name for y in top_active_yogas(yogas)],
        care_patterns=care_patterns(data.yoga_dosham.doshams, yogas),
    )
