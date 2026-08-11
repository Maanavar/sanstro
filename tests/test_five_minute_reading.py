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
    _PERIOD_THEME,  # noqa: PLC2701 (internal use)
    _SHADOW_ESSENCE,  # noqa: PLC2701 (internal use)
    _TOPIC_LENS,  # noqa: PLC2701 (internal use)
    _VOICE,  # noqa: PLC2701 (internal use)
    _beat_last_period_extended,  # noqa: PLC2701 (internal use)
    _beat_repeating_pattern,  # noqa: PLC2701 (internal use)
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
    *, age: int, display_name: str | None = None, marital_status: str | None = None
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
    return payload


def _chart_id_for_age(client, age: int, *, marital_status: str | None = None) -> str:
    created = client.post(
        "/api/v1/birth-profiles", json=_profile(age=age, marital_status=marital_status)
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


def test_a_teen_owning_their_own_account_gets_the_same_404_as_flag_off(client):
    """Age 15, own chart, own account -> "client_with_guardian", not built yet."""
    reset_flag("five_minute_reading")
    set_flag("five_minute_reading", False)
    off = client.get(f"/api/v1/charts/{uuid.uuid4()}/five-minute")
    set_flag("five_minute_reading", True)

    chart_id = _chart_id_for_age(client, age=15)
    response = client.get(f"/api/v1/charts/{chart_id}/five-minute")

    assert response.status_code == 404
    assert response.json() == off.json()


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
    builder function itself: for every graha that could be `strongest`, the
    rendered beat's opening clause and both domain clauses must be
    byte-for-byte the SAME graha's `shadow`/`domain_flex` entries. A builder
    that ever sourced the two domain clauses from a different graha's table
    than the one it opened `shadow` on would still produce plausible-sounding
    prose and pass every other test in this file; only comparing against the
    source tables directly catches that.
    """
    for graha, voice in _VOICE.items():
        beat = _beat_repeating_pattern(strongest=graha)
        work_ta, work_en = voice.domain_flex["WORK"]
        relationships_ta, relationships_en = voice.domain_flex["RELATIONSHIPS"]

        assert work_en in beat.text.en, (graha, beat.text.en)
        assert relationships_en in beat.text.en, (graha, beat.text.en)
        assert work_ta in beat.text.ta, (graha, beat.text.ta)
        assert relationships_ta in beat.text.ta, (graha, beat.text.ta)

        # The opening clause is THIS graha's own `shadow`, not any other
        # graha's — checked by exclusion, not just by presence, since every
        # `shadow` string in the table is distinct.
        shadow_en = voice.shadow[1]
        assert beat.text.en.startswith(f"{shadow_en[0].upper()}{shadow_en[1:]}")
        for other_graha, other_voice in _VOICE.items():
            if other_graha == graha:
                continue
            assert other_voice.domain_flex["WORK"][1] not in beat.text.en, (graha, other_graha)
            assert other_voice.domain_flex["RELATIONSHIPS"][1] not in beat.text.en, (
                graha,
                other_graha,
            )


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
    """54 strings estimated in the spec (§4.3); cap raised from 60 to 62 on
    2026-08-11 for `_SHADOW_ESSENCE` (see its own comment in
    five_minute_reading_service.py): fixing the Beat 3/4/7 verbatim-repetition
    finding from that day's manual review cost 9 new reviewable strings even
    after dropping `mechanism` from Beat 7 entirely to pay most of the way.
    +2 net over the original "one Tamil sitting" ceiling is judged close
    enough to the same review burden to not be worth a second sitting.

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
    assert new_strings == 9 + 18 + 9 + 9 + 8 + 9
    assert new_strings <= 62
