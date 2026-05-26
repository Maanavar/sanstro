from __future__ import annotations

import logging
import random
import smtplib
import time
from dataclasses import dataclass
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import NamedTuple

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# ── Generic email delivery with retry ────────────────────────────────────────

_MAX_ATTEMPTS = 3
_BASE_DELAY_S = 1.0
_JITTER = 0.2


class EmailMessage(NamedTuple):
    to_address: str
    subject: str
    body_text: str
    body_html: str | None = None


def _smtp_configured() -> bool:
    s = get_settings()
    return bool(s.smtp_host and s.smtp_user and s.smtp_pass)


def send_email(message: EmailMessage) -> bool:
    """
    Send an email with up to 3 attempts (1s/2s/4s backoff, ±20% jitter).
    Returns True on success or when SMTP is unconfigured (stub mode).
    Returns False only on permanent/exhausted failure.
    """
    if not _smtp_configured():
        logger.info("SMTP not configured — skipping email to %s: %s", message.to_address, message.subject)
        return True

    s = get_settings()
    from_addr = s.notification_from_email or s.smtp_user
    from_name = s.notification_from_name

    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = message.subject
            msg["From"] = f"{from_name} <{from_addr}>"
            msg["To"] = message.to_address
            msg.attach(MIMEText(message.body_text, "plain", "utf-8"))
            if message.body_html:
                msg.attach(MIMEText(message.body_html, "html", "utf-8"))

            with smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=10) as server:  # type: ignore[arg-type]
                server.ehlo()
                server.starttls()
                server.login(s.smtp_user, s.smtp_pass)  # type: ignore[arg-type]
                server.sendmail(from_addr, [message.to_address], msg.as_string())  # type: ignore[arg-type]

            logger.info("email_sent to=%s subject=%s", message.to_address, message.subject)
            return True

        except smtplib.SMTPRecipientsRefused:
            logger.warning("email_rejected to=%s — server refused recipient, not retrying", message.to_address)
            return False

        except Exception as exc:
            if attempt == _MAX_ATTEMPTS:
                logger.error("email_failed to=%s after %d attempts: %s", message.to_address, _MAX_ATTEMPTS, exc)
                return False
            delay = _BASE_DELAY_S * (2 ** (attempt - 1)) * (1 + random.uniform(-_JITTER, _JITTER))
            logger.warning("email_retry attempt=%d/%d to=%s exc=%s delay=%.1fs", attempt, _MAX_ATTEMPTS, message.to_address, exc, delay)
            time.sleep(delay)

    return False


def build_notification_email(to_address: str, title: str, body: str) -> EmailMessage:
    """Wrap a notification title+body into a plain+HTML EmailMessage."""
    html = f"<html><body style='font-family:sans-serif;max-width:600px;margin:auto;padding:24px'><h2>{title}</h2><p>{body}</p></body></html>"
    return EmailMessage(to_address=to_address, subject=title, body_text=f"{title}\n\n{body}", body_html=html)

# ── Tamil planet names ────────────────────────────────────────────────────────

_PLANET_TA = {
    "SATURN": "சனி (Sani)",
    "JUPITER": "குரு (Guru)",
    "RAHU": "ராகு (Rahu)",
    "KETU": "கேது (Ketu)",
}

_RASI_TA = {
    "MESHAM": "மேஷம்",
    "RISHABAM": "ரிஷபம்",
    "MIDHUNAM": "மிதுனம்",
    "KADAGAM": "கடகம்",
    "SIMMAM": "சிம்மம்",
    "KANNI": "கன்னி",
    "THULAAM": "துலாம்",
    "VRICHIGAM": "விருச்சிகம்",
    "DHANUSU": "தனுசு",
    "MAGARAM": "மகரம்",
    "KUMBAM": "கும்பம்",
    "MEENAM": "மீனம்",
}

# Supportive remedy text by Sani cycle — non-fearful language per spec
_SANI_REMEDY = {
    "JANMA_SANI": (
        "Strengthen daily routines and physical health. Hanuman or Sani stotra recitation supports resilience.",
        "தினசரி ஒழுக்கம் மற்றும் உடல்நலத்தை பலப்படுத்துங்கள். ஹனுமான் அல்லது சனி ஸ்தோத்திரம் உதவும்.",
    ),
    "EZHARAI_SANI_PHASE_1": (
        "Focus on letting go of what no longer serves you. Saturn brings restructuring — trust the process.",
        "உங்களுக்கு உதவாதவற்றை விட்டுவிட கவனம் செலுத்துங்கள். சனி மறுகட்டமைப்பை கொண்டுவருகிறார்.",
    ),
    "EZHARAI_SANI_PHASE_3": (
        "Family and financial matters need patience. Avoid major commitments; focus on consolidation.",
        "குடும்ப மற்றும் நிதி விஷயங்களில் பொறுமை தேவை. பெரிய கட்டுப்பாடுகளை தவிர்க்கவும்.",
    ),
    "ASHTAMA_SANI": (
        "A period for inner work and health care. Saturn asks for discipline, not fear.",
        "உள் வேலை மற்றும் உடல்நல பராமரிப்புக்கான காலம். சனி ஒழுக்கத்தை கேட்கிறார், பயத்தை அல்ல.",
    ),
    "KANDAKA_SANI": (
        "Saturn in angular position — time to build strong foundations in career and relationships.",
        "சனி கோணல் நிலையில் — தொழில் மற்றும் உறவுகளில் வலுவான அடித்தளம் அமைக்கும் நேரம்.",
    ),
    "ARDHASHTAMA_SANI": (
        "Mid-point of the Saturn cycle — review and course-correct any ongoing commitments.",
        "சனி சுழற்சியின் நடுப்புள்ளி — நடந்துகொண்டிருக்கும் கடமைகளை மதிப்பாய்வு செய்யுங்கள்.",
    ),
}

_DEFAULT_REMEDY_EN = "Take time to reflect and prepare. Saturn's energy supports those who act with patience and intention."
_DEFAULT_REMEDY_TA = "சிந்திக்கவும் தயாரிக்கவும் நேரம் எடுங்கள். சனியின் ஆற்றல் பொறுமையுடன் செயல்படுவோரை ஆதரிக்கிறது."


@dataclass(frozen=True, slots=True)
class PeyarchiEmailContext:
    to_address: str
    display_name: str
    planet: str          # "SATURN" etc.
    from_rasi: str       # "MEENAM"
    to_rasi: str         # "MESHAM"
    event_date_str: str  # "23 Feb 2028" — already formatted by caller
    days_away: int
    house_from_moon: int
    sani_cycle_after: str | None
    tier: str            # "30d" | "7d" | "1d" | "day_of"


def _subject(ctx: PeyarchiEmailContext) -> str:
    planet_en = ctx.planet.capitalize()
    if ctx.tier == "day_of":
        return f"Today is {planet_en} Peyarchi day for your chart"
    if ctx.tier == "1d":
        return f"{planet_en} Peyarchi tomorrow — {ctx.event_date_str}"
    if ctx.tier == "7d":
        return f"{planet_en} Peyarchi in {ctx.days_away} days — {ctx.event_date_str}"
    # 30d
    return f"{planet_en} Peyarchi approaching — {ctx.event_date_str}"


def _body_html(ctx: PeyarchiEmailContext) -> str:
    planet_ta = _PLANET_TA.get(ctx.planet, ctx.planet)
    from_rasi_ta = _RASI_TA.get(ctx.from_rasi, ctx.from_rasi)
    to_rasi_ta = _RASI_TA.get(ctx.to_rasi, ctx.to_rasi)
    remedy_en, remedy_ta = _SANI_REMEDY.get(ctx.sani_cycle_after or "", (_DEFAULT_REMEDY_EN, _DEFAULT_REMEDY_TA))
    sani_cycle_line = ""
    if ctx.sani_cycle_after:
        sani_cycle_line = f"<p><strong>Sani cycle after peyarchi:</strong> {ctx.sani_cycle_after.replace('_', ' ').title()}</p>"

    if ctx.tier == "day_of":
        intro_en = f"Today, {ctx.event_date_str}, is the day of {ctx.planet.capitalize()} Peyarchi for your chart."
        intro_ta = f"இன்று, {ctx.event_date_str}, உங்கள் ஜாதகத்திற்கு {planet_ta} பெயர்ச்சி நாள்."
    else:
        intro_en = f"{ctx.planet.capitalize()} Peyarchi is in {ctx.days_away} days — on {ctx.event_date_str}."
        intro_ta = f"{planet_ta} பெயர்ச்சி {ctx.days_away} நாட்களில் — {ctx.event_date_str} அன்று."

    return f"""
<html><body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:auto;padding:24px">
  <h2 style="color:#7c3aed">{ctx.planet.capitalize()} Peyarchi — Vinaadi AI</h2>
  <p>{intro_en}</p>
  <p style="color:#555">{intro_ta}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
  <p><strong>Transition:</strong> {ctx.from_rasi} → {ctx.to_rasi}</p>
  <p style="color:#555">{from_rasi_ta} → {to_rasi_ta}</p>
  <p><strong>House from natal Moon after change:</strong> {ctx.house_from_moon}</p>
  {sani_cycle_line}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
  <h3>Suggested approach</h3>
  <p>{remedy_en}</p>
  <p style="color:#555">{remedy_ta}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:0.8rem;color:#9ca3af">
    Vinaadi AI · Thirukanitham-based guidance · This reading is traditionally associated with tendencies, not certainties.
  </p>
</body></html>
"""


def _body_text(ctx: PeyarchiEmailContext) -> str:
    planet_ta = _PLANET_TA.get(ctx.planet, ctx.planet)
    from_rasi_ta = _RASI_TA.get(ctx.from_rasi, ctx.from_rasi)
    to_rasi_ta = _RASI_TA.get(ctx.to_rasi, ctx.to_rasi)
    remedy_en, remedy_ta = _SANI_REMEDY.get(ctx.sani_cycle_after or "", (_DEFAULT_REMEDY_EN, _DEFAULT_REMEDY_TA))

    if ctx.tier == "day_of":
        intro = f"Today ({ctx.event_date_str}) is {ctx.planet.capitalize()} Peyarchi day."
    else:
        intro = f"{ctx.planet.capitalize()} Peyarchi is in {ctx.days_away} days ({ctx.event_date_str})."

    lines = [
        intro,
        f"{planet_ta}",
        "",
        f"Transition: {ctx.from_rasi} -> {ctx.to_rasi}",
        f"({from_rasi_ta} -> {to_rasi_ta})",
        f"House from natal Moon after change: {ctx.house_from_moon}",
    ]
    if ctx.sani_cycle_after:
        lines.append(f"Sani cycle after peyarchi: {ctx.sani_cycle_after.replace('_', ' ').title()}")
    lines += ["", "Suggested approach:", remedy_en, remedy_ta]
    return "\n".join(lines)


def send_peyarchi_notification(ctx: PeyarchiEmailContext) -> bool:
    """
    Send a peyarchi notification email.
    Uses shared SMTP delivery with retries and graceful stub mode.
    """
    settings = get_settings()
    if not all([settings.smtp_host, settings.smtp_user, settings.smtp_pass, settings.notification_from_email]):
        logger.info(
            "email_stub planet=%s tier=%s to=%s — SMTP not configured, skipping send",
            ctx.planet,
            ctx.tier,
            ctx.to_address,
        )
        return False

    message = EmailMessage(
        to_address=ctx.to_address,
        subject=_subject(ctx),
        body_text=_body_text(ctx),
        body_html=_body_html(ctx),
    )
    sent = send_email(message)
    if sent:
        logger.info("email_sent planet=%s tier=%s to=%s", ctx.planet, ctx.tier, ctx.to_address)
    else:
        logger.error("email_failed planet=%s tier=%s to=%s", ctx.planet, ctx.tier, ctx.to_address)
    return sent
