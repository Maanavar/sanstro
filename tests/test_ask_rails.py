"""Ask Vinaadi rails (admin spec L7): metering, spend cap, per-state quota, credits, topics.

The kill-switch acceptance test lives with the other switches in
tests/test_runtime_settings.py (`test_ask_vinaadi_switch_answers_without_calling_the_provider`).
"""
from __future__ import annotations

import hashlib
import json
from datetime import UTC, date, datetime
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest

from app.core.clock import accounting_date
from app.core.error_codes import ErrorCode
from app.core.errors import AppError
from app.models.ask_vinaadi_call import AskSpendAlert, AskVinaadiCall
from app.models.payment import CreditLedgerEntry
from app.models.user import User
from app.services import ask_vinaadi_metering as metering
from app.services import ask_vinaadi_service as service
from app.services import feature_flags
from app.services.ask_vinaadi_topics import CATEGORIES, sensitive_topics
from app.services.payment_service import credit_balance
from tests.conftest import TEST_USER_ID, SessionLocal
from tests.test_ask_vinaadi import _create_test_chart

UID = UUID(TEST_USER_ID)


class _FixedClock:
    def __init__(self, at: datetime) -> None:
        self._at = at

    def now_utc(self) -> datetime:
        return self._at


def _message(*, input_tokens: int = 1_000, output_tokens: int = 500, text: str | None = None) -> SimpleNamespace:
    body = text if text is not None else json.dumps(
        {"ta": "நல்ல காலம்.", "en": "A good period.", "signals_used": [], "confidence": "MEDIUM"}
    )
    return SimpleNamespace(
        content=[SimpleNamespace(type="text", text=body)],
        usage=SimpleNamespace(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cache_read_input_tokens=None,
            cache_creation_input_tokens=None,
        ),
    )


def _ask(client, chart_id: str, question: str, provider: MagicMock):
    with patch("app.services.ask_vinaadi_service.get_settings") as settings, \
         patch.dict("sys.modules", {"anthropic": provider}):
        settings.return_value.anthropic_api_key = "sk-test-key"
        return client.post(f"/api/v1/charts/{chart_id}/ask", json={"question": question, "lang": "en"})


def _provider(message: SimpleNamespace | None = None) -> MagicMock:
    provider = MagicMock()
    provider.Anthropic.return_value.messages.create.return_value = message or _message()
    return provider


def _calls() -> list[AskVinaadiCall]:
    with SessionLocal() as session:
        return session.query(AskVinaadiCall).order_by(AskVinaadiCall.created_at).all()


def _set(name: str, value) -> None:
    feature_flags.persist_flag(name, value, reason="test setting", actor_user_id=None)


# ── Cost ─────────────────────────────────────────────────────────────────────


@pytest.mark.no_db
def test_the_model_ask_calls_has_a_price():
    assert service._MODEL in metering.MODEL_PRICES


@pytest.mark.no_db
def test_cost_is_list_price_times_rate_rounded_up():
    usage = metering.CallUsage(input_tokens=1_000_000, output_tokens=1_000_000)
    # $3 + $15 = $18 at ₹88.00 = ₹1,584.00
    assert metering.cost_paise("claude-sonnet-4-6", usage, usd_inr_paise=8_800) == 158_400
    cached = metering.CallUsage(cache_read_tokens=1_000_000, cache_write_tokens=1_000_000)
    # $0.30 + $3.75 = $4.05 at ₹88.00 = ₹356.40
    assert metering.cost_paise("claude-sonnet-4-6", cached, usd_inr_paise=8_800) == 35_640
    # One token costs a fraction of a paisa; the cap must still see it.
    assert metering.cost_paise("claude-sonnet-4-6", metering.CallUsage(input_tokens=1), usd_inr_paise=8_800) == 1


@pytest.mark.no_db
def test_an_unpriced_model_is_refused_not_free():
    with pytest.raises(KeyError):
        metering.cost_paise("some-new-model", metering.CallUsage(input_tokens=10), usd_inr_paise=8_800)


@pytest.mark.no_db
def test_usage_reads_only_real_counts():
    assert metering.usage_from_message(MagicMock()) == metering.CallUsage()
    assert metering.usage_from_message(None) == metering.CallUsage()
    assert metering.usage_from_message(_message(input_tokens=7, output_tokens=3)) == metering.CallUsage(7, 3, 0, 0)


# ── Prompt version ───────────────────────────────────────────────────────────

#: sha256 of the instructions each prompt version names. A prompt edit without a
#: version bump fails here; add the new version's line rather than editing one.
_PROMPT_FINGERPRINTS = {
    "ask-2026-11-02": "d6608e5bdf1ce649d11f1d3fd0ea5c6d5ebcf82055c107c9a451936c700579db",
}


@pytest.mark.no_db
def test_prompt_version_names_the_exact_instructions():
    text = "\n".join((service._SYSTEM_PROMPT, service._SAFETY_ADDENDUM, service._SELF_HARM_ADDENDUM))
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    assert _PROMPT_FINGERPRINTS.get(service.ASK_PROMPT_VERSION) == digest, (
        f"The Ask prompt changed: bump ASK_PROMPT_VERSION and record {digest}"
    )


# ── Sensitive topics ─────────────────────────────────────────────────────────


@pytest.mark.no_db
@pytest.mark.parametrize(
    ("question", "expected"),
    [
        ("Is this a good week for my career?", ()),
        ("Should I start a diet this month?", ()),
        ("I studied hard, will I pass?", ()),
        ("When will my father die?", ("death",)),
        ("என் ஆயுள் எவ்வளவு?", ("death",)),
        ("My son has been sick for weeks, will he recover?", ("illness", "child_health")),
        ("குழந்தைக்கு நோய் குணமாகுமா?", ("illness", "child_health")),
        ("Will I get pregnant this year?", ("pregnancy",)),
        ("Should I file for divorce?", ("divorce",)),
        ("I want to end my life", ("self_harm",)),
        ("தற்கொலை எண்ணம் வருகிறது", ("self_harm",)),
        ("I lost money in trading, will I recover it?", ("money_loss",)),
        ("வியாபாரத்தில் நஷ்டம் வருமா?", ("money_loss",)),
    ],
)
def test_sensitive_topics(question, expected):
    assert sensitive_topics(question) == expected


@pytest.mark.no_db
def test_flags_come_back_in_category_order():
    flags = sensitive_topics("I want to die, my divorce and the business loss are too much")
    assert flags == tuple(c for c in CATEGORIES if c in flags)
    assert {"death", "divorce", "self_harm", "money_loss"} <= set(flags)


@pytest.mark.no_db
def test_safety_addendum_only_for_flagged_questions():
    assert service._safety_addendum(()) == ""
    illness = service._safety_addendum(("illness",))
    assert "illness" in illness and "14416" not in illness
    assert "14416" in service._safety_addendum(("self_harm",))


def test_a_flagged_question_carries_the_safety_addendum_to_the_provider(client):
    _, chart_id = _create_test_chart(client)
    provider = _provider()
    assert _ask(client, chart_id, "I want to end my life, what does my chart say?", provider).status_code == 200
    sent = provider.Anthropic.return_value.messages.create.call_args.kwargs
    assert "14416" in sent["messages"][0]["content"]
    assert sent["system"] == service._SYSTEM_PROMPT, "the system prompt stays one fixed text"
    assert _calls()[0].flags == ["self_harm"]

    plain = _provider()
    assert _ask(client, chart_id, "Is this a good week for my career?", plain).status_code == 200
    assert "SAFETY" not in plain.Anthropic.return_value.messages.create.call_args.kwargs["messages"][0]["content"]


# ── Metering ─────────────────────────────────────────────────────────────────


def test_every_answer_is_metered(client):
    _, chart_id = _create_test_chart(client)
    response = _ask(client, chart_id, "Is this a good week for my career?", _provider(_message(input_tokens=2_000, output_tokens=800)))
    assert response.status_code == 200, response.text

    [call] = _calls()
    assert call.outcome == "answered"
    assert call.prompt_version == service.ASK_PROMPT_VERSION
    assert call.model == service._MODEL
    assert (call.input_tokens, call.output_tokens) == (2_000, 800)
    # $0.006 + $0.012 = $0.018 at ₹88.00 = 158.4 paise, rounded up
    assert call.cost_paise == 159
    assert call.latency_ms >= 0
    assert call.flags == []
    assert call.spend_date == accounting_date()
    assert not any(col.endswith("user_id") for col in AskVinaadiCall.__table__.columns.keys()), (
        "a metering row must not name the person"
    )


def test_a_failed_call_is_still_metered_and_the_question_given_back(client):
    _, chart_id = _create_test_chart(client)
    provider = MagicMock()
    provider.APITimeoutError = type("APITimeoutError", (Exception,), {})
    provider.Anthropic.return_value.messages.create.side_effect = provider.APITimeoutError("slow")

    response = _ask(client, chart_id, "Is this a good week for my career?", provider)
    assert response.status_code == 504

    # The request rolled back; the metering row did not.
    [call] = _calls()
    assert call.outcome == "provider_error"
    assert call.cost_paise == 0
    status = client.get("/api/v1/ask-vinaadi/daily-status").json()
    assert status["chipsUsed"] == 0


def test_a_billed_but_unreadable_reply_is_metered_as_unusable(client):
    _, chart_id = _create_test_chart(client)
    response = _ask(client, chart_id, "Is this a good week?", _provider(_message(text="[1, 2, 3]")))
    assert response.status_code == 502
    [call] = _calls()
    assert call.outcome == "unusable"
    assert call.cost_paise > 0


# ── Spend cap ────────────────────────────────────────────────────────────────


def _seed_spend(day: date, paise: int) -> None:
    with SessionLocal() as session, session.begin():
        session.add(AskVinaadiCall(
            spend_date=day, prompt_version="seed", model=service._MODEL, cost_paise=paise, outcome="answered", flags=[],
        ))


def _make_owner(email: str = "owner@example.com") -> None:
    with SessionLocal() as session, session.begin():
        session.add(User(email=email, admin_role="owner", is_admin=True))


def test_at_the_cap_no_provider_call_is_made_that_day(client):
    _, chart_id = _create_test_chart(client)
    _make_owner()
    _set("ask_daily_spend_cap_paise", 500)
    _seed_spend(accounting_date(), 500)
    provider = _provider()

    with patch.object(metering, "dispatch_owner_alert") as dispatch:
        response = _ask(client, chart_id, "Is this a good week for my career?", provider)

    assert response.status_code == 503
    error = response.json()["error"]
    assert error["code"] == "SERVICE_UNAVAILABLE"
    assert error["message"] == metering.CAP_REACHED_MESSAGE
    provider.Anthropic.return_value.messages.create.assert_not_called()
    assert client.get("/api/v1/ask-vinaadi/daily-status").json()["chipsUsed"] == 0, "a refusal spends no question"
    assert len(_calls()) == 1, "no call row: nothing was asked of the provider"
    [messages] = [c.args[0] for c in dispatch.call_args_list]
    assert [m.to_address for m in messages] == ["owner@example.com"]
    assert "pausing until tomorrow" in messages[0].body_text


def test_cap_follows_the_fake_clock_across_midnight(client):
    """Spend counts against its own accounting day: refused at 23:30 IST, open at 00:01."""
    _set("ask_daily_spend_cap_paise", 500)
    late = _FixedClock(datetime(2026, 11, 2, 18, 0, tzinfo=UTC))       # 23:30 IST on 2 Nov
    after = _FixedClock(datetime(2026, 11, 2, 18, 31, tzinfo=UTC))     # 00:01 IST on 3 Nov
    _seed_spend(date(2026, 11, 2), 500)

    with SessionLocal() as session, patch.object(metering, "dispatch_owner_alert"):
        with pytest.raises(AppError) as refused:
            metering.assert_spend_headroom(session, clock=late)
        assert refused.value.code is ErrorCode.SERVICE_UNAVAILABLE
        metering.assert_spend_headroom(session, clock=after)  # a new day, a fresh cap


def test_owners_are_alerted_once_at_80_and_once_at_100(client):
    _make_owner()
    _set("ask_daily_spend_cap_paise", 1_000)
    usage = metering.CallUsage(input_tokens=1_000_000)  # $3 at ₹88 = 26,400 paise > cap
    small = metering.CallUsage(input_tokens=30_000)     # 792 paise: 79.2% of the cap

    with patch.object(metering, "dispatch_owner_alert") as dispatch:
        metering.record_call(model=service._MODEL, prompt_version="t", usage=small, latency_ms=1, outcome="answered", flags=())
        assert dispatch.call_count == 0
        metering.record_call(model=service._MODEL, prompt_version="t", usage=metering.CallUsage(input_tokens=1_000),
                             latency_ms=1, outcome="answered", flags=())  # +27 → 819, past 80%
        assert dispatch.call_count == 1
        metering.record_call(model=service._MODEL, prompt_version="t", usage=metering.CallUsage(input_tokens=1_000),
                             latency_ms=1, outcome="answered", flags=())
        assert dispatch.call_count == 1, "80% alerts once a day"
        metering.record_call(model=service._MODEL, prompt_version="t", usage=usage, latency_ms=1, outcome="answered", flags=())
        metering.record_call(model=service._MODEL, prompt_version="t", usage=usage, latency_ms=1, outcome="answered", flags=())
        assert dispatch.call_count == 2, "100% alerts once a day"

    with SessionLocal() as session:
        assert sorted(a.threshold_pct for a in session.query(AskSpendAlert).all()) == [80, 100]


# ── Per-state quota and credits ──────────────────────────────────────────────


def test_the_daily_quota_is_a_setting(client):
    _, chart_id = _create_test_chart(client)
    _set("ask_daily_limit_premium", 1)  # the fixture account is premium
    assert client.get("/api/v1/ask-vinaadi/daily-status").json()["dailyLimit"] == 1
    assert _ask(client, chart_id, "Is this a good week?", _provider()).status_code == 200
    assert _ask(client, chart_id, "And next week?", _provider()).status_code == 429


@pytest.mark.no_db
def test_quota_settings_cannot_go_negative():
    with pytest.raises(feature_flags.FlagValueError):
        feature_flags._validated_for_persist("ask_daily_limit_registered", -1)
    with pytest.raises(feature_flags.FlagValueError):
        feature_flags._validated_for_persist("ask_daily_spend_cap_paise", -5)


def _give_credits(count: int) -> None:
    with SessionLocal() as session, session.begin():
        session.add(CreditLedgerEntry(
            user_id=UID, credit_key="ask_question", delta=count, source="purchase", source_id="order-test",
            idempotency_key="order:test:ask_question",
        ))


def test_a_bought_credit_pays_once_the_allowance_is_spent(client):
    _, chart_id = _create_test_chart(client)
    _set("ask_daily_limit_premium", 1)
    _give_credits(1)

    assert _ask(client, chart_id, "Is this a good week?", _provider()).status_code == 200
    with SessionLocal() as session:
        assert credit_balance(session, UID, "ask_question") == 1, "the allowance pays first"

    second = _ask(client, chart_id, "And next week?", _provider())
    assert second.status_code == 200, second.text
    with SessionLocal() as session:
        assert credit_balance(session, UID, "ask_question") == 0

    third = _ask(client, chart_id, "And the week after?", _provider())
    assert third.status_code == 429
    assert third.json()["error"]["code"] == "DAILY_LIMIT_REACHED"


def test_a_credit_is_given_back_when_its_answer_never_arrives(client):
    from app.services.ask_vinaadi_usage_service import release_question, reserve_question

    _set("ask_daily_limit_premium", 0)
    _give_credits(1)
    with SessionLocal() as session, session.begin():
        reservation = reserve_question(session, UID)
        assert reservation.source == "credit"
        assert credit_balance(session, UID, "ask_question") == 0
        release_question(session, UID, reservation)
        release_question(session, UID, reservation)  # idempotent: one spend, one return
        assert credit_balance(session, UID, "ask_question") == 1


# ── The daily status says what the reader can do before they type (audit U4) ─


def test_daily_status_reports_bought_credits(client):
    """Credits were spent but never shown: a buyer could not see how many remained."""
    assert client.get("/api/v1/ask-vinaadi/daily-status").json()["creditsRemaining"] == 0
    _give_credits(3)
    assert client.get("/api/v1/ask-vinaadi/daily-status").json()["creditsRemaining"] == 3


def test_daily_status_reports_a_spend_cap_pause_without_alerting(client):
    _make_owner()
    _set("ask_daily_spend_cap_paise", 500)
    assert client.get("/api/v1/ask-vinaadi/daily-status").json()["askPaused"] is False
    _seed_spend(accounting_date(), 500)
    with patch.object(metering, "dispatch_owner_alert") as dispatch:
        assert client.get("/api/v1/ask-vinaadi/daily-status").json()["askPaused"] is True
    dispatch.assert_not_called()  # reading the status is not a refused question


def test_daily_status_reports_the_kill_switch(client):
    _set("enable_ask_vinaadi", False)
    assert client.get("/api/v1/ask-vinaadi/daily-status").json()["askPaused"] is True
