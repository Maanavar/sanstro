"""Offline birthplace search — bundled GeoNames data, no third-party call.

Owner ruling 2026-08-24 (B-006): birthplace lookup must default to a bundled
dataset, not a per-query geocoder. `app/api/geo.py`'s Nominatim proxy stays as
the explicit, opt-in fallback for a place this endpoint doesn't find — never
the default path. See `scripts/ingest_places.py` for how `places` is
populated and its current scope (Tamil Nadu only as of 2026-08-24).
"""
from __future__ import annotations

import unicodedata

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.public_endpoint_limiter import public_endpoint_rate_limit
from app.db.session import get_db
from app.models.place import Place

router = APIRouter(prefix="/places", tags=["places"])

_MIN_QUERY_LENGTH = 2
_DEFAULT_LIMIT = 20
_MAX_LIMIT = 50


class PlaceResult(BaseModel):
    geonameId: int
    name: str
    admin1Name: str | None
    countryCode: str
    countryName: str
    lat: float
    lng: float
    timezone: str


class PlaceSearchResponse(BaseModel):
    success: bool = True
    data: list[PlaceResult]


def _search_key(query: str) -> str:
    """Same fold used at ingestion time — see scripts/ingest_places.py."""
    folded = unicodedata.normalize("NFKD", query).encode("ascii", "ignore").decode("ascii")
    return folded.lower().strip()


@router.get("/search", response_model=PlaceSearchResponse, summary="Search bundled offline place data")
@public_endpoint_rate_limit("places_search")
def search_places(
    q: str,
    request: Request,
    limit: int = _DEFAULT_LIMIT,
    session: Session = Depends(get_db),
) -> PlaceSearchResponse:
    """Prefix-search the bundled places table. No authentication required —
    used during onboarding, before sign-in.

    Below `_MIN_QUERY_LENGTH` this returns no results rather than the whole
    table, so a caller doesn't need its own client-side length guard.
    """
    key = _search_key(q)
    if len(key) < _MIN_QUERY_LENGTH:
        return PlaceSearchResponse(data=[])

    capped_limit = max(1, min(limit, _MAX_LIMIT))
    stmt = (
        select(Place)
        .where(Place.search_key.like(f"{key}%"))
        .order_by(Place.population.desc())
        .limit(capped_limit)
    )
    rows = session.execute(stmt).scalars().all()
    return PlaceSearchResponse(
        data=[
            PlaceResult(
                geonameId=row.geoname_id,
                name=row.name,
                admin1Name=row.admin1_name,
                countryCode=row.country_code,
                countryName=row.country_name,
                lat=float(row.latitude),
                lng=float(row.longitude),
                timezone=row.timezone,
            )
            for row in rows
        ],
    )
