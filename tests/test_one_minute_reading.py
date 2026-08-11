"""Tests for "Your Chart in One Minute" (docs/ONE_MINUTE_READING_2026-08-04.md).

These are not incidental coverage — each one pins a rule the feature is not
allowed to break, and several pin a failure this codebase has already paid for
once on another surface.
"""
from __future__ import annotations

import dataclasses
import itertools
import re
import uuid
from datetime import UTC, date, datetime

import pytest
from sqlalchemy import select

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.dasha import DashaPeriod, VimshottariTimeline
from app.calculations.display_names import (
    NAKSHATRA_EN,
    NAKSHATRA_TA,
    PLANET_EN,
    RASI_EN,
    RASI_TA,
    planet_en,
)
from app.db.session import SessionLocal
from app.models import BirthProfile, Chart
from app.services import one_minute_reading_service as reading
from app.services.feature_flags import reset_flag, set_flag
from app.services.narrative_engine import tone_validator
from app.services.one_minute_reading_service import (
    MAX_WORDS_EN,
    MAX_WORDS_TA,
    _beat_last_ten_years,
    word_budget,
)

TODAY = date.today()


@pytest.fixture(autouse=True)
def _reading_enabled():
    set_flag("one_minute_reading", True)
    yield
    reset_flag("one_minute_reading")


def _birth_date_for_age(age: int) -> str:
    # 14 March keeps the birthday behind us for most of the year, so the
    # requested age is the age the service computes.
    return date(TODAY.year - age, 3, 14).isoformat()


# The API rejects a second birth profile with identical details in the same
# account (409). Tests that build two charts differing only in a *profile field*
# — birth-time source, marital status — would trip that guard, so every synthetic
# profile gets a distinct display name.
_SERIAL = itertools.count(1)


def _profile(
    *,
    age: int,
    display_name: str | None = None,
    marital_status: str | None = None,
    employment_type: str | None = None,
    birth_time_source: str = "BIRTH_CERTIFICATE",
) -> dict:
    """A clearly-synthetic profile. Never a real birth record (CLAUDE.md)."""
    payload = {
        "displayName": display_name or f"Kavitha Synthetic {next(_SERIAL)}",
        "birthDateLocal": _birth_date_for_age(age),
        "birthTimeLocal": "06:42:00",
        "birthPlace": "Madurai, Tamil Nadu, India",
        "birthLatitude": 9.9252,
        "birthLongitude": 78.1198,
        "birthTimezone": "Asia/Kolkata",
        "birthTimeSource": birth_time_source,
        "calculateNow": True,
    }
    if marital_status is not None:
        payload["maritalStatus"] = marital_status
    if employment_type is not None:
        payload["employmentType"] = employment_type
    return payload


def _read(client, **kwargs) -> dict:
    created = client.post("/api/v1/birth-profiles", json=_profile(**kwargs))
    assert created.status_code == 200, created.text
    chart_id = created.json()["data"]["chartId"]
    response = client.get(f"/api/v1/charts/{chart_id}/one-minute")
    assert response.status_code == 200, response.text
    return response.json()["data"]


def _body(data: dict, lang: str) -> str:
    return " ".join(beat["text"][lang] for beat in data["beats"])


# ── The rollout gate ─────────────────────────────────────────────────────────


def test_flag_off_answers_404_identically_for_real_and_fake_chart_ids(
    client, birth_profile_payload_factory
):
    """The gate must not become an oracle for which chart ids exist.

    A flag checked AFTER the ownership lookup leaks existence through the
    403/404 split. This is the same ordering numerology.py's module docstring
    documents, tested here so a future refactor cannot quietly reverse it.
    """
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory())
    real_chart_id = created.json()["data"]["chartId"]
    reset_flag("one_minute_reading")
    set_flag("one_minute_reading", False)

    real = client.get(f"/api/v1/charts/{real_chart_id}/one-minute")
    fake = client.get(f"/api/v1/charts/{uuid.uuid4()}/one-minute")

    assert real.status_code == 404
    assert fake.status_code == 404
    assert real.json() == fake.json()


# ── The budget IS the product ────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("age", "marital_status", "employment_type", "birth_time_source"),
    [
        (1, None, None, "BIRTH_CERTIFICATE"),
        (8, None, None, "BIRTH_CERTIFICATE"),
        (15, None, None, "BIRTH_CERTIFICATE"),
        (22, None, "student", "BIRTH_CERTIFICATE"),
        (28, None, "student", "BIRTH_CERTIFICATE"),
        (26, "single", None, "BIRTH_CERTIFICATE"),
        # Blank status: beat 5 is withheld, so this case measures the SHORT
        # reading — the lower bound below is the one doing the work here.
        (30, None, None, "BIRTH_CERTIFICATE"),
        (33, "married", None, "BIRTH_CERTIFICATE"),
        # A status that records a loss routes to STEADYING, which has its own
        # copy and therefore its own budget exposure.
        (45, "widowed", None, "BIRTH_CERTIFICATE"),
        (38, "divorced", "employed_salaried", "BIRTH_CERTIFICATE"),
        (38, "married", "business_owner", "BIRTH_CERTIFICATE"),
        (44, "married", "business_owner", "BIRTH_CERTIFICATE"),
        (52, None, "employed_salaried", "BIRTH_CERTIFICATE"),
        (62, "married", "retired", "BIRTH_CERTIFICATE"),
        # 66/married was absent from this matrix and the case ran 259 words
        # against a 255 ceiling — found by reading a preview, not by this test.
        # The gap was the matrix, not the guard.
        (66, "married", None, "BIRTH_CERTIFICATE"),
        (71, "widowed", "retired", "BIRTH_CERTIFICATE"),
        # An unconfirmed birth time is a longer reading, not a shorter one: the
        # falsifiability beat's unconfirmed form has to say what it left out and
        # what it stood on instead, which costs more than the two words beat 1
        # saves by dropping the rising sign. This branch was outside the matrix
        # and is now the binding case for the English ceiling — the same shape
        # of gap as the 66/married one above, found the same way.
        (33, "married", None, "unknown"),
        (66, "married", None, "unknown"),
        (8, None, None, "unknown"),
    ],
)
def test_word_budget_holds_for_every_life_stage(
    client, age, marital_status, employment_type, birth_time_source
):
    """Without this test the surface becomes a report within two sprints.

    That is not hypothetical — it is exactly how the jadhagam report got to
    where it is. The one-minute promise is the product; a reading that runs
    long has silently become a different feature.
    """
    data = _read(
        client,
        age=age,
        marital_status=marital_status,
        employment_type=employment_type,
        birth_time_source=birth_time_source,
    )

    # Per-GATE, not global. A four-beat guardian reading and a seven-beat adult
    # one held to the same number means the number was doing nothing for the
    # shorter ones — a guardian reading could have doubled and still passed.
    #
    # The same argument applies INSIDE the self register, which is why the
    # budget also takes lagna confidence: an unconfirmed reading keeps every
    # beat and additionally says what it left out and which part of the rest
    # depends on it. Folding that into one raised number would have let the
    # confirmed reading — most of them — drift up into headroom it does not need.
    lagna_reliable = birth_time_source in {"BIRTH_CERTIFICATE", "HOSPITAL_RECORD", "FAMILY_RECORD"}
    budget_en, budget_ta = word_budget(data["addressedTo"], lagna_reliable=lagna_reliable)
    assert data["wordCount"]["en"] <= budget_en, _body(data, "en")
    assert data["wordCount"]["ta"] <= budget_ta, _body(data, "ta")
    # No gate may exceed the global ceiling, which is still what the "about a
    # minute" promise is measured against.
    assert budget_en <= MAX_WORDS_EN
    assert budget_ta <= MAX_WORDS_TA
    # A reading that collapses to two sentences has failed differently.
    assert data["wordCount"]["en"] >= 60
    assert len(data["beats"]) >= 4


# ── Safety: the two failures that lose a user permanently ────────────────────


# The family-formation and money halves were added 2026-08-07, and they were
# not a hypothetical gap. Jupiter's `now_texture` — "teaching, children, and
# people senior to you tend to help" — was being printed verbatim to a
# sixteen-year-old reading their own chart, and Venus's ran "relationships,
# comfort and money move more easily now" to the same reader. Both passed this
# test for two commits because the list covered marriage and work and stopped
# there.
#
# The register split is what exposed it: before G2 the 13-17 band got the child
# vocabulary, which never touched `now_texture` at all. Adding a register that
# shares an adult table is exactly when a content lint has to be re-derived from
# the rule rather than left at whatever it happened to catch last time.
_ADULT_TOKENS_EN = (
    "marriage", "marry", "married", "spouse", "husband", "wife",
    "career", "salary", "promotion", "income", "job", "wealth", "invest",
    "children", "money", "relationship",
)
_ADULT_TOKENS_TA = (
    "திருமண", "கல்யாண", "கணவ", "மனைவி", "சம்பள", "முதலீ",
    "பிள்ளைகள்", "பணம்", "உறவுகள்",
)


@pytest.mark.parametrize("age", [1, 5, 8, 12, 15, 17])
def test_a_minors_reading_never_speaks_about_marriage_or_work(client, age):
    """The failure age_phase_service:96 records, re-tested on a new surface.

    An eight-month-old's chart once came back advising her to watch her
    standing at work. The graha reading was fine; the text was written for the
    wrong person. Every new narrative surface has to prove it cannot do that.
    """
    data = _read(client, age=age)

    # The register splits at 13 (§4.2 item 2) and the CONTENT gate does not:
    # the legal gate is still MINOR_AGE = 18, so everything below holds for a
    # 17-year-old addressed directly exactly as it does for an eight-year-old
    # read to their parent. Which register they get is a different test.
    assert data["addressedTo"] in {"parent", "client_with_guardian"}
    assert data["focusTopic"] in {"CHILD_GROWTH", "TEEN"}

    body_en = _body(data, "en").lower()
    for token in _ADULT_TOKENS_EN:
        assert token not in body_en, f"minor aged {age} was told about '{token}': {body_en}"
    body_ta = _body(data, "ta")
    for token in _ADULT_TOKENS_TA:
        assert token not in body_ta, f"minor aged {age} was told about '{token}': {body_ta}"

    # And the instruction must have a valid recipient — a bare "do this" to a
    # minor has none. Which adult is named depends on the register: below 13 the
    # parent is the one who can act, and at 13-17 the teenager can act with the
    # family alongside them. What is not allowed is neither.
    one_thing = next(b for b in data["beats"] if b["id"] == "one_thing")
    if data["addressedTo"] == "parent":
        assert "parents" in one_thing["text"]["en"].lower()
        assert "பெற்றோர்" in one_thing["text"]["ta"]
    else:
        assert "together with family" in one_thing["text"]["en"].lower()
        assert "குடும்பத்துடன்" in one_thing["text"]["ta"]


@pytest.mark.parametrize("age", [26, 33, 40, 49])
def test_a_married_reader_is_never_told_when_they_will_marry(client, age):
    """The single unrecoverable failure — and we already store the field that prevents it."""
    data = _read(client, age=age, marital_status="married")

    assert data["focusTopic"] == "MARRIED_LIFE"
    assert data["pendingQuestion"] is None
    beat = next(b for b in data["beats"] if b["id"] == "your_age_question")
    assert "the question the chart is actually being asked" not in beat["text"]["en"]
    assert "ஜாதகத்திடம் உண்மையில் கேட்கப்படும் கேள்வி" not in beat["text"]["ta"]


def test_a_student_is_read_as_a_student_regardless_of_age(client):
    """A 28-year-old PhD student is a student. Age alone is the wrong gate."""
    data = _read(client, age=28, employment_type="student")
    assert data["focusTopic"] == "EDUCATION"


@pytest.mark.parametrize("age", [19, 26, 30, 45, 52])
def test_an_unknown_marital_status_is_never_read_as_never_married(client, age):
    """A field we never asked about is not an answer.

    An earlier build read a blank ``marital_status`` under 36 as an unmarried
    reader and printed "At 30, marriage is the question the chart is actually
    being asked" — to a reader who may have been married for eight years. Same
    inference-from-absence that let progeny be read off age. The reading now
    withholds the beat and asks, which is what the schema docstring had been
    promising while the code did the opposite.
    """
    data = _read(client, age=age)

    assert data["focusTopic"] == "UNKNOWN"
    # The promise the schema makes: the beat is ABSENT, not defaulted.
    assert not any(beat["id"] == "your_age_question" for beat in data["beats"])
    body = _body(data, "en").lower()
    assert "marriage" not in body
    assert "married" not in body
    assert "திருமண" not in _body(data, "ta")


def test_the_question_offers_every_marital_status_a_reader_could_be_in(client):
    """"Yes, married" / "Not yet" was wrong on both halves.

    "Not yet" writes an expectation onto a reader who never expressed one, and a
    divorced or widowed person had no button at all — they could only clear the
    question by describing themselves as something they are not, which the PATCH
    then fed to every other surface.
    """
    data = _read(client, age=30)
    question = data["pendingQuestion"]

    assert question is not None
    assert question["field"] == "maritalStatus"
    assert {o["value"] for o in question["options"]} == {
        "married", "single", "divorced", "widowed", "undisclosed",
    }
    for option in question["options"]:
        for lang in ("ta", "en"):
            assert option["label"][lang].strip()
    assert "not yet" not in " ".join(
        o["label"]["en"].lower() for o in question["options"]
    )


def test_a_declined_answer_is_respected_rather_than_re_asked(client):
    """Offering the decline is what makes the other four answers trustworthy.

    ``undisclosed`` must behave exactly as a blank does — no beat 5, and above
    all never read as "single" — while also ending the question. Asking again
    after someone has said they would rather not turns their answer into a
    non-answer.
    """
    data = _read(client, age=30, marital_status="undisclosed")

    assert data["focusTopic"] == "UNKNOWN"
    assert data["pendingQuestion"] is None
    assert not any(beat["id"] == "your_age_question" for beat in data["beats"])
    body = _body(data, "en").lower()
    assert "marriage" not in body
    assert "married" not in body


def test_the_question_stands_in_the_gap_rather_than_ahead_of_the_reading(client):
    """The client anchors on `beforeBeat`, and its fallback is the end of the
    piece — so an anchor that does not resolve would push the question to the
    bottom, and a hardcoded one would have put it above the opening line. Asking
    a reader their marital status before they have read a word of their own
    reading is the failure this pins."""
    data = _read(client, age=30)
    beat_ids = [beat["id"] for beat in data["beats"]]

    anchor = data["pendingQuestion"]["beforeBeat"]
    assert anchor in beat_ids, beat_ids
    # Not first: the reading opens on the reader, never on a form.
    assert beat_ids.index(anchor) > 0


def test_no_question_is_raised_when_the_answer_would_not_change_the_beat(client):
    # Past prime marriage age: the topic is settled without asking.
    data = _read(client, age=62)
    assert data["focusTopic"] == "ELDER"
    assert data["pendingQuestion"] is None
    # And a status we DO hold is never re-asked.
    assert _read(client, age=30, marital_status="single")["pendingQuestion"] is None


@pytest.mark.parametrize(
    ("age", "marital_status"),
    [(45, "widowed"), (33, "widowed"), (38, "divorced"), (29, "breakup")],
)
def test_a_reader_who_has_lost_a_marriage_is_never_offered_remarriage_unasked(
    client, age, marital_status
):
    """"At 45, marriage is the question the chart is actually being asked — not
    only when, but with whom." Told to a widow, unprompted, possibly weeks after
    a funeral.

    ``widowed`` sits in ``age_gate.REMARRIAGE_SEEKING_STATUSES``, which is right
    for the marriage surface a reader NAVIGATES TO and wrong for a reading that
    opens by itself. The gate module stays canonical; this surface reads it
    differently because volunteering is not the same act as answering.
    """
    data = _read(client, age=age, marital_status=marital_status)

    assert data["focusTopic"] == "STEADYING"
    assert data["pendingQuestion"] is None
    body_en = _body(data, "en").lower()
    for token in ("marriage", "marry", "remarry", "spouse", "husband", "wife", "partner"):
        assert token not in body_en, f"{marital_status} reader was told about '{token}': {body_en}"
    body_ta = _body(data, "ta")
    for token in ("திருமண", "கல்யாண", "மறுமண"):
        assert token not in body_ta, f"{marital_status} reader was told about '{token}': {body_ta}"


# ── The third-party register: nobody who is not in the room ──────────────────
#
# §3.1 of docs/AGE_GATED_READING_AUDIT_2026-08-05.md, and the source document's
# hardest cross-gate prohibition. This was a live product-shape defect, not a
# copy defect: the family vault is member-centric and this reading is its first
# section per member, so a father opening his adult daughter's card was handed
# her whole reading — grievance, soft spot and marriage timing — as "you".


def _vault_member_reading(
    client, vault_factory, member_factory, *, age: int, relationship: str, name: str
) -> dict:
    """A chart reached the way the family vault reaches it, not by profile id.

    The register turns on FamilyMember.relationship_to_owner, which a birth
    profile created directly never has — so a test that posts to
    /birth-profiles cannot see this behaviour at all.
    """
    vault = client.post("/api/v1/family-vaults", json=vault_factory())
    assert vault.status_code == 200, vault.text
    vault_id = vault.json()["data"]["familyVaultId"]

    payload = member_factory(display_name=name, relationship_to_owner=relationship)
    payload["birthDateLocal"] = _birth_date_for_age(age)
    member = client.post(f"/api/v1/family-vaults/{vault_id}/members", json=payload)
    assert member.status_code == 200, member.text
    member_id = member.json()["data"]["familyMemberId"]

    with SessionLocal() as session:
        row = session.execute(
            select(Chart.chart_id)
            .join(BirthProfile, BirthProfile.birth_profile_id == Chart.birth_profile_id)
            .where(BirthProfile.family_member_id == uuid.UUID(member_id))
            .order_by(Chart.created_at.desc())
        ).first()
    assert row is not None, "the member's chart was not created"

    response = client.get(f"/api/v1/charts/{row[0]}/one-minute")
    assert response.status_code == 200, response.text
    return response.json()["data"]


def test_an_adult_who_is_not_the_reader_is_never_read_in_achievement_terms(
    client, family_vault_payload_factory, family_member_payload_factory
):
    """The failure §3.1 found, pinned.

    A 52-year-old opening his 26-year-old daughter's member card received her
    signature opening, her private grievance quoted back as her own inner
    question, her soft spot, and her marriage-timing beat — every one addressed
    as "you". None of it may survive.
    """
    data = _vault_member_reading(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
        age=26,
        relationship="child",
        name="Divya Synthetic Daughter",
    )

    assert data["addressedTo"] == "other"
    assert data["focusTopic"] == "THIRD_PARTY"

    ids = [beat["id"] for beat in data["beats"]]
    for withheld in ("strength_and_cost", "last_ten_years", "your_age_question", "next_ten_years"):
        assert withheld not in ids, f"{withheld} reached a third-party reading: {ids}"

    body = _body(data, "en").lower()
    # Second person at all is the tell — the whole register is third person, so
    # a single "you" means a beat leaked in from the reader's own path.
    assert not re.search(r"\byou\b|\byour\b|\byourself\b", body), body
    for token in _ADULT_TOKENS_EN:
        assert token not in body, f"'{token}' reached a third-party reading: {body}"
    assert "Divya" in _body(data, "en")


def test_no_question_about_an_absent_adult_is_put_to_somebody_else(
    client, family_vault_payload_factory, family_member_payload_factory
):
    """The third instance of the same defect, and the least obvious one.

    The pending question PATCHes the birth profile. Raised on a family-vault
    card it would ask a father to declare his adult daughter's marital status —
    a status she has not disclosed, answered by somebody else, and propagated
    from there to life_areas, marriage_service and daily guidance as though she
    had said it herself.
    """
    data = _vault_member_reading(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
        age=30,
        relationship="sibling",
        name="Nila Synthetic Sibling",
    )

    assert data["pendingQuestion"] is None, data["pendingQuestion"]


def test_a_reading_that_stops_early_says_so_rather_than_just_stopping(
    client, family_vault_payload_factory, family_member_payload_factory
):
    """A short reading with no explanation reads as a broken one.

    Same rule as the withheld beat 5: an unexplained gap is a bug, and "this is
    where a chart read at second hand ends, and the rest is theirs" is the
    restraint it actually is. It must not claim to be a person, either — "bring
    them here and I will talk to them" is a first-person claim to practice and
    is v2 ship blocker #5.
    """
    data = _vault_member_reading(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
        age=41,
        relationship="spouse",
        name="Ilango Synthetic Spouse",
    )

    close = next(b for b in data["beats"] if b["id"] == "third_party_close")
    assert "Ilango" in close["text"]["en"]
    assert "Ilango" in close["text"]["ta"]
    body = _body(data, "en").lower()
    for claim in (" i ", "i will", "i have", "my practice", "in my experience"):
        assert claim not in f" {body} ", f"first-person claim to practice: {body}"


def test_the_owners_own_chart_is_still_read_to_them_in_the_second_person(
    client, family_vault_payload_factory, family_member_payload_factory
):
    """The gate is the RELATIONSHIP, not the vault.

    Without this the safety fix would quietly gut the feature for everyone who
    keeps their own chart in a family vault — which is most people who have one.
    """
    data = _vault_member_reading(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
        age=34,
        relationship="self",
        name="Arjun Synthetic Owner",
    )

    assert data["addressedTo"] == "self"
    assert "strength_and_cost" in [beat["id"] for beat in data["beats"]]


def test_a_minor_in_the_vault_keeps_the_guardian_register_rather_than_the_third_party_one(
    client, family_vault_payload_factory, family_member_payload_factory
):
    """Order matters: the minor branch is checked first, and must stay first.

    The guardian register is the STRICTER of the two third-party registers — it
    has its own vocabulary, drops the strength and past beats, and addresses the
    remedy to somebody who can act on it. Falling through to "other" would swap
    a reading written for this case for one written for a different one.
    """
    data = _vault_member_reading(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
        age=9,
        relationship="child",
        name="Meena Synthetic Child",
    )

    assert data["addressedTo"] == "parent"
    assert "years_ahead" in [beat["id"] for beat in data["beats"]]


# ── G2, the teen band: read TO them, not about them ──────────────────────────


@pytest.mark.parametrize("age", [13, 15, 17])
def test_a_teenager_reading_their_own_chart_is_addressed_directly(client, age):
    """§4.2 item 2. The whole 13-17 band used to get copy written for somebody else.

    A 17-year-old received a reading addressed to their parent, in the third
    person, out of a vocabulary written for an eight-year-old — "give the energy
    somewhere to go every day, a sport not a screen". The source document's
    13-21 gate says the client is addressed directly with the guardian present,
    and that is the one thing this band was not getting.
    """
    data = _read(client, age=age)

    assert data["addressedTo"] == "client_with_guardian"
    assert data["focusTopic"] == "TEEN"
    body = _body(data, "en")
    assert re.search(r"\byou\b|\byour\b", body.lower()), body
    # Still a minor: the legal gate is unchanged and the content blocks hold.
    for token in _ADULT_TOKENS_EN:
        assert token not in body.lower(), f"'{token}' reached a 17-and-under reading: {body}"


@pytest.mark.parametrize("age", [13, 15, 17])
def test_the_teen_reading_carries_no_character_verdict_and_no_dead_past_beat(client, age):
    """Two beats stay dropped, for two different reasons.

    strength_and_cost closes on a soft spot and a private grievance, which is a
    character verdict and is what §4.2 says this gate does not deliver.
    last_ten_years is degenerate by construction — its window is clamped to age
    15, so for a 15-year-old it spans nothing at all.
    """
    ids = [beat["id"] for beat in _read(client, age=age)["beats"]]

    assert "strength_and_cost" not in ids, ids
    assert "last_ten_years" not in ids, ids
    assert "right_now" in ids, ids


@pytest.mark.parametrize("age", [13, 15, 17])
def test_the_teen_reading_never_switches_person_mid_way(client, age):
    """Every beat addresses the teenager, including the falsifiability offer.

    `client_with_guardian` is reached only when the teenager holds the account,
    so they are the reader throughout. But _beat_what_this_rests_on chose its
    copy with `"self" if addressed_to == "self" else "third_person"`, and the
    teen register — added later — fell to the third-person side. The result was
    two consecutive sentences that disagreed about who was being spoken to:
    "You were born under Uthiram..." followed immediately by "If that does not
    sound like Sweep...". The reader's own name, used about them, to them.

    Checked on the falsifiability beat specifically rather than on the body as a
    whole: the body already contains "you" from other beats, so a whole-body
    search would pass while this exact sentence was still wrong.
    """
    data = _read(client, age=age)
    rests_on = next(b for b in data["beats"] if b["id"] == "what_this_rests_on")
    display_name = data.get("displayName") or ""
    given = display_name.split()[0] if display_name else None

    assert "does not sound like you" in rests_on["text"]["en"], rests_on["text"]["en"]
    if given:
        assert given not in rests_on["text"]["en"], (
            "the teenager is addressed as 'you' everywhere else; naming them here "
            f"talks about them instead of to them: {rests_on['text']['en']}"
        )


def test_a_soft_spot_that_repeats_its_own_noun_says_what_the_reader_does_with_it():
    """KETU's English endorsed the very cost it had just named.

    It read "staying, at the times when staying is what the situation needs",
    which the frame rendered as "Where it costs you is staying, at the times
    when staying is what the situation needs" — the cost is staying, and staying
    is what is needed. Its Tamil was always right (விலகிவிடுகிறீர்கள், "you
    withdraw"); only the English had dropped the verb.

    Deliberately narrow. The general shape — "a soft spot must explain itself" —
    is not machine-checkable: a first attempt at a table-wide rule ("the tail
    must contain a second-person verb") flagged eight correct entries, because
    RAHU's tail is a statement about the world and JUPITER's folds the cost into
    a single clause. A guard with eight false positives would be deleted the
    first time it fired. What IS checkable is the specific trap: when the tail
    repeats the head noun, the sentence has to say what the reader does with it,
    or the repetition reads as endorsement.
    """
    from app.services.one_minute_reading_service import _VOICE

    offenders = []
    for lord, voice in _VOICE.items():
        en = voice.shadow[1]
        head = re.split(r"[;,—]", en, maxsplit=1)[0].strip().lower()
        tail = en[len(head):]
        if head and head in tail.lower() and not re.search(r"\byou\b", tail):
            offenders.append(f"{lord}: {en}")

    assert not offenders, (
        "a soft spot repeats its own noun without naming the behaviour, so the "
        "frame turns it into 'the cost is X, and X is what is needed':\n"
        + "\n".join(offenders)
    )


def test_the_teen_remedy_is_shared_with_the_family_rather_than_handed_over(client):
    """"Guardian present" is a register, and the remedy is where it shows.

    The wording is age_phase_service.remedy_lead_in_for_stage's own — it already
    held the right sentence for STAGE_TEEN, and reusing it is what keeps a
    fourth register from costing a fourth vocabulary.
    """
    data = _read(client, age=16)
    one_thing = next(b for b in data["beats"] if b["id"] == "one_thing")

    assert one_thing["text"]["en"].startswith("To do together with family:")
    assert "parents can do" not in one_thing["text"]["en"]


def test_no_period_read_to_a_teenager_names_a_life_they_do_not_have():
    """``now_texture`` is the ONE table the teen register shares with the adult
    one, and two of its nine entries named an adult life surface.

    Jupiter's ran "teaching, children, and people senior to you tend to help"
    and Venus's "relationships, comfort and money move more easily now", both
    printed verbatim to a sixteen-year-old holding their own account. The
    parametrized minor test above could only catch it when a synthetic chart
    happened to land in one of those two mahadashas, which is not a guarantee —
    so this walks the table directly and the coverage stops depending on luck.

    The second half is what makes it a real test: the ADULT form must still
    contain the token. Otherwise a future contributor could satisfy this by
    stripping the karakatva from the adult copy, which is the opposite of the
    fix — Guru is putra-karaka and Sukra is kalatra-karaka, and the adult
    readings are where that belongs.
    """
    proved_the_override_does_work = 0
    for lord in reading._VOICE:
        teen_ta, teen_en = reading._now_texture(lord, "client_with_guardian")
        for token in _ADULT_TOKENS_EN:
            assert token not in teen_en.lower(), f"{lord} tells a teenager about '{token}': {teen_en}"
        for token in _ADULT_TOKENS_TA:
            assert token not in teen_ta, f"{lord} tells a teenager about '{token}': {teen_ta}"

        adult_en = reading._VOICE[lord].now_texture[1].lower()
        if any(token in adult_en for token in _ADULT_TOKENS_EN):
            assert lord in reading._MINOR_NOW_TEXTURE, (
                f"{lord}'s adult now_texture names an adult life surface and has no minor form"
            )
            proved_the_override_does_work += 1

    assert proved_the_override_does_work == len(reading._MINOR_NOW_TEXTURE), (
        "_MINOR_NOW_TEXTURE carries an entry whose adult form needs no override — "
        "a stale entry reads as coverage it is not providing"
    )


def test_a_teenager_in_someone_elses_vault_is_still_read_to_their_guardian(
    client, family_vault_payload_factory, family_member_payload_factory
):
    """§4.2 item 2 specifies this seam on AGE ALONE, and that is wrong for us.

    Addressing a teenager directly is right in a consultation, where they are in
    the room. On a family vault the reader is usually the parent, so a
    second-person teen reading on a child's member card would tell a father
    "you were born under Rohini" about his son — the same error as §3.1, one
    band down. The direct register is reached only when the teenager holds the
    account.
    """
    data = _vault_member_reading(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
        age=15,
        relationship="child",
        name="Karthik Synthetic Teen",
    )

    assert data["addressedTo"] == "parent"
    assert data["focusTopic"] == "CHILD_GROWTH"
    assert "Karthik" in _body(data, "en")


# ── G6: the refusal said out loud ────────────────────────────────────────────


@pytest.mark.parametrize("age", [62, 66, 71])
def test_an_elder_is_not_handed_their_own_decades_back(client, age):
    """§1.1(d), and the first gate-keyed trust beat (§4.2 item 3).

    The dated past is G4's mechanism and it is weak above ~50: a 67-year-old
    knows his own decades better than we do, and reciting them back is not
    impressive, it is filler. It is also what the refusal is paid for with — an
    elder reading ran 300 English words against a 285 ceiling carrying both, and
    the answer to that was not a bigger budget.
    """
    ids = [beat["id"] for beat in _read(client, age=age, marital_status="married")["beats"]]

    assert "last_ten_years" not in ids, ids
    # The hinge names the year the previous beat closed on, so dropping that
    # beat must drop the hinge with it rather than leaving it pointing at
    # nothing.
    assert "right_now" in ids, ids


@pytest.mark.parametrize("age", [62, 66, 71])
def test_an_elder_is_told_that_longevity_is_refused_rather_than_merely_not_given(client, age):
    """§1.1(g). Saying it is worth more than doing it.

    We have always omitted longevity, and a silence is indistinguishable from an
    oversight — or from not knowing. One sentence, no chart data, the highest
    trust-per-word in the source document.
    """
    body = _body(_read(client, age=age, marital_status="married"), "en")

    assert "does not read length of life" in body, body
    # The reason has to travel with the refusal, or it reads as a limitation
    # rather than a position.
    assert "changes how a person spends the years they have" in body, body


def test_the_refusal_claims_no_practice_of_its_own(client):
    """The source's third sentence is "because I have watched what that answer does".

    That is a first-person claim to practice — v2 ship blocker #5 — and does not
    port for the same reason "in fifty years" does not. What replaces it is the
    REASON, stated without a claimant: authority moved from the speaker to the
    argument, which is what the whole of Part 3 does.
    """
    body = _body(_read(client, age=68, marital_status="married"), "en").lower()

    for claim in ("i have watched", "i have seen", "in my experience", "years of practice"):
        assert claim not in body, f"first-person claim to practice: {body}"


@pytest.mark.parametrize("age", [8, 16, 30, 45])
def test_the_refusal_is_declared_where_the_question_is_live_and_nowhere_else(client, age):
    """A principle declared at every gate is a disclaimer answering nobody.

    The ban on longevity vocabulary is a lint and applies everywhere; the
    REFUSAL is copy and belongs to G6. They are not the same deliverable, and
    conflating them would put "this reading does not read length of life" in
    front of a parent of an eight-year-old who had not wondered.
    """
    body = _body(_read(client, age=age), "en")

    assert "length of life" not in body, body


# ── The jargon rule, and its language asymmetry ──────────────────────────────


_EN_JARGON = (
    "mahadasha", "antardasha", "antar dasha", "dasha", "bhukti", "vimshottari",
    "lagna", "rasi", "nakshatra", "ashtakavarga", "dosham", "dosha", "yoga",
    "pada", "graha", "bhava", "gochar", "navamsa", "varga", "kendra", "trikona",
    "dusthana", "karaka", "shadbala", "peyarchi", "ayanamsa",
)


@pytest.mark.parametrize("age,marital_status", [(8, None), (30, None), (33, "married"), (62, "married")])
def test_english_body_text_carries_no_technical_vocabulary(client, age, marital_status):
    data = _read(client, age=age, marital_status=marital_status)
    body = _body(data, "en").lower()
    for term in _EN_JARGON:
        assert not re.search(rf"\b{re.escape(term)}\b", body), f"'{term}' leaked into English body: {body}"


def test_tamil_body_text_keeps_its_household_words(client):
    """The asymmetry is deliberate, not an oversight.

    நட்சத்திரம் and ராசி are ordinary Tamil. Stripping them to match the English
    lint would make the copy read as translated-from-English, which costs
    exactly the trust this surface exists to earn. Asserted so a future
    "consistency" pass cannot quietly delete it.

    THE TWO WORDS ARE NOW CHECKED ON DIFFERENT REGISTERS, and that is the §6.17
    ruling rather than a weakening of this test. Cutting the self reading's rasi
    clauses obliged cutting their nouns with them — a named placement the reading
    says nothing about is the defect those clauses were added to fix. So ராசி
    survives only where the placement is still printed: `parent` and `other` are
    defined as chart facts with the interpretation withheld, so there the bare
    noun IS the deliverable.

    Asserting it on the self reading anyway is what turned this into a failure
    rather than a finding — a lint pinned to copy that no longer exists tests
    nothing and blocks everything.
    """
    body_self = _body(_read(client, age=33, marital_status="married"), "ta")
    assert "நட்சத்திர" in body_self

    body_parent = _body(_read(client, age=8), "ta")
    assert "நட்சத்திர" in body_parent
    assert "ராசி" in body_parent


def test_the_basis_field_is_where_the_technical_terms_live(client):
    """The reader who wants to check us can; the plain reader never sees it."""
    data = _read(client, age=33, marital_status="married")
    basis = " ".join(b["basis"]["en"] for b in data["beats"] if b.get("basis"))
    assert "nakshatra" in basis.lower()
    assert "mahadasha" in basis.lower()


@pytest.mark.parametrize(
    "age,marital_status,addressed_to",
    [(33, "married", "self"), (16, None, "client_with_guardian"), (8, None, "parent")],
)
def test_the_tamil_reading_names_the_star_and_rasi_in_tamil(
    client, age, marital_status, addressed_to
):
    """The star and the rasi are the first two nouns the reader meets.

    Both languages used to be handed one `_proper(nakshatra_name)`, so the Tamil
    opened on "நீங்கள் Anusham நட்சத்திரத்தில், Viruchigam ராசியில்" — English
    proper nouns inside Tamil prose, in the sentence whose entire job is to
    sound like a person talking. Every register that prints the placement is
    checked, because the three build it in three separate f-strings.
    """
    data = _read(client, age=age, marital_status=marital_status)
    beat = next(b for b in data["beats"] if b["id"] == "who_you_are")
    basis_en = beat["basis"]["en"]

    star_en = re.search(r"^(\w+) nakshatra", basis_en)
    assert star_en, f"basis does not name the star: {basis_en}"
    number = next(
        n for n, name in NAKSHATRA_EN.items() if name == star_en.group(1)
    )

    for field in ("text", "basis"):
        ta = beat[field]["ta"]
        assert NAKSHATRA_TA[number] in ta, f"{field}.ta lacks the Tamil star: {ta}"
        assert star_en.group(1) not in ta, f"{field}.ta still carries the English star: {ta}"
        for rasi_name in RASI_EN.values():
            assert rasi_name not in ta, f"{field}.ta still carries an English rasi: {ta}"


def test_every_nakshatra_has_a_tamil_name_aligned_to_the_machine_value():
    """A 27-row hand-typed map beside a 27-row constant is the classic drift pair.

    The English side is derived from `NAKSHATRA_NAMES` and so cannot drift; this
    guards the half that can. Alignment matters more than presence — a table
    that is complete but off by one row renders a wrong star name for 26 of 27
    readers and nothing else in the system would notice.
    """
    assert sorted(NAKSHATRA_TA) == list(range(1, 28))
    assert sorted(NAKSHATRA_EN) == list(range(1, 28))
    # Tamil script only, so an English name cannot be pasted into a gap.
    for number, name in NAKSHATRA_TA.items():
        assert not re.search(r"[A-Za-z]", name), f"nakshatra {number} is not Tamil: {name}"


# ── Tone, stability, and the hinge ───────────────────────────────────────────


@pytest.mark.parametrize(
    "age,marital_status",
    [(8, None), (22, None), (33, "married"), (45, "widowed"), (71, "widowed")],
)
def test_no_fatalistic_phrasing_reaches_any_string(client, age, marital_status):
    data = _read(client, age=age, marital_status=marital_status)
    for beat in data["beats"]:
        for lang in ("ta", "en"):
            assert tone_validator(beat["text"][lang]) == [], beat["text"][lang]


def test_the_reading_is_stable_across_days_inside_its_window(client):
    """A life story that reads differently each morning announces itself as generated."""
    created = client.post("/api/v1/birth-profiles", json=_profile(age=33, marital_status="married"))
    chart_id = created.json()["data"]["chartId"]

    window = client.get(f"/api/v1/charts/{chart_id}/one-minute").json()["data"]["readingWindow"]
    start = date.fromisoformat(window["from"])
    end = date.fromisoformat(window["to"])
    # Two days that are both inside the current antardasha.
    first_day = max(start, TODAY.replace(day=1))
    assert first_day < end

    a = client.get(f"/api/v1/charts/{chart_id}/one-minute", params={"asOf": first_day.isoformat()})
    b = client.get(
        f"/api/v1/charts/{chart_id}/one-minute",
        params={"asOf": first_day.replace(day=first_day.day + 1).isoformat()},
    )
    assert a.json()["data"]["beats"] == b.json()["data"]["beats"]


def test_beat_four_hinges_on_the_year_beat_three_closed_on(client):
    """Seven facts become one piece of writing only if each beat opens the next.

    Beat 3 names the year of the turn and beat 4 must pick it up. Without the
    hinge the reader gets a list, and a list does not carry anyone to the end.
    """
    checked = 0
    for age in (25, 30, 40, 55, 66):
        data = _read(client, age=age, marital_status="married" if age > 35 else None)
        past = next((b for b in data["beats"] if b["id"] == "last_ten_years"), None)
        now = next(b for b in data["beats"] if b["id"] == "right_now")
        if past is None:
            continue
        years = re.findall(r"\b((?:19|20)\d{2})\b", past["text"]["en"])
        if not years:
            continue
        if "That changed in" in now["text"]["en"] or "Since" in now["text"]["en"]:
            assert years[-1] in now["text"]["en"], (past["text"]["en"], now["text"]["en"])
            checked += 1
    assert checked >= 1, "no chart in the sample exercised the hinge branch"


def _to_jd(value: date) -> float:
    return utc_datetime_to_julian_day(datetime(value.year, value.month, value.day, tzinfo=UTC))


def _maha(lord: str, start: date, end: date, index: int) -> DashaPeriod:
    to_jd = _to_jd
    return DashaPeriod(
        level="maha",
        lord=lord,
        start_jd=to_jd(start),
        end_jd=to_jd(end),
        start_date=start,
        end_date=end,
        sequence_index=index,
    )


def test_a_window_holding_two_handovers_names_the_lord_that_actually_ran():
    """"From 2016 to 2026 you were under Venus" — said to a chart whose Venus
    ended in 2020 and whose Sun then ran the six years to 2026.

    Two mahadasha turns fell inside the ten-year window, and the beat paired the
    lord covering the window's START with the year of the LAST turn. The six Sun
    years the reader actually lived vanished, and the prose contradicted the
    basis line printed directly beneath it. This beat's entire value is that its
    dates are checkable, so it is pinned here at a level the API sample cannot
    reach reliably: a timeline with two handovers, built by hand.
    """
    mahadashas = (
        _maha("KETU", date(1993, 3, 20), date(2000, 3, 20), 0),
        _maha("VENUS", date(2000, 3, 20), date(2020, 3, 20), 1),
        _maha("SUN", date(2020, 3, 20), date(2026, 3, 13), 2),
        _maha("MOON", date(2026, 3, 13), date(2036, 3, 13), 3),
    )
    timeline = VimshottariTimeline(
        opening_lord="KETU",
        balance_years_at_birth=7.0,
        opening_end_jd=mahadashas[0].end_jd,
        mahadashas=mahadashas,
        current_mahadasha=mahadashas[3],
        current_antardasha=mahadashas[3],
        current_pratyantardasha=mahadashas[3],
        current_sookshmadasha=mahadashas[3],
        current_pranadasha=mahadashas[3],
    )

    beat, hinge, theme_lord = _beat_last_ten_years(
        timeline=timeline, as_of=date(2026, 8, 4), birth_date=date(1993, 3, 20)
    )

    assert "From 2020 to 2026 you were under Sun" in beat.text.en, beat.text.en
    assert "Venus" not in beat.text.en, beat.text.en
    assert hinge == (2026, "maha")
    assert theme_lord == "SUN"
    # The years in the prose must sit inside the span its own basis line prints.
    assert "Sun mahadasha 2020-2026" in beat.basis.en, beat.basis.en


def test_a_turn_that_was_only_a_bhukti_change_never_claims_the_period_changed(client):
    """"That changed in 2026. You are in a Venus period now" — off a turn that
    was a bhukti change inside an unbroken Venus mahadasha. The reader is told
    something changed and then told it is the same graha, in consecutive
    sentences. The two levels of turn need two different connectives."""
    for age in (22, 25, 30, 40, 55, 66):
        data = _read(client, age=age, marital_status="married" if age > 35 else None)
        past = next((b for b in data["beats"] if b["id"] == "last_ten_years"), None)
        now = next(b for b in data["beats"] if b["id"] == "right_now")
        if past is None or "That changed in" not in now["text"]["en"]:
            continue
        # A "That changed" lead may only follow a mahadasha handover, and the
        # lord named now must differ from the lord named for the past stretch.
        past_lords = {w for w in re.findall(r"\b[A-Z][a-z]+\b", past["text"]["en"])}
        now_lord = re.search(r"in a (\w+) period now", now["text"]["en"])
        assert now_lord is not None, now["text"]["en"]
        assert now_lord.group(1) not in past_lords, (past["text"]["en"], now["text"]["en"])


def test_a_young_adult_is_not_told_their_childhood_was_their_decade(client):
    """"The last ten years repaid your patience with comfort", told to a
    22-year-old, is a claim about a twelve-year-old. The window is clamped to
    age 15 and the beat names the real span."""
    data = _read(client, age=22, employment_type="student")
    past = next(b for b in data["beats"] if b["id"] == "last_ten_years")
    years = [int(y) for y in re.findall(r"\b((?:19|20)\d{2})\b", past["text"]["en"])]
    assert years, past["text"]["en"]
    assert min(years) >= TODAY.year - 22 + 15


def test_an_elder_is_not_told_about_reinventing_their_work(client):
    """Elder must be checked before married, or a married 66-year-old is handed
    a career-pivot framing that is not wrong so much as absurd at 66."""
    data = _read(client, age=66, marital_status="married")
    assert data["focusTopic"] == "ELDER"
    body = _body(data, "en").lower()
    assert "reinventing your work" not in body


# ── Prose hygiene: the tells that a template wrote it ────────────────────────


@pytest.mark.parametrize(
    "age,marital_status,employment_type",
    [(7, None, None), (22, None, "student"), (30, None, None), (38, "married", None), (66, "married", None)],
)
def test_no_sentence_starts_in_lower_case(client, age, marital_status, employment_type):
    """The facets are clauses; used to open a sentence they must be capitalised.

    "You are in a Venus period now. this is a generous stretch" is the single
    most obvious tell that a template produced the text.
    """
    data = _read(client, age=age, marital_status=marital_status, employment_type=employment_type)
    for beat in data["beats"]:
        for sentence in re.split(r"(?<=[.!?])\s+", beat["text"]["en"]):
            if sentence.strip():
                assert sentence.strip()[0].isupper(), beat["text"]["en"]


@pytest.mark.parametrize("age,employment_type", [(7, None), (30, None), (38, None)])
def test_star_and_rasi_names_are_not_shouted(client, age, employment_type):
    """Chart-layer names arrive uppercase; left alone, the first noun the reader
    meets reads like an error message."""
    data = _read(client, age=age, employment_type=employment_type)
    opening = next(b for b in data["beats"] if b["id"] == "who_you_are")
    for text in (opening["text"]["en"], opening["text"]["ta"]):
        assert not re.search(r"\b[A-Z]{4,}\b", text), text


# ── Doctrine: what the copy may and may not claim ────────────────────────────


_EVENT_CLAIM_PATTERNS = (
    r"\byou will\b",
    r"\byou lost\b",
    r"\byou got married\b",
    r"\bwill happen\b",
    r"\bguarantee",
    r"\bdefinitely\b",
)


@pytest.mark.parametrize("age,marital_status", [(8, None), (30, None), (33, "married"), (62, "married")])
def test_the_reading_names_texture_and_never_an_event(client, age, marital_status):
    """Vimshottari says which lord ran a stretch. It does not say what happened.

    This is the line between this product and a fortune-teller, so it is a test
    rather than a comment.
    """
    body = _body(_read(client, age=age, marital_status=marital_status), "en").lower()
    for pattern in _EVENT_CLAIM_PATTERNS:
        assert not re.search(pattern, body), f"event claim '{pattern}' in: {body}"


def _who_you_are(data: dict) -> dict:
    return next(b for b in data["beats"] if b["id"] == "who_you_are")


def test_an_unconfirmed_birth_time_withholds_the_lagna(client):
    """A wrong birth time moves the lagna, and beat 1 is what most depends on it.

    Opening confidently on a lagna we are not sure of loses the reader at
    sentence one — which costs the whole reading, not just that clause.

    EACH DIRECTION IS ASSERTED ON A SURFACE THAT STILL VARIES, which is the
    §6.17 repair and the reason this test failed rather than merely aged. The
    self reading's prose no longer prints the lagna at all — the clause was cut
    for length and its noun went with it — so `"rising" not in text` had become
    true of every reading ever generated, confirmed or not. A negative with no
    live positive control beside it is the stale-baseline failure this repo has
    paid for before, and here it was the guard for a claim we make about our own
    honesty.

    So the withholding is now checked where it is actually decided:

    - `basis`, on the self register, where the lagna is either named or its
      absence is explained. This is the surface the reader who wants to check us
      opens.
    - `text`, on the `parent` register, which still prints the placement — so
      there is one register where the prose-level guard has something to prove.
    """
    unsure = _who_you_are(
        _read(client, age=33, marital_status="married", birth_time_source="unknown")
    )
    confirmed = _who_you_are(
        _read(client, age=33, marital_status="married", birth_time_source="BIRTH_CERTIFICATE")
    )

    # Both languages state the withholding rather than going quiet on it. The
    # Tamil sentence necessarily contains லக்னம் — it is the word being withheld
    # — so the discriminator is the refusal verb, not the noun.
    assert "birth time is not confirmed" in unsure["basis"]["en"]
    assert "பயன்படுத்தப்படவில்லை" in unsure["basis"]["ta"]

    assert "lagna" in confirmed["basis"]["en"]
    assert "withheld" not in confirmed["basis"]["en"]
    assert "லக்னம்" in confirmed["basis"]["ta"]
    assert "பயன்படுத்தப்படவில்லை" not in confirmed["basis"]["ta"]

    # The prose path, on the register that still has prose to withhold.
    unsure_child = _who_you_are(_read(client, age=8, birth_time_source="unknown"))
    confirmed_child = _who_you_are(_read(client, age=8, birth_time_source="BIRTH_CERTIFICATE"))

    assert "rising" not in unsure_child["text"]["en"]
    assert "லக்னத்தில்" not in unsure_child["text"]["ta"]
    assert "rising" in confirmed_child["text"]["en"]
    assert "லக்னத்தில்" in confirmed_child["text"]["ta"]


@pytest.mark.parametrize("age,marital_status", [(22, None), (33, "married"), (45, "widowed")])
def test_every_placement_the_opening_names_is_a_placement_it_reads(client, age, marital_status):
    """THE INVARIANT IS UNCHANGED; what satisfies it is.

    Until 2026-08-07 the opening said "you were born under Anusham, Moon in
    Viruchigam, Meenam rising" and then took its character line from the
    nakshatra lord alone. The other two nouns were decoration — two readers with
    different stars AND different Moon rasis got word-for-word identical
    openings whenever their signature graha happened to coincide, which is
    common. Naming a placement and reading nothing from it is worse than not
    naming it: the reader can see the noun, so the silence after it is legible
    to them and to nobody else.

    That was first satisfied by adding the two missing clauses. §6.17 cut them
    for length, so it is now satisfied the other way — one noun, and the nature
    sentence is read from it. Both directions honour the same rule, which is
    why this test kept its name: the failure it exists to catch is a THIRD
    state, where a noun is printed and nothing follows from it.
    """
    data = _read(client, age=age, marital_status=marital_status)
    beat = next(b for b in data["beats"] if b["id"] == "who_you_are")

    for lang in ("en", "ta"):
        text = beat["text"][lang]
        # No rasi may be named in the self reading's opening — neither language,
        # and Tamil is checked against the Tamil spellings it now renders.
        for rasi_name in (*RASI_EN.values(), *RASI_TA.values()):
            assert rasi_name not in text, f"{lang} opening still names a rasi: {text}"

    # The star IS named, and the nature line keyed to its lord is what reads it.
    star = re.search(r"^(\w+) nakshatra", beat["basis"]["en"])
    assert star, beat["basis"]["en"]
    assert star.group(1) in beat["text"]["en"], beat["text"]["en"]
    lord = re.search(r"lord (\w+)", beat["basis"]["en"]).group(1)
    graha = next(g for g, name in PLANET_EN.items() if name == lord)
    # Case-insensitive: the nature clause is lower-cased when a connective
    # precedes it, which is `_transition` working rather than a mismatch.
    nature = reading._VOICE[graha].nature.en.rstrip(".").lower()
    assert nature in beat["text"]["en"].lower(), beat["text"]["en"]


def test_a_chart_read_at_second_hand_keeps_its_dispositions_to_itself(
    client, family_vault_payload_factory, family_member_payload_factory
):
    """The two new tables are dispositions, so §3.1 governs them.

    An adult who is not the one reading gets the chart facts and no character
    note; a child's reading is a different artifact rather than the adult one
    softened. A clause about how this person's mind works, or about how other
    people meet them, is precisely the material both of those registers exist to
    withhold — and it would have arrived attached to a fact sentence that both
    registers legitimately keep, which is how it would have gone unnoticed.
    """
    for age, relationship, name in ((26, "sibling", "Anitha Synthetic"), (8, "child", "Ravi Synthetic")):
        data = _vault_member_reading(
            client,
            family_vault_payload_factory,
            family_member_payload_factory,
            age=age,
            relationship=relationship,
            name=name,
        )
        beat = next(b for b in data["beats"] if b["id"] == "who_you_are")
        for table_name in ("_MOON_MIND", "_LAGNA_FACE"):
            for rasi, (ta, en) in getattr(reading, table_name).items():
                assert en not in beat["text"]["en"], f"{table_name}[{rasi}] reached {relationship}"
                assert ta not in beat["text"]["ta"], f"{table_name}[{rasi}] reached {relationship}"
        # The basis must not advertise a derivation the text did not make.
        assert "Moon in" not in beat["basis"]["en"], beat["basis"]["en"]


# ── Falsifiability: the trust device only software can offer ──────────────────


@pytest.mark.parametrize("age,marital_status", [(8, None), (30, None), (33, "married"), (66, "married")])
def test_every_reading_says_what_it_rests_on_before_it_asks_to_be_believed(
    client, age, marital_status
):
    """Spec v2 Part 3 substitute #4, and it is the one that does not port BACK.

    A practitioner cannot say "this may all rest on bad input" without losing
    the room. Software can, it costs nothing, and it converts the honest
    weakness into the credibility the borrowed "fifty years of practice" was
    faking — which is why it is asserted on every path including the minor one,
    and asserted to be SECOND rather than merely present.
    """
    data = _read(client, age=age, marital_status=marital_status)
    ids = [beat["id"] for beat in data["beats"]]

    assert "what_this_rests_on" in ids, ids
    # Position is the device. Arriving later it is a disclaimer attached to a
    # reading already delivered, by which point "that is not me" has stopped
    # being a cheap thing for the reader to say.
    assert ids[1] == "what_this_rests_on", ids


def test_the_falsifiability_offer_points_at_the_input_it_is_evidence_about(client):
    """The correction v2's own wording needed before it could be used here.

    v2 places this offer before a paragraph DESCRIBING the lagnam, so "if that
    is not you, the birth time is off" is sound there. Our opening is built on
    the janma nakshatra and the chart signature, and the Moon moves ~0.55° an
    hour against a 13°20' nakshatra — twenty minutes essentially never moves the
    star. So a confirmed reading must send the reader to the DATE as well as the
    time, and only the unconfirmed reading, which is actually about the lagna,
    gets to rest its case on twenty minutes.
    """
    confirmed = _read(client, age=33, marital_status="married")
    unsure = _read(client, age=33, marital_status="married", birth_time_source="unknown")

    confirmed_text = next(b for b in confirmed["beats"] if b["id"] == "what_this_rests_on")["text"]
    unsure_text = next(b for b in unsure["beats"] if b["id"] == "what_this_rests_on")["text"]

    assert "birth date and time" in confirmed_text["en"], confirmed_text["en"]
    # The unconfirmed form states the uncertainty band (v2 Part 3 substitute #3)
    # rather than asking for a check we already know the answer to, and it says
    # what the reading stood on instead — otherwise "we left something out" is
    # an admission with no reassurance attached.
    assert "not confirmed" in unsure_text["en"], unsure_text["en"]
    # Case-insensitive: the reassurance was a trailing clause ("it does not move
    # your star") until 2026-08-07 and is now its own sentence, because the
    # clause it used to trail — "which the rest is built on" — was false. What
    # this test is pinning is that the star is named as what survives, not where
    # in the paragraph it lands.
    assert "your star" in unsure_text["en"].lower(), unsure_text["en"]
    assert "நட்சத்திர" in unsure_text["ta"], unsure_text["ta"]


def test_the_falsifiability_offer_addresses_the_person_who_can_act_on_it(client):
    """A parent cannot check whether a reading "sounds like you".

    Same rule as _beat_one_thing: an instruction aimed at a child has no valid
    recipient. Here the whole beat is an instruction, so the register has to
    follow the reading's.
    """
    data = _read(client, age=8, display_name="Meena Synthetic Child")
    beat = next(b for b in data["beats"] if b["id"] == "what_this_rests_on")

    assert data["addressedTo"] == "parent"
    assert "Meena" in beat["text"]["en"]
    assert "Meena" in beat["text"]["ta"]
    assert "sound like you" not in beat["text"]["en"]


def test_an_unconfirmed_time_says_which_half_of_the_reading_actually_moves(client):
    """The offer used to claim the star was all the rest stood on. It was false.

    ``_signature_lord`` and ``_strongest_and_weakest`` both key on
    ``strength_score``, and ``explain_natal_planet_score`` takes the lagna and
    swings house strength 25-80 on it. So the opening line and the whole
    strength/cost beat rested on the input the sentence had just disclaimed —
    in the one register whose entire job is to be honest about that.

    The caveat is keyed on ``addressed_to``, NOT on the falsifiability register,
    and that distinction is the test's real subject: ``client_with_guardian``
    shares the "self" key while carrying neither the signature opening nor the
    strength beat, so a register-keyed caveat would tell a teenager to discount
    a sentence their reading does not contain.
    """
    unsure = _read(client, age=38, birth_time_source="APPROXIMATE")
    beat = next(b for b in unsure["beats"] if b["id"] == "what_this_rests_on")
    assert unsure["addressedTo"] == "self"
    assert "The strength and the cost named next" in beat["text"]["en"], beat["text"]["en"]
    assert "அடுத்து வரும் பலமும்" in beat["text"]["ta"], beat["text"]["ta"]
    # ...and the beat it points at is in fact the next one.
    ids = [b["id"] for b in unsure["beats"]]
    assert ids[ids.index("what_this_rests_on") + 1] == "strength_and_cost", ids
    # The false clause is gone rather than softened.
    assert "which the rest is built on" not in beat["text"]["en"]

    # A confirmed time raises none of this — there is nothing to discount.
    sure = _read(client, age=38)
    sure_beat = next(b for b in sure["beats"] if b["id"] == "what_this_rests_on")
    assert "named next" not in sure_beat["text"]["en"]

    # A teenager shares the register and not the beats, so they must not be told
    # to discount a strength reading they were never given.
    teen = _read(client, age=16, birth_time_source="APPROXIMATE")
    teen_beat = next(b for b in teen["beats"] if b["id"] == "what_this_rests_on")
    assert teen["addressedTo"] == "client_with_guardian"
    assert "strength_and_cost" not in [b["id"] for b in teen["beats"]]
    assert "named next" not in teen_beat["text"]["en"], teen_beat["text"]["en"]

    # And the third-person registers KEEP the strong claim, because for them it
    # is true: neither emits the signature opening nor the strength beat.
    child = _read(client, age=8, birth_time_source="APPROXIMATE")
    child_beat = next(b for b in child["beats"] if b["id"] == "what_this_rests_on")
    assert "which the rest is built on" in child_beat["text"]["en"]


@pytest.mark.parametrize("age,marital_status", [(25, None), (33, "married"), (45, "widowed")])
def test_the_dated_past_hands_the_reader_the_judgement_on_it(client, age, marital_status):
    """v2's E->R conversion operator, second half — see ``_PAST_INVITATION``.

    We shipped the rule ("that stretch asked for endurance") without the
    invitation ("whether it took that form for you, you will know") from launch
    until 2026-08-07. The rule alone is a statement the reader has to decide
    what to do with; the invitation tells them to check it against a decade they
    lived, which is this beat's entire reason to exist.
    """
    data = _read(client, age=age, marital_status=marital_status)
    past = next(b for b in data["beats"] if b["id"] == "last_ten_years")

    assert "only you can say" in past["text"]["en"], past["text"]["en"]
    assert "நீங்கள்தான் சொல்ல முடியும்" in past["text"]["ta"], past["text"]["ta"]
    # It invites; it must never assert. The operator exists precisely so that a
    # miss says nothing false, and "whether" is what carries that.
    assert "Whether it took that form" in past["text"]["en"]
    # It also may not reach for the future to do it. The first draft read "you
    # will know" and _EVENT_CLAIM_PATTERNS rejected it, correctly — that is the
    # construction one edit away from "you will marry".
    assert "you will" not in past["text"]["en"].lower()

    # The invitation carries no year, so it cannot displace the hinge that beat
    # 4 opens on — the reason it sits before the turn sentence, not after it.
    assert not re.search(r"\b(?:19|20)\d{2}\b", reading._PAST_INVITATION[1])


def test_the_connective_between_two_sentences_comes_from_their_meaning():
    """It used to come from whether two GRAHAS were the same one.

    `signature_lord != nakshatra_lord` means "different graha", not "opposing
    content" — with nine grahas it fires almost always, and a sweep found `And
    yet:` claiming a tension that was not there in seven readings out of nine. A
    Rahu opening ("reaching past the edge of it") followed by "And yet: you
    carry yourself as someone in charge" announces a contradiction between two
    sentences that plainly agree.

    The reader never sees a graha. They see two sentences and the word joining
    them, and they notice when that word is wrong.
    """
    outward = reading._Line("வெளி", "outward line", reading.Orientation.OUTWARD)
    other_outward = reading._Line("வேறு", "another outward line", reading.Orientation.OUTWARD)
    inward = reading._Line("உள்", "inward line", reading.Orientation.INWARD)

    assert reading._transition(outward, inward) == reading._CONTRAST
    assert reading._transition(inward, outward) == reading._CONTRAST
    assert reading._transition(outward, other_outward) == reading._CONTINUATION
    # The same line twice is not a transition. A connective there would be
    # punctuation pretending to be thought.
    assert reading._transition(outward, outward) == reading._NO_TRANSITION

    # Both languages must make the SAME claim, which is what broke before: the
    # single connective was ("அதே நேரத்தில்:", "And yet:") — but அதே நேரத்தில்
    # means "at the same time", a continuation, while "And yet" asserts a
    # contrast. The two languages were printing opposite claims about the same
    # pair of sentences for as long as the device existed.
    assert reading._CONTRAST != reading._CONTINUATION
    assert reading._CONTINUATION[0] == "அதே நேரத்தில்:"
    assert "at the same time" in reading._CONTINUATION[1].lower()

    # A connective may not collide with the sentence it introduces. ஆனால் is the
    # obvious Tamil for a contrast and it is unusable here: every nature line
    # contains it already, because rule 2 attaches each trait's cost with ஆனால்.
    # Printed together it read "…ஆனால், தொடங்கியதை முடிப்பவர்; … — ஆனால் ஒரு…".
    # The English has no such collision ("And yet" against "though"), so nothing
    # about the English side of this table would have shown it.
    for connective in (reading._CONTRAST, reading._CONTINUATION):
        lead_ta = connective[0].rstrip(":,").strip()
        if not lead_ta:
            continue
        for lord, voice in reading._VOICE.items():
            assert lead_ta not in voice.nature.ta, (
                f"the connective '{lead_ta}' already appears inside {lord}'s Tamil nature line, "
                f"so the two collide when printed together: {voice.nature.ta}"
            )


def test_every_temperament_sentence_carries_its_own_meaning_tag():
    """The tag travels ON the sentence, never in a table beside it.

    That is the whole reason this is not a graha-pair table: a pair table is
    tied to wording, so rewriting one nature line silently invalidates every
    pair involving that graha with nothing to catch it. A field on the same
    literal cannot be missed by anyone editing the text.
    """
    for lord, opening in reading._SIGNATURE_OPENING.items():
        assert isinstance(opening, reading._Line), lord
        assert isinstance(opening.faces, reading.Orientation), lord
        assert opening.ta and opening.en, lord
    for lord, voice in reading._VOICE.items():
        assert isinstance(voice.nature, reading._Line), lord
        assert isinstance(voice.nature.faces, reading.Orientation), lord

    # Both poles must be populated, or the axis is not an axis and every reading
    # takes the same branch — which is the defect this replaced, inverted.
    poles = {line.faces for line in reading._SIGNATURE_OPENING.values()}
    poles |= {v.nature.faces for v in reading._VOICE.values()}
    assert poles == set(reading.Orientation), poles


@pytest.mark.parametrize("age,marital_status", [(25, None), (33, "married"), (45, "widowed")])
def test_the_gift_its_shadow_and_its_consequence_all_come_from_one_graha(
    client, age, marital_status
):
    """"Which is why" must be true by construction, not by coincidence.

    Beat 3 used to draw the gift from the strongest graha, the cost from the
    weakest and the grievance from the signature, then assert the second caused
    the third. They cohered in one reading out of nine — worse than chance,
    because the signature is the DOMINANT graha and the cost came from the
    WEAKEST, so the two were actively anti-correlated. What reached the reader
    was three separate observations wearing the grammar of one.

    A jodhidar says: Sevvai is your strength; because Sevvai is strong you move
    before others; and because of that you wonder why people resisted something
    obvious to you. One graha, one voice.

    §6.17 stopped the chain at the shadow for length. The one-graha rule is what
    survives and is what this test is really for — it applies to however many
    links the beat has, and it is the property that would break silently if a
    later change reached for a second graha to fill the shorter beat out.
    """
    data = _read(client, age=age, marital_status=marital_status)
    beat = next(b for b in data["beats"] if b["id"] == "strength_and_cost")

    # The basis names one graha, and the copy must be that graha's throughout.
    strongest = next(
        lord for lord in reading._VOICE if planet_en(lord) in beat["basis"]["en"]
    )
    voice = reading._VOICE[strongest]
    assert voice.gift[1] in beat["text"]["en"], beat["text"]["en"]
    assert voice.shadow[1] in beat["text"]["en"], beat["text"]["en"]

    # No OTHER graha's gift or shadow may appear — the failure mode the one-graha
    # rule exists to stop, and the shorter beat is exactly when padding tempts.
    for lord, other in reading._VOICE.items():
        if lord == strongest:
            continue
        assert other.gift[1] not in beat["text"]["en"], f"{lord} gift leaked in"
        assert other.shadow[1] not in beat["text"]["en"], f"{lord} shadow leaked in"

    # The grievance chain is out of the one-minute reading (§6.17). Pinned, not
    # merely absent: it was cut for length and would come back for the same
    # reason it was written, which was a good one.
    assert reading._GRIEVANCE[strongest][1] not in beat["text"]["en"], beat["text"]["en"]
    assert "Which is why" not in beat["text"]["en"]
    assert reading._VALIDATION[1] not in beat["text"]["en"]


@pytest.mark.parametrize("age,marital_status", [(25, None), (33, "married"), (66, "married")])
def test_the_lesson_beat_is_held_back_from_the_one_minute_reading(
    client, age, marital_status
):
    """§6.17: it exists, it is correct, and it is not in the minute.

    The cut is asserted rather than left implicit because the beat's builder and
    vocabulary are both still here, one call away from returning — which is the
    point of keeping them, and also the way this would come back by accident.
    """
    ids = [b["id"] for b in _read(client, age=age, marital_status=marital_status)["beats"]]
    assert "what_life_keeps_teaching" not in ids, ids


def test_the_lesson_still_closes_its_own_grahas_chain():
    """Tested against the builder, because the reading no longer calls it.

    The property is what makes the beat worth keeping for the longer reading, so
    it is worth keeping tested: the lesson must ANSWER the shadow rather than
    raise a second difficulty. Keyed on the weakest graha for one afternoon, the
    pairing was arbitrary eight times in nine; from the same graha the closure is
    real rather than rhetorical — Guru's chain ends "everyone comes to me, so
    who comes for me?" and Guru's lesson answers exactly that.

    All nine grahas, where the old route through the API could only ever reach
    the three the fixtures happened to produce.
    """
    for strongest in reading._VOICE:
        beat = reading._beat_what_life_keeps_teaching(strongest=strongest)
        assert beat.text.en == reading._VOICE[strongest].life_lesson[1], strongest
        assert beat.text.ta == reading._VOICE[strongest].life_lesson[0], strongest
        assert planet_en(strongest) in beat.basis.en, strongest

        # No frame. These sentences are self-contained by design, and a lead-in
        # would be the beat introducing itself.
        assert beat.text.en[0].isupper(), strongest
        assert not beat.text.en.startswith("One lesson"), strongest
        # "Life keeps teaching you X" is one clause from "life taught you X in
        # 2019", an event claim. The class boundary runs directly under this beat.
        assert not re.search(r"\b(?:19|20)\d{2}\b", beat.text.en), beat.text.en


def test_every_life_lesson_answers_its_own_grahas_complaint():
    """The vocabulary is a narrative primitive now, not a copy optimisation.

    ``shadow`` answers "where does this strength become excessive"; ``life_lesson``
    answers "what does that keep teaching". Different questions, so the second
    may not be phrased out of the first — the same rule that gave minors their
    own copy rather than a rephrasing of the adults'.

    A GENERAL RULE WAS TRIED AND REMOVED, and the removal is the finding. "The
    lesson may not repeat the shadow's head noun" sounds like the right check
    and fires on two entries, one of which is correct: SATURN's shadow is
    *starting* and its lesson is "waiting for certainty costs more than starting
    without it" — the echo is the whole point, because the lesson is telling
    them to start. It did catch MERCURY, whose lesson closed on the shadow's own
    noun and left the grievance unanswered; that copy was fixed. But a rule that
    needs an exception carved for a correct entry is a wrong rule, and this repo
    has already paid for the lint that cried wolf.

    What remains is the shape, plus the one trap that IS decidable.
    """
    for lord, voice in reading._VOICE.items():
        lesson_en = voice.life_lesson[1]
        assert lesson_en.endswith("."), f"{lord}: the lesson is a whole sentence"
        assert lesson_en[0].isupper(), lord
        assert lesson_en != voice.shadow[1], f"{lord}: the lesson IS the shadow"
        # A lesson that prescribes more of the shadow endorses the cost it just
        # named. SATURN is the live case and the reason this is written down:
        # "life keeps teaching you patience" is the obvious Sani sentence and it
        # is advice to do more of the problem, because this graha's shadow is
        # that it already waits too long. Same failure as the KETU soft spot,
        # one facet later.
        if lord == "SATURN":
            assert "patience" not in lesson_en.lower(), lesson_en


def test_the_supportive_outlook_cannot_be_read_as_the_slow_one(client):
    """"The current period is behind this" shipped, and "behind" reads as
    "lagging" as readily as "supporting".

    It lands immediately after a sentence about where the chart's weight sits,
    where both readings are plausible — so a reader taking the wrong one was
    told the opposite of what the dasa/area affinity computed. The Tamil was
    never ambiguous (ஆதரவாக இருக்கிறது), which makes this the second time on
    this surface that the ENGLISH was the copy at risk.
    """
    for clause in (reading._OUTLOOK_SUPPORTIVE, reading._OUTLOOK_MIXED, reading._OUTLOOK_SLOW):
        assert "behind" not in clause[1].lower(), clause[1]


# ── The two cross-gate lints ─────────────────────────────────────────────────
#
# §4.2 item 4. Both come from the source document's cross-gate rules, and
# neither had anything enforcing it: `run_safety_pass` is tone-only by design,
# and `tone_validator` bans fatalism without saying anything about boundedness.


# Difficulty language, chosen to match the vocabulary we actually ship rather
# than to be exhaustive — a lint that guesses at words nobody wrote is a lint
# that never fires, which is worse than none because it reads as coverage.
_DIFFICULTY_EN = (
    "asks for patience", "pays late", "slow", "delay", "harder",
    "endurance", "against you", "loss", "struggle",
)
_DIFFICULTY_TA = ("பொறுமையைக் கேட்கிறது", "தாமத", "இழப்ப", "கடின")
_BOUND = re.compile(r"\b(?:19|20)\d{2}\b")

# The rule is about difficulties, and a difficulty is a claim about a PERIOD.
# A trait's cost is not one: "once committed to a way of working, you find it
# hard to let go" has no expiry because it is not supposed to have one — rule 2
# says every trait carries its own cost, and a cost that expired would be a
# gift. Scoping to the time beats is what separates the two, and it is not a
# convenience: applied to the whole reading this lint fired on the nature line,
# which is the one place an unbounded negative is correct.
_TIME_BEATS = frozenset({
    "last_ten_years", "right_now", "next_ten_years", "your_age_question", "period_now",
})


@pytest.mark.parametrize(
    ("age", "marital_status", "employment_type"),
    [(8, None, None), (16, None, None), (26, "single", None), (33, "married", None),
     (45, "widowed", None), (52, None, "employed_salaried"), (66, "married", None),
     (71, "widowed", "retired")],
)
def test_every_difficulty_is_bounded_by_a_date(client, age, marital_status, employment_type):
    """"If a difficulty cannot be bounded by a bukthi, it does not get said."

    A negative with no end is the single cruellest thing this surface can emit,
    and it is easy to write by accident — the vocabulary supplies the
    difficulty and the FRAME supplies the year, so the two can come apart
    without either half looking wrong on its own. That is exactly how it broke:
    `right_now`'s no-hinge lead named no year at all, and it became the live
    path for every elder the moment G6 dropped the past beat.
    """
    data = _read(client, age=age, marital_status=marital_status, employment_type=employment_type)

    for beat in data["beats"]:
        if beat["id"] not in _TIME_BEATS:
            continue
        en = beat["text"]["en"].lower()
        if any(marker in en for marker in _DIFFICULTY_EN):
            assert _BOUND.search(beat["text"]["en"]), (
                f"unbounded difficulty in beat '{beat['id']}': {beat['text']['en']}"
            )
        ta = beat["text"]["ta"]
        if any(marker in ta for marker in _DIFFICULTY_TA):
            assert _BOUND.search(ta), f"unbounded difficulty in beat '{beat['id']}': {ta}"


_LONGEVITY_EN = ("longevity", "lifespan", "length of life", "how long you will live",
                 "years remaining", "remaining years", "death", "die", "dying")
_LONGEVITY_TA = ("ஆயுள", "ஆயுட", "மரண", "இறப்ப")


@pytest.mark.parametrize("age", [8, 16, 26, 33, 45, 62, 66, 71])
def test_longevity_is_spoken_of_only_in_the_sentence_that_refuses_to_read_it(client, age):
    """The ban is a lint; the refusal is copy. They are not the same deliverable.

    Which is why this test cannot simply forbid the vocabulary: the G6 refusal
    is made OF that vocabulary, and a naive ban would have deleted the one
    sentence the audit rated highest trust-per-word in the source document. So
    the refusal is subtracted first, and what must hold is that nothing else in
    any reading at any gate raises the subject at all.
    """
    data = _read(client, age=age, marital_status="married" if age > 25 else None)

    for lang, banned in (("en", _LONGEVITY_EN), ("ta", _LONGEVITY_TA)):
        body = _body(data, lang)
        refusal = reading._LONGEVITY_REFUSAL[0 if lang == "ta" else 1]
        assert body.count(refusal) <= 1, "the refusal is declared more than once"
        remainder = body.replace(refusal, " ").lower()
        for term in banned:
            # Anchored at the start of a word. Substring matching put "die"
            # inside "decide" and failed a teenager's reading on the word
            # "those two decide what comes next", which is the wrong kind of
            # caution: a lint that cries wolf gets its markers deleted.
            assert not re.search(rf"\b{re.escape(term)}", remainder), (
                f"longevity vocabulary outside the refusal: {remainder}"
            )


# ── Provenance: the class system, enforced statically ────────────────────────
#
# docs/AGE_GATED_READING_AUDIT_2026-08-05.md §6.2(a). The reading-generation
# spec v2 specifies a RUNTIME validator that drops E/C sentences on their way
# out; because our vocabulary is fixed rather than generated, the same rule is
# a static assertion over the tables. That is strictly stronger — a runtime
# dropper catches only what its matcher recognises, whereas a table with no E
# slot cannot emit an E sentence at all — and these four tests are the whole
# mechanism.


def _is_copy_pair(value: object) -> bool:
    """One slot of authored copy: a (ta, en) pair, or a tagged ``_Line``.

    ``type(part) is str`` rather than ``isinstance``: the provenance
    declarations are 2-tuples of StrEnum members, which ARE str instances, and
    an isinstance check would classify the classifier as copy.

    ``_Line`` was added when the transition between two temperament sentences
    stopped being chosen from their grahas and started being chosen from their
    meaning — it is a (ta, en) pair plus the tag that decides the connective.
    Reflection has to recognise it or `_SIGNATURE_OPENING` silently drops out of
    the discovered set and its provenance declaration reads as stale, which is
    the failure mode these tests exist to prevent, arriving through the door
    they were built on.
    """
    if isinstance(value, reading._Line):
        return True
    return (
        isinstance(value, tuple)
        and len(value) == 2
        and all(type(part) is str for part in value)
    )


def _copy_tables() -> dict[str, object]:
    """Every module-level table of authored copy, found by reflection.

    Discovered rather than listed, deliberately: a list would be a thing to
    forget to update, and the whole point is that a NEW table of Tamil/English
    copy fails the suite until somebody classifies it.
    """
    found: dict[str, object] = {}
    for name, value in vars(reading).items():
        if _is_copy_pair(value):
            found[name] = value
        elif isinstance(value, dict) and value and all(_is_copy_pair(v) for v in value.values()):
            found[name] = value
    return found


def test_no_copy_slot_classifies_as_an_event_or_a_cold_read():
    """The ship blocker, and the reason the class system exists at all.

    E asserts something happened; C lands on most readers regardless of chart.
    Neither may reach a user, and on a fixed vocabulary that is checkable before
    anything is rendered.
    """
    declared = {
        **{f"_Voice.{slot}": v for slot, v in reading._Voice.PROVENANCE.items()},
        **{f"_ChildVoice.{slot}": v for slot, v in reading._ChildVoice.PROVENANCE.items()},
        **reading._TABLE_PROVENANCE,
    }
    assert declared, "the provenance registry is empty — the model has been removed"

    for slot, (provenance, base_rate) in declared.items():
        assert provenance in reading.EMITTABLE_PROVENANCE, (
            f"{slot} classifies {provenance.name}, which may never be emitted"
        )
        # The sixth column. A near-universal predicate carries no information
        # however impeccable its derivation — v2's own C-test misses this
        # because it reads the sentence's form, not the rule's consequent.
        assert base_rate is not reading.BaseRate.UNIVERSAL, (
            f"{slot} declares a near-universal predicate and cannot inform anyone"
        )

    for beat_id, classes in reading._BEAT_PROVENANCE.items():
        assert classes, f"beat {beat_id} declares no class at all"
        unemittable = classes - reading.EMITTABLE_PROVENANCE
        assert not unemittable, f"beat {beat_id} carries {unemittable}"


def test_every_table_of_copy_declares_its_provenance():
    """A new vocabulary table is unclassified until somebody classifies it.

    Without this the model decays the moment the next contributor adds a table,
    which is the failure mode the audit named: the copy is in decent shape, and
    nothing stops the next string being an E.
    """
    classified = set(reading._TABLE_PROVENANCE)
    # _VOICE and _CHILD_VOICE hold dataclasses rather than pairs, so reflection
    # does not reach them; their facets are classified on the dataclass itself
    # and asserted by the field check below.
    for name in _copy_tables():
        assert name in classified, (
            f"{name} is a table of authored copy with no provenance class. "
            "Add it to _TABLE_PROVENANCE."
        )
    stale = classified - set(_copy_tables())
    assert not stale, f"_TABLE_PROVENANCE classifies tables that no longer exist: {stale}"


def test_every_narration_facet_is_classified():
    """Add a seventh facet to _Voice and this fails until it is classified.

    Field reflection rather than a list, for the same reason as above.
    """
    for voice_class in (reading._Voice, reading._ChildVoice):
        fields = {f.name for f in dataclasses.fields(voice_class)}
        declared = set(voice_class.PROVENANCE)
        assert fields == declared, (
            f"{voice_class.__name__}: {fields ^ declared} is unclassified or stale"
        )


def test_every_keyed_table_covers_every_graha():
    """A missing key is not a copy gap, it is a crash for one reader in nine.

    Every one of these is indexed by a graha derived from the chart — the
    nakshatra lord, the signature, the running dasa lord — so a table short one
    entry raises KeyError for exactly the readers who have it.
    """
    grahas = set(reading._VOICE)
    assert len(grahas) == 9, grahas
    for name in ("_CHILD_VOICE", "_SIGNATURE_OPENING", "_GRIEVANCE"):
        assert set(getattr(reading, name)) == grahas, f"{name} does not cover every graha"


def test_every_rasi_has_a_mind_and_a_face():
    """Same failure one table over, and keyed by rasi rather than by graha.

    A gap here is not a copy gap either — it is a KeyError for exactly the one
    reader in twelve who has that placement, and nothing else in the suite would
    reach it, because every synthetic profile in this file shares a birth time.
    """
    for name in ("_MOON_MIND", "_LAGNA_FACE"):
        assert set(getattr(reading, name)) == set(range(1, 13)), (
            f"{name} does not cover every rasi"
        )


def test_the_rasi_clauses_cannot_outgrow_their_budget():
    """The one part of beat 1 whose length the API matrix structurally cannot see.

    Every synthetic profile here shares a birth time and place, so
    `test_word_budget_holds_for_every_life_stage` exercises exactly ONE of the
    144 rasi pairs — and not the longest. A contributor adding a generous
    twelfth entry would ship a reading over its ceiling for eleven readers in
    twelve with the entire suite green.

    That is the failure the 66/married case already taught this file once: the
    gap was the matrix, not the guard. The fix there was five more rows; here
    more rows cannot work, because reaching a chosen rasi means solving for a
    birth time rather than adding a parameter. So the table is bounded directly
    and the budget test keeps the register it can actually measure.

    AS OF §6.17 NO READING EMITS THESE CLAUSES — the tables are held for the
    longer reading, alongside `_beat_what_life_keeps_teaching`. So this is
    presently a bound on unspent copy, and it is kept rather than deleted for the
    reason it was written: it is the only check that can exist at all for these
    two tables, and the `self` budget still reserves room for them. Deleting it
    while the reservation stands would mean wiring the clauses back in with
    nothing measuring the case the suite cannot reach.
    """
    def longest(table: dict, index: int) -> int:
        return max(len(value[index].split()) for value in table.values())

    worst_en = longest(reading._MOON_MIND, 1) + longest(reading._LAGNA_FACE, 1)
    worst_ta = longest(reading._MOON_MIND, 0) + longest(reading._LAGNA_FACE, 0)

    # Headroom is measured, not assumed: the binding 45-widowed reading runs 322
    # English words carrying the fixture's 13-word pair, against a 328 ceiling.
    assert worst_en <= 19, f"the longest rasi clause pair is {worst_en} English words"
    # Tamil: 234 measured with an 11-word pair, against 238.
    assert worst_ta <= 15, f"the longest rasi clause pair is {worst_ta} Tamil words"


def test_the_rasi_clauses_describe_a_mind_and_not_a_life():
    """The `now_texture` lesson, applied before these tables can repeat it.

    Both are shared with the teen register, which is exactly the condition that
    let Jupiter's "children" and Venus's "relationships, comfort and money"
    reach a sixteen-year-old. A table shared across registers gets its content
    lint written when it is added, not after the sweep that finds it.
    """
    for name in ("_MOON_MIND", "_LAGNA_FACE"):
        for rasi, (ta, en) in getattr(reading, name).items():
            for token in _ADULT_TOKENS_EN:
                assert token not in en.lower(), f"{name}[{rasi}] names '{token}': {en}"
            for token in _ADULT_TOKENS_TA:
                assert token not in ta, f"{name}[{rasi}] names '{token}': {ta}"


def test_every_beat_the_service_emits_declares_its_provenance(
    client, family_vault_payload_factory, family_member_payload_factory
):
    """The frames are where an event claim would actually get written.

    Most of this reading's words are the frames the beat builders write around
    the vocabulary, not the vocabulary itself — and a frame already carries a
    date, so turning it into an event claim is one clause of work. §6.5 of the
    audit classified the tables and stopped there; this closes the other half.

    Both directions are asserted. A declared-but-never-emitted beat is the
    stale-baseline problem this repo has paid for before.
    """
    emitted: set[str] = set()
    # Three registers cover every id: the guardian path (its own forward beat),
    # the full adult path, and the third-party path (its two own beats).
    for kwargs in ({"age": 8}, {"age": 33, "marital_status": "married"}):
        emitted |= {beat["id"] for beat in _read(client, **kwargs)["beats"]}
    emitted |= {
        beat["id"]
        for beat in _vault_member_reading(
            client,
            family_vault_payload_factory,
            family_member_payload_factory,
            age=29,
            relationship="sibling",
            name="Tamil Synthetic Sibling",
        )["beats"]
    }

    undeclared = emitted - set(reading._BEAT_PROVENANCE)
    assert not undeclared, f"beats with no provenance class: {undeclared}"
    never_emitted = set(reading._BEAT_PROVENANCE) - emitted
    assert not never_emitted, f"_BEAT_PROVENANCE declares beats nothing emits: {never_emitted}"


def test_no_score_number_appears_anywhere_in_the_body(client):
    """Scores live in Life Areas. A rating beside a narrative verdict fuses into
    one confused claim — the same reason a second rating was cut from the
    numerology card."""
    data = _read(client, age=33, marital_status="married")
    body = _body(data, "en")
    assert "/100" not in body
    assert not re.search(r"\b\d{1,3}\s*(?:points|score|out of)\b", body, re.IGNORECASE)
