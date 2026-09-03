"""Public statistics endpoints — no authentication required."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.cache import get_cache
from app.db.session import get_db
from app.models.birth_profile import BirthProfile

router = APIRouter(prefix="/stats", tags=["stats"])

_STATS_TTL = 3600  # 1 hour


@router.get("/public")
def public_stats(session: Session = Depends(get_db)) -> dict:
    """Return platform-wide public statistics.

    Cached for 1 hour. Used by the landing page social-proof block (E-02).
    """
    cache = get_cache()

    def _compute() -> dict:
        count = session.execute(
            select(func.count()).select_from(BirthProfile).where(BirthProfile.deleted_at.is_(None))
        ).scalar_one()
        return {"charts_generated": count}

    return cache.get_or_compute("stats:public", _compute, _STATS_TTL)
