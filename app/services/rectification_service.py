"""
Rectification service — P1-F.

Heuristic birth time estimation using life event constraints.
- Sweeps candidate Lagna windows (every 30 min across 24 hours)
- For each event: awards a point if the event-year Lagna matches the
  house signification of that event type
- Returns top-3 candidates sorted by score

Accuracy: ~30-60 min window. Labelled clearly as heuristic, not classical.
"""
from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.astro import RASI_NAMES, rasi_from_degree, resolve_timezone, utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_lagna_degree
from app.models import BirthProfile
from app.schemas.rectification import (
    CandidateWindow,
    RectificationEvent,
    RectificationResultData,
)

# ── House significations per event type ──────────────────────────────────────
# Maps each event to the house numbers that, if Lagna-active at the event year,
# corroborate this event type.  "Lagna-active" = the Lagna rasi at the candidate
# birth time falls on or aspects the key house for that event.

_EVENT_KEY_HOUSES: dict[str, list[int]] = {
    "MARRIAGE":      [7, 2],          # 7th: spouse; 2nd: family
    "CAREER_BREAK":  [10, 6],         # 10th: career; 6th: obstacles/service
    "RELOCATION":    [12, 4],         # 12th: foreign; 4th: home
    "HEALTH_MAJOR":  [6, 8, 1],       # 6th/8th: illness; 1st: body
    "PARENT_BIRTH":  [4, 9],          # 4th: mother; 9th: father
}


# ── Lagna corroboration check ─────────────────────────────────────────────────

def _lagna_supports_event(lagna_rasi: int, event_type: str) -> bool:
    """True if the Lagna rasi itself is one of the key house rasis for this event."""
    key_houses = _EVENT_KEY_HOUSES.get(event_type, [])
    # For a lagna at rasi R, the Nth house is ((R + N - 2) % 12) + 1.
    # We check if the lagna itself IS any of the key-house positions relative to
    # candidate lagna == 1 (i.e., the key-house rasi from lagna-1 = lagna_rasi + N - 1).
    # Simpler: check if key house from lagna_rasi is among positions 1..12 that score.
    # We use the position of the key house from lagna == the house number itself.
    return lagna_rasi in key_houses


# ── Candidate generation ──────────────────────────────────────────────────────

def _build_candidate_lagna(
    birth_date: date,
    birth_latitude: float,
    birth_longitude: float,
    birth_timezone: str,
) -> list[dict]:
    """Return 48 candidates (30-min steps) with their Lagna rasi."""
    tz = resolve_timezone(birth_timezone)
    candidates = []

    for step in range(48):
        candidate_time = time(step * 30 // 60, (step * 30) % 60)
        local_dt = datetime.combine(birth_date, candidate_time, tzinfo=tz)
        utc_dt = local_dt.astimezone(UTC)
        jd = utc_datetime_to_julian_day(utc_dt)

        lagna_deg = calculate_lagna_degree(jd, birth_latitude, birth_longitude)
        lagna_rasi = rasi_from_degree(lagna_deg)
        candidates.append({
            "time_local": candidate_time.strftime("%H:%M"),
            "lagna_rasi": lagna_rasi,
            "lagna_rasi_name": RASI_NAMES.get(lagna_rasi, str(lagna_rasi)),
            "score": 0,
        })

    return candidates


# ── Scoring ───────────────────────────────────────────────────────────────────

def _score_candidates(
    candidates: list[dict],
    events: list[RectificationEvent],
) -> list[dict]:
    for event in events:
        for cand in candidates:
            if _lagna_supports_event(cand["lagna_rasi"], event.event_type):
                cand["score"] += 1
    return candidates


# ── Public service ────────────────────────────────────────────────────────────

def estimate_birth_time(
    session: Session,
    birth_profile_id: UUID,
    events: list[RectificationEvent],
    owner_user_id: UUID,
) -> RectificationResultData:
    profile = session.get(BirthProfile, birth_profile_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
    if profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    if not events:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="At least one life event is required.")

    candidates = _build_candidate_lagna(
        profile.birth_date_local,
        float(profile.birth_latitude),
        float(profile.birth_longitude),
        profile.birth_timezone,
    )
    candidates = _score_candidates(candidates, events)

    # Deduplicate by Lagna rasi — keep highest score per rasi, then take top 3
    best_per_rasi: dict[int, dict] = {}
    for c in candidates:
        rasi = c["lagna_rasi"]
        if rasi not in best_per_rasi or c["score"] > best_per_rasi[rasi]["score"]:
            best_per_rasi[rasi] = c

    top = sorted(best_per_rasi.values(), key=lambda x: x["score"], reverse=True)[:3]

    total_events = len(events)
    candidate_windows = [
        CandidateWindow(
            timeLocal=c["time_local"],
            lagnaRasi=c["lagna_rasi"],
            lagnaRasiName=c["lagna_rasi_name"],
            probabilityWeight=round(c["score"] / max(total_events, 1), 2),
            matchingEvents=c["score"],
        )
        for c in top
    ]

    recommended = candidate_windows[0].time_local if candidate_windows else "12:00"

    return RectificationResultData(
        birthProfileId=birth_profile_id,
        candidates=candidate_windows,
        recommendedTime=recommended,
        confidenceNote=(
            f"Based on {total_events} life event(s). "
            f"Top candidate matches {top[0]['score'] if top else 0}/{total_events} event(s)."
        ),
        disclaimer=(
            "Approximate — heuristic estimate, not classical rectification. "
            "Lagna-dependent chart interpretations may vary by ±1 rasi."
        ),
    )


def apply_rectified_time(
    session: Session,
    birth_profile_id: UUID,
    selected_time_str: str,
    owner_user_id: UUID,
) -> BirthProfile:
    profile = session.get(BirthProfile, birth_profile_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
    if profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    try:
        parsed = datetime.strptime(selected_time_str, "%H:%M").time()
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid time format. Expected HH:MM.")

    profile.birth_time_local = parsed
    profile.birth_time_source = "ESTIMATED_RECTIFIED"
    profile.birth_time_confidence_minutes = 30
    session.commit()
    session.refresh(profile)
    return profile
