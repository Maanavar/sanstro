"""Geocoding must not write birthplaces or coordinates into the logs (P1-3).

`geocode_ok` fired at INFO on every successful lookup with the raw user-typed
query and lat/lon to 4 decimal places — about 11 metres. A geocode here is
somebody typing where they were born: the query is a place they have a personal
connection to, and the pair together is personal data. At INFO it goes into log
aggregation, whatever retention that has, and everyone with read access.

The test greps the emitted records for the query text and for a coordinate,
which is the check the way an auditor would run it — rather than asserting the
current format string, which would pass just as happily if someone reintroduced
the data under a different key.
"""
from __future__ import annotations

import logging

import pytest

from app.api import geo as geo_module

pytestmark = pytest.mark.no_db

# Deliberately synthetic: a place name distinctive enough that a substring match
# cannot pass by accident, and one nobody was born in.
QUERY = "Zzyzx Hollow, Farnsworth Province"
LAT = 12.3456
LON = 77.6543


class _FakeResponse:
    def raise_for_status(self) -> None:
        return None

    @staticmethod
    def json():
        return [
            {
                "lat": str(LAT),
                "lon": str(LON),
                "address": {"country_code": "in", "state": "Tamil Nadu"},
            }
        ]


@pytest.fixture(autouse=True)
def _clear_geocode_cache():
    geo_module._cache.clear()
    yield
    geo_module._cache.clear()


def _emitted(caplog) -> str:
    return "\n".join(r.getMessage() for r in caplog.records)


def test_successful_geocode_logs_neither_the_query_nor_the_coordinates(
    monkeypatch, caplog
):
    monkeypatch.setattr(geo_module.httpx, "get", lambda *a, **k: _FakeResponse())

    with caplog.at_level(logging.INFO, logger="app.api.geo"):
        result = geo_module.geocode_place(geo_module.GeocodeRequest(query=QUERY))

    assert result.lat == LAT  # the caller still gets the answer
    emitted = _emitted(caplog)
    assert emitted, "the lookup logged nothing at all — operations needs something"
    assert QUERY not in emitted
    assert "Zzyzx" not in emitted
    assert "12.345" not in emitted
    assert "77.654" not in emitted


def test_it_still_logs_what_operations_actually_needs(monkeypatch, caplog):
    monkeypatch.setattr(geo_module.httpx, "get", lambda *a, **k: _FakeResponse())

    with caplog.at_level(logging.INFO, logger="app.api.geo"):
        geo_module.geocode_place(geo_module.GeocodeRequest(query=QUERY))

    emitted = _emitted(caplog)
    assert "geocode_ok" in emitted
    assert "country=in" in emitted
    assert "results=1" in emitted
    assert "tz=" in emitted


def test_network_failure_does_not_log_the_query_either(monkeypatch, caplog):
    def _boom(*_a, **_k):
        raise TimeoutError("upstream timed out")

    monkeypatch.setattr(geo_module.httpx, "get", _boom)

    with caplog.at_level(logging.INFO, logger="app.api.geo"):
        result = geo_module.geocode_place(geo_module.GeocodeRequest(query=QUERY))

    assert result.error == "network"
    emitted = _emitted(caplog)
    assert QUERY not in emitted
    assert "Zzyzx" not in emitted
    # The failure is still diagnosable: what broke, and roughly what was asked.
    assert "geocode_network_error" in emitted
    assert "TimeoutError" in emitted


def test_the_identifying_detail_is_available_at_debug(monkeypatch, caplog):
    """Not a privacy hole — a developer reproducing one bad lookup needs it, and
    DEBUG is off in production. Pinned so the DEBUG line is not later 'tidied'
    back up to INFO."""
    monkeypatch.setattr(geo_module.httpx, "get", lambda *a, **k: _FakeResponse())

    with caplog.at_level(logging.DEBUG, logger="app.api.geo"):
        geo_module.geocode_place(geo_module.GeocodeRequest(query=QUERY))

    debug_only = "\n".join(
        r.getMessage() for r in caplog.records if r.levelno == logging.DEBUG
    )
    assert QUERY in debug_only
    assert "12.3456" in debug_only
