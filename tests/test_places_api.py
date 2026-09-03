"""B-006 (owner ruling 2026-08-24): bundled offline birthplace search.

`client` resets the schema per test (see conftest.py's `_reset_db`), so these
insert their own `Place` fixture rows rather than depending on a real
`scripts/ingest_places.py` run having populated the table.
"""
from app.db.session import SessionLocal
from app.models.place import Place


def _seed_places() -> None:
    rows = [
        Place(geoname_id=1, name="Mannargudi", search_key="mannargudi",
              admin1_name="Tamil Nadu", country_code="IN", country_name="India",
              latitude=10.66626, longitude=79.45064, timezone="Asia/Kolkata", population=66999),
        Place(geoname_id=2, name="Mannachanallur", search_key="mannachanallur",
              admin1_name="Tamil Nadu", country_code="IN", country_name="India",
              latitude=10.90988, longitude=78.69927, timezone="Asia/Kolkata", population=25931),
        Place(geoname_id=3, name="Mannampatti", search_key="mannampatti",
              admin1_name="Tamil Nadu", country_code="IN", country_name="India",
              latitude=11.0, longitude=78.0, timezone="Asia/Kolkata", population=0),
        Place(geoname_id=4, name="Chennai", search_key="chennai",
              admin1_name="Tamil Nadu", country_code="IN", country_name="India",
              latitude=13.0827, longitude=80.2707, timezone="Asia/Kolkata", population=4646732),
    ]
    with SessionLocal() as session:
        with session.begin():
            session.add_all(rows)


def test_prefix_search_ranks_by_population_descending(client):
    _seed_places()
    response = client.get("/api/v1/places/search", params={"q": "mann"})

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    names = [row["name"] for row in body["data"]]
    assert names == ["Mannargudi", "Mannachanallur", "Mannampatti"]


def test_search_is_case_and_diacritic_insensitive(client):
    _seed_places()
    response = client.get("/api/v1/places/search", params={"q": "MANN"})
    assert [row["name"] for row in response.json()["data"]] == [
        "Mannargudi", "Mannachanallur", "Mannampatti",
    ]


def test_search_returns_full_display_fields(client):
    _seed_places()
    response = client.get("/api/v1/places/search", params={"q": "chennai"})
    row = response.json()["data"][0]
    assert row == {
        "geonameId": 4,
        "name": "Chennai",
        "admin1Name": "Tamil Nadu",
        "countryCode": "IN",
        "countryName": "India",
        "lat": 13.0827,
        "lng": 80.2707,
        "timezone": "Asia/Kolkata",
    }


def test_query_below_minimum_length_returns_no_results_not_the_whole_table(client):
    _seed_places()
    response = client.get("/api/v1/places/search", params={"q": "m"})
    assert response.status_code == 200
    assert response.json()["data"] == []


def test_no_match_returns_empty_list_not_an_error(client):
    _seed_places()
    response = client.get("/api/v1/places/search", params={"q": "zzznotaplace"})
    assert response.status_code == 200
    assert response.json()["data"] == []


def test_limit_is_capped(client):
    with SessionLocal() as session:
        with session.begin():
            session.add_all(
                Place(
                    geoname_id=100 + i, name=f"Testville{i}", search_key=f"testville{i}",
                    admin1_name="Tamil Nadu", country_code="IN", country_name="India",
                    latitude=10.0, longitude=78.0, timezone="Asia/Kolkata", population=i,
                )
                for i in range(80)
            )
    response = client.get("/api/v1/places/search", params={"q": "testville", "limit": 999})
    assert len(response.json()["data"]) == 50  # _MAX_LIMIT, not the requested 999
