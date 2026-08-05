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

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.dasha import DashaPeriod, VimshottariTimeline
from app.services import one_minute_reading_service as reading
from app.services.feature_flags import reset_flag, set_flag
from app.services.narrative_engine import tone_validator
from app.services.one_minute_reading_service import (
    MAX_WORDS_EN,
    MAX_WORDS_TA,
    _beat_last_ten_years,
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

    assert data["wordCount"]["en"] <= MAX_WORDS_EN, _body(data, "en")
    assert data["wordCount"]["ta"] <= MAX_WORDS_TA, _body(data, "ta")
    # A reading that collapses to two sentences has failed differently.
    assert data["wordCount"]["en"] >= 60
    assert len(data["beats"]) >= 4


# ── Safety: the two failures that lose a user permanently ────────────────────


_ADULT_TOKENS_EN = (
    "marriage", "marry", "married", "spouse", "husband", "wife",
    "career", "salary", "promotion", "income", "job", "wealth", "invest",
)
_ADULT_TOKENS_TA = ("திருமண", "கல்யாண", "கணவ", "மனைவி", "சம்பள", "முதலீ")


@pytest.mark.parametrize("age", [1, 5, 8, 12, 15, 17])
def test_a_minors_reading_never_speaks_about_marriage_or_work(client, age):
    """The failure age_phase_service:96 records, re-tested on a new surface.

    An eight-month-old's chart once came back advising her to watch her
    standing at work. The graha reading was fine; the text was written for the
    wrong person. Every new narrative surface has to prove it cannot do that.
    """
    data = _read(client, age=age)

    assert data["addressedTo"] == "parent"
    assert data["focusTopic"] == "CHILD_GROWTH"

    body_en = _body(data, "en").lower()
    for token in _ADULT_TOKENS_EN:
        assert token not in body_en, f"minor aged {age} was told about '{token}': {body_en}"
    body_ta = _body(data, "ta")
    for token in _ADULT_TOKENS_TA:
        assert token not in body_ta, f"minor aged {age} was told about '{token}': {body_ta}"

    # And the instruction must have a valid recipient.
    one_thing = next(b for b in data["beats"] if b["id"] == "one_thing")
    assert "parents" in one_thing["text"]["en"].lower()
    assert "பெற்றோர்" in one_thing["text"]["ta"]


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
    """
    data = _read(client, age=33, marital_status="married")
    body = _body(data, "ta")
    assert "நட்சத்திர" in body
    assert "ராசி" in body


def test_the_basis_field_is_where_the_technical_terms_live(client):
    """The reader who wants to check us can; the plain reader never sees it."""
    data = _read(client, age=33, marital_status="married")
    basis = " ".join(b["basis"]["en"] for b in data["beats"] if b.get("basis"))
    assert "nakshatra" in basis.lower()
    assert "mahadasha" in basis.lower()


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

    beat, hinge = _beat_last_ten_years(
        timeline=timeline, as_of=date(2026, 8, 4), birth_date=date(1993, 3, 20)
    )

    assert "From 2020 to 2026 you were under Sun" in beat.text.en, beat.text.en
    assert "Venus" not in beat.text.en, beat.text.en
    assert hinge == (2026, "maha")
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


def test_an_unconfirmed_birth_time_withholds_the_lagna(client):
    """A wrong birth time moves the lagna, and beat 1 is what most depends on it.

    Opening confidently on a lagna we are not sure of loses the reader at
    sentence one — which costs the whole reading, not just that clause.
    """
    unsure = _read(client, age=33, marital_status="married", birth_time_source="unknown")
    confirmed = _read(client, age=33, marital_status="married", birth_time_source="BIRTH_CERTIFICATE")

    unsure_beat = next(b for b in unsure["beats"] if b["id"] == "who_you_are")
    confirmed_beat = next(b for b in confirmed["beats"] if b["id"] == "who_you_are")

    assert "rising" not in unsure_beat["text"]["en"]
    assert "லக்னத்தில்" not in unsure_beat["text"]["ta"]
    assert "birth time is not confirmed" in unsure_beat["basis"]["en"]
    assert "rising" in confirmed_beat["text"]["en"]


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
    assert "your star" in unsure_text["en"], unsure_text["en"]
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
    """A (ta, en) pair of authored copy.

    ``type(part) is str`` rather than ``isinstance``: the provenance
    declarations are 2-tuples of StrEnum members, which ARE str instances, and
    an isinstance check would classify the classifier as copy.
    """
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
    for name in ("_CHILD_VOICE", "_SIGNATURE_OPENING", "_SIGNATURE_GRIEVANCE"):
        assert set(getattr(reading, name)) == grahas, f"{name} does not cover every graha"


def test_every_beat_the_service_emits_declares_its_provenance(client):
    """The frames are where an event claim would actually get written.

    Most of this reading's words are the frames the beat builders write around
    the vocabulary, not the vocabulary itself — and a frame already carries a
    date, so turning it into an event claim is one clause of work. §6.5 of the
    audit classified the tables and stopped there; this closes the other half.

    Both directions are asserted. A declared-but-never-emitted beat is the
    stale-baseline problem this repo has paid for before.
    """
    emitted: set[str] = set()
    # Two profiles cover all eight ids: the minor path (four beats, its own
    # forward beat) and the full adult path.
    for kwargs in ({"age": 8}, {"age": 33, "marital_status": "married"}):
        emitted |= {beat["id"] for beat in _read(client, **kwargs)["beats"]}

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
