"""Tests for "Your Chart in Five Minutes" (docs/FIVE_MINUTE_READING_SPEC_2026-08-11.md).

Covers what five_minute_reading_service.py ships for the "self" register: the
flag gate, register gating, and all eight beats — 1/2/8 reused verbatim from
one_minute_reading_service, 3/4 (core_nature, repeating_pattern), and 5/6/7
(last_period, this_period, topic_in_full), gated per §0.2/§2.3-§2.5.

Deliberately NOT reproduced here: the bidirectional provenance test from spec
§4 item 1. It guards tables this module doesn't have of its own — `_Voice.
mechanism`/`_Voice.domain_flex`/`_Voice.asks` all live in one_minute_reading_
service.py and are already exercised by that module's test_every_narration_
facet_is_classified and test_no_copy_slot_classifies_as_an_event_or_a_cold_
read. What IS reproduced here: the vocabulary-size ceiling (spec §4 item 3),
the "one graha" invariant for Beat 4 (spec §4 item 4), and the maha-hinge
theme-consistency check (spec §4 item 5 / §3), since all three are specific
to what this module builds.
"""
from __future__ import annotations

import itertools
import uuid
from datetime import date

import pytest

from app.calculations.dasha import DashaPeriod, VimshottariTimeline
from app.services.feature_flags import reset_flag, set_flag
from app.services.five_minute_reading_service import (
    _BHUKTI_FLAVOR,  # noqa: PLC2701 (internal use)
    _PERIOD_THEME,  # noqa: PLC2701 (internal use)
    _SHADOW_ESSENCE,  # noqa: PLC2701 (internal use)
    _TOPIC_LENS,  # noqa: PLC2701 (internal use)
    _VOICE,  # noqa: PLC2701 (internal use)
    _beat_last_period_extended,  # noqa: PLC2701 (internal use)
    _beat_repeating_pattern,  # noqa: PLC2701 (internal use)
    _beat_this_period_extended,  # noqa: PLC2701 (internal use)
    word_budget,
)

TODAY = date.today()


def _maha(lord: str, start: date, end: date, index: int) -> DashaPeriod:
    """A bare mahadasha period for direct-call tests. `start_jd`/`end_jd` are
    unused by the branch of `_beat_last_ten_years` these tests exercise (a
    mahadasha handover falls inside the ten-year window), same convention as
    test_one_minute_reading.py's own `_maha`, simplified since no test here
    reaches the antardasha fallback that would need real julian days."""
    return DashaPeriod(
        level="maha", lord=lord, start_jd=0.0, end_jd=0.0,
        start_date=start, end_date=end, sequence_index=index,
    )


@pytest.fixture(autouse=True)
def _reading_enabled():
    set_flag("five_minute_reading", True)
    yield
    reset_flag("five_minute_reading")


def _birth_date_for_age(age: int) -> str:
    # 14 March keeps the birthday behind us for most of the year, so the
    # requested age is the age the service computes — same convention as
    # test_one_minute_reading.py.
    return date(TODAY.year - age, 3, 14).isoformat()


_SERIAL = itertools.count(1)


def _profile(
    *,
    age: int,
    display_name: str | None = None,
    marital_status: str | None = None,
    employment_type: str | None = None,
) -> dict:
    """A clearly-synthetic profile. Never a real birth record (CLAUDE.md)."""
    payload = {
        "displayName": display_name or f"Five Minute Synthetic {next(_SERIAL)}",
        "birthDateLocal": _birth_date_for_age(age),
        "birthTimeLocal": "06:42:00",
        "birthPlace": "Madurai, Tamil Nadu, India",
        "birthLatitude": 9.9252,
        "birthLongitude": 78.1198,
        "birthTimezone": "Asia/Kolkata",
        "birthTimeSource": "BIRTH_CERTIFICATE",
        "calculateNow": True,
    }
    if marital_status is not None:
        payload["maritalStatus"] = marital_status
    if employment_type is not None:
        payload["employmentType"] = employment_type
    return payload


def _chart_id_for_age(
    client, age: int, *, marital_status: str | None = None, employment_type: str | None = None
) -> str:
    created = client.post(
        "/api/v1/birth-profiles",
        json=_profile(age=age, marital_status=marital_status, employment_type=employment_type),
    )
    assert created.status_code == 200, created.text
    return created.json()["data"]["chartId"]


def _read(client, *, age: int, marital_status: str | None = None) -> dict:
    chart_id = _chart_id_for_age(client, age=age, marital_status=marital_status)
    response = client.get(f"/api/v1/charts/{chart_id}/five-minute")
    assert response.status_code == 200, response.text
    return response.json()["data"]


# ── The rollout gate ─────────────────────────────────────────────────────────


def test_flag_off_answers_404_identically_for_real_and_fake_chart_ids(
    client, birth_profile_payload_factory
):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory())
    real_chart_id = created.json()["data"]["chartId"]
    reset_flag("five_minute_reading")
    set_flag("five_minute_reading", False)

    real = client.get(f"/api/v1/charts/{real_chart_id}/five-minute")
    fake = client.get(f"/api/v1/charts/{uuid.uuid4()}/five-minute")

    assert real.status_code == 404
    assert fake.status_code == 404
    assert real.json() == fake.json()


# ── Register gating (§0.2): only "self" ships ────────────────────────────────


def test_a_minor_owning_their_own_account_gets_the_same_404_as_flag_off(client):
    """Age 8, own chart, own account -> "parent" register, which doesn't ship yet."""
    reset_flag("five_minute_reading")
    set_flag("five_minute_reading", False)
    off = client.get(f"/api/v1/charts/{uuid.uuid4()}/five-minute")
    set_flag("five_minute_reading", True)

    chart_id = _chart_id_for_age(client, age=8)
    response = client.get(f"/api/v1/charts/{chart_id}/five-minute")

    assert response.status_code == 404
    assert response.json() == off.json()


# ── client_with_guardian: the reduced 6-beat register (§0.2) ─────────────────


def _read_guardian(client, *, age: int = 15, employment_type: str | None = None) -> dict:
    chart_id = _chart_id_for_age(client, age=age, employment_type=employment_type)
    response = client.get(f"/api/v1/charts/{chart_id}/five-minute")
    assert response.status_code == 200, response.text
    return response.json()["data"]


def test_a_teen_owning_their_own_account_gets_the_reduced_six_beat_reading(client):
    """Age 15, own chart, own account -> "client_with_guardian", now built (§0.2)."""
    data = _read_guardian(client, age=15)

    assert data["addressedTo"] == "client_with_guardian"
    ids = [beat["id"] for beat in data["beats"]]
    assert ids == [
        "who_you_are",
        "what_this_rests_on",
        "core_nature",
        "this_period",
        "topic_in_full",
        "one_thing",
    ]
    assert data["pendingQuestion"] is None

    max_en, max_ta = word_budget("client_with_guardian")
    assert max_en == 650
    assert max_ta == 380
    assert data["wordCount"]["en"] <= max_en, data["wordCount"]
    assert data["wordCount"]["ta"] <= max_ta, data["wordCount"]


def test_a_teen_always_gets_topic_teen_regardless_of_employment_type(client):
    """TOPIC_TEEN wins unconditionally for client_with_guardian (see topic
    resolution in one_minute_reading_service.py) — TOPIC_EDUCATION's "you are
    studying" is an inference this register's own topic deliberately avoids,
    true of most Tamil teenagers and wrong in a way that stings the one it
    misses. `employment_type` is adult-only vocabulary for this register."""
    data = _read_guardian(client, age=16, employment_type="student")
    assert data["focusTopic"] == "TEEN"


def test_guardian_core_nature_never_carries_the_shadow_sentence(client):
    """§0.2: drops the shadow/grievance half of Beat 3 — a character verdict a
    13-to-17-year-old has not earned, same reasoning the 2-minute reading
    already applies by omitting this beat's 2-minute equivalent outright."""
    data = _read_guardian(client, age=15)
    core_nature = next(beat for beat in data["beats"] if beat["id"] == "core_nature")

    assert "Your real strength is" in core_nature["text"]["en"]
    assert "Where it costs you is" not in core_nature["text"]["en"]
    for voice in _VOICE.values():
        assert voice.shadow[1] not in core_nature["text"]["en"]


def test_guardian_topic_in_full_uses_nature_not_shadow_essence(client):
    """§0.2 applied to Beat 7: facet 3 swaps `_SHADOW_ESSENCE` for the same
    graha's `nature` line, under `_TEMPERAMENT_CONNECTIVE` rather than
    `_FRICTION_CONNECTIVE` — see _beat_topic_in_full's own addressed_to
    branch. Otherwise Beat 7 would quietly reintroduce the shadow content
    Beat 3 just went out of its way to drop."""
    data = _read_guardian(client, age=15)
    topic_in_full = next(beat for beat in data["beats"] if beat["id"] == "topic_in_full")

    en = topic_in_full["text"]["en"]
    assert "It also shows up as:" in en
    assert "Where it runs into friction:" not in en
    for essence_ta, essence_en in _SHADOW_ESSENCE.values():
        assert essence_en not in en


def test_guardian_reading_never_asks_the_marital_status_question(client):
    """A minor's own reading never raises the adult pending-question mechanism,
    regardless of topic — TOPIC_UNKNOWN is structurally unreachable here."""
    data = _read_guardian(client, age=15)
    assert data["focusTopic"] != "UNKNOWN"
    assert data["pendingQuestion"] is None


def test_a_family_vault_members_chart_gets_the_same_404_as_flag_off(
    client, family_vault_payload_factory, family_member_payload_factory
):
    """A chart read off someone else's family-vault card -> "other", never ships."""
    reset_flag("five_minute_reading")
    set_flag("five_minute_reading", False)
    off = client.get(f"/api/v1/charts/{uuid.uuid4()}/five-minute")
    set_flag("five_minute_reading", True)

    from sqlalchemy import select

    from app.db.session import SessionLocal
    from app.models import BirthProfile, Chart

    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory())
    assert vault.status_code == 200, vault.text
    vault_id = vault.json()["data"]["familyVaultId"]

    payload = family_member_payload_factory(
        display_name="Five Minute Synthetic Daughter", relationship_to_owner="child"
    )
    payload["birthDateLocal"] = _birth_date_for_age(26)
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

    response = client.get(f"/api/v1/charts/{row[0]}/five-minute")

    assert response.status_code == 404
    assert response.json() == off.json()


# ── What actually ships: "self", all 8 beats (5, 6, 7 gated per §0.2/§2.5) ──


@pytest.mark.parametrize(
    ("age", "marital_status", "expected_ids"),
    [
        # 22/45, no marital status on file -> TOPIC_UNKNOWN: beat 7 withheld,
        # beat 5 present (not elder), pending question fills the gap.
        (
            22,
            None,
            [
                "who_you_are",
                "what_this_rests_on",
                "core_nature",
                "repeating_pattern",
                "last_period",
                "this_period",
                "one_thing",
            ],
        ),
        (
            45,
            None,
            [
                "who_you_are",
                "what_this_rests_on",
                "core_nature",
                "repeating_pattern",
                "last_period",
                "this_period",
                "one_thing",
            ],
        ),
        # Married adult -> TOPIC_MARRIED_LIFE: every beat renders, 8 total.
        (
            40,
            "married",
            [
                "who_you_are",
                "what_this_rests_on",
                "core_nature",
                "repeating_pattern",
                "last_period",
                "this_period",
                "topic_in_full",
                "one_thing",
            ],
        ),
        # Elder path (§ G6 in the 2-minute reading) drops the dated past
        # entirely, even though TOPIC_ELDER != TOPIC_UNKNOWN keeps beat 7.
        (
            66,
            "married",
            [
                "who_you_are",
                "what_this_rests_on",
                "core_nature",
                "repeating_pattern",
                "this_period",
                "topic_in_full",
                "one_thing",
            ],
        ),
    ],
)
def test_self_register_renders_exactly_the_beats_the_topic_earns(
    client, age, marital_status, expected_ids
):
    data = _read(client, age=age, marital_status=marital_status)

    assert data["addressedTo"] == "self"
    ids = [beat["id"] for beat in data["beats"]]
    assert ids == expected_ids

    max_en, max_ta = word_budget("self")
    assert data["wordCount"]["en"] <= max_en, data["wordCount"]
    assert data["wordCount"]["ta"] <= max_ta, data["wordCount"]


def test_core_nature_beat_names_gift_mechanism_and_shadow_in_one_sentence_pair(client):
    """The mechanism clause must actually render, not just exist in the table."""
    chart_id = _chart_id_for_age(client, age=30)
    response = client.get(f"/api/v1/charts/{chart_id}/five-minute")
    assert response.status_code == 200, response.text
    data = response.json()["data"]

    core_nature = next(beat for beat in data["beats"] if beat["id"] == "core_nature")
    assert "Your real strength is" in core_nature["text"]["en"]
    assert "Where it costs you is" in core_nature["text"]["en"]
    # Every mechanism clause was drafted as a "because ..." connective (§2.1).
    assert "because" in core_nature["text"]["en"]


# ── Beat 4 — Repeating Pattern (§2.2, §0.3) ──────────────────────────────────


def test_repeating_pattern_beat_names_both_domains(client):
    """Both domain connectives must actually render, not just exist in the table."""
    chart_id = _chart_id_for_age(client, age=30)
    response = client.get(f"/api/v1/charts/{chart_id}/five-minute")
    assert response.status_code == 200, response.text
    data = response.json()["data"]

    repeating_pattern = next(beat for beat in data["beats"] if beat["id"] == "repeating_pattern")
    assert "At work, that can look like" in repeating_pattern["text"]["en"]
    assert "In relationships, it can look like" in repeating_pattern["text"]["en"]


def test_beat_4_never_mixes_grahas():
    """The §0.3 'one graha' invariant, checked against the tables directly.

    Not a test of the copy's plausibility — a reviewer does that — but of the
    builder function itself: for every graha that could be `strongest`, both
    domain clauses must be byte-for-byte the SAME graha's `domain_flex`
    entries. A builder that ever sourced the two domain clauses from a
    different graha's table than the caller's `strongest` would still produce
    plausible-sounding prose and pass every other test in this file; only
    comparing against the source tables directly catches that. The "one
    graha" guarantee here is structural (both clauses are keyed off the same
    `strongest` argument `build_five_minute_reading` also passes to Beat 3),
    not textual — see `test_beat_4_does_not_reopen_on_beat_3s_shadow_sentence`
    for why this beat no longer echoes `shadow` itself.
    """
    for graha, voice in _VOICE.items():
        beat = _beat_repeating_pattern(strongest=graha)
        work_ta, work_en = voice.domain_flex["WORK"]
        relationships_ta, relationships_en = voice.domain_flex["RELATIONSHIPS"]

        assert work_en in beat.text.en, (graha, beat.text.en)
        assert relationships_en in beat.text.en, (graha, beat.text.en)
        assert work_ta in beat.text.ta, (graha, beat.text.ta)
        assert relationships_ta in beat.text.ta, (graha, beat.text.ta)

        for other_graha, other_voice in _VOICE.items():
            if other_graha == graha:
                continue
            assert other_voice.domain_flex["WORK"][1] not in beat.text.en, (graha, other_graha)
            assert other_voice.domain_flex["RELATIONSHIPS"][1] not in beat.text.en, (
                graha,
                other_graha,
            )


def test_beat_4_does_not_reopen_on_beat_3s_shadow_sentence():
    """Regression guard for the 2026-08-11 astrologer-review finding: a first
    draft opened Beat 4 on `shadow` verbatim, capitalised, immediately after
    Beat 3's own closing clause — "Where it costs you is {shadow}." — had
    just said the identical sentence framed as a cost. Read start to finish,
    that is the same shadow clause twice in a row; no other test in this file
    catches it because each beat was individually spec-compliant. See
    `_beat_repeating_pattern`'s own docstring for the full account, and
    `test_topic_in_full_never_repeats_core_natures_own_sentences_verbatim`
    for the same failure class caught one beat later, same date."""
    for graha, voice in _VOICE.items():
        beat = _beat_repeating_pattern(strongest=graha)
        shadow_en = voice.shadow[1]
        shadow_ta = voice.shadow[0]
        assert shadow_en not in beat.text.en, (graha, beat.text.en)
        assert shadow_ta not in beat.text.ta, (graha, beat.text.ta)


# ── Beat 5 — What the Last Period Was Teaching, extended (§2.3) ─────────────


def test_last_period_beat_opens_on_the_theme_word_before_the_texture_sentence():
    """The theme clause must actually render ahead of `past_texture`, not just exist in the table."""
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

    beat, hinge = _beat_last_period_extended(
        timeline=timeline, as_of=date(2026, 8, 4), birth_date=date(1993, 3, 20)
    )

    assert beat.id == "last_period"
    assert hinge == (2026, "maha")
    # The window's outgoing lord here is Sun (2020-2026), so the theme word
    # must be Sun's, and the sentence it opens on must still be Sun's own
    # `past_texture` — not a second, differently-worded transition.
    assert "From 2020 to 2026 you were under Sun" in beat.text.en, beat.text.en
    assert beat.text.en.index("Responsibility —") < beat.text.en.index(
        "it put you in front of people"
    ), beat.text.en


# ── Beat 6 — Right Now, extended (§2.4) ──────────────────────────────────────


def test_this_period_beat_appends_the_asks_clause_after_the_2_minute_text(client):
    data = _read(client, age=30)
    this_period = next(beat for beat in data["beats"] if beat["id"] == "this_period")
    en = this_period["text"]["en"]

    assert "What this period asks of you:" in en
    # The asks clause is APPENDED, not substituted — everything the 2-minute
    # right_now beat says must still be there, ahead of the new clause.
    lead, _, tail = en.partition("What this period asks of you:")
    assert lead.strip(), en
    assert tail.strip(), en


def test_asks_never_restates_now_texture_for_any_graha():
    """§2.4's reviewer check, run structurally: `asks` and `now_texture` must differ."""
    for graha, voice in _VOICE.items():
        assert voice.asks[1] != voice.now_texture[1], graha
        assert voice.asks[0] != voice.now_texture[0], graha


def test_this_period_beat_names_the_antardasha_when_it_differs_from_the_mahadasha():
    """2026-08-11 astrologer-review finding: Beat 6 spoke only in the
    mahadasha lord's voice, so a Moon mahadasha rendered word-for-word the
    same "right now" beat whether the running bhukti was Saturn or Venus —
    the antardasha was already computed (`_beat_right_now`'s own `basis`
    field cites it) but never reached the body text. `_BHUKTI_FLAVOR` fixes
    that; this locks the antardasha lord's flavour clause into the rendered
    beat, ahead of the `asks` clause, whenever it differs from the
    mahadasha lord."""
    mahadashas = (
        _maha("MOON", date(2016, 3, 13), date(2026, 3, 13), 0),
        _maha("MARS", date(2026, 3, 13), date(2033, 3, 13), 1),
    )
    antardasha = DashaPeriod(
        level="antar", lord="SATURN", start_jd=0.0, end_jd=0.0,
        start_date=date(2024, 1, 1), end_date=date(2026, 3, 13), sequence_index=0,
    )
    timeline = VimshottariTimeline(
        opening_lord="MOON",
        balance_years_at_birth=10.0,
        opening_end_jd=mahadashas[0].end_jd,
        mahadashas=mahadashas,
        current_mahadasha=mahadashas[0],
        current_antardasha=antardasha,
        current_pratyantardasha=antardasha,
        current_sookshmadasha=antardasha,
        current_pranadasha=antardasha,
    )

    beat = _beat_this_period_extended(timeline=timeline, hinge=None, addressed_to="self")

    flavor_en = _BHUKTI_FLAVOR["SATURN"][1]
    assert "Its current Saturn phase" in beat.text.en, beat.text.en
    assert flavor_en in beat.text.en, beat.text.en
    # Ordering: now_texture, then the bhukti clause, then asks — never the
    # bhukti clause printed after the reading has already moved on to asks.
    assert beat.text.en.index("Its current Saturn phase") < beat.text.en.index(
        "What this period asks of you:"
    ), beat.text.en


def test_this_period_beat_withholds_the_bhukti_clause_on_swabhukti():
    """The first bhukti of every mahadasha runs under the mahadasha lord
    itself (swabhukti) — there is nothing new `_BHUKTI_FLAVOR` could add
    that `now_texture` has not already said, and reusing the table there
    would reopen the same-clause-twice defect `_beat_repeating_pattern` was
    fixed for one beat earlier. Regression guard, not a hypothetical: this
    is the COMMON case, not an edge one."""
    mahadashas = (_maha("VENUS", date(2024, 1, 1), date(2044, 1, 1), 0),)
    antardasha = DashaPeriod(
        level="antar", lord="VENUS", start_jd=0.0, end_jd=0.0,
        start_date=date(2024, 1, 1), end_date=date(2027, 4, 1), sequence_index=0,
    )
    timeline = VimshottariTimeline(
        opening_lord="VENUS",
        balance_years_at_birth=20.0,
        opening_end_jd=mahadashas[0].end_jd,
        mahadashas=mahadashas,
        current_mahadasha=mahadashas[0],
        current_antardasha=antardasha,
        current_pratyantardasha=antardasha,
        current_sookshmadasha=antardasha,
        current_pranadasha=antardasha,
    )

    beat = _beat_this_period_extended(timeline=timeline, hinge=None, addressed_to="self")

    assert "Its current Venus phase" not in beat.text.en, beat.text.en
    for flavor_ta, flavor_en in _BHUKTI_FLAVOR.values():
        assert flavor_en not in beat.text.en, beat.text.en
        assert flavor_ta not in beat.text.ta, beat.text.ta


# ── Beat 7 — Your Topic in Full (§2.5) ───────────────────────────────────────


def test_topic_in_full_composes_style_friction_and_outlook(client):
    data = _read(client, age=40, marital_status="married")
    topic_in_full = next(beat for beat in data["beats"] if beat["id"] == "topic_in_full")

    en = topic_in_full["text"]["en"]
    assert "In home and family, that shows up as" in en
    assert "Where it runs into friction:" in en
    assert "One thing that might help:" in en


def test_topic_in_full_never_repeats_core_natures_own_sentences_verbatim(client):
    """Regression guard for the 2026-08-11 manual-review finding: a first draft
    composed Beat 7 from `gift`/`mechanism`/`shadow` verbatim (a literal read of
    §2.5), which made a single reading repeat Beat 3's own two sentences almost
    word for word four beats later, with `shadow` alone appearing a THIRD time
    counting Beat 4's opening clause. Nothing here was factually wrong — every
    beat was individually spec-compliant — so no other test caught it; this one
    checks the compressed facets directly rather than trusting a future edit not
    to reintroduce the verbatim reuse."""
    data = _read(client, age=40, marital_status="married")
    core_nature = next(beat for beat in data["beats"] if beat["id"] == "core_nature")
    topic_in_full = next(beat for beat in data["beats"] if beat["id"] == "topic_in_full")

    for graha, voice in _VOICE.items():
        if voice.mechanism[1] in core_nature["text"]["en"]:
            assert voice.mechanism[1] not in topic_in_full["text"]["en"], graha
        if voice.shadow[1] in core_nature["text"]["en"]:
            assert voice.shadow[1] not in topic_in_full["text"]["en"], graha


def test_topic_in_full_is_withheld_exactly_when_the_age_question_would_be(client):
    """TOPIC_UNKNOWN (no marital status on file) withholds beat 7 and raises the
    pending question in its place — same withholding rule as the 2-minute
    reading's own age-question beat."""
    data = _read(client, age=30, marital_status=None)

    ids = [beat["id"] for beat in data["beats"]]
    assert "topic_in_full" not in ids
    assert data["pendingQuestion"] is not None
    assert data["pendingQuestion"]["field"] == "maritalStatus"
    assert data["pendingQuestion"]["beforeBeat"] == "one_thing"


def test_topic_in_full_renders_once_marital_status_is_on_file(client):
    data = _read(client, age=30, marital_status="single")

    ids = [beat["id"] for beat in data["beats"]]
    assert "topic_in_full" in ids
    assert data["pendingQuestion"] is None


# ── Cross-beat consistency (spec §3) ──────────────────────────────────────────


def test_last_period_theme_never_names_a_different_lord_than_the_span_it_opens():
    """The maha-hinge case names TWO lords in the reading (the outgoing one in
    beat 5, the incoming one in beat 6) — the one seam worth guarding by test:
    the theme word printed in beat 5 must be the OUTGOING lord's, never the
    lord beat 6 goes on to name.
    """
    mahadashas = (
        _maha("KETU", date(1993, 3, 20), date(2000, 3, 20), 0),
        _maha("SATURN", date(2000, 3, 20), date(2020, 3, 20), 1),
        _maha("MOON", date(2020, 3, 20), date(2036, 3, 20), 2),
    )
    timeline = VimshottariTimeline(
        opening_lord="KETU",
        balance_years_at_birth=7.0,
        opening_end_jd=0.0,
        mahadashas=mahadashas,
        current_mahadasha=mahadashas[2],
        current_antardasha=mahadashas[2],
        current_pratyantardasha=mahadashas[2],
        current_sookshmadasha=mahadashas[2],
        current_pranadasha=mahadashas[2],
    )

    beat, hinge = _beat_last_period_extended(
        timeline=timeline, as_of=date(2026, 8, 4), birth_date=date(1993, 3, 20)
    )
    assert hinge is not None and hinge[1] == "maha"

    saturn_theme_en = _PERIOD_THEME["SATURN"][1]
    moon_theme_en = _PERIOD_THEME["MOON"][1]
    assert saturn_theme_en.capitalize() in beat.text.en, beat.text.en
    assert moon_theme_en.capitalize() not in beat.text.en, beat.text.en


# ── Vocabulary size (spec §4 item 3) ─────────────────────────────────────────


def test_five_minute_vocabulary_stays_under_the_reviewable_cap():
    """54 strings estimated in the spec (§4.3). Cap raised from 60 to 62 on
    2026-08-11 for `_SHADOW_ESSENCE` (see its own comment in
    five_minute_reading_service.py): fixing the Beat 3/4/7 verbatim-repetition
    finding from that day's manual review cost 9 new reviewable strings even
    after dropping `mechanism` from Beat 7 entirely to pay most of the way.

    Raised again, same day, from 62 to 71 for `_BHUKTI_FLAVOR` (9 more
    strings, see its own comment) — an astrologer-requested fix for a
    different defect (Beat 6 spoke only in the mahadasha lord's voice, so a
    static chart produced a word-for-word identical "right now" beat on every
    visit within the same ~10-year mahadasha), not a repetition fix, and
    genuinely new information rather than a paraphrase of an existing table.
    Unlike the 62 raise, nothing paid for this one — it is an intentional,
    written-down unpaid raise rather than a silent one, on the judgement that
    a freshness mechanism for repeat visits is worth one Tamil review pass
    it did not previously need.

    This test counts what actually exists rather than trusting the spec's
    estimate, so it starts failing the moment a future beat's table pushes the
    running total past the cap, which is the point: catch it before the copy
    is drafted, not after a reviewer has signed off on it (spec §6 item 4).

    Fixed, topic/graha-invariant connectives (`_WORK_CONNECTIVE`,
    `_FRICTION_CONNECTIVE`, `_ASKS_CONNECTIVE`, `_GUIDANCE_CONNECTIVE`,
    `_GUIDANCE_FALLBACK`, ...) are NOT counted, same treatment the 2-minute
    module gives `_CONTRAST`/`_CONTINUATION` — reviewed once as boilerplate,
    not per-entity.
    """
    new_strings = 9  # mechanism: one per graha
    new_strings += 9 * 2  # domain_flex: WORK + RELATIONSHIPS per graha
    new_strings += 9  # asks: one per graha
    new_strings += len(_PERIOD_THEME)  # period_theme: one per graha
    new_strings += len(_TOPIC_LENS)  # topic_lens: one per non-UNKNOWN, reachable topic
    new_strings += len(_SHADOW_ESSENCE)  # shadow_essence: one per graha, Beat 7's friction facet
    new_strings += len(_BHUKTI_FLAVOR)  # bhukti_flavor: one per graha, Beat 6's antardasha clause
    assert new_strings == 9 + 18 + 9 + 9 + 8 + 9 + 9
    assert new_strings <= 71
