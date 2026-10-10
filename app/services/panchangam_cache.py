"""Read-through cache for panchangam snapshots (A13).

The calculation (`app.calculations.panchangam.compute_daily_panchangam`) is
pure: date, place and timezone in, snapshot out. This module owns everything
that touches the database around it — the `panchangam_cache` table, its TTL,
the expired-row purge — and exposes the session-taking entry points callers
have always used, with unchanged signatures and behaviour:

* ``calculate_daily_panchangam(..., session=None, use_cache=True)``
* ``calculate_daily_panchangam_range(..., session=None, only=None)``
* ``with_daylight_lagna_schedule(snapshot, *, session=None)``

Without a session each one is exactly the pure computation.

Invalidation is unchanged too: bump ``PANCHANGAM_CACHE_DATA_VERSION`` (it lives
with the snapshot serializer in the calculation module, since it versions the
serialized shape); rows written under another version are ignored and
overwritten. Never ``DELETE`` by hand.
"""
from __future__ import annotations

import logging
from collections.abc import Collection
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.calculations.ephemeris import RiseTransitUndefinedError
from app.calculations.panchangam import (
    DEFAULT_AYANAMSA_TYPE,
    PANCHANGAM_CACHE_DATA_VERSION,
    PanchangamSnapshot,
    _deserialize_snapshot,
    _serialize_snapshot,
    attach_daylight_lagna_schedule,
    compute_daily_panchangam,
    compute_daily_panchangam_range,
    date_range,
)
from app.models.panchangam_cache import PanchangamCache

logger = logging.getLogger(__name__)

PANCHANGAM_CACHE_TTL_HOURS = 24


def _load_cached_snapshot(
    session: Session,
    date_local: date,
    latitude: float,
    longitude: float,
    ayanamsa_type: str,
) -> PanchangamSnapshot | None:
    row = session.execute(
        select(PanchangamCache).where(
            PanchangamCache.cache_date == date_local,
            PanchangamCache.latitude == round(latitude, 6),
            PanchangamCache.longitude == round(longitude, 6),
            PanchangamCache.ayanamsa_type == ayanamsa_type,
        )
    ).scalar_one_or_none()
    if row is None:
        return None
    if row.created_at < datetime.now(tz=UTC) - timedelta(hours=PANCHANGAM_CACHE_TTL_HOURS):
        return None
    if int(row.data.get("schema_version", 1)) != PANCHANGAM_CACHE_DATA_VERSION:
        return None
    return _deserialize_snapshot(row.data)


def _load_cached_snapshots_in_range(
    session: Session,
    start_date: date,
    end_date: date,
    latitude: float,
    longitude: float,
    ayanamsa_type: str,
) -> dict[date, PanchangamSnapshot]:
    rows = session.execute(
        select(PanchangamCache).where(
            PanchangamCache.cache_date >= start_date,
            PanchangamCache.cache_date <= end_date,
            PanchangamCache.latitude == round(latitude, 6),
            PanchangamCache.longitude == round(longitude, 6),
            PanchangamCache.ayanamsa_type == ayanamsa_type,
        )
    ).scalars()

    snapshots: dict[date, PanchangamSnapshot] = {}
    cutoff = datetime.now(tz=UTC) - timedelta(hours=PANCHANGAM_CACHE_TTL_HOURS)
    for row in rows:
        if row.created_at < cutoff:
            continue
        if int(row.data.get("schema_version", 1)) != PANCHANGAM_CACHE_DATA_VERSION:
            continue
        snapshots[row.cache_date] = _deserialize_snapshot(row.data)
    return snapshots


def purge_expired_panchangam_cache(session: Session) -> int:
    result = session.execute(
        delete(PanchangamCache).where(PanchangamCache.expires_at < datetime.now(tz=UTC))
    )
    # Avoid committing here: this helper is called from read paths and should not
    # flush or commit unrelated pending ORM changes in the caller's session.
    return int(result.rowcount or 0)


def _store_cached_snapshot(
    session: Session,
    snapshot: PanchangamSnapshot,
    ayanamsa_type: str,
) -> None:
    latitude = round(snapshot.latitude, 6)
    longitude = round(snapshot.longitude, 6)
    payload = _serialize_snapshot(snapshot)
    session.execute(
        pg_insert(PanchangamCache)
        .values(
            cache_date=snapshot.date_local,
            latitude=latitude,
            longitude=longitude,
            ayanamsa_type=ayanamsa_type,
            data=payload,
        )
        .on_conflict_do_update(
            constraint="uq_panchangam_cache_key",
            set_={
                "data": payload,
                "created_at": datetime.now(tz=UTC),
                "expires_at": datetime.now(tz=UTC) + timedelta(days=90),
            },
        )
    )


def calculate_daily_panchangam(
    date_local: date,
    latitude: float,
    longitude: float,
    timezone_name: str,
    *,
    session: Session | None = None,
    use_cache: bool = True,
) -> PanchangamSnapshot:
    if use_cache and session is not None:
        try:
            purge_expired_panchangam_cache(session)
            cached = _load_cached_snapshot(session, date_local, latitude, longitude, DEFAULT_AYANAMSA_TYPE)
            if cached is not None:
                return cached
        except Exception as exc:
            logger.warning(f"Panchangam cache read/purge failed; falling back to computation: {exc}")
            use_cache = False

    snapshot = compute_daily_panchangam(date_local, latitude, longitude, timezone_name)

    if use_cache and session is not None:
        try:
            _store_cached_snapshot(session, snapshot, DEFAULT_AYANAMSA_TYPE)
        except Exception as exc:
            logger.warning(f"Failed to store panchangam cache for {date_local}: {exc}")
    return snapshot


def calculate_daily_panchangam_range(
    start_date: date,
    end_date: date,
    latitude: float,
    longitude: float,
    timezone_name: str,
    *,
    session: Session | None = None,
    only: Collection[date] | None = None,
) -> dict[date, PanchangamSnapshot]:
    """Compute panchangam snapshots for a date range with batched cache I/O.

    Replaces the per-day SELECT + DELETE that ``calculate_daily_panchangam``
    performs when called in a loop (e.g. for a monthly calendar) with a single
    bulk SELECT covering the whole range and a single purge call. Cache misses
    fall back to the regular per-day computation, which also stores its result.

    ``only`` restricts computation to the dates a caller actually needs, while
    the cache SELECT still covers the whole range in one query. A caller with
    SPARSE dates must pass it: the curated muhurtham sheet is ~55 dates spread
    across a year, and filling the contiguous range between them computed ~360
    days to answer about 55. That is invisible on a warm cache and a wall on a
    cold one — a panchangam day costs ~600 ms, so the muhurtham-naals endpoint
    spent ~220 s and returned 502 at the proxy's 300 s limit the first time it
    was asked for a year whose snapshots had been invalidated (2026-09-09, by a
    cache-version bump). Dates outside the range are ignored, not fetched.
    """
    # A polar-latitude range can contain some days with no sunrise/sunset. Those
    # days are simply omitted from the result (the monthly grid skips them) rather
    # than failing the whole range — the caller iterates whatever days came back.
    if session is None:
        return compute_daily_panchangam_range(
            start_date, end_date, latitude, longitude, timezone_name, only=only,
        )

    wanted = None if only is None else set(only)
    try:
        purge_expired_panchangam_cache(session)
        cached = _load_cached_snapshots_in_range(
            session, start_date, end_date, latitude, longitude, DEFAULT_AYANAMSA_TYPE,
        )
    except Exception as exc:
        logger.warning(f"Panchangam cache read/purge failed for range; computing all: {exc}")
        cached = {}

    snapshots: dict[date, PanchangamSnapshot] = {}
    for current in date_range(start_date, end_date):
        if wanted is not None and current not in wanted:
            continue
        existing = cached.get(current)
        if existing is not None:
            snapshots[current] = existing
            continue
        try:
            computed = compute_daily_panchangam(current, latitude, longitude, timezone_name)
        except RiseTransitUndefinedError:
            logger.info("Skipping %s: no sunrise/sunset at this location (polar day/night)", current)
            continue
        try:
            _store_cached_snapshot(session, computed, DEFAULT_AYANAMSA_TYPE)
        except Exception as exc:
            logger.warning(f"Failed to store panchangam cache for {current}: {exc}")
        snapshots[current] = computed
    return snapshots


def with_daylight_lagna_schedule(
    snapshot: PanchangamSnapshot,
    *,
    session: Session | None = None,
) -> PanchangamSnapshot:
    """Attach and persist the lazily calculated daylight lagna schedule."""
    if snapshot.lagna_schedule:
        return snapshot
    enriched = attach_daylight_lagna_schedule(snapshot)
    if session is not None:
        try:
            _store_cached_snapshot(session, enriched, DEFAULT_AYANAMSA_TYPE)
        except Exception as exc:
            logger.warning("Failed to cache lagna schedule for %s: %s", snapshot.date_local, exc)
    return enriched
