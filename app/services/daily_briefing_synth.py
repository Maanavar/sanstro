"""Daily briefing synthesizer (Track A — synthesis layer).

The daily engine already computes six bilingual `reasons` fragments plus the
component scores that produced them. Today those six are rendered as a flat,
equal-weight stack — which is the single biggest reason the output reads
"mechanical": a real astrologer never speaks in six labelled blocks.

This module composes those *already-computed* pieces into ONE prioritized,
flowing bilingual briefing:

  1. lead with the verdict (band / label),
  2. surface only the 1-2 signals that actually matter today (salience rank),
  3. weave them with causal / temporal connectors,
  4. drop the neutral noise,
  5. end with the single most useful action.

It is pure, deterministic, CPU-only — no external model. It reuses the vetted
bilingual fragments from the existing engine and adds only a small amount of
connective "glue" copy, so Tamil quality stays anchored to text you already
trust. Variation is seeded from stable inputs, so the same day renders the same
text (cacheable, testable) while different days/charts don't share one cadence.

Flag-gated by ``daily_briefing_synth`` — OFF by default. The six-row output is
untouched until this is switched on.

NOTE: the Tamil connective glue below was native-reviewed and corrected on
2026-07-14 (live astrologer/native-Tamil session, C-3/C-4). The English is
production-intent.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Protocol


class _Bi(Protocol):
    """Anything bilingual: BiText, ChartExplanationText, DailyGuidanceText…

    Read-only members: the synthesizer never writes back, and every real
    implementer is a frozen dataclass, which a settable protocol member
    would exclude.
    """
    @property
    def ta(self) -> str: ...
    @property
    def en(self) -> str: ...


@dataclass(frozen=True)
class BiText:
    ta: str
    en: str


@dataclass(frozen=True)
class BriefingInputs:
    """Everything the synthesizer needs — all already computed by the daily engine."""
    label: str                       # STRONG_SUPPORT | GOOD | BALANCED | CAUTION | RESTORATIVE
    # component scores (0-100) — used only to rank salience, never shown
    moon_score: int
    dasha_score: int
    transit_score: int
    panchangam_score: int
    personal_score: int
    # the six vetted bilingual reason fragments
    moon_transit: _Bi
    dasha_support: _Bi
    gochar: _Bi
    panchangam: _Bi
    personal_caution: _Bi
    action: _Bi
    # forced-salience flags (a caution that must never be buried)
    chandrashtama: bool = False
    sani_cycle_active: bool = False
    # The running Saturn cycle said in backdrop register (narrative_engine's
    # `sani_cycle_background`). Optional: when a cycle is live but has no
    # background phrasing, the clause is simply omitted.
    sani_background: _Bi | None = None
    # stable seed for phrasing variation (e.g. maha lord + iso date)
    seed: str = ""


# ── Verdict openers — the first sentence carries the judgement ──────────────────
# Two variants per band so consecutive days don't repeat cadence; chosen by a
# stable hash of the seed. English is production-intent; Tamil native-reviewed
# 2026-07-14.

_OPENERS: dict[str, tuple[BiText, ...]] = {
    "STRONG_SUPPORT": (
        BiText("இன்று உங்களுக்கு மிகவும் சாதகமான நாள் — முக்கியமான விஷயங்களை முன்னெடுக்க ஏற்ற நேரம்.",
               "Today reads strongly in your favour — a genuinely good day to move on what matters."),
        BiText("இன்று வலுவான சாதகமான சூழல் உள்ளது — திட்டமிட்டதைச் செயல்படுத்த இது நல்ல நேரம்.",
               "The day is strongly with you — the right window to act on what you've planned."),
        BiText("இன்று கதவுகள் திறந்திருக்கும் நாள் — தள்ளிப் போட்டிருந்த முக்கியமான ஒன்றை இன்று எடுத்து வையுங்கள்.",
               "Doors open easily today — pick up the important thing you've been putting off."),
        BiText("இன்று உங்கள் முயற்சிக்குத் தடை குறைவு — கேட்க வேண்டியதைக் கேளுங்கள், சொல்ல வேண்டியதைச் சொல்லுங்கள்.",
               "There's little friction against you today — ask for what you need, say what you've been holding."),
    ),
    "GOOD": (
        BiText("இன்று நல்ல நாள் — முன்னேற்றம் உங்கள் பக்கம் உள்ளது.",
               "A good day — steady momentum is on your side."),
        BiText("இன்று சாதகமாக அமைகிறது — முக்கியமான பணிகளை நம்பிக்கையுடன் தொடரலாம்.",
               "Today shapes up well — you can carry your important tasks forward with confidence."),
        BiText("இன்று காற்று உங்கள் பக்கம் வீசுகிறது — ஒரு படி மேலே வைக்க இது நல்ல நாள்.",
               "The wind is behind you today — a good day to push one step further than yesterday."),
        BiText("இன்று சிக்கல்கள் குறைவாக இருக்கும் — நீங்கள் நினைத்ததைச் செய்து முடிக்கலாம்.",
               "Few things should snag today — what you set out to do is likely to get done."),
    ),
    "BALANCED": (
        BiText("இன்று சமநிலையான நாள் — விஷயங்களை எளிமையாக வைத்து, தொடங்கியவற்றை முடிப்பது நல்லது.",
               "A steady day — keep things simple and finish what's already on your plate."),
        BiText("இன்று சமநிலையான ஓட்டம் — சிறிய, உறுதியான முயற்சிகள் நல்ல பலன் தரும்.",
               "An even-keeled day — small, sure steps work better than sweeping ones right now."),
        BiText("இன்று சிறப்பான தடையும் இல்லை, சிறப்பான ஆதரவும் இல்லை — வழக்கமான வேலையை நேர்த்தியாகச் செய்யுங்கள்.",
               "Nothing pushing, nothing blocking — a day to do the ordinary work well."),
        BiText("இன்று பெரிய அலைகள் இல்லை — ஒரே ஒரு விஷயத்தை முழுமையாக முடித்தால் நாள் நிறைவாகும்.",
               "No big swings today — finish one thing properly and the day has earned its keep."),
    ),
    "CAUTION": (
        BiText("இன்று சற்று கவனமாக இருங்கள் — புதிய பெரிய முடிவுகளை விட வழக்கமான பணிகளுக்கு முன்னுரிமை கொடுங்கள்.",
               "Today asks for a lighter touch — favour routine over big new decisions."),
        BiText("இன்று பொறுமையாக இருப்பது நல்லது — அவசர முடிவுகளைத் தவிர்த்து, ஏற்கனவே நடந்து கொண்டிருப்பவற்றில் கவனம் செலுத்துங்கள்.",
               "Patience serves you today — avoid rushed calls and steady what's already moving."),
        BiText("இன்று உராய்வு அதிகம் இருக்கும் — சொல்வதைக் குறைத்து, கேட்பதை அதிகப்படுத்துங்கள்.",
               "There's friction in the day — say less, listen more, and let the sharp reply wait."),
        BiText("இன்று எதையும் நிரந்தரமாக்க வேண்டாம் — திரும்பப் பெறக்கூடிய முடிவுகளை மட்டும் எடுங்கள்.",
               "Don't make anything permanent today — keep your decisions to the ones you can undo."),
    ),
    "RESTORATIVE": (
        BiText("இன்று மெதுவாகச் செல்ல வேண்டிய நாள் — ஓய்வுக்கு முன்னுரிமை கொடுத்து, பொறுப்புகளை குறைவாக வைத்துக்கொள்ளுங்கள்.",
               "A day to slow down and restore — keep commitments small."),
        BiText("இன்று உடலையும் மனதையும் புத்துணர்ச்சி பெறச் செய்யும் நாள் — புதிய பொறுப்புகளை ஏற்காமல் ஓய்வெடுங்கள்.",
               "A recharging day — don't take on anything new; let yourself rest."),
        BiText("இன்று உங்கள் சக்தி குறைவாக இருக்கும் — குறைவாகச் செய்து, நன்றாக ஓய்வெடுங்கள்.",
               "Your reserves are low today — do less, and rest properly rather than half-resting."),
        BiText("இன்று வெளியே தள்ளாமல் உள்ளே திரும்பும் நாள் — சொல்ல வேண்டியதை நாளைக்குத் தள்ளி வையுங்கள்.",
               "A day that turns inward rather than out — let the hard conversation wait for tomorrow."),
    ),
}

# Connectors that introduce the second driver. Tone-aware: a supporting second
# signal reads as additive ("and also…"), a cautionary one as a pivot ("that
# said…"). Picking the wrong register — "at the same time" in front of a warning
# — is exactly what makes weaved copy feel machine-assembled, so the two pools
# are kept separate and chosen by the second driver's direction.
_CONNECTORS_SUPPORT: tuple[BiText, ...] = (
    BiText("அதே நேரத்தில், ", "At the same time, "),
    BiText("மேலும், ", "Alongside that, "),
)
_CONNECTORS_CAUTION: tuple[BiText, ...] = (
    BiText("கவனிக்க வேண்டிய விஷயம் — ", "One thing worth noting — "),
    BiText("அதே நேரத்தில், சற்று கவனமாக இருங்கள் — ", "That said, tread carefully — "),
    # Dash-free forms. Most fragments carry their own em-dash, and a connector
    # that also ends in one produced "One thing worth noting — your mood may run
    # flat — the day leans toward…": two dashes in one breath, which reads as a
    # stutter. `_pick_connector` prefers these whenever the fragment has a dash.
    BiText("இருப்பினும் ஒன்றைக் கவனியுங்கள்: ", "One thing to watch, though: "),
    BiText("அதே நேரத்தில், ", "That said, "),
)


def _has_dash(text: str) -> bool:
    return "—" in text

# Lead-in to the single concrete action.
_ACTION_LEAD: BiText = BiText("இன்று செய்ய வேண்டியது: ", "What to do with it: ")

# A driver whose score sits inside ±_NEUTRAL_BAND of 50 is "unremarkable" and is
# dropped rather than stated — this is the "stop saying neutral things" rule.
_NEUTRAL_BAND = 8


def _pick(variants: tuple[BiText, ...], seed: str) -> BiText:
    """Deterministic choice from a pool — stable per seed, varied across seeds.

    Uses a content hash rather than the builtin ``hash()``: CPython salts string
    hashing per process (``PYTHONHASHSEED``), so ``hash()`` would pick a
    *different* variant every server restart — breaking the "same day renders
    the same text" guarantee this module promises (two workers could serve two
    cadences for one date) and making any text assertion in tests flaky.
    """
    if not variants:
        return BiText("", "")
    digest = hashlib.sha256(seed.encode("utf-8")).digest()
    return variants[int.from_bytes(digest[:8], "big") % len(variants)]


# English words that keep their capital even mid-sentence, so the connector
# join below must not lowercase them. Tamil has no case, so this applies to the
# `.en` side only.
_PROPER_LEADS = frozenset({
    "Moon", "Sun", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
    "Panchangam", "Chandrashtamam", "Chandrashtama", "Janma", "Ardhashtama",
    "Ashtama", "Ezhara", "Kantaka", "Rikta", "Paththirai", "Abhijit",
})


def _decapitalise(text: str) -> str:
    """Lower the opening capital so a fragment reads on from a connector.

    Every fragment the synthesizer consumes is written to stand alone, so each
    starts with a capital. Glued after a lower-case connector that ends in a
    comma or a dash, that produced "At the same time, Your mood should hold
    steady" — a small tell, but exactly the kind that makes assembled copy read
    as assembled. Proper nouns are left alone.
    """
    if not text:
        return text
    first_word = text.split(" ", 1)[0].strip(",.;:—-")
    if first_word in _PROPER_LEADS or first_word.isupper():
        return text
    return text[0].lower() + text[1:]


def _first_sentence(text: str) -> str:
    """Trim a multi-clause reason to its lead clause so the weave stays readable.

    Cuts at whichever separator appears *earliest*, not at a fixed precedence.
    The old fixed order tried ". " before the chip separator " · ", which is only
    safe while no chip contains a full stop of its own — and three do. The Ezhara
    Sani warns are written as two sentences ("Ezhara Sani — phase 1. Prepare to
    accept transitions."), so on a Chandrashtamam + Ezhara day the caution
    fragment "Chandrashtamam — … · Ezhara Sani — phase 1. Prepare…" got cut at
    the *inner* full stop and carried two chips into the briefing, one of them
    beheaded: "…emotional stress possible · Ezhara Sani — phase 1." Earliest-wins
    ends the lead clause where it actually ends, whichever separator gets there.
    """
    cuts = [pos for sep in (". ", " · ", "; ") if (pos := text.find(sep)) > 0]
    if not cuts:
        return text.strip()
    return text[: min(cuts)].strip().rstrip(".") + "."


@dataclass(frozen=True)
class _Driver:
    salience: float   # distance from neutral — higher wins the limited slots
    reason: _Bi       # the vetted bilingual fragment to weave in
    is_caution: bool  # True → a warning, chooses the connector's register


def _drivers(inp: BriefingInputs) -> list[_Driver]:
    """Rank the day's signals by how far they deviate from neutral.

    Chandrashtama is pinned to the top so it can never be buried under a
    merely-strong transit. It earns that pin because it *is* a day-scoped event:
    it lands, it lasts a day or so, it lifts.

    A Saturn cycle is not. Ardhashtama Sani runs about two and a half years and
    Ezhara Sani seven and a half, so pinning it here put one unchanging sentence
    at the head of the briefing every morning for years — which is the single
    biggest reason the output read as boilerplate, and it also contradicted the
    verdict it followed ("a steady day. Sudden difficulties possible."). The
    cycle still always surfaces, but as a scoped backdrop clause after the
    day-varying drivers (see ``synthesize_daily_briefing``), so the two lead
    slots go to signals that actually differ from yesterday.

    Dedup: a pinned caution and one of the component drivers can name the *same*
    phenomenon — Chandrashtama is precisely why the Moon score is depressed, and
    the active Saturn cycle is exactly what the gochar fragment reports. Surfacing
    both makes the briefing stutter ("caution: Chandrashtama … also, the Moon is
    weak"). So when a phenomenon is already spoken for, the component driver it
    explains is suppressed from the candidate pool.
    """
    ranked: list[_Driver] = []
    suppressed: set[str] = set()

    if inp.chandrashtama:
        ranked.append(_Driver(1_000.0, inp.personal_caution, is_caution=True))
        suppressed.add("moon")         # the depressed Moon score IS the Chandrashtama
    if inp.sani_cycle_active:
        suppressed.add("gochar")       # the backdrop clause already names the Saturn cycle

    candidates = (
        ("moon",       inp.moon_score,       inp.moon_transit),
        ("dasha",      inp.dasha_score,      inp.dasha_support),
        ("gochar",     inp.transit_score,    inp.gochar),
        ("panchangam", inp.panchangam_score, inp.panchangam),
    )
    for key, score, reason in candidates:
        if key in suppressed:
            continue
        salience = abs(score - 50)
        if salience >= _NEUTRAL_BAND:
            ranked.append(_Driver(salience, reason, is_caution=score < 50))

    ranked.sort(key=lambda d: d.salience, reverse=True)
    return ranked


def _keep_a_counterweight(ranked: list[_Driver]) -> list[_Driver]:
    """Take the top two, but never let both be supportive while a caution waits.

    Salience alone is |score - 50|, so on a strong day a real caution loses its
    slot to a merely-slightly-stronger positive: a day with panchangam 88, Moon
    85 and dasha 18 surfaced the two positives and dropped the reduced dasha
    entirely, leaving a uniformly rosy briefing with its one counterweight
    silently cut. The reader is never told the thing they'd most want to know.

    So the second slot is given to the strongest caution in the pool whenever the
    natural top two are both supportive. The lead is untouched — the day's
    loudest signal still opens — and a caution already in the top two changes
    nothing. Nothing is invented: the caution promoted here had already cleared
    the neutral band on its own.
    """
    top = ranked[:2]
    if any(d.is_caution for d in top):
        return top
    caution = next((d for d in ranked[2:] if d.is_caution), None)
    if caution is None:
        return top
    return [top[0], caution] if top else [caution]


def synthesize_daily_briefing(inp: BriefingInputs) -> BiText:
    """Compose the six computed reasons into one prioritized, flowing briefing."""
    opener = _pick(_OPENERS.get(inp.label, _OPENERS["BALANCED"]), inp.seed)

    drivers = _drivers(inp)
    top = _keep_a_counterweight(drivers)

    ta_parts = [opener.ta]
    en_parts = [opener.en]

    if top:
        # Lead driver flows straight on from the verdict.
        lead = top[0].reason
        ta_parts.append(_first_sentence(lead.ta))
        en_parts.append(_first_sentence(lead.en))

    if len(top) > 1:
        # Second driver introduced with a connector whose register matches its
        # tone — a warning gets a pivot ("that said…"), support gets "and also…".
        second = top[1]
        pool = _CONNECTORS_CAUTION if second.is_caution else _CONNECTORS_SUPPORT
        if _has_dash(second.reason.en):
            dash_free = tuple(c for c in pool if not c.en.rstrip().endswith("—"))
            pool = dash_free or pool
        conn = _pick(pool, inp.seed + "c")
        ta_parts.append(conn.ta + _first_sentence(second.reason.ta))
        en_parts.append(conn.en + _decapitalise(_first_sentence(second.reason.en)))

    # The running Saturn cycle, said last among the signals and in backdrop
    # register. It sits here rather than at the head deliberately: it is the one
    # sentence in the briefing that will not change tomorrow, so it must not be
    # the one the reader meets first. Placed after the day-varying drivers it
    # reads as context for them; placed before, it read as today's headline.
    if inp.sani_cycle_active and inp.sani_background is not None:
        ta_parts.append(inp.sani_background.ta)
        en_parts.append(inp.sani_background.en)

    # The single most useful action, led plainly. (The best-time window is not
    # restated here — the action text already carries it on active days, and both
    # dashboards surface it as a dedicated metric/chip; repeating it read as a
    # duplicate, in two different clock formats.)
    ta_parts.append(_ACTION_LEAD.ta + _first_sentence(inp.action.ta))
    en_parts.append(_ACTION_LEAD.en + _first_sentence(inp.action.en))

    return BiText(ta=" ".join(ta_parts), en=" ".join(en_parts))
