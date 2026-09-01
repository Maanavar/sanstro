"""Backend geocoding proxy.

Proxies geocoding requests to Nominatim (or a future paid provider) server-side,
satisfying Nominatim's policy of no direct client calls. Results are cached in
memory for 30 days — same place name always maps to the same coordinates.
"""
from __future__ import annotations

import logging
import time
from threading import Lock

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/geo", tags=["geo"])

_NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
_NOMINATIM_HEADERS = {"User-Agent": "VinaadiAI/1.0 (mobile@vinaadi.app)"}
_CACHE_TTL_SECONDS = 30 * 24 * 3600  # 30 days

# Simple in-memory cache: query → (result_dict, expiry_epoch)
_cache: dict[str, tuple[dict, float]] = {}
_cache_lock = Lock()

# US state code → IANA timezone (covers all 50 states + DC).
# Source: IANA tzdb / NIST — major TZ per state (border counties use primary TZ).
_US_STATE_TZ: dict[str, str] = {
    "AK": "America/Anchorage",
    "HI": "Pacific/Honolulu",
    "WA": "America/Los_Angeles",
    "OR": "America/Los_Angeles",
    "CA": "America/Los_Angeles",
    "NV": "America/Los_Angeles",
    "ID": "America/Boise",
    "MT": "America/Denver",
    "WY": "America/Denver",
    "UT": "America/Denver",
    "CO": "America/Denver",
    "AZ": "America/Phoenix",
    "NM": "America/Denver",
    "ND": "America/Chicago",
    "SD": "America/Chicago",
    "NE": "America/Chicago",
    "KS": "America/Chicago",
    "MN": "America/Chicago",
    "IA": "America/Chicago",
    "MO": "America/Chicago",
    "WI": "America/Chicago",
    "IL": "America/Chicago",
    "MI": "America/Detroit",
    "IN": "America/Indiana/Indianapolis",
    "OH": "America/New_York",
    "KY": "America/New_York",
    "TN": "America/Chicago",
    "MS": "America/Chicago",
    "AL": "America/Chicago",
    "GA": "America/New_York",
    "FL": "America/New_York",
    "SC": "America/New_York",
    "NC": "America/New_York",
    "VA": "America/New_York",
    "WV": "America/New_York",
    "PA": "America/New_York",
    "NY": "America/New_York",
    "NJ": "America/New_York",
    "DE": "America/New_York",
    "MD": "America/New_York",
    "DC": "America/New_York",
    "CT": "America/New_York",
    "RI": "America/New_York",
    "MA": "America/New_York",
    "VT": "America/New_York",
    "NH": "America/New_York",
    "ME": "America/New_York",
    "TX": "America/Chicago",
    "OK": "America/Chicago",
    "AR": "America/Chicago",
    "LA": "America/Chicago",
}

# Single-timezone country defaults
_COUNTRY_DEFAULT_TZ: dict[str, str] = {
    "in": "Asia/Kolkata",
    "gb": "Europe/London",
    "sg": "Asia/Singapore",
    "my": "Asia/Kuala_Lumpur",
    "au": "Australia/Sydney",
    "ca": "America/Toronto",
    "de": "Europe/Berlin",
    "fr": "Europe/Paris",
    "ae": "Asia/Dubai",
    "qa": "Asia/Qatar",
    "sa": "Asia/Riyadh",
    "nz": "Pacific/Auckland",
    "lk": "Asia/Colombo",
    "za": "Africa/Johannesburg",
    "jp": "Asia/Tokyo",
    "ch": "Europe/Zurich",
    "nl": "Europe/Amsterdam",
    "be": "Europe/Brussels",
    "it": "Europe/Rome",
    "se": "Europe/Stockholm",
    "no": "Europe/Oslo",
    "dk": "Europe/Copenhagen",
}


def _resolve_timezone(country_code: str, address: dict) -> str:
    """Return the IANA timezone string for a geocoded result."""
    cc = country_code.lower()
    if cc == "us":
        iso = address.get("ISO3166-2-lvl4") or ""
        state_code = iso.removeprefix("US-")
        return _US_STATE_TZ.get(state_code, "America/New_York")
    return _COUNTRY_DEFAULT_TZ.get(cc, "Asia/Kolkata")


class GeocodeRequest(BaseModel):
    query: str


class GeocodeResponse(BaseModel):
    lat: float | None = None
    lon: float | None = None
    countryCode: str | None = None
    timezone: str | None = None
    error: str | None = None  # "not_found" | "network"


def _cache_get(key: str) -> dict | None:
    with _cache_lock:
        entry = _cache.get(key)
        if entry and entry[1] > time.time():
            return entry[0]
        if entry:
            del _cache[key]
    return None


def _cache_set(key: str, value: dict) -> None:
    with _cache_lock:
        _cache[key] = (value, time.time() + _CACHE_TTL_SECONDS)


@router.post(
    "/geocode",
    response_model=GeocodeResponse,
    summary="Geocode a place name (server-side Nominatim proxy with cache)",
)
def geocode_place(req: GeocodeRequest) -> GeocodeResponse:
    """Geocode a place name to lat/lon/countryCode.

    Calls Nominatim server-side and caches results for 30 days.
    No authentication required — used during onboarding before sign-in.
    """
    query = req.query.strip()
    if not query:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="query must not be empty")

    cache_key = query.lower()
    cached = _cache_get(cache_key)
    if cached is not None:
        return GeocodeResponse(**cached)

    try:
        resp = httpx.get(
            _NOMINATIM_URL,
            params={"q": query, "format": "json", "limit": 1, "addressdetails": 1},
            headers=_NOMINATIM_HEADERS,
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        # No `query=`: see geocode_ok below. The exception type and the length
        # are what you need to tell a timeout from a malformed request, and
        # neither identifies anybody.
        logger.warning(
            "geocode_network_error query_len=%d exc=%s", len(query), type(exc).__name__
        )
        logger.debug("geocode_network_error_detail query=%r exc=%s", query, exc)
        return GeocodeResponse(error="network")

    if not data:
        result = {"lat": None, "lon": None, "countryCode": None, "error": "not_found"}
        _cache_set(cache_key, result)
        return GeocodeResponse(**result)

    item = data[0]
    address: dict = item.get("address") or {}
    country_code: str = address.get("country_code") or "in"
    timezone_str = _resolve_timezone(country_code, address)
    result = {
        "lat": float(item["lat"]),
        "lon": float(item["lon"]),
        "countryCode": country_code,
        "timezone": timezone_str,
        "error": None,
    }
    _cache_set(cache_key, result)
    # Deliberately no query text and no coordinates.
    #
    # A geocode here is somebody typing where they were born. The query is a
    # place name they have a personal connection to, and lat/lon at 4 decimal
    # places is about 11 metres — together that is personal data, and logging it
    # at INFO on every successful lookup ships it into log aggregation, whatever
    # retention that has, and everyone with read access to it.
    #
    # What is left is what operations actually needs: did it resolve, how many
    # results, which country, which timezone. The identifying half is available
    # at DEBUG for a developer reproducing a specific bad lookup, and DEBUG is
    # off in production.
    logger.info(
        "geocode_ok results=%d country=%s tz=%s", len(data), country_code, timezone_str
    )
    logger.debug(
        "geocode_ok_detail query=%r lat=%.4f lon=%.4f", query, result["lat"], result["lon"]
    )
    return GeocodeResponse(**result)
