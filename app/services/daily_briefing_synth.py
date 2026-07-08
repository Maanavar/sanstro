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

NOTE: the Tamil connective glue below is first-draft and marked for a native
review pass (Track B). The English is production-intent.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Protocol


class _Bi(Protocol):
    """Anything bilingual: BiText, ChartExplanationText, DailyGuidanceText…"""
    ta: str
    en: str


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
    # optional concrete window, already formatted (e.g. "6:12 am-7:30 am")
    best_window_label: str | None = None
    # stable seed for phrasing variation (e.g. maha lord + iso date)
    seed: str = ""


# ── Verdict openers — the first sentence carries the judgement ──────────────────
# Two variants per band so consecutive days don't repeat cadence; chosen by a
# stable hash of the seed. English is production-intent; Tamil = review pass.

_OPENERS: dict[str, tuple[BiText, ...]] = {
    "STRONG_SUPPORT": (
        BiText("இன்று உங்களுக்கு மிகவும் சாதகமான நாள் — முக்கியமானதை முன்னெடுக்க ஏற்ற தருணம்.",
               "Today reads strongly in your favour — a genuinely good day to move on what matters."),
        BiText("இன்று வலுவான ஆதரவு உள்ளது — திட்டமிட்டதைச் செயல்படுத்த இதுவே சரியான நேரம்.",
               "The day is strongly with you — the right window to act on what you've planned."),
    ),
    "GOOD": (
        BiText("இன்று நல்ல நாள் — நிலையான வேகம் உங்கள் பக்கம் உள்ளது.",
               "A good day — steady momentum is on your side."),
        BiText("இன்று சாதகமாக அமைகிறது — முக்கிய பணிகளை நம்பிக்கையுடன் தொடரலாம்.",
               "Today shapes up well — you can carry your important tasks forward with confidence."),
    ),
    "BALANCED": (
        BiText("இன்று சமநிலையான நாள் — பெரிதாக வற்புறுத்தாமல், எளிமையாக வைத்து தொடங்கியதை முடிப்பது நல்லது.",
               "Today reads steady — not one to force big moves, but a good one to keep things simple and finish what's already on your plate."),
        BiText("இன்று நடுநிலையான ஓட்டம் — சிறிய, உறுதியான அடிகள் இன்று சிறப்பாக வேலை செய்யும்.",
               "An even-keeled day — small, sure steps work better than sweeping ones right now."),
    ),
    "CAUTION": (
        BiText("இன்று சற்று கவனத்துடன் அணுகுங்கள் — புதிய பெரிய முடிவுகளை விட வழக்கமான பணிகளுக்கு முன்னுரிமை.",
               "Today asks for a lighter touch — favour routine over big new decisions."),
        BiText("இன்று பொறுமை உதவும் — அவசர முடிவுகளைத் தவிர்த்து, நடப்பதை நிலைப்படுத்துங்கள்.",
               "Patience serves you today — avoid rushed calls and steady what's already moving."),
    ),
    "RESTORATIVE": (
        BiText("இன்று மெதுவாக, ஓய்வுக்கு முன்னுரிமை தரும் நாள் — பொறுப்புகளைச் சிறியதாக வையுங்கள்.",
               "A day to slow down and restore — keep commitments small."),
        BiText("இன்று உங்களை மீட்டெடுக்கும் நாள் — புதிதாக எதையும் சுமக்காமல் ஓய்வெடுங்கள்.",
               "A recharging day — don't take on anything new; let yourself rest."),
    ),
}

# Connectors that introduce the second driver. Tone-aware: a supporting second
# signal reads as additive ("and also…"), a cautionary one as a pivot ("that
# said…"). Picking the wrong register — "at the same time" in front of a warning
# — is exactly what makes weaved copy feel machine-assembled, so the two pools
# are kept separate and chosen by the second driver's direction.
_CONNECTORS_SUPPORT: tuple[BiText, ...] = (
    BiText("அதே நேரத்தில், ", "At the same time, "),
    BiText("அதனுடன், ", "Alongside that, "),
)
_CONNECTORS_CAUTION: tuple[BiText, ...] = (
    BiText("கவனிக்க வேண்டிய ஒன்று — ", "One thing worth noting — "),
    BiText("அதே வேளையில், கவனமாக — ", "That said, tread carefully — "),
)

# Lead-in to the single concrete action.
_ACTION_LEAD: BiText = BiText("இன்று செய்யலாம்: ", "What to do with it: ")

# Appended when a concrete auspicious window exists.
_WINDOW_LEAD: BiText = BiText("சிறந்த நேரம்: ", "Best window: ")

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


def _first_sentence(text: str) -> str:
    """Trim a multi-clause reason to its lead clause so the weave stays readable."""
    for sep in (". ", " · ", "; "):
        head, _, _ = text.partition(sep)
        if head and head != text:
            return head.strip().rstrip(".") + "."
    return text.strip()


@dataclass(frozen=True)
class _Driver:
    salience: float   # distance from neutral — higher wins the limited slots
    reason: _Bi       # the vetted bilingual fragment to weave in
    is_caution: bool  # True → a warning, chooses the connector's register


def _drivers(inp: BriefingInputs) -> list[_Driver]:
    """Rank the day's signals by how far they deviate from neutral.

    Forced-salience cautions (Chandrashtama, an active Saturn cycle) are pinned
    to the top so they can never be buried under a merely-strong transit.

    Dedup: a forced caution and one of the component drivers can name the *same*
    phenomenon — Chandrashtama is precisely why the Moon score is depressed, and
    the active Saturn cycle is exactly what the gochar fragment reports. Surfacing
    both makes the briefing stutter ("caution: Chandrashtama … also, the Moon is
    weak"). So when a phenomenon is pinned as the caution, the component driver it
    already explains is suppressed from the candidate pool.
    """
    ranked: list[_Driver] = []
    suppressed: set[str] = set()

    # A caution the doctrine says must always surface, if live.
    if inp.chandrashtama or inp.sani_cycle_active:
        ranked.append(_Driver(1_000.0, inp.personal_caution, is_caution=True))
        if inp.chandrashtama:
            suppressed.add("moon")     # the depressed Moon score IS the Chandrashtama
        if inp.sani_cycle_active:
            suppressed.add("gochar")   # the gochar fragment already names the Saturn cycle

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


def synthesize_daily_briefing(inp: BriefingInputs) -> BiText:
    """Compose the six computed reasons into one prioritized, flowing briefing."""
    opener = _pick(_OPENERS.get(inp.label, _OPENERS["BALANCED"]), inp.seed)

    drivers = _drivers(inp)
    top = drivers[:2]

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
        conn = _pick(pool, inp.seed + "c")
        ta_parts.append(conn.ta + _first_sentence(second.reason.ta))
        en_parts.append(conn.en + _first_sentence(second.reason.en))

    # The single most useful action, led plainly.
    ta_parts.append(_ACTION_LEAD.ta + _first_sentence(inp.action.ta))
    en_parts.append(_ACTION_LEAD.en + _first_sentence(inp.action.en))

    if inp.best_window_label:
        ta_parts.append(f"{_WINDOW_LEAD.ta}{inp.best_window_label}.")
        en_parts.append(f"{_WINDOW_LEAD.en}{inp.best_window_label}.")

    return BiText(ta=" ".join(ta_parts), en=" ".join(en_parts))
