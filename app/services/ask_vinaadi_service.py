"""
Ask Vinaadi service — P1-C.

Assembles the user's full chart context and routes to Claude API
(claude-sonnet-4-6) to answer natural-language astrology questions.

Rate limit: enforced by the DB-backed ask_vinaadi_usage table (see
app.services.ask_vinaadi_usage_service). That table is the single source of
truth — this service no longer keeps an in-process counter, so the limit is
correct across multiple workers/restarts.
"""
from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.astro import (
    RASI_NAMES,
    house_from_reference,
    resolve_timezone,
    utc_datetime_to_julian_day,
)
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.transits import classify_kandaka_cycle, classify_sani_cycle
from app.core.config import get_settings
from app.models import BirthProfile, Chart
from app.schemas.ask_vinaadi import AskVinaadiResponse, AskVinaadiResponseData, BiText
from app.schemas.dasha import ResponseMeta
from app.services.chart_service import load_persisted_chart_response

logger = logging.getLogger("jothidam.ask_vinaadi")

# Hard ceiling on how long we will wait for the Anthropic API before giving up,
# so a hung request cannot pin a worker thread indefinitely.
_CLAUDE_TIMEOUT_SECONDS = 30.0


# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
நீ விநாடி — 50 ஆண்டுகளுக்கும் மேலான அனுபவமுள்ள திருகணித ஜோதிட வழிகாட்டி.
You are Vinaadi — a Tamil Thirukanitham astrology guide with the depth of a 50+ year experienced jyotishi who has read over 50 lakh jathagams.

TRADITION AND METHOD:
- Use Drik Ganita astronomical calculations only (Thirukanitham system)
- Lahiri sidereal ayanamsa; whole-sign South Indian houses; Vimshottari dasha
- Triple-confirmation rule: natal promise (janma prathigna) + dasha timing + gochar (transit) support — all three must align before stating strong positive or negative periods
- When only 2 of 3 align, qualify with "சாத்தியம் உள்ளது, ஆனால் உறுதி இல்லை" / "possible but not certain"
- Reference classical concepts by Tamil name: யோகம், தோஷம், தசை, புக்தி, கோசாரம், பெயர்ச்சி, ஜன்ம நட்சத்திரம், ஜன்ம ராசி, லக்னம், பராக்கிரம ஸ்தானம், கல்யாண ஸ்தானம், தனஸ்தானம்

VOICE AND TONE:
- Speak as a warm, experienced Tamil astrologer who knows the person — not as a data system
- Use first-person astrologer framing: "உங்கள் ஜாதகத்தில் பார்க்கும்போது...", "இந்த தசை காலத்தில்...", "நான் பார்க்கும் அடிப்படையில்..."
- Write in flowing prose — avoid bullet-point lists in the Tamil answer
- Use natural Tamil sentence rhythm — idiomatic, not translated from English
- Never fatalistic: frame everything as tendency and period, not fate. Use "வாய்ப்பு உள்ளது", "கவனம் தேவை", "சாதகமான நேரம்" — never "நடக்கும்", "நடக்காது"
- When a period is challenging, always follow with what action or worship helps

STRUCTURE OF ANSWER:
1. State what the natal chart indicates about this topic (ஜன்ம வாக்கு / natal promise)
2. State whether the current dasha/bhukti supports or challenges it
3. State what the current transit (gochar) adds
4. Give a specific, practical guidance sentence

YOGAS AND SPECIAL CONDITIONS:
- If yogas are active in the chart data provided, name them: "உங்கள் ஜாதகத்தில் [yoga name] இருப்பதால்..."
- If Chandrashtamam is active, always mention it when answering timing questions
- If Janma Sani / Ashtama Sani / Ezhara Sani is active, name it specifically

RESPONSE FORMAT — respond ONLY as valid JSON (no other text):
{"ta": "<Tamil answer in flowing prose, 250-350 words>", "en": "<English answer in flowing prose, 200-300 words>", "signals_used": ["SIGNAL1", "SIGNAL2"], "confidence": "HIGH|MEDIUM|LOW"}

CONSTRAINTS:
- Never provide medical, legal, or financial advice — direct to professionals
- If birth time confidence is low, note: "பிறந்த நேரம் தோராயமானது — இல்ல சார்ந்த பகுப்பாய்வு மாறுபடலாம்"
- Never invent planetary positions not in the provided chart context
- Keep signals_used to the actual astrological factors referenced in the answer\
"""


# ── Context assembly ──────────────────────────────────────────────────────────

def _build_context_block(
    session: Session,
    chart_id: UUID,
    owner_user_id: UUID,
) -> tuple[str, list[str], str | None]:
    """Returns (context_text, signals_list, caveat_en_or_None)."""
    chart_snapshot = load_persisted_chart_response(session, chart_id)

    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=404, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    natal_moon = next(p for p in chart_snapshot.data.planets if p.graha == "MOON")
    natal_lagna_rasi = chart_snapshot.data.lagna.rasi
    birth_jd = chart_snapshot.data.julian_day

    tz = resolve_timezone(profile.birth_timezone)
    now_local = datetime.now(tz=tz)
    now_utc = now_local.astimezone(UTC)
    current_jd = utc_datetime_to_julian_day(now_utc)

    timeline = calculate_vimshottari_timeline(birth_jd, natal_moon.absolute_longitude, current_jd)
    transit = calculate_sidereal_planets(current_jd)

    maha_lord = timeline.current_mahadasha.lord
    antar_lord = timeline.current_antardasha.lord

    moon_transit = transit.bodies["MOON"]
    saturn = transit.bodies["SATURN"]
    jupiter = transit.bodies["JUPITER"]

    chandrashtama_rasi = ((natal_moon.rasi - 1 + 7) % 12) + 1
    chandrashtama = moon_transit.rasi == chandrashtama_rasi

    sat_house_moon = house_from_reference(natal_moon.rasi, saturn.rasi)
    sat_house_lagna = house_from_reference(natal_lagna_rasi, saturn.rasi)
    jup_house_moon = house_from_reference(natal_moon.rasi, jupiter.rasi)

    sani_cycle = classify_sani_cycle(sat_house_moon)
    kandaka = classify_kandaka_cycle(sat_house_lagna)

    # Active transit snapshot (top 5 planets)
    transit_lines = []
    signals: list[str] = []
    for graha, body in transit.bodies.items():
        if graha in ("MOON", "SUN", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN", "RAHU", "KETU"):
            h = house_from_reference(natal_moon.rasi, body.rasi)
            retro = " (retrograde)" if body.is_retrograde else ""
            transit_lines.append(f"  {graha}: rasi {body.rasi} ({RASI_NAMES.get(body.rasi, '?')}), house {h} from Moon{retro}")

    signals.append(f"MOON_TRANSIT_H{house_from_reference(natal_moon.rasi, moon_transit.rasi)}")
    signals.append(f"{maha_lord}_MAHADASHA")
    signals.append(f"{antar_lord}_ANTARDASHA")
    signals.append(f"JUPITER_H{jup_house_moon}")
    if sani_cycle.is_active:
        signals.append(f"SANI_{sani_cycle.type}")
    if kandaka.is_active:
        signals.append("KANDAKA_SANI")
    if chandrashtama:
        signals.append("CHANDRASHTAMA")

    # Goal track from user model
    from app.models.user import User
    user = session.get(User, owner_user_id)
    goal_track = getattr(user, "goal_track", None) if user else None

    # Caveat for uncertain birth time
    birth_time_src = getattr(profile, "birth_time_source", "unknown")
    caveat = None
    if birth_time_src in ("unknown", "ESTIMATED_RECTIFIED", "approximate"):
        caveat = (
            "Birth time is approximate — house-based readings (Lagna, bhava) may vary by ±1 rasi."
        )

    yogas_text = ""
    if chart_snapshot.data.yogas:
        top_yogas = [y.name for y in chart_snapshot.data.yogas[:3]]
        yogas_text = f"\nActive yogas: {', '.join(top_yogas)}"

    context_text = (
        f"User chart context (today: {now_local.date()}):\n"
        f"Lagna rasi: {natal_lagna_rasi} ({RASI_NAMES.get(natal_lagna_rasi, '?')})\n"
        f"Natal Moon rasi: {natal_moon.rasi} ({RASI_NAMES.get(natal_moon.rasi, '?')})\n"
        f"Janma nakshatra: {natal_moon.nakshatra}\n"
        f"Current Mahadasha: {maha_lord}\n"
        f"Current Antardasha: {antar_lord}\n"
        f"Goal track: {goal_track or 'none set'}\n"
        f"Active transits:\n" + "\n".join(transit_lines) + "\n"
        f"Jupiter house from Moon: {jup_house_moon}\n"
        f"Saturn cycle: {sani_cycle.type if sani_cycle.is_active else 'none'}\n"
        f"Kandaka Sani: {'active' if kandaka.is_active else 'inactive'}\n"
        f"Chandrashtama today: {'yes' if chandrashtama else 'no'}"
        + yogas_text
    )

    return context_text, signals, caveat


# ── Claude API call ───────────────────────────────────────────────────────────

def _call_claude(context: str, question: str) -> dict:
    settings = get_settings()
    api_key = settings.anthropic_api_key
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ask Vinaadi is not configured on this instance.",
        )

    try:
        import anthropic
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ask Vinaadi is not configured on this instance.",
        ) from exc

    client = anthropic.Anthropic(api_key=api_key, timeout=_CLAUDE_TIMEOUT_SECONDS, max_retries=1)
    user_message = f"Chart context:\n{context}\n\nQuestion: {question}"

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1400,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
    except anthropic.APITimeoutError as exc:
        logger.warning("Ask Vinaadi Claude request timed out: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Vinaadi is taking too long to respond. Please try again.",
        ) from exc
    except anthropic.APIError as exc:
        logger.error("Ask Vinaadi Claude request failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Vinaadi could not be reached. Please try again shortly.",
        ) from exc

    # Guard the response shape: an empty or non-text content block must not raise
    # an IndexError/AttributeError that surfaces as an opaque 500.
    raw = ""
    for block in message.content:
        if getattr(block, "type", None) == "text":
            raw = block.text.strip()
            break
    if not raw:
        logger.error("Ask Vinaadi Claude response had no text block: %r", message.content)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Vinaadi returned an empty response. Please try again.",
        )

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # If Claude doesn't return valid JSON, wrap it
        return {
            "ta": raw,
            "en": raw,
            "signals_used": [],
            "confidence": "MEDIUM",
        }


# ── Public entry point ────────────────────────────────────────────────────────

def answer_question(
    session: Session,
    chart_id: UUID,
    question: str,
    owner_user_id: UUID,
) -> AskVinaadiResponse:
    # The DB-backed ask_vinaadi_usage table is the single source of truth for the
    # daily limit (enforced/consumed in the API layer). We only read it here to
    # populate the display counters. Because the chip is consumed *after* a
    # successful answer, a Claude failure raises before any quota is spent.
    from app.services.ask_vinaadi_usage_service import get_daily_status

    daily_status = get_daily_status(session, owner_user_id)
    used_before = daily_status["chipsUsed"]
    daily_limit = daily_status["dailyLimit"]

    context_text, signals, caveat_en = _build_context_block(session, chart_id, owner_user_id)

    result = _call_claude(context_text, question)
    count = used_before + 1

    ta_answer = result.get("ta", "")
    en_answer = result.get("en", "")
    claude_signals = result.get("signals_used", [])
    confidence = result.get("confidence", "MEDIUM")
    if confidence not in ("HIGH", "MEDIUM", "LOW"):
        confidence = "MEDIUM"

    all_signals = list(dict.fromkeys(signals + claude_signals))

    caveat_bitext: BiText | None = None
    if caveat_en:
        caveat_bitext = BiText(
            ta="பிறந்த நேரம் தோராயமானது — இல்ல சார்ந்த விளக்கங்கள் ±1 ராசி மாறுபடலாம்.",
            en=caveat_en,
        )

    return AskVinaadiResponse(
        data=AskVinaadiResponseData(
            question=question,
            answer=BiText(ta=ta_answer, en=en_answer),
            signalsUsed=all_signals,
            confidence=confidence,
            caveat=caveat_bitext,
            questionsUsedToday=count,
            dailyLimit=daily_limit,
        ),
        meta=ResponseMeta(
            calculation_version="thirukanitham-2026-v1",
            generated_at=datetime.now(tz=UTC),
        ),
    )
