"""Doctrine A-1 (2026-08-19) on the surfaces that missed it.

A-1 reckons Kandaka Sani from the Janma Rasi over 4/7/10, and every surface
must label it "Kantaka Sani (from Janma Rasi)" so the reference is never
implied (`docs/VINAADI_RULEBOOK_TABLE_APPENDIX.md`, GO-10).

Two surfaces still used the superseded Lagna reckoning:

* The sani-cycle response's `lagnaBasedCycle` — a deliberately kept Lagna
  cross-check — called `classify_kandaka_cycle` with the house from the
  *Lagna*, which stamps `KANDAKA_SANI`, the tag that renders "· from Janma
  Rasi". A Lagna reading was labelled a Moon reading.
* Family flags and day views took their only Kandaka from that cross-check, so
  a member was flagged for Saturn 4/7/10 from the Lagna and never for Saturn
  4/7/10 from the Moon — the reverse of the ruling.

The member and the dates are found, not hard-coded: the test asks the
sani-cycle endpoint where Saturn stands on 1 January of each year and picks
one year that separates the two references each way. What it cannot see:
the owner's own tile (`_owner_aggregate_member`, `_owner_day_view`) is
covered by the same helper but not exercised here; mobile renders no Sani tag.
"""
from __future__ import annotations

from datetime import date

KANDAKA_HOUSES = {4, 7, 10}


def _sani(client, chart_id: str, on: date) -> dict:
    response = client.get(f"/api/v1/charts/{chart_id}/sani-cycle", params={"date": on.isoformat()})
    assert response.status_code == 200, response.text
    return response.json()["data"]


def _member_tags(client, vault_id: str, member_chart_id: str, on: date) -> list[str]:
    response = client.get(f"/api/v1/family-vaults/{vault_id}/daily-aggregate", params={"date": on.isoformat()})
    assert response.status_code == 200, response.text
    member = next(m for m in response.json()["data"]["members"] if m["chartId"] == member_chart_id)
    return member["activeCycleTags"]


def test_kandaka_is_reckoned_from_the_moon_and_labelled_by_its_reference(
    client, family_vault_payload_factory, family_member_payload_factory
):
    vault_id = client.post("/api/v1/family-vaults", json=family_vault_payload_factory()).json()["data"]["familyVaultId"]
    member = client.post(
        f"/api/v1/family-vaults/{vault_id}/members",
        json=family_member_payload_factory(display_name="Synthetic Member"),
    ).json()["data"]
    chart_id = member["chartId"]

    lagna_only = moon_only = None
    for year in range(2000, 2041):
        on = date(year, 1, 1)
        sani = _sani(client, chart_id, on)
        from_moon, from_lagna = sani["positionFromMoon"], sani["positionFromLagna"]
        if lagna_only is None and from_lagna in KANDAKA_HOUSES and from_moon not in KANDAKA_HOUSES:
            lagna_only = (on, sani)
        # 7/10, not 4: the 4th from the Moon is also Ardhashtama, which would
        # put a Moon-cycle tag in front and hide what this checks.
        if moon_only is None and from_moon in {7, 10} and from_lagna not in KANDAKA_HOUSES:
            moon_only = (on, sani)
    assert lagna_only and moon_only, "synthetic chart never separates the two references"

    # Saturn 4/7/10 from the Lagna only: the cross-check fires, under a tag that
    # does not claim the Janma Rasi, and the family flag does not fire at all.
    on, sani = lagna_only
    assert sani["lagnaBasedCycle"]["isActive"] is True
    assert sani["lagnaBasedCycle"]["type"] != "KANDAKA_SANI"
    assert "KANDAKA_SANI" not in _member_tags(client, vault_id, chart_id, on)

    # Saturn 7/10 from the Moon only: A-1's Kandaka, so the family flag fires.
    on, _sani_data = moon_only
    assert "KANDAKA_SANI" in _member_tags(client, vault_id, chart_id, on)
    today = client.get(f"/api/v1/family-vaults/{vault_id}/today", params={"date": on.isoformat()})
    assert today.status_code == 200, today.text
    card = next(m for m in today.json()["data"]["members"] if m["chartId"] == chart_id)
    assert card["saniCycleType"] == "KANDAKA_SANI"
