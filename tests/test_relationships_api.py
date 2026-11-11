from datetime import date
from uuid import UUID

from app.db.session import SessionLocal
from app.models.relationship_alert import RelationshipAlert


def _create_family_with_two_members(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
) -> tuple[str, str]:
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory())
    assert vault.status_code == 200
    family_vault_id = vault.json()["data"]["familyVaultId"]

    self_member = client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=family_member_payload_factory(display_name="Arjun Kumar", relationship_to_owner="self"),
    )
    assert self_member.status_code == 200

    spouse_member = client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=family_member_payload_factory(display_name="Anitha"),
    )
    assert spouse_member.status_code == 200
    member_id = spouse_member.json()["data"]["familyMemberId"]
    return family_vault_id, member_id


def test_relationship_synastry_endpoint_returns_score(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    family_vault_id, member_id = _create_family_with_two_members(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
    )

    response = client.get(
        f"/api/v1/relationships/{member_id}/synastry",
        params={"familyVaultId": family_vault_id},
    )
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["familyVaultId"] == family_vault_id
    assert body["memberId"] == member_id
    assert 0 <= body["score"] <= 100
    assert body["label"] in {"SUPPORTIVE", "MIXED", "CAREFUL"}
    assert body["summary"]["en"]
    assert isinstance(body["keyAspects"], list)


def test_relationship_porutham_endpoint_returns_ten_poruthams(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    """The vault-member porutham route had no test at all, and F-POR-05's
    change to `_assign_bride_groom` (which gained a third return value) missed
    this one of its three call sites. Every request to this endpoint would
    have raised "too many values to unpack" — 6415 passing tests did not
    notice, and mypy caught it in CI.

    Asserted on the shape a caller depends on rather than on scores: the point
    is that the route executes end to end.
    """
    family_vault_id, member_id = _create_family_with_two_members(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
    )

    # MARRIAGE is the context that reads all ten; GENERAL deliberately shows a
    # smaller set, so both are exercised — a route that 500s does so either way.
    marriage = client.get(
        f"/api/v1/relationships/{member_id}/porutham",
        params={"familyVaultId": family_vault_id, "compatibilityContext": "MARRIAGE"},
    )
    assert marriage.status_code == 200, marriage.text
    body = marriage.json()["data"]
    assert len(body["kutas"]) == 10
    assert body["maxScore"] == 10
    assert 0 <= body["totalScore"] <= 10
    assert body["label"] in {"EXCELLENT", "GOOD", "AVERAGE", "CAUTION"}
    assert body["contextNote"]["en"] and body["contextNote"]["ta"]
    assert isinstance(body["rajjuDosha"], bool)
    assert isinstance(body["vedhaDosha"], bool)

    general = client.get(
        f"/api/v1/relationships/{member_id}/porutham",
        params={"familyVaultId": family_vault_id},
    )
    assert general.status_code == 200, general.text
    assert 0 < len(general.json()["data"]["kutas"]) <= 10


def test_porutham_response_carries_the_shashtashtaka_note(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    """F-POR-02 reached `PorutthamResult` and stopped there — a field with no
    reader. This pins that it survives the shaping step, the schema and the
    route.

    Asserted on the field's *shape*, not on whether this particular synthetic
    pair happens to be 6/8: the fixture's rasis are not chosen for it, and a
    test that needed them to be would break whenever the fixture moved.
    """
    family_vault_id, member_id = _create_family_with_two_members(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
    )

    response = client.get(
        f"/api/v1/relationships/{member_id}/porutham",
        params={"familyVaultId": family_vault_id, "compatibilityContext": "MARRIAGE"},
    )
    assert response.status_code == 200, response.text
    note = response.json()["data"]["shashtashtaka"]
    assert note is not None, "the note must reach the wire, not stop at the engine"
    assert isinstance(note["present"], bool)
    assert isinstance(note["directionalPass"], bool)
    # The two inclusive counts between two signs always sum to 14 (or are both
    # 1 for a same-sign pair), which is why one count detects either
    # orientation — see shashtashtaka_relation's docstring.
    total = note["countGirlToBoy"] + note["countBoyToGirl"]
    assert total in {2, 14}, total
    if note["present"]:
        assert note["label"]["ta"] and note["note"]["ta"]
        assert 6 in (note["countGirlToBoy"], note["countBoyToGirl"])
    else:
        assert note["label"]["ta"] == "" and note["label"]["en"] == ""


def test_relationship_alerts_endpoint_filters_unread(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    family_vault_id, member_id = _create_family_with_two_members(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
    )

    with SessionLocal() as session:
        with session.begin():
            session.add(
                RelationshipAlert(
                    vault_id=UUID(family_vault_id),
                    member_id=UUID(member_id),
                    trigger_planet="JUPITER",
                    trigger_type="transit_conjunct_a_venus",
                    message_en="Supportive relationship activation window.",
                    message_ta="Uravukku supportive activation window.",
                    alert_date=date(2026, 5, 23),
                    is_read=False,
                )
            )

    unread = client.get(
        "/api/v1/relationships/alerts",
        params={"familyVaultId": family_vault_id},
    )
    assert unread.status_code == 200
    unread_body = unread.json()["data"]
    assert unread_body["unreadOnly"] is True
    assert unread_body["totalCount"] == 1
    assert unread_body["items"][0]["isRead"] is False

    all_items = client.get(
        "/api/v1/relationships/alerts",
        params={"familyVaultId": family_vault_id, "unreadOnly": False},
    )
    assert all_items.status_code == 200
    all_body = all_items.json()["data"]
    assert all_body["unreadOnly"] is False
    assert all_body["totalCount"] == 1



def test_relationship_compatibility_intelligence_includes_astro_identity(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    """Rasi/Nakshatra/Lagnam identity facts (2026-07 UX gap fix) must be
    present for both people, not just the score breakdowns."""
    family_vault_id, member_id = _create_family_with_two_members(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
    )

    response = client.get(
        f"/api/v1/relationships/{member_id}/compatibility-intelligence",
        params={"familyVaultId": family_vault_id},
    )
    assert response.status_code == 200
    body = response.json()["data"]
    for identity in (body["personAIdentity"], body["personBIdentity"]):
        assert 1 <= identity["rasi"] <= 12
        assert identity["rasiName"]
        assert 1 <= identity["nakshatra"] <= 27
        assert identity["nakshatraName"]
        assert 1 <= identity["pada"] <= 4
        assert 1 <= identity["lagnaRasi"] <= 12
        assert identity["lagnaRasiName"]


def test_compatibility_intelligence_reads_the_8th_by_stated_gender(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    """FAA-30 through the production assembler. The factory gives both people
    the same synthetic birth data, so the two readings must list the same
    placements and differ only in role and tier: the bride's lagna reading
    cites Phaladeepika 11.1, the groom's never does."""
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory())
    vid = vault.json()["data"]["familyVaultId"]
    me = family_member_payload_factory(display_name="Synthetic Groom", relationship_to_owner="self")
    other = family_member_payload_factory(display_name="Synthetic Bride")
    assert client.post(f"/api/v1/family-vaults/{vid}/members", json={**me, "genderForTraditionalRules": "male"}).status_code == 200
    made = client.post(f"/api/v1/family-vaults/{vid}/members", json={**other, "genderForTraditionalRules": "female"})
    assert made.status_code == 200
    body = client.get(
        f"/api/v1/relationships/{made.json()['data']['familyMemberId']}/compatibility-intelligence",
        params={"familyVaultId": vid},
    ).json()["data"]

    eh = body["eighthHouse"]
    readings = {eh["personA"]["role"]: eh["personA"], eh["personB"]["role"]: eh["personB"]}
    assert set(readings) == {"BRIDE", "GROOM_8TH"}
    bride, groom = readings["BRIDE"], readings["GROOM_8TH"]
    assert bride["mangalyaReference"] == groom["mangalyaReference"] == "BOTH"

    def placements(r):
        return sorted((f["kind"], f["reference"], f["graha"], f["target"], f["via"], f["placementId"]) for f in r["factors"])

    assert placements(bride) == placements(groom) != []
    assert any(f["rule"] == "PHALADEEPIKA_11_1" for f in bride["factors"])
    assert all(f["tier"] == "engine_inference" for f in groom["factors"])
    assert eh["joint"] in {"BOTH", "NEITHER"}  # the same chart twice
    for f in bride["factors"] + groom["factors"]:
        assert not any(k.endswith("Name") for k in f) and "MARAKA" not in f["lordship"]
    # A Sevvai the 8th-house reading links to the dosham is one the report shows.
    if any("SEVVAI_DOSHAM" in f["alsoCountedIn"] for f in bride["factors"]):
        assert body["sevvaiA"]["hasDosham"] or body["sevvaiB"]["hasDosham"]

    # The same couple's PDF carries the section, with mangalya named once (the bride).
    from tests._pdf_readable import count_streams, pdf_readable_text

    pdf = client.get(
        f"/api/v1/relationships/{made.json()['data']['familyMemberId']}/compatibility-intelligence/pdf",
        params={"familyVaultId": vid},
    )
    assert pdf.status_code == 200
    text, inflated = pdf_readable_text(pdf.content)
    assert inflated == count_streams(pdf.content)
    assert "The 8th house" in text and "8th-house factors" in text
    assert text.count("Mangalya sthana") == 1


def test_relationship_compatibility_intelligence_pdf_endpoint_returns_pdf(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    family_vault_id, member_id = _create_family_with_two_members(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
    )

    response = client.get(
        f"/api/v1/relationships/{member_id}/compatibility-intelligence/pdf",
        params={"familyVaultId": family_vault_id},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.content[:4] == b"%PDF"


def test_relationship_compatibility_intelligence_direct_pdf_endpoint_returns_pdf(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    family_vault_id, member_id = _create_family_with_two_members(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
    )

    response = client.post(
        f"/api/v1/relationships/{member_id}/compatibility-intelligence/direct/pdf",
        params={"familyVaultId": family_vault_id},
        json={
            "personA": {
                "displayName": "Arjun Kumar",
                "birthDateLocal": "1991-07-22",
                "birthTimeLocal": "06:30:00",
                "birthPlace": "Chennai, Tamil Nadu, India",
                "birthLatitude": 13.0827,
                "birthLongitude": 80.2707,
                "birthTimezone": "Asia/Kolkata",
            }
        },
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.content[:4] == b"%PDF"


# Two clearly-synthetic people, neither of whom is a member of any family vault.
_HAND_ENTERED_A = {
    "displayName": "Test Person A",
    "birthDateLocal": "1991-07-22",
    "birthTimeLocal": "06:30:00",
    "birthPlace": "Chennai, Tamil Nadu, India",
    "birthLatitude": 13.0827,
    "birthLongitude": 80.2707,
    "birthTimezone": "Asia/Kolkata",
}
_HAND_ENTERED_B = {
    "displayName": "Test Person B",
    "birthDateLocal": "1993-02-11",
    "birthTimeLocal": "18:45:00",
    "birthPlace": "Coimbatore, Tamil Nadu, India",
    "birthLatitude": 11.0168,
    "birthLongitude": 76.9558,
    "birthTimezone": "Asia/Kolkata",
}


def test_compatibility_intelligence_direct_pair_needs_no_family_vault(client):
    """The depth of the report follows who is asking, not where the data is stored.

    Every other Compatibility Intelligence route requires Person B to be a saved
    family-vault member, which left a signed-in user who typed two people into
    the Porutham tool with the same shallow ten-porutham result a logged-out
    visitor gets on the marketing calculator.
    """
    response = client.post(
        "/api/v1/relationships/compatibility-intelligence/direct",
        json={"personA": _HAND_ENTERED_A, "personB": _HAND_ENTERED_B},
    )
    assert response.status_code == 200
    body = response.json()["data"]
    assert 0 <= body["overallScore"] <= 100
    assert body["overallLabel"]
    assert 0 <= body["poruthamScore"] <= body["poruthamMax"]
    assert len(body["poruthamKutas"]) == 10
    for identity in (body["personAIdentity"], body["personBIdentity"]):
        assert 1 <= identity["rasi"] <= 12
        assert 1 <= identity["nakshatra"] <= 27
        assert 1 <= identity["lagnaRasi"] <= 12

    # FAA-33 reaches the wire from the one production assembler, both directions,
    # numbers only, and agrees with the identity block it sits beside.
    rows = body["crossChart"]
    assert len(rows) == 14
    assert {r["direction"] for r in rows} == {"A_TO_B", "B_TO_A"}
    (lagna_ab,) = [r for r in rows if r["direction"] == "A_TO_B" and r["key"] == "LAGNA"]
    a_lagna, b_lagna = body["personAIdentity"]["lagnaRasi"], body["personBIdentity"]["lagnaRasi"]
    assert lagna_ab["rasi"] == a_lagna
    assert lagna_ab["houseFromLagna"] == (a_lagna - b_lagna) % 12 + 1
    assert all(r["tier"] == "engine_inference" and not any(k.endswith("Name") for k in r) for r in rows)

    # FAA-30: hand-entered people state no gender, so nothing is applied.
    eh = body["eighthHouse"]
    assert eh["personA"]["role"] == eh["personB"]["role"] == "NOT_APPLIED"
    assert eh["personA"]["factors"] == [] and eh["joint"] == "NOT_APPLIED"


def test_compatibility_intelligence_carries_the_shashtashtaka_note(client):
    """F-POR-02 reached the Compatibility Intelligence *schema* and stopped
    there — the field existed on `CompatibilityIntelligenceData` with no
    producer at its one construction site, so it was permanently null while
    looking wired. That is the same defect as a field with no reader, and a
    schema-only addition cannot be seen by a typecheck.

    This is the deepest marriage surface and the one carrying F-CI-01's label
    caps, so a silent 6/8 pass is most exposed here.

    Asserted on shape, not on whether this synthetic pair happens to be 6/8 —
    same reasoning as `test_porutham_response_carries_the_shashtashtaka_note`.
    `is not None` is what fails when the producer is missing.
    """
    response = client.post(
        "/api/v1/relationships/compatibility-intelligence/direct",
        json={"personA": _HAND_ENTERED_A, "personB": _HAND_ENTERED_B},
    )
    assert response.status_code == 200, response.text
    note = response.json()["data"]["shashtashtaka"]
    assert note is not None, "the note must reach the wire, not stop at the schema"
    assert isinstance(note["present"], bool)
    assert isinstance(note["directionalPass"], bool)
    total = note["countGirlToBoy"] + note["countBoyToGirl"]
    assert total in {2, 14}, total
    # The disclosure must not have leaked into the verdict it sits beside.
    assert 0 <= response.json()["data"]["overallScore"] <= 100


def test_compatibility_intelligence_direct_pair_requires_sign_in(raw_client):
    """Sign-in is the only gate on the route — so it has to actually be one."""
    response = raw_client.post(
        "/api/v1/relationships/compatibility-intelligence/direct",
        json={"personA": _HAND_ENTERED_A, "personB": _HAND_ENTERED_B},
    )
    assert response.status_code in {401, 403}


def test_compatibility_intelligence_direct_pair_pdf_returns_pdf(client):
    response = client.post(
        "/api/v1/relationships/compatibility-intelligence/direct/pdf",
        json={"personA": _HAND_ENTERED_A, "personB": _HAND_ENTERED_B},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.content[:4] == b"%PDF"

    # FAA-33 card reaches the PDF. The probe must prove it read every page
    # first: the card sits on page 2, which the probe used to skip.
    from tests._pdf_readable import count_streams, pdf_readable_text

    text, inflated = pdf_readable_text(response.content)
    assert inflated == count_streams(response.content) > 1
    assert "Compatibility Intelligence" in text
    assert "Chart-to-chart observations" in text
    assert "points in" in text  # a direction label, so at least one group rendered

    # The Tamil PDF renders the Tamil card copy (glyph-encoded, so only "it
    # builds" is checkable here; the words are pinned by the copy golden file).
    ta = client.post(
        "/api/v1/relationships/compatibility-intelligence/direct/pdf?lang=ta",
        json={"personA": _HAND_ENTERED_A, "personB": _HAND_ENTERED_B},
    )
    assert ta.status_code == 200 and ta.content[:4] == b"%PDF"
    assert len(ta.content) > len(response.content) // 2
