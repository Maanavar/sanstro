"""Public numerology endpoint tests (NUM-24)."""
from __future__ import annotations

from collections.abc import Iterator
from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.core.rate_limit import reset_rate_limit_backend
from app.main import app
from app.services.feature_flags import reset_flag, set_flag

pytestmark = pytest.mark.no_db

PROFILE_URL = "/api/v1/public/numerology/profile"
NUMBER_URL = "/api/v1/public/numerology/number"
PERSONAL_YEAR_URL = "/api/v1/public/numerology/personal-year"


@pytest.fixture
def enabled() -> Iterator[None]:
    reset_rate_limit_backend()
    set_flag("numerology_engine", True)
    try:
        yield
    finally:
        reset_flag("numerology_engine")
        reset_rate_limit_backend()


def test_endpoints_404_while_the_flag_is_off() -> None:
    """Default state. A not-yet-launched feature should not advertise itself."""
    reset_rate_limit_backend()
    with TestClient(app, raise_server_exceptions=False) as client:
        profile = client.post(PROFILE_URL, json={"birthDate": "1990-05-17"})
        number = client.post(NUMBER_URL, json={"value": "12A", "kind": "house"})
        personal_year = client.post(
            PERSONAL_YEAR_URL, json={"birthDate": "1990-05-17", "onDate": "2026-07-27"}
        )
    assert profile.status_code == 404
    assert number.status_code == 404
    assert personal_year.status_code == 404


def test_profile_returns_the_four_numbers(enabled: None) -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            PROFILE_URL,
            json={"birthDate": "1990-05-17", "documentName": "Zoro", "calledName": "Test"},
        )
    assert response.status_code == 200
    body = response.json()

    # Hand-computed: day 17 -> 8 (Saturn); date digits 32 -> 5 (Mercury).
    assert body["psychic"]["root"] == 8
    assert body["psychic"]["graha"] == "SATURN"
    assert body["destiny"]["total"] == 32
    assert body["destiny"]["root"] == 5
    # Z=7 O=7 R=2 O=7 -> 23 ; T=4 E=5 S=3 T=4 -> 16
    assert body["name"]["total"] == 23
    assert body["namesake"]["total"] == 16


def test_response_says_which_string_it_scored(enabled: None) -> None:
    """Doctrine D3 — a name reading that omits its input cannot be acted on."""
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            PROFILE_URL, json={"birthDate": "1990-05-17", "documentName": "Zoro"}
        )
    body = response.json()
    assert body["scoredName"] == "Zoro"
    assert body["scoredNamesake"] is None
    assert body["namesake"] is None


def test_compound_is_exposed_not_collapsed(enabled: None) -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            PROFILE_URL, json={"birthDate": "1990-05-17", "documentName": "Zoro"}
        )
    name = response.json()["name"]
    assert name["compound"] == 23
    assert name["root"] == 5
    assert name["reductionChain"] == [23, 5]


def test_tradition_is_declared_on_every_response(enabled: None) -> None:
    """Plan §9.5 — the system must be named in the UI."""
    with TestClient(app, raise_server_exceptions=False) as client:
        profile = client.post(PROFILE_URL, json={"birthDate": "1990-05-17"}).json()
        number = client.post(NUMBER_URL, json={"value": "12A", "kind": "house"}).json()
    for body in (profile, number):
        assert "Chaldean" in body["traditionEn"]
        assert body["traditionTa"]


def test_non_latin_name_is_refused_with_422(enabled: None) -> None:
    """Silently skipping Tamil letters would return a confident wrong number."""
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            PROFILE_URL, json={"birthDate": "1990-05-17", "documentName": "தீபா"}
        )
    assert response.status_code == 422
    assert "Latin" in response.json()["detail"]


def test_future_birth_date_is_rejected(enabled: None) -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(PROFILE_URL, json={"birthDate": "2099-01-01"})
    assert response.status_code == 422


def test_mobile_number_returns_a_tail_reading(enabled: None) -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            NUMBER_URL, json={"value": "98765 43210", "kind": "mobile"}
        )
    assert response.status_code == 200
    body = response.json()
    assert body["scored"] == "9876543210"
    assert body["reading"]["total"] == 45
    assert body["reading"]["root"] == 9
    assert body["secondaryLabel"] == "last 4"
    assert body["secondary"]["total"] == 6


def test_vehicle_plate_scores_letters_and_digits(enabled: None) -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            NUMBER_URL, json={"value": "TN09BX4512", "kind": "vehicle"}
        )
    body = response.json()
    assert body["reading"]["total"] == 37
    assert body["reading"]["root"] == 1
    assert body["secondary"] is None


def test_unknown_object_kind_is_rejected(enabled: None) -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(NUMBER_URL, json={"value": "12", "kind": "pet"})
    assert response.status_code == 422


def test_unscoreable_value_is_rejected(enabled: None) -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(NUMBER_URL, json={"value": "----", "kind": "house"})
    assert response.status_code == 422


# ── Personal year (Phase 4, public) ──────────────────────────────────────────
def test_personal_year_returns_the_cycle_and_its_window(enabled: None) -> None:
    """Hand-computed: born 17 May 1990, read on 27 Jul 2026, birthday epoch.

    Year: digits of 17 + 5 + 2026 = 8 + 5 + 10 = 23 -> root 5 (Budhan).
    Month: 5 + 7 = 12 -> root 3. Day: 3 + 27 = 30 -> root 3.
    """
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            PERSONAL_YEAR_URL, json={"birthDate": "1990-05-17", "onDate": "2026-07-27"}
        )
    assert response.status_code == 200
    body = response.json()

    assert body["year"]["reading"]["total"] == 23
    assert body["year"]["reading"]["compound"] == 23
    assert body["year"]["reading"]["root"] == 5
    assert body["year"]["reading"]["graha"] == "MERCURY"
    assert body["year"]["epoch"] == "birthday"
    assert body["year"]["governingYear"] == 2026
    # The window is part of the answer: the same date reads differently under a
    # different epoch, so a number without its boundaries cannot be checked.
    assert body["year"]["cycleStart"] == "2026-05-17"
    assert body["year"]["cycleEnd"] == "2027-05-16"
    assert body["month"]["total"] == 12
    assert body["month"]["root"] == 3
    assert body["day"]["total"] == 30
    assert body["day"]["root"] == 3


def test_personal_year_epoch_flag_changes_the_number_not_just_the_label(
    enabled: None,
) -> None:
    """Doctrine D1 is a real fork, not cosmetics.

    Read on 1 March 2026 — before the 17 May birthday — the birthday epoch is
    still in the 2025 year (root 4) while the calendar epoch has already rolled
    into 2026 (root 5). If this ever returns the same number under both, the
    flag has stopped being wired to the engine.
    """
    payload = {"birthDate": "1990-05-17", "onDate": "2026-03-01"}
    with TestClient(app, raise_server_exceptions=False) as client:
        birthday = client.post(PERSONAL_YEAR_URL, json=payload).json()
        set_flag("numerology_personal_year_epoch", "january")
        try:
            january = client.post(PERSONAL_YEAR_URL, json=payload).json()
        finally:
            reset_flag("numerology_personal_year_epoch")

    assert birthday["year"]["governingYear"] == 2025
    assert birthday["year"]["reading"]["root"] == 4
    assert birthday["year"]["cycleStart"] == "2025-05-17"

    assert january["year"]["governingYear"] == 2026
    assert january["year"]["reading"]["root"] == 5
    assert january["year"]["cycleStart"] == "2026-01-01"
    assert january["year"]["cycleEnd"] == "2026-12-31"


def test_personal_year_ships_numbers_only(enabled: None) -> None:
    """Same 'no prose' rule Phase 2 ships under.

    The Phase 4 engine can produce notes; none has had a Tamil native review, so
    this response carries arithmetic, graha names and the tradition line only.
    """
    with TestClient(app, raise_server_exceptions=False) as client:
        body = client.post(
            PERSONAL_YEAR_URL, json={"birthDate": "1990-05-17", "onDate": "2026-07-27"}
        ).json()
    assert set(body) == {"onDate", "year", "month", "day", "traditionEn", "traditionTa"}
    assert "Chaldean" in body["traditionEn"]


def test_personal_year_defaults_to_today(enabled: None) -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(PERSONAL_YEAR_URL, json={"birthDate": "1990-05-17"})
    assert response.status_code == 200
    assert response.json()["onDate"] == date.today().isoformat()


def test_personal_year_rejects_a_future_birth_date(enabled: None) -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(PERSONAL_YEAR_URL, json={"birthDate": "2099-01-01"})
    assert response.status_code == 422
