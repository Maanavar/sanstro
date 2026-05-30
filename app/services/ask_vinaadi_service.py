"""
Ask Vinaadi service — P1-C.

Assembles the user's full chart context and routes to Claude API
(claude-sonnet-4-6) to answer natural-language astrology questions.

Rate limit: JOTHIDAM_ASK_VINAADI_DAILY_LIMIT questions per user per day.
Counter is in-process (resets on restart); acceptable for current scale.
"""
from __future__ import annotations

import json
import logging
from collections import defaultdict
from datetime import UTC, date, datetime
from threading import Lock
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

# ── In-process daily rate counter ────────────────────────────────────────────
_counter_lock = Lock()
_daily_counts: dict[str, dict[str, int]] = defaultdict(dict)


def _today_key() -> str:
    return date.today().isoformat()


def _increment_and_check(user_id: str, limit: int) -> int:
    today = _today_key()
    with _counter_lock:
        count = _daily_counts[user_id].get(today, 0)
        if count >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Daily limit of {limit} questions reached. Resets at midnight.",
            )
        _daily_counts[user_id][today] = count + 1
        return count + 1


def _get_count(user_id: str) -> int:
    today = _today_key()
    with _counter_lock:
        return _daily_counts[user_id].get(today, 0)


# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are Vinaadi, a Tamil astrology guide trained in Thirukanitham / Drik Ganita methodology.
You use Lahiri sidereal ayanamsa, whole-sign South Indian houses, and Vimshottari dasha.
You follow the triple-confirmation rule: natal promise + dasha timing + gochar (transit) support.
Tone: supportive, practical, never fatalistic. Frame tendencies as "traditionally associated with" not certainties.
Every answer must reference which specific astrological signals you are using.
Respond ONLY as a JSON object with this exact structure (no other text):
{"ta": "<Tamil answer>", "en": "<English answer>", "signals_used": ["SIGNAL1", "SIGNAL2"], "confidence": "HIGH|MEDIUM|LOW"}
Never provide medical, legal, or financial advice. Astrology guidance only.
If birth time confidence is low, acknowledge that precise house-based readings may vary.
Keep each language answer under 200 words. Be warm and specific to the user's chart.\
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
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ask Vinaadi is not configured on this instance.",
        )

    client = anthropic.Anthropic(api_key=api_key)
    user_message = f"Chart context:\n{context}\n\nQuestion: {question}"

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = message.content[0].text.strip()
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
    settings = get_settings()
    user_key = str(owner_user_id)
    count = _increment_and_check(user_key, settings.ask_vinaadi_daily_limit)

    context_text, signals, caveat_en = _build_context_block(session, chart_id, owner_user_id)

    try:
        result = _call_claude(context_text, question)
    except HTTPException:
        # Decrement on API failure so the question doesn't count
        with _counter_lock:
            today = _today_key()
            _daily_counts[user_key][today] = max(0, count - 1)
        raise

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
            dailyLimit=settings.ask_vinaadi_daily_limit,
        ),
        meta=ResponseMeta(
            calculation_version="thirukanitham-2026-v1",
            generated_at=datetime.now(tz=UTC),
        ),
    )
