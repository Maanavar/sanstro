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
import re
import uuid
from datetime import date

import pytest

from app.calculations.dasha import DashaPeriod, VimshottariTimeline
from app.schemas.one_minute_reading import OneMinuteBeat, OneMinuteText
from app.services.feature_flags import reset_flag, set_flag
from app.services.five_minute_reading_service import (
    _AREA_NOUN,  # noqa: PLC2701 (internal use)
    _BHUKTI_FLAVOR,  # noqa: PLC2701 (internal use)
    _GOCHARA_SANI,  # noqa: PLC2701 (internal use)
    _LORD_STRENGTH_NOTE,  # noqa: PLC2701 (internal use)
    _PERIOD_THEME,  # noqa: PLC2701 (internal use)
    _SANI_PHASE_NAME,  # noqa: PLC2701 (internal use)
    _SHADOW_ESSENCE,  # noqa: PLC2701 (internal use)
    _TOPIC_HOUSE,  # noqa: PLC2701 (internal use)
    _TOPIC_LENS,  # noqa: PLC2701 (internal use)
    _VOICE,  # noqa: PLC2701 (internal use)
    _beat_last_period_extended,  # noqa: PLC2701 (internal use)
    _beat_repeating_pattern,  # noqa: PLC2701 (internal use)
    _beat_this_period_extended,  # noqa: PLC2701 (internal use)
    repeated_source_clauses,
    word_budget,
)
from app.services.one_minute_reading_service import (
    _beat_right_now,  # noqa: PLC2701 (internal use)
    forward_beat_names_mahadasha_handover,
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


def test_guardian_topic_in_full_carries_no_temperament_facet_at_all(client):
    """§0.2 applied to the topic beat, tightened 2026-08-11.

    This register's facet 3 used to be `_VOICE[strongest].nature` — chosen
    over `_SHADOW_ESSENCE` because a shadow-derived clause is exactly what
    §0.2 refuses a 13-to-17-year-old. That was right about the shadow and
    wrong about `nature`: this register's Beat 1 already prints
    `_VOICE[nakshatra_lord].nature`, so whenever the strongest graha and the
    nakshatra lord coincide the teenager read their own temperament sentence
    twice in one reading.

    With the beat rebuilt on house material there is no longer a gap to fill,
    so facet 3 is dropped for this register on both paths. Both the shadow
    form and the nature form are asserted absent — the first because §0.2
    forbids it, the second because it repeats."""
    data = _read_guardian(client, age=15)
    topic_in_full = next(beat for beat in data["beats"] if beat["id"] == "topic_in_full")

    en = topic_in_full["text"]["en"]
    assert "It also shows up as:" not in en
    assert "Where it runs into friction:" not in en
    for _essence_ta, essence_en in _SHADOW_ESSENCE.values():
        assert essence_en not in en
    for voice in _VOICE.values():
        assert voice.nature.en not in en


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
        # 22/45, no marital status on file -> TOPIC_UNKNOWN: the topic beat is
        # withheld, the dated past renders (not elder), pending question fills
        # the gap. Every one of these fixtures has a confirmed birth time, so
        # `the_tension` renders throughout — see the unreliable-lagna test
        # below for the branch where it does not.
        (
            22,
            None,
            [
                "who_you_are",
                "what_this_rests_on",
                "core_nature",
                "repeating_pattern",
                "the_tension",
                "last_period",
                "this_period",
                "window_ahead",
                "what_comes_after",
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
                "the_tension",
                "last_period",
                "this_period",
                "window_ahead",
                "what_comes_after",
                "one_thing",
            ],
        ),
        # Married adult -> TOPIC_MARRIED_LIFE: every beat renders, 11 total.
        (
            40,
            "married",
            [
                "who_you_are",
                "what_this_rests_on",
                "core_nature",
                "repeating_pattern",
                "the_tension",
                "last_period",
                "this_period",
                "window_ahead",
                "topic_in_full",
                "what_comes_after",
                "one_thing",
            ],
        ),
        # Elder path (§ G6 in the 2-minute reading) drops the dated past
        # entirely, even though TOPIC_ELDER != TOPIC_UNKNOWN keeps the topic
        # beat.
        (
            66,
            "married",
            [
                "who_you_are",
                "what_this_rests_on",
                "core_nature",
                "repeating_pattern",
                "the_tension",
                "this_period",
                "window_ahead",
                "topic_in_full",
                "what_comes_after",
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
    # A COLON, not an em dash — six of the nine `past_texture` strings contain
    # an em dash of their own, so the dash form put two dashes doing two
    # different jobs in one sentence. See `_theme_prefix`'s own docstring.
    assert beat.text.en.index("Responsibility:") < beat.text.en.index(
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

    # `forward_beat_follows=False` keeps this test on the bhukti clause it is
    # about — with it True the lead also drops its end year, which is a
    # different beat's invariant and has its own tests below.
    beat = _beat_this_period_extended(
        timeline=timeline,
        hinge=None,
        addressed_to="self",
        as_of=date(2026, 1, 1),
        forward_beat_follows=False,
    )

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

    beat = _beat_this_period_extended(
        timeline=timeline,
        hinge=None,
        addressed_to="self",
        as_of=date(2026, 1, 1),
        forward_beat_follows=True,
    )

    assert "Its current Venus phase" not in beat.text.en, beat.text.en
    for flavor_ta, flavor_en in _BHUKTI_FLAVOR.values():
        assert flavor_en not in beat.text.en, beat.text.en
        assert flavor_ta not in beat.text.ta, beat.text.ta


def _timeline_with_handover_in_the_decade() -> VimshottariTimeline:
    """Current MOON mahadasha ending 2033, MARS after it, SATURN bhukti running.

    The elder shape the doubled-date finding was raised against: no hinge (the
    elder path drops the dated past), a handover well inside the forward beat's
    decade, and a bhukti under a different lord so this beat carries its own
    nearer expiry.
    """
    mahadashas = (
        _maha("MOON", date(2023, 3, 13), date(2033, 3, 13), 0),
        _maha("MARS", date(2033, 3, 13), date(2040, 3, 13), 1),
    )
    antardasha = DashaPeriod(
        level="antar", lord="SATURN", start_jd=0.0, end_jd=0.0,
        start_date=date(2025, 1, 1), end_date=date(2027, 6, 1), sequence_index=0,
    )
    return VimshottariTimeline(
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


def test_the_mahadasha_end_year_is_dropped_when_a_later_beat_states_it_precisely():
    """Spec §8.5's last open item, closed 2026-08-12.

    The elder path said the mahadasha's end twice at two precisions — "runs to
    2033" in this beat, "until March 2033" in `what_comes_after` three beats
    later. Both correct, neither redundant alone, together noticeable. The
    coarse one goes, because the bhukti clause in this same beat is a nearer
    bound for the texture it sits beside.
    """
    beat = _beat_this_period_extended(
        timeline=_timeline_with_handover_in_the_decade(),
        hinge=None,
        addressed_to="self",
        as_of=date(2026, 1, 1),
        forward_beat_follows=True,
    )

    assert "runs to 2033" not in beat.text.en, beat.text.en
    assert "2033" not in beat.text.ta, beat.text.ta
    # The lord and the bhukti bound both survive — this is a suppression of one
    # clause, not of the beat's dating.
    assert "You are in a Moon period now." in beat.text.en, beat.text.en
    assert "Its current Saturn phase" in beat.text.en, beat.text.en


def test_the_mahadasha_end_year_survives_when_the_bhukti_clause_is_withheld():
    """Swabhukti: no bhukti clause, so nothing in this beat bounds the texture.

    The forward beat would still restate the handover, but three beats away and
    after a possibly-negative texture has been left hanging. The cross-gate
    rule ("every negative statement carries an expiry date") outranks the mild
    repetition, so the year stays.
    """
    mahadashas = (
        _maha("SATURN", date(2024, 1, 1), date(2043, 1, 1), 0),
        _maha("MERCURY", date(2043, 1, 1), date(2060, 1, 1), 1),
    )
    antardasha = DashaPeriod(
        level="antar", lord="SATURN", start_jd=0.0, end_jd=0.0,
        start_date=date(2024, 1, 1), end_date=date(2027, 1, 1), sequence_index=0,
    )
    timeline = VimshottariTimeline(
        opening_lord="SATURN",
        balance_years_at_birth=19.0,
        opening_end_jd=mahadashas[0].end_jd,
        mahadashas=mahadashas,
        current_mahadasha=mahadashas[0],
        current_antardasha=antardasha,
        current_pratyantardasha=antardasha,
        current_sookshmadasha=antardasha,
        current_pranadasha=antardasha,
    )

    beat = _beat_this_period_extended(
        timeline=timeline,
        hinge=None,
        addressed_to="self",
        as_of=date(2026, 1, 1),
        forward_beat_follows=True,
    )

    assert "runs to 2043" in beat.text.en, beat.text.en


def test_the_mahadasha_end_year_survives_when_no_handover_falls_in_the_decade():
    """No mahadasha handover inside the forward beat's ten years, so that beat
    speaks only of an antardasha turn and never says when the mahadasha ends.
    Suppressing here would DELETE the bound rather than defer it — the failure
    mode `forward_beat_names_mahadasha_handover` exists to rule out."""
    mahadashas = (_maha("SATURN", date(2024, 1, 1), date(2043, 1, 1), 0),)
    antardasha = DashaPeriod(
        level="antar", lord="KETU", start_jd=0.0, end_jd=0.0,
        start_date=date(2025, 6, 1), end_date=date(2026, 8, 1), sequence_index=1,
    )
    timeline = VimshottariTimeline(
        opening_lord="SATURN",
        balance_years_at_birth=19.0,
        opening_end_jd=mahadashas[0].end_jd,
        mahadashas=mahadashas,
        current_mahadasha=mahadashas[0],
        current_antardasha=antardasha,
        current_pratyantardasha=antardasha,
        current_sookshmadasha=antardasha,
        current_pranadasha=antardasha,
    )

    assert not forward_beat_names_mahadasha_handover(
        timeline=timeline, as_of=date(2026, 1, 1)
    )
    beat = _beat_this_period_extended(
        timeline=timeline,
        hinge=None,
        addressed_to="self",
        as_of=date(2026, 1, 1),
        forward_beat_follows=True,
    )

    assert "runs to 2043" in beat.text.en, beat.text.en


def test_the_guardian_register_keeps_its_bound_because_it_has_no_forward_beat():
    """`client_with_guardian` is six beats and ends on `one_thing` (§0.2). The
    chart-level predicate would say the handover gets restated; the register
    says no beat is left to restate it. The register wins."""
    beat = _beat_this_period_extended(
        timeline=_timeline_with_handover_in_the_decade(),
        hinge=None,
        addressed_to="client_with_guardian",
        as_of=date(2026, 1, 1),
        forward_beat_follows=False,
    )

    assert "runs to 2033" in beat.text.en, beat.text.en


def test_the_two_minute_reading_still_bounds_its_own_no_hinge_lead():
    """The suppression is the five-minute module's call, taken because of what
    else that reading contains. The shorter reading has no bhukti clause and no
    forward beat in the same position, so `_beat_right_now`'s default must not
    have moved underneath it."""
    beat = _beat_right_now(
        timeline=_timeline_with_handover_in_the_decade(),
        hinge=None,
        addressed_to="self",
    )

    assert "runs to 2033" in beat.text.en, beat.text.en


def test_the_assembled_elder_reading_states_the_handover_once(client):
    """End-to-end, on a real chart rather than a hand-built timeline: whatever
    branch the fixture lands in, no two beats may date the same mahadasha
    handover. This is the form the defect was actually found in — by a person
    reading the assembled output, which is how all three of this module's copy
    defects were found."""
    data = _read(client, age=66, marital_status="married")
    assert data["focusTopic"] == "ELDER"

    this_period = next(b for b in data["beats"] if b["id"] == "this_period")["text"]["en"]
    forward = next(b for b in data["beats"] if b["id"] == "what_comes_after")["text"]["en"]

    match = re.search(r"and it runs to (\d{4})\.", this_period)
    if match:
        assert match.group(1) not in forward, (this_period, forward)


# ── Beat 7 — Your Topic in Full (§2.5) ───────────────────────────────────────


def test_topic_in_full_is_built_from_the_topics_own_house_not_from_temperament(client):
    """The 2026-08-11 rebuild, asserted at the seam it was made for.

    Facet 1 used to be `_VOICE[strongest].gift` behind a "that shows up as"
    lens — which printed Beat 3's own opening clause a second time, relabelled
    as this topic's manifestation. It is now the topic's house, that house's
    adhipathi, and where the adhipathi actually sits, none of which appears
    anywhere else in the reading.

    `basis` is checked alongside the prose deliberately: the house number and
    the lord's placement are the claim, and a reading that states them without
    disclosing them is not checkable against the reader's own jathagam, which
    is the entire reason this material was chosen."""
    data = _read(client, age=40, marital_status="married")
    topic_in_full = next(beat for beat in data["beats"] if beat["id"] == "topic_in_full")

    en = topic_in_full["text"]["en"]
    assert "In home and family," in en
    assert " lord " in en and " sits in your " in en, en
    assert "One thing that might help:" in en
    # The old lens hand-off is gone, and with it the gift reuse it enabled.
    assert "that shows up as" not in en
    for voice in _VOICE.values():
        assert voice.gift[1] not in en

    basis_en = topic_in_full["basis"]["en"]
    assert "house 4 (this topic's house)" in basis_en, basis_en
    assert "strength" in basis_en, basis_en


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
    # The anchor is whichever beat now stands where the withheld topic beat
    # would have — `what_comes_after` since the forward horizon was wired in
    # after it (2026-08-11), `one_thing` before that.
    assert data["pendingQuestion"]["beforeBeat"] == "what_comes_after"
    assert ids.index("what_comes_after") == ids.index("window_ahead") + 1, ids


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

    # Saturn is the one lord whose theme word its own `past_texture` already
    # contains ("endurance"), so `_theme_prefix` correctly suppresses the
    # prefix here rather than printing "Endurance: it asked for endurance".
    # What the seam this test guards actually needs is the negative: the
    # INCOMING lord's theme must never appear in the outgoing lord's beat.
    moon_theme_en = _PERIOD_THEME["MOON"][1]
    assert "under Saturn" in beat.text.en, beat.text.en
    assert moon_theme_en.capitalize() not in beat.text.en, beat.text.en
    assert f"{moon_theme_en}:" not in beat.text.en, beat.text.en


# ── Cross-beat repetition (2026-08-11) ───────────────────────────────────────


def _beats_of(data: dict) -> list[OneMinuteBeat]:
    return [
        OneMinuteBeat.model_validate({"id": b["id"], "text": b["text"], "basis": b["basis"]})
        for b in data["beats"]
    ]


@pytest.mark.parametrize(
    ("age", "marital_status"),
    [(22, None), (29, "single"), (40, "married"), (52, "widowed"), (66, "married")],
)
def test_no_content_clause_is_printed_by_two_beats_of_one_reading(
    client, age, marital_status
):
    """THE GUARD FOR THE ONLY DEFECT CLASS THIS MODULE HAS ACTUALLY SHIPPED.

    Three separate copy defects reached rendered output here, and all three
    were the same shape: a beat printing a content string another beat in the
    same reading had already spent. Beat 4 reopened on `shadow` verbatim
    immediately after Beat 3 closed on it. The topic beat printed `shadow` a
    third time. The topic beat printed `gift` after Beat 3 had opened on it.
    Every one was found by a person reading rendered output start to finish,
    and none by a test — because each beat was individually correct, each
    table lookup was the one the spec named, and the defect lived only in the
    adjacency of two beats no test looked at together.

    This looks at them together. It is deliberately parametrised across the
    topic routes rather than run once: which beats render at all depends on
    age and marital status, so a single fixture would leave most of the
    possible adjacencies unexercised — and the pairs that shipped broken were
    never the pairs anybody thought to check.
    """
    data = _read(client, age=age, marital_status=marital_status)
    repeats = repeated_source_clauses(_beats_of(data))
    assert repeats == {}, repeats


def test_the_repetition_guard_actually_fires_on_a_repeat():
    """The guard's own guard. A cross-beat check that silently matched nothing
    — a bad table reference, a facet renamed out from under it — would pass
    every reading forever and read exactly like success, which is the failure
    mode a negative-only assertion cannot distinguish from working."""
    clause = _VOICE["SUN"].gift[1]
    beats = [
        OneMinuteBeat(
            id="first",
            text=OneMinuteText(ta="x", en=f"Your real strength is {clause}."),
            basis=OneMinuteText(ta="", en=""),
        ),
        OneMinuteBeat(
            id="second",
            text=OneMinuteText(ta="y", en=f"At work, that shows up as {clause}."),
            basis=OneMinuteText(ta="", en=""),
        ),
    ]

    repeats = repeated_source_clauses(beats)
    assert repeats == {clause: ["first", "second"]}, repeats


def test_the_repetition_guard_does_not_fire_on_a_single_common_word():
    """The other half of calibrating it. `_PERIOD_THEME`'s entries are single
    words ("change", "learning"), and `_beat_right_now` opens its maha branch
    on "That changed in {year}" — so scanning them would fail a correct Moon
    reading on a substring coincidence. A guard that cries wolf on correct
    output is a guard somebody switches off, which is worse than not having
    one. See `_content_strings`' own comment for the general rule."""
    theme = _PERIOD_THEME["MOON"][1]
    beats = [
        OneMinuteBeat(
            id="last_period",
            text=OneMinuteText(ta="x", en=f"{theme.capitalize()}: it moved often."),
            basis=OneMinuteText(ta="", en=""),
        ),
        OneMinuteBeat(
            id="this_period",
            text=OneMinuteText(ta="y", en="That changed in 2020."),
            basis=OneMinuteText(ta="", en=""),
        ),
    ]

    assert repeated_source_clauses(beats) == {}


# ── The dated gochara window (2026-08-11) ────────────────────────────────────


def test_window_ahead_names_a_house_a_texture_and_a_month(client):
    """The one beat in either reading that is about this season rather than
    this life. All three parts have to be there: without the house it is not
    chart-derived, without the month it is not dateable, and without the
    texture it is a coordinate with no reading attached."""
    data = _read(client, age=40, marital_status="married")
    window = next(beat for beat in data["beats"] if beat["id"] == "window_ahead")

    en = window["text"]["en"]
    assert "Saturn is currently transiting the" in en
    assert "from your Moon" in en
    assert "It moves on around" in en
    # Compared case-insensitively on the leading character only: the beat
    # `_cap`s the texture, because it opens a sentence there and the table
    # entries are written lower-case so they can also sit mid-sentence.
    assert any(
        texture_en[0].upper() + texture_en[1:] in en for _ta, texture_en in _GOCHARA_SANI.values()
    ), en

    # The basis discloses the two rasis and the count between them, so the
    # reader can check the house against any panchangam they already own.
    basis_en = window["basis"]["en"]
    assert "Transiting Saturn in rasi" in basis_en
    assert "janma rasi" in basis_en
    assert "house" in basis_en and "from the Moon" in basis_en


def test_gochara_table_covers_all_twelve_houses_and_phase_names_are_a_subset():
    """`house_from_reference` returns 1-12, so a gap is a live KeyError on
    somebody's reading rather than a missing sentence. The phase names cover
    only the five positions the Tamil almanac actually names — inventing one
    for the other seven would be a claim wearing a convention's clothes."""
    assert sorted(_GOCHARA_SANI) == list(range(1, 13))
    assert set(_SANI_PHASE_NAME) == {12, 1, 2, 4, 8}
    assert set(_SANI_PHASE_NAME) <= set(_GOCHARA_SANI)


# ── The tension beat (2026-08-11) ────────────────────────────────────────────


def test_the_tension_beat_is_withheld_when_the_birth_time_is_not_confirmed(client):
    """`_LAGNA_FACE` is keyed on the lagna rasi, which is precisely the value a
    twenty-minute error moves. Beat 2 has just told this reader the lagna is
    being left out; a lagna-derived beat three beats later would contradict
    the disclosure the reading just made."""
    payload = _profile(age=38, marital_status="married")
    payload["birthTimeSource"] = "APPROXIMATE"
    created = client.post("/api/v1/birth-profiles", json=payload)
    assert created.status_code == 200, created.text
    chart_id = created.json()["data"]["chartId"]

    response = client.get(f"/api/v1/charts/{chart_id}/five-minute")
    assert response.status_code == 200, response.text
    ids = [beat["id"] for beat in response.json()["data"]["beats"]]

    assert "the_tension" not in ids
    # ...and the beats that need no lagna all still render.
    assert "window_ahead" in ids
    assert "what_comes_after" in ids


def test_the_topic_beat_still_names_its_topic_without_a_lagna(client):
    """With the house sentence withheld, the lens moves onto the fallback
    friction clause. Without that the beat opened straight on "Where it runs
    into friction:" — a whole beat about the reader's marriage or work that
    never named which, delivered to the reader who was already told the
    reading is working with less."""
    payload = _profile(age=38, marital_status="married")
    payload["birthTimeSource"] = "APPROXIMATE"
    created = client.post("/api/v1/birth-profiles", json=payload)
    chart_id = created.json()["data"]["chartId"]
    data = client.get(f"/api/v1/charts/{chart_id}/five-minute").json()["data"]

    topic = next(beat for beat in data["beats"] if beat["id"] == "topic_in_full")
    en = topic["text"]["en"]
    assert en.startswith("In home and family,"), en
    assert "sits in your" not in en, en
    assert "(this topic's house)" not in topic["basis"]["en"], topic["basis"]["en"]


def test_every_reachable_topic_has_a_house_a_lens_and_an_area_noun():
    """Three tables keyed on the same topic set, read in the same beat. A gap
    in any of them is a KeyError on a live reading, and they are maintained
    separately, which is exactly when a set-equality assertion earns its
    place."""
    from app.services.one_minute_reading_service import (  # noqa: PLC0415
        _TOPIC_AREA,  # noqa: PLC2701 (internal use)
    )

    assert set(_TOPIC_HOUSE) == set(_TOPIC_LENS)
    assert {_TOPIC_AREA[topic] for topic in _TOPIC_HOUSE} <= set(_AREA_NOUN)
    assert all(1 <= house <= 12 for house in _TOPIC_HOUSE.values())


def test_the_elder_refusal_survives_into_the_longer_reading(client):
    """The 2-minute reading declares "this reading does not read length of
    life" on its own ELDER branch. The 5-minute reading routes the same reader
    to the same health topic and says considerably more about it — a longer
    reading of the same subject cannot carry fewer commitments than the
    shorter one it is sold as an upgrade from."""
    data = _read(client, age=66, marital_status="married")
    assert data["focusTopic"] == "ELDER"
    topic = next(beat for beat in data["beats"] if beat["id"] == "topic_in_full")
    assert "does not read length of life" in topic["text"]["en"], topic["text"]["en"]


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

    Raised a third time, 71 -> 96, on 2026-08-11 for the descent rebuild:
    `_GOCHARA_SANI` (12), `_SANI_PHASE_NAME` (5), `_LORD_STRENGTH_NOTE` (3)
    and `_AREA_NOUN` (5). This is the largest single raise the cap has taken
    and it is unpaid, so it is worth being exact about what it buys and why
    the ceiling should tolerate it.

    What it buys is the module's ONLY dated, non-natal material. Every beat
    before this pass was true of the reader's life rather than of their next
    few seasons, which is what made the five-minute reading a longer
    two-minute reading rather than a deeper one.

    Why 24 strings of it is cheaper to review than 24 strings of temperament:
    the cap's stated unit is "one Tamil review sitting", and these are not
    equivalent per string. `_GOCHARA_SANI` is standard gochara — a Tamil
    astrologer reads Sani-in-the-Nth-from-Chandra against a convention they
    already hold, so review is verification. `_VOICE.domain_flex` was
    authored prose with no external referent, so review is judgement. Twelve
    of the former is a shorter sitting than twelve of the latter, and a cap
    that counts them the same is measuring the wrong thing. It is left
    counting them the same anyway, because the alternative is a weighted cap
    nobody can audit — the honest fix is this comment, not a multiplier.

    `_TOPIC_HOUSE` is NOT counted: its values are house numbers, and a
    doctrinal integer is not a string anybody reviews for tone.
    `_TENSION_FRAME`/`_TENSION_CLOSE` are not counted either, same treatment
    as every other fixed connective — and note the beat they frame introduced
    NO new vocabulary of its own, because `_LAGNA_FACE`/`_MOON_MIND` were
    written and reviewed long ago and have been waiting for a beat to use
    them.
    """
    new_strings = 9  # mechanism: one per graha
    new_strings += 9 * 2  # domain_flex: WORK + RELATIONSHIPS per graha
    new_strings += 9  # asks: one per graha
    new_strings += len(_PERIOD_THEME)  # period_theme: one per graha
    new_strings += len(_TOPIC_LENS)  # topic_lens: one per non-UNKNOWN, reachable topic
    new_strings += len(_SHADOW_ESSENCE)  # shadow_essence: per graha, the no-lagna friction facet
    new_strings += len(_BHUKTI_FLAVOR)  # bhukti_flavor: one per graha, the antardasha clause
    new_strings += len(_GOCHARA_SANI)  # gochara_sani: Sani in the Nth from the janma rasi
    new_strings += len(_SANI_PHASE_NAME)  # the five positions the Tamil almanac names
    new_strings += len(_LORD_STRENGTH_NOTE)  # STRONG / MODERATE / WEAK
    new_strings += len(_AREA_NOUN)  # the subject the outlook + guidance clauses now name
    assert new_strings == 9 + 18 + 9 + 9 + 8 + 9 + 9 + 12 + 5 + 3 + 5
    assert new_strings <= 96
