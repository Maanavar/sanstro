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
    # OWNER-Q-D4: two lines, one per cause, each read off that chart's own facts.
    # The same chart twice, so each line is BOTH or NEITHER, never ONE.
    assert [j["key"] for j in eh["joint"]] == ["MALEFIC_IN_EIGHTH", "EIGHTH_LORD_DEBILITATED_OR_COMBUST"]
    facts = {"MALEFIC_IN_EIGHTH": "maleficInLagnaEighth",
             "EIGHTH_LORD_DEBILITATED_OR_COMBUST": "lagnaEighthLordDebilitatedOrCombust"}
    for j in eh["joint"]:
        assert j["pattern"] == ("BOTH" if bride[facts[j["key"]]] else "NEITHER")
        assert bride[facts[j["key"]]] == groom[facts[j["key"]]]
    assert "maleficInfluence" not in bride
    for f in bride["factors"] + groom["factors"]:
        assert not any(k.endswith("Name") for k in f) and "MARAKA" not in f["lordship"]
    # A Sevvai the 8th-house reading links to the dosham is one the report shows.
    if any("SEVVAI_DOSHAM" in f["alsoCountedIn"] for f in bride["factors"]):
        assert body["sevvaiA"]["hasDosham"] or body["sevvaiB"]["hasDosham"]

    # FAA-32 on the same couple. Same chart twice: the 5th-house side is
    # identical; only the 9th differs (the bride's is the verse, the groom's
    # context), and only the bride's 9th lord is a timing lord.
    jp = body["jointProgeny"]
    kids = {jp["personA"]["ninth"]: jp["personA"], jp["personB"]["ninth"]: jp["personB"]}
    assert set(kids) == {"CHILDREN", "CONTEXT"}
    kb, kg = kids["CHILDREN"], kids["CONTEXT"]

    def fifth(r):
        return sorted((f["kind"], f["reference"], f["graha"], f["target"], f["via"], f["bearing"], f["rule"])
                      for f in r["factors"] if f["bhava"] == 5)

    assert fifth(kb) == fifth(kg) != []
    assert any(f["rule"] == "PHALADEEPIKA_11_1" for f in kb["factors"] if f["bhava"] == 9)
    assert all(f["bearing"] == "CONTEXT" and f["tier"] == "engine_inference" for f in kg["factors"] if f["bhava"] == 9)
    assert any("NINTH_LORD" in t["roles"] for t in kb["timingLords"])
    assert not any("NINTH_LORD" in t["roles"] for t in kg["timingLords"])
    assert [j["key"] for j in jp["joint"]] == ["FIFTH_HOUSE", "FIFTH_LORD", "JUPITER"]
    assert all(j["pattern"] in {"BOTH", "NEITHER"} for j in jp["joint"])  # the same chart twice
    assert jp["horizonYears"] == 5
    for w in jp["windows"]:
        assert jp["horizonStart"] <= w["start"] < w["end"] <= jp["horizonEnd"]
    for f in kb["factors"] + kg["factors"]:
        assert not any(k.endswith("Name") for k in f) and "MARAKA" not in f["lordship"]

    # FAA-31 on the same couple (surface ratified 2026-11-12, spec §0.4).
    # Both members are built from one set of birth data, so the two mahadasa
    # timelines are identical and any pair must sit at a zero gap. Whether
    # there is a pair at all depends on a handover falling inside the 10-year
    # horizon — a mahadasa runs 6 to 20 years, and this fixture's chart has
    # none — so the list is asserted conditionally. The zero-gap shape itself
    # is pinned deterministically in tests/test_faa31_dasa_sandhi_surface.py
    # (test_identical_charts_pair_every_change_at_a_zero_gap).
    ds = body["dasaSandhi"]
    assert ds["tier"] == "engine_inference"
    assert ds["rule"] == "PROKERALA_PORUTHAM_P17"  # a practice, not doctrine
    assert (ds["option"], ds["fixedMonths"], ds["horizonYears"]) == ("A_FIXED", 6.0, 10)
    assert ds["band"] in {"CLOSE", "NEAR", None}
    # A band is claimed exactly when something was found, never otherwise.
    assert (ds["band"] is None) == (ds["pairs"] == [])
    for p in ds["pairs"]:
        assert p["changeGapDays"] == 0 and p["changeA"] == p["changeB"]
        assert p["band"] == "CLOSE"
        # The supplementary measure restates the primary one: 12 months less the gap.
        assert p["windowGapDays"] == -365 and p["windowsOverlap"] is True
        assert p["outgoingA"] == p["outgoingB"] and p["incomingA"] == p["incomingB"]
        assert ds["horizonStart"] <= p["changeA"] <= ds["horizonEnd"]
        # A flagged pair is never 12 months or more apart (the ruling's limit).
        assert p["changeGapDays"] < 366
        assert not any(k.endswith("Name") or k.endswith("Code") for k in p)
    # No score field rode in with it.
    assert not any("score" in k.lower() for k in ds)

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
    assert "These two lines compare" in text  # the joint note sits under the joint lines
    assert "malefic influence on the 8th" not in text  # the merged pre-D4 line is gone
    assert "Children: reading both charts" in text and "Periods running for both" in text
    assert "The 9th, read for children in a woman's chart" in text and "The 9th, as context only" in text
    # FAA-31's section, and the words that keep it advisory. The heading, the
    # intro's disclaimers and the closing note are on the page whether or not
    # anything was flagged; the band sentence depends on this fixture's charts,
    # so it is matched against whichever band the response actually carries.
    # ReportLab wraps a paragraph across several text-show operators, so a long
    # phrase can be split mid-sentence in the stream. Collapse whitespace and
    # match short fragments rather than whole sentences.
    flat = " ".join(text.split())
    assert "When each chart's mahadasa changes" in flat
    assert "classical texts" in flat  # the practice is not presented as doctrine
    assert "not a dosham" in flat and "remedy to buy" in flat
    band_fragment = {
        "CLOSE": "fall close together",
        "NEAR": "fall near each other",
        None: "within twelve months",
    }[ds["band"]]
    assert band_fragment in flat
    # The supplementary line appears only where there is a pair to restate.
    assert ("restates the gap above" in flat) == bool(ds["pairs"])
    # EC-RULING-06: the section never reaches for mortality or a verdict.
    for banned in ("widow", "lifespan", "do not marry", "unsuitable match"):
        assert banned not in text.lower(), banned


def test_faa30_joint_lines_never_move_a_score_or_a_verdict(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
    monkeypatch,
):
    """OWNER-Q-D4: the joint lines are observations. Forcing both to BOTH must
    change nothing in the report except the lines themselves."""
    from app.calculations import compatibility_intelligence as ci_module
    from app.calculations.mangalya_sthana import JointLine

    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory())
    vid = vault.json()["data"]["familyVaultId"]
    me = family_member_payload_factory(display_name="Synthetic Groom", relationship_to_owner="self")
    other = family_member_payload_factory(display_name="Synthetic Bride")
    assert client.post(f"/api/v1/family-vaults/{vid}/members", json={**me, "genderForTraditionalRules": "male"}).status_code == 200
    made = client.post(f"/api/v1/family-vaults/{vid}/members", json={**other, "genderForTraditionalRules": "female"})
    url = f"/api/v1/relationships/{made.json()['data']['familyMemberId']}/compatibility-intelligence"

    plain = client.get(url, params={"familyVaultId": vid}).json()["data"]
    forced_lines = (JointLine("MALEFIC_IN_EIGHTH", "BOTH"), JointLine("EIGHTH_LORD_DEBILITATED_OR_COMBUST", "BOTH"))
    monkeypatch.setattr(ci_module, "mangalya_joint_lines", lambda a, b: forced_lines)
    forced = client.get(url, params={"familyVaultId": vid}).json()["data"]

    # Proof of life: the patch reached the response (no cache answered instead).
    assert [j["pattern"] for j in forced["eighthHouse"]["joint"]] == ["BOTH", "BOTH"]
    plain.pop("eighthHouse")
    forced.pop("eighthHouse")
    assert forced == plain


def test_faa31_dasa_sandhi_never_moves_a_score_or_a_verdict(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
    monkeypatch,
):
    """Spec §0.4: the sandhi reading times, it never grades. Forcing a CLOSE
    band must change nothing in the report except the sandhi block itself."""
    from app.calculations import compatibility_intelligence as ci_module
    from app.calculations.dasa_sandhi import couple_reading

    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory())
    vid = vault.json()["data"]["familyVaultId"]
    me = family_member_payload_factory(display_name="Synthetic Groom", relationship_to_owner="self")
    other = family_member_payload_factory(display_name="Synthetic Bride")
    assert client.post(f"/api/v1/family-vaults/{vid}/members", json={**me, "genderForTraditionalRules": "male"}).status_code == 200
    made = client.post(f"/api/v1/family-vaults/{vid}/members", json={**other, "genderForTraditionalRules": "female"})
    url = f"/api/v1/relationships/{made.json()['data']['familyMemberId']}/compatibility-intelligence"

    plain = client.get(url, params={"familyVaultId": vid}).json()["data"]

    # These two members share one set of birth data, so the default reading is
    # already CLOSE with zero gaps. Forcing a *different horizon* is therefore
    # the only unambiguous proof the patch ran at all.
    def forced_reading(snap_a, snap_b, today_jd):
        from app.calculations.astro import julian_day_to_utc_datetime

        mahas = ci_module._mahadashas(snap_a, today_jd)
        return couple_reading(
            mahas, mahas,
            from_date=julian_day_to_utc_datetime(today_jd).date(),
            horizon_years=5,
        )

    monkeypatch.setattr(ci_module, "dasa_sandhi_from_snapshots", forced_reading)
    forced = client.get(url, params={"familyVaultId": vid}).json()["data"]

    # Proof of life: the patch reached the response (no cache answered
    # instead). The horizon is the signal, not the band — both members share
    # one set of birth data and this chart has no mahadasa handover inside
    # either horizon, so the band stays None in both.
    assert plain["dasaSandhi"]["horizonYears"] == 10
    assert forced["dasaSandhi"]["horizonYears"] == 5
    assert forced["dasaSandhi"] != plain["dasaSandhi"]
    assert all(p["changeGapDays"] == 0 for p in forced["dasaSandhi"]["pairs"])
    plain.pop("dasaSandhi")
    forced.pop("dasaSandhi")
    assert forced == plain


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
    assert eh["personA"]["factors"] == [] and eh["joint"] == []

    # FAA-32: the 5th side needs no gender; the 9th is not read for either.
    jp = body["jointProgeny"]
    for r in (jp["personA"], jp["personB"]):
        assert r["ninth"] == "NOT_APPLIED" and r["ninthFromLagna"] is None
        assert r["factors"] and all(f["bhava"] == 5 for f in r["factors"])
        assert not any("NINTH" in role for t in r["timingLords"] for role in t["roles"])

    # FAA-31 reads dasha timing only, so unlike FAA-30/32 it needs no stated
    # gender and is fully present on a hand-entered pair.
    ds = body["dasaSandhi"]
    assert (ds["option"], ds["fixedMonths"], ds["horizonYears"]) == ("A_FIXED", 6.0, 10)
    assert ds["tier"] == "engine_inference" and ds["rule"] == "PROKERALA_PORUTHAM_P17"
    assert ds["band"] in {"CLOSE", "NEAR", None}
    assert ds["band"] is not None or ds["pairs"] == []
    for p in ds["pairs"]:
        assert p["changeGapDays"] < 366  # never 12 months or more
        # The 6-month cut is 182.625 days and the wire rounds to whole days, so
        # 182-184 is genuinely ambiguous here; assert only away from that edge.
        if p["changeGapDays"] <= 181:
            assert p["band"] == "CLOSE"
        elif p["changeGapDays"] >= 184:
            assert p["band"] == "NEAR"
        assert ds["horizonStart"] <= p["changeA"] <= ds["horizonEnd"]
        assert not any(k.endswith("Name") or k.endswith("Code") for k in p)


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
    assert "Children: reading both charts" in text  # FAA-32
    assert "No gender is stated, so the 9th was not read." in text

    # The Tamil PDF renders the Tamil card copy (glyph-encoded, so only "it
    # builds" is checkable here; the words are pinned by the copy golden file).
    ta = client.post(
        "/api/v1/relationships/compatibility-intelligence/direct/pdf?lang=ta",
        json={"personA": _HAND_ENTERED_A, "personB": _HAND_ENTERED_B},
    )
    assert ta.status_code == 200 and ta.content[:4] == b"%PDF"
    assert len(ta.content) > len(response.content) // 2
