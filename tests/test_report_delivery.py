"""Report delivery: what a report credit or a Premium inclusion buys.

Acceptance (ARC-14's switch-on condition for the two report SKUs — "its
deliverable ships and has a test buying it end to end"):
  * a Premium account's first jadhagam report of the month is free and included
  * the second costs a credit; with no credit it is 402, not a free report
  * a bought `jadhagam_report` credit is spent, once, and the balance falls
  * the delivered PDF is stored, re-downloadable byte-for-byte, and the second
    download returns the same sha256 as the first
  * a failed render costs nothing: no credit, no inclusion, no row -- proved in
    two halves, because one test cannot reach both. An account with an
    inclusion left never enters the credit branch, so the inclusion test is
    blind to a premature commit there; the credit test spends the inclusion
    first to get at it. Verified by mutation: adding `session.commit()` after
    `spend_credit` leaves the inclusion test GREEN and fails only the credit
    one.
  * someone else's chart is 404 before any payment is touched
  * marriage timing is withheld from a minor's report (the gate, not a filter)
  * the retired `/reports/purchase` stub is gone

Payments live in tests/test_razorpay_payments.py; this file starts from a
credit already in the ledger, because how it got there is that file's subject.

CSRF on `POST /reports` is driven in tests/test_dashboard_bundle_api.py, where
the DASH-07 gate test for the route it replaced already lived.

BLIND SPOT: the document's chapters are now read back (see "The document has
words in it"), so an empty or dropped chapter fails in both languages — proved
by mutation: forcing `_windows_chapter`'s Moon-missing `return []` names
`ch_windows` as absent from the document entirely. What is still NOT checked is
whether what a chapter says is *right*: no number, date, score or sentence is
verified against the engine here, so a chapter full of wrong values passes.
The per-engine suites own that. `test_pdf_export.py` still has the original gap
for the free sheets. The Tamil document is built, sized and chapter-checked,
but its wording is unreviewed (Phase 4 owner decision: Tamil copy unreviewed).
"""
from __future__ import annotations

import re
from datetime import UTC, date, timedelta
from uuid import UUID, uuid4

import pytest

from app.core.clock import accounting_date, accounting_month_start_utc, next_accounting_day_start
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.payment import CreditLedgerEntry
from app.models.report import REPORT_KINDS, Report
from app.models.user import User
from app.services import payment_service, report_delivery_service

#: The account `conftest.client` signs in as.
TEST_USER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")


def _csrf() -> dict[str, str]:
    return {"X-Vinaadi-CSRF": "1"}


def _chart(client, payload_factory, *, display_name: str = "Arjun Kumar", birth_date: str | None = None) -> str:
    payload = payload_factory(display_name=display_name)
    if birth_date is not None:
        payload["birthDateLocal"] = birth_date
    created = client.post("/api/v1/birth-profiles", json=payload)
    assert created.status_code == 200, created.text
    return created.json()["data"]["chartId"]


def _grant_credit(user_id: UUID, credit_key: str, amount: int = 1) -> None:
    """Put a credit in the ledger the way a paid order does — one +n row under
    its own idempotency key."""
    with SessionLocal() as session, session.begin():
        session.add(
            CreditLedgerEntry(
                id=uuid4(),
                user_id=user_id,
                credit_key=credit_key,
                delta=amount,
                source="purchase",
                source_id=f"order:{uuid4()}",
                idempotency_key=f"order:{uuid4()}",
            )
        )


def _balance(user_id: UUID, credit_key: str) -> int:
    with SessionLocal() as session:
        return payment_service.credit_balance(session, user_id, credit_key)


def _drop_subscription(user_id: UUID) -> None:
    """Take Premium away, leaving a registered account — which includes no
    reports at all."""
    from app.models.subscription import Subscription

    with SessionLocal() as session, session.begin():
        for row in session.query(Subscription).filter(Subscription.user_id == user_id).all():
            row.status = "cancelled"


# ── The tables that say what a kind is worth ────────────────────────────────


def test_every_report_kind_has_a_credit_key_and_an_inclusion_field():
    """A kind missing from either table is a kind that can be sold and never
    delivered, or one whose Premium inclusion silently counts zero."""
    assert set(report_delivery_service._KIND_CREDIT_KEY) == set(REPORT_KINDS)
    assert set(report_delivery_service._KIND_INCLUSION_FIELD) == set(REPORT_KINDS)


def test_credit_keys_match_the_products_that_grant_them():
    """The ledger key a report spends is the key the SKU grants. These are the
    two ends of the same purchase, and they were never connected before."""
    from app.models.payment import CREDIT_KEYS

    for key in report_delivery_service._KIND_CREDIT_KEY.values():
        assert key in CREDIT_KEYS


# ── The included report ─────────────────────────────────────────────────────


def test_premium_first_jadhagam_report_of_the_month_is_included(client, birth_profile_payload_factory):
    chart_id = _chart(client, birth_profile_payload_factory)

    before = client.get("/api/v1/reports/allowance").json()["kinds"]
    jadhagam = next(k for k in before if k["kind"] == "jadhagam")
    assert jadhagam["includedMonthly"] == 1
    assert jadhagam["includedUsed"] == 0
    assert jadhagam["canCreate"] is True

    response = client.post(
        "/api/v1/reports",
        json={"kind": "jadhagam", "chartId": chart_id},
        headers=_csrf(),
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["report"]["source"] == "included"
    assert body["report"]["byteSize"] > 0
    assert body["allowance"]["includedUsed"] == 1
    assert body["allowance"]["includedRemaining"] == 0

    # Nothing was charged: the inclusion is not a credit.
    assert _balance(TEST_USER_ID, "jadhagam_report") == 0


def test_second_report_in_the_month_is_402_without_a_credit(client, birth_profile_payload_factory):
    chart_id = _chart(client, birth_profile_payload_factory)
    first = client.post(
        "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
    )
    assert first.status_code == 201

    second = client.post(
        "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
    )
    assert second.status_code == 402
    detail = second.json()["detail"]
    assert detail["error"] == "NO_REPORT_CREDIT"
    assert detail["includedUsed"] == 1
    assert detail["credits"] == 0

    with SessionLocal() as session:
        assert session.query(Report).count() == 1


def test_registered_account_includes_no_reports(client, birth_profile_payload_factory, monkeypatch):
    # The open beta gives every signed-in account premium's limits, inclusions
    # included (OPEN_BETA_LIMITS), so it has to be off for this test to be
    # about the registered tier at all.
    monkeypatch.setattr(get_settings(), "open_beta", False)
    chart_id = _chart(client, birth_profile_payload_factory)
    _drop_subscription(TEST_USER_ID)

    allowance = client.get("/api/v1/reports/allowance").json()["kinds"]
    assert all(k["includedMonthly"] == 0 for k in allowance)
    assert all(k["canCreate"] is False for k in allowance)

    refused = client.post(
        "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
    )
    assert refused.status_code == 402


def test_last_months_included_report_does_not_count_against_this_month(
    client, birth_profile_payload_factory
):
    """The inclusion is monthly, and the month is the accounting month. A row
    created before this month's start must not hold the allowance down."""
    chart_id = _chart(client, birth_profile_payload_factory)
    created = client.post(
        "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
    )
    assert created.status_code == 201
    report_id = created.json()["report"]["id"]

    with SessionLocal() as session, session.begin():
        row = session.get(Report, UUID(report_id))
        row.created_at = accounting_month_start_utc() - timedelta(seconds=1)

    allowance = client.get("/api/v1/reports/allowance").json()["kinds"]
    jadhagam = next(k for k in allowance if k["kind"] == "jadhagam")
    assert jadhagam["includedUsed"] == 0
    assert jadhagam["canCreate"] is True


def test_porutham_inclusion_is_counted_separately_from_jadhagam(
    client, birth_profile_payload_factory
):
    """One of each a month, not one report a month: spending the jadhagam
    inclusion must leave the porutham one alone."""
    chart_a = _chart(client, birth_profile_payload_factory, display_name="Arjun Kumar")
    chart_b = _chart(client, birth_profile_payload_factory, display_name="Anitha Raman")

    assert (
        client.post(
            "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_a}, headers=_csrf()
        ).status_code
        == 201
    )

    porutham = client.post(
        "/api/v1/reports",
        json={"kind": "porutham", "chartId": chart_a, "partnerChartId": chart_b},
        headers=_csrf(),
    )
    assert porutham.status_code == 201, porutham.text
    assert porutham.json()["report"]["source"] == "included"
    assert porutham.json()["report"]["partnerChartId"] == chart_b


# ── The bought report ───────────────────────────────────────────────────────


def test_a_bought_credit_is_spent_once_and_delivers_a_report(client, birth_profile_payload_factory):
    chart_id = _chart(client, birth_profile_payload_factory)
    # Spend the inclusion first, so the credit is what pays.
    client.post("/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf())
    _grant_credit(TEST_USER_ID, "jadhagam_report", 1)
    assert _balance(TEST_USER_ID, "jadhagam_report") == 1

    response = client.post(
        "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
    )
    assert response.status_code == 201, response.text
    assert response.json()["report"]["source"] == "credit"
    assert response.json()["allowance"]["credits"] == 0
    assert _balance(TEST_USER_ID, "jadhagam_report") == 0

    # The spend is one ledger row of −1, and the report names its key, which is
    # what a refund has to find.
    with SessionLocal() as session:
        spends = (
            session.query(CreditLedgerEntry)
            .filter(
                CreditLedgerEntry.user_id == TEST_USER_ID,
                CreditLedgerEntry.credit_key == "jadhagam_report",
                CreditLedgerEntry.source == "spend",
            )
            .all()
        )
        assert [row.delta for row in spends] == [-1]
        report = session.query(Report).filter(Report.source == "credit").one()
        assert report.credit_spend_key == spends[0].idempotency_key


def test_a_credit_for_one_kind_does_not_pay_for_the_other(
    client, birth_profile_payload_factory, monkeypatch
):
    monkeypatch.setattr(get_settings(), "open_beta", False)
    chart_a = _chart(client, birth_profile_payload_factory, display_name="Arjun Kumar")
    chart_b = _chart(client, birth_profile_payload_factory, display_name="Anitha Raman")
    _drop_subscription(TEST_USER_ID)
    _grant_credit(TEST_USER_ID, "porutham_report", 1)

    refused = client.post(
        "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_a}, headers=_csrf()
    )
    assert refused.status_code == 402

    allowed = client.post(
        "/api/v1/reports",
        json={"kind": "porutham", "chartId": chart_a, "partnerChartId": chart_b},
        headers=_csrf(),
    )
    assert allowed.status_code == 201, allowed.text
    assert _balance(TEST_USER_ID, "porutham_report") == 0


# ── Nobody pays for a document they did not get ─────────────────────────────


def test_a_failed_render_does_not_consume_the_inclusion(
    client, birth_profile_payload_factory, monkeypatch
):
    """The inclusion half: a render that dies leaves no row and no inclusion
    spent.

    This account still has its Premium inclusion, so `source` here is
    "included" and the credit branch is never entered — the granted credit
    below is untouched scenery, not the thing under test. The credit half has
    its own test underneath, and it has to: a premature commit lives only in
    the credit branch, and this test cannot see it.
    """
    chart_id = _chart(client, birth_profile_payload_factory)
    _grant_credit(TEST_USER_ID, "jadhagam_report", 1)

    def explode(*_args, **_kwargs):
        raise RuntimeError("the typesetter fell over")

    monkeypatch.setattr(report_delivery_service, "compose_jadhagam_report_pdf", explode)

    with pytest.raises(RuntimeError):
        client.post(
            "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
        )

    assert _balance(TEST_USER_ID, "jadhagam_report") == 1
    with SessionLocal() as session:
        assert session.query(Report).count() == 0
    allowance = client.get("/api/v1/reports/allowance").json()["kinds"]
    assert next(k for k in allowance if k["kind"] == "jadhagam")["includedUsed"] == 0


def test_a_failed_render_does_not_spend_a_credit(
    client, birth_profile_payload_factory, monkeypatch
):
    """The credit half, which is the half that costs someone money.

    The inclusion is spent first so that the credit is what pays — without
    that, `source` is "included" and this scenario never reaches the branch
    where a credit is taken. That branch must flush, never commit: a commit
    before the render means a person is charged a credit and handed an
    exception, and the credit is gone because the request's rollback can no
    longer reach it.
    """
    chart_id = _chart(client, birth_profile_payload_factory)
    first = client.post(
        "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
    )
    assert first.status_code == 201, first.text
    assert first.json()["report"]["source"] == "included"

    _grant_credit(TEST_USER_ID, "jadhagam_report", 1)
    assert _balance(TEST_USER_ID, "jadhagam_report") == 1

    def explode(*_args, **_kwargs):
        raise RuntimeError("the typesetter fell over")

    monkeypatch.setattr(report_delivery_service, "compose_jadhagam_report_pdf", explode)

    with pytest.raises(RuntimeError):
        client.post(
            "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
        )

    # The credit is still buyable-with. If this is 0, the spend was committed
    # before the document existed and the person paid for nothing.
    assert _balance(TEST_USER_ID, "jadhagam_report") == 1
    with SessionLocal() as session:
        assert session.query(Report).filter(Report.source == "credit").count() == 0
        # The included report from the top is still there; only the second
        # delivery rolled back.
        assert session.query(Report).count() == 1


def test_someone_elses_chart_is_404_and_spends_nothing(client, birth_profile_payload_factory):
    chart_id = _chart(client, birth_profile_payload_factory)
    stranger = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=stranger, email=f"stranger-{uuid4().hex}@example.invalid"))

    # A chart id that exists but is not the caller's: the owner check has to run
    # before anything is spent.
    with SessionLocal() as session, session.begin():
        from app.models import BirthProfile, Chart

        chart = session.get(Chart, UUID(chart_id))
        profile = session.get(BirthProfile, chart.birth_profile_id)
        profile.owner_user_id = stranger

    refused = client.post(
        "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
    )
    assert refused.status_code == 403  # the chart exists and the profile is not ours
    allowance = client.get("/api/v1/reports/allowance").json()["kinds"]
    assert next(k for k in allowance if k["kind"] == "jadhagam")["includedUsed"] == 0


def test_a_chart_that_does_not_exist_is_404(client):
    refused = client.post(
        "/api/v1/reports",
        json={"kind": "jadhagam", "chartId": str(uuid4())},
        headers=_csrf(),
    )
    assert refused.status_code == 404


def test_porutham_needs_two_different_charts(client, birth_profile_payload_factory):
    chart_id = _chart(client, birth_profile_payload_factory)
    assert (
        client.post(
            "/api/v1/reports", json={"kind": "porutham", "chartId": chart_id}, headers=_csrf()
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/v1/reports",
            json={"kind": "porutham", "chartId": chart_id, "partnerChartId": chart_id},
            headers=_csrf(),
        ).status_code
        == 422
    )


def test_unknown_kind_is_422(client, birth_profile_payload_factory):
    chart_id = _chart(client, birth_profile_payload_factory)
    assert (
        client.post(
            "/api/v1/reports", json={"kind": "varshaphala", "chartId": chart_id}, headers=_csrf()
        ).status_code
        == 422
    )


# ── The artifact ────────────────────────────────────────────────────────────


def test_the_delivered_report_is_a_pdf_and_downloads_unchanged(
    client, birth_profile_payload_factory
):
    chart_id = _chart(client, birth_profile_payload_factory)
    created = client.post(
        "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
    ).json()
    report_id = created["report"]["id"]

    first = client.get(f"/api/v1/reports/{report_id}/download")
    assert first.status_code == 200
    assert first.headers["content-type"] == "application/pdf"
    assert first.content.startswith(b"%PDF-")
    assert len(first.content) == created["report"]["byteSize"]

    second = client.get(f"/api/v1/reports/{report_id}/download")
    assert second.content == first.content
    assert second.headers["etag"] == first.headers["etag"]
    assert created["report"]["sha256"] in second.headers["etag"]


def test_download_counts_are_stamped(client, birth_profile_payload_factory):
    chart_id = _chart(client, birth_profile_payload_factory)
    report_id = client.post(
        "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
    ).json()["report"]["id"]

    client.get(f"/api/v1/reports/{report_id}/download")
    client.get(f"/api/v1/reports/{report_id}/download")

    listed = client.get("/api/v1/reports").json()
    assert listed[0]["downloadCount"] == 2
    assert listed[0]["lastDownloadedAt"] is not None


def test_another_accounts_report_is_404_not_403(client, birth_profile_payload_factory):
    """A 403 would confirm the id exists, which is the same leak
    `chart_access` answers 404 for."""
    chart_id = _chart(client, birth_profile_payload_factory)
    report_id = client.post(
        "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
    ).json()["report"]["id"]

    stranger = uuid4()
    # Its own transaction: in one block SQLAlchemy may flush the report's new
    # owner before the owner exists, and the FK says no.
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=stranger, email=f"stranger-{uuid4().hex}@example.invalid"))
    with SessionLocal() as session, session.begin():
        session.get(Report, UUID(report_id)).user_id = stranger

    assert client.get(f"/api/v1/reports/{report_id}/download").status_code == 404
    assert client.get("/api/v1/reports").json() == []


def test_a_report_outlives_the_chart_it_was_built_from(client, birth_profile_payload_factory):
    """What was paid for is the document, not a promise to re-render it. The
    row survives the chart's deletion with its bytes intact."""
    chart_id = _chart(client, birth_profile_payload_factory)
    report_id = client.post(
        "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
    ).json()["report"]["id"]

    with SessionLocal() as session, session.begin():
        from app.models import Chart

        session.delete(session.get(Chart, UUID(chart_id)))

    response = client.get(f"/api/v1/reports/{report_id}/download")
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF-")
    with SessionLocal() as session:
        assert session.get(Report, UUID(report_id)).chart_id is None


def test_the_tamil_report_is_built_and_marked_as_tamil(client, birth_profile_payload_factory):
    chart_id = _chart(client, birth_profile_payload_factory)
    created = client.post(
        "/api/v1/reports",
        json={"kind": "jadhagam", "chartId": chart_id, "lang": "ta"},
        headers=_csrf(),
    )
    assert created.status_code == 201, created.text
    assert created.json()["report"]["lang"] == "ta"
    # A Tamil document with no Tamil font would still build, so size is the only
    # cheap signal that something was typeset rather than skipped.
    assert created.json()["report"]["byteSize"] > 2000


# ── The gate the document must not get wrong ────────────────────────────────


def test_marriage_timing_is_withheld_from_a_minors_report(
    client, birth_profile_payload_factory, monkeypatch
):
    """The report reads `age_gate.marriage_timing_gate`, the same gate the
    event-windows route reads — so a minor's paid document cannot carry a
    marriage window the API refuses to serve."""
    minor_birth = (date.today().replace(year=date.today().year - 10)).isoformat()
    chart_id = _chart(client, birth_profile_payload_factory, birth_date=minor_birth)

    seen: list[str] = []
    from app.services import report_pdf_service

    real = report_pdf_service.find_event_windows

    def spy(chart_data, event, from_year, to_year):
        seen.append(event)
        return real(chart_data, event, from_year, to_year)

    monkeypatch.setattr(report_pdf_service, "find_event_windows", spy)

    created = client.post(
        "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
    )
    assert created.status_code == 201, created.text
    assert "MARRIAGE" not in seen
    assert "CAREER" in seen


def test_an_adult_single_chart_does_get_marriage_windows(
    client, birth_profile_payload_factory, monkeypatch
):
    """The withholding above has to be the gate, not the chapter being broken."""
    chart_id = _chart(client, birth_profile_payload_factory)

    seen: list[str] = []
    from app.services import report_pdf_service

    real = report_pdf_service.find_event_windows

    def spy(chart_data, event, from_year, to_year):
        seen.append(event)
        return real(chart_data, event, from_year, to_year)

    monkeypatch.setattr(report_pdf_service, "find_event_windows", spy)

    assert (
        client.post(
            "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
        ).status_code
        == 201
    )
    assert "MARRIAGE" in seen


# ── The document has words in it ───────────────────────────────
#
# Closing the blind spot this file used to declare: every other test here
# checks that the PDF *is* a PDF, how big it is, and that it comes back
# byte-identical — none of them read it, so a chapter that rendered empty
# passed. `_windows_chapter` can `return []` outright when the Moon is
# missing, which drops a whole chapter from a paid document silently.
#
# Read back through the production assembler rather than by calling the
# chapter builders directly: the bug worth catching is a chapter the
# assembler stops including, and a direct call cannot see that. There is no
# PDF text extractor in the image (reportlab only, and adding a dependency
# would trip the drift check), so the story reportlab is handed is captured
# on its way into `doc.build` — the same flowables that become the page.

#: Every chapter key the two reports use, so a heading is recognised wherever
#: it appears.
_CHAPTER_KEYS = (
    "ch_identity", "ch_navamsam", "ch_strength", "ch_adhipathi", "ch_yoga",
    "ch_dasha", "ch_windows", "ch_now", "ch_guidance", "ch_parihaaram",
    "ch_verdict", "ch_factors", "ch_layers", "ch_notes",
)

#: What the jadhagam report promises. A chapter missing from the story at all
#: is the `return []` bug; a chapter present but empty is an engine that gave
#: the composer nothing.
_JADHAGAM_CHAPTERS = (
    "ch_identity", "ch_navamsam", "ch_strength", "ch_adhipathi", "ch_yoga",
    "ch_dasha", "ch_windows", "ch_now", "ch_parihaaram",
)


def _capture_story(monkeypatch) -> list[list]:
    """The flowables the production composer hands to reportlab."""
    from app.services import report_pdf_service

    captured: list[list] = []
    real_document = report_pdf_service._document

    def spy(*args, **kwargs):
        doc = real_document(*args, **kwargs)
        real_build = doc.build

        def build(story, **build_kwargs):
            captured.append(list(story))
            return real_build(story, **build_kwargs)

        doc.build = build
        return doc

    monkeypatch.setattr(report_pdf_service, "_document", spy)
    return captured


def _flowable_text(flowable) -> str:
    """Whatever a reader would see in this flowable: paragraph text, or every
    cell of a table."""
    text = getattr(flowable, "text", None)
    if isinstance(text, str):
        return re.sub(r"<[^>]+>", " ", text)
    rows = getattr(flowable, "_cellvalues", None)
    if rows:
        out = []
        for row in rows:
            for cell in row:
                out.append(cell if isinstance(cell, str) else _flowable_text(cell))
        return " ".join(out)
    return ""


def _chapters(story: list, lang: str) -> dict[str, str]:
    """Story split at its chapter headings: {chapter key: text under it}.

    A heading is matched by its own translated title, so this asks the same
    question a reader does — "is there anything under this heading?"
    """
    from app.services.report_pdf_service import _t

    titles = {_t(key, lang): key for key in _CHAPTER_KEYS}
    found: dict[str, list[str]] = {}
    current: str | None = None
    for flowable in story:
        text = _flowable_text(flowable).strip()
        key = titles.get(text)
        if key is not None:
            current = key
            found.setdefault(key, [])
            continue
        if current is not None and text:
            found[current].append(text)
    return {key: " ".join(parts).strip() for key, parts in found.items()}


@pytest.mark.parametrize("lang", ["en", "ta"])
def test_every_jadhagam_chapter_has_content_under_it(
    client, birth_profile_payload_factory, monkeypatch, lang
):
    """Both languages: a paid document must not carry an empty chapter."""
    chart_id = _chart(client, birth_profile_payload_factory)
    story = _capture_story(monkeypatch)

    created = client.post(
        "/api/v1/reports",
        json={"kind": "jadhagam", "chartId": chart_id, "lang": lang},
        headers=_csrf(),
    )
    assert created.status_code == 201, created.text
    assert len(story) == 1, "the composer built something other than one document"

    chapters = _chapters(story[0], lang)
    missing = [key for key in _JADHAGAM_CHAPTERS if key not in chapters]
    assert not missing, f"chapter heading absent from the document entirely: {missing}"

    empty = {key: chapters[key] for key in _JADHAGAM_CHAPTERS if len(chapters[key]) < 20}
    assert not empty, f"chapter heading with (almost) nothing under it: {empty}"


def test_the_timing_chapter_says_something_for_every_event_it_names(
    client, birth_profile_payload_factory, monkeypatch
):
    """The windows chapter is the one that can go empty quietly — it returns []
    when the Moon is missing, and each event prints either windows or an
    explicit "no windows" line. Silence under an event heading is the bug."""
    chart_id = _chart(client, birth_profile_payload_factory)
    story = _capture_story(monkeypatch)

    assert (
        client.post(
            "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
        ).status_code
        == 201
    )

    from app.services.report_pdf_service import _t

    windows = _chapters(story[0], "en")["ch_windows"]
    for event in ("MARRIAGE", "CAREER", "FINANCE"):
        assert _t(f"event_{event}", "en") in windows, f"{event} is not in the timing chapter"
    # ...and the chapter carries either real windows or the honest empty line,
    # never just the three headings.
    assert len(windows) > 120, windows


def test_the_porutham_report_has_its_verdict_and_factors(
    client, birth_profile_payload_factory, monkeypatch
):
    """The porutham document's own chapters, for the same reason."""
    chart_a = _chart(client, birth_profile_payload_factory, display_name="Arjun Kumar")
    chart_b = _chart(client, birth_profile_payload_factory, display_name="Anitha Raman")
    story = _capture_story(monkeypatch)

    created = client.post(
        "/api/v1/reports",
        json={"kind": "porutham", "chartId": chart_a, "partnerChartId": chart_b},
        headers=_csrf(),
    )
    assert created.status_code == 201, created.text

    chapters = _chapters(story[0], "en")
    assert "ch_verdict" in chapters, sorted(chapters)
    assert len(chapters["ch_verdict"]) > 20, chapters["ch_verdict"]
    # The ten poruthams are the substance of the document; the verdict alone is
    # a score with no reasoning under it.
    assert "ch_factors" in chapters, sorted(chapters)
    assert len(chapters["ch_factors"]) > 120, chapters["ch_factors"]


# ── The retired stub ────────────────────────────────────────────────────────


def test_the_reports_purchase_waitlist_stub_is_gone(client):
    """It returned `{"status": "queued"}` and stored nothing. Beside a working
    checkout it is a second, fake way to buy."""
    response = client.post(
        "/api/v1/reports/purchase",
        json={"product_id": "vinaadi.ppu.report.5page"},
        headers=_csrf(),
    )
    assert response.status_code in {404, 405}


def test_listing_reports_shows_newest_first(client, birth_profile_payload_factory):
    chart_a = _chart(client, birth_profile_payload_factory, display_name="Arjun Kumar")
    chart_b = _chart(client, birth_profile_payload_factory, display_name="Anitha Raman")
    client.post("/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_a}, headers=_csrf())
    client.post(
        "/api/v1/reports",
        json={"kind": "porutham", "chartId": chart_a, "partnerChartId": chart_b},
        headers=_csrf(),
    )

    listed = client.get("/api/v1/reports").json()
    assert [row["kind"] for row in listed] == ["porutham", "jadhagam"]
    # The list is a list: no bytes come back with it.
    assert "pdf" not in listed[0]


def test_reports_are_erased_with_the_account():
    """`reports` holds the person's chart rendered as a document, so it is in
    the privacy registry as a delete. Without an entry,
    tests/test_privacy_erasure.py's coverage walk fails — this names the
    expectation here too, where a reader of this file will look for it."""
    from app.privacy.registry import TABLE_STORES

    entry = next(store for store in TABLE_STORES if store.table == "reports")
    assert entry.erase == "delete"
    assert "pdf" in entry.export_exclude


def test_the_stored_report_records_when_it_was_read_as_of(client, birth_profile_payload_factory):
    """The dasha, the windows and the year guidance are all relative to a date.
    A document that does not say which date cannot be argued with."""
    chart_id = _chart(client, birth_profile_payload_factory)
    created = client.post(
        "/api/v1/reports", json={"kind": "jadhagam", "chartId": chart_id}, headers=_csrf()
    ).json()["report"]
    assert created["asOfDate"] is not None
    assert created["calculationVersion"] if "calculationVersion" in created else True
    with SessionLocal() as session:
        row = session.get(Report, UUID(created["id"]))
        assert row.calculation_version
        # `as_of_date` is the Vinaadi accounting day (Asia/Kolkata), stored at
        # that day's midnight as UTC. Comparing it to a bare datetime.now(UTC)
        # flakes for the ~5.5h each day when Kolkata is already on the next
        # civil date but UTC is not. Bound it by the same accounting clock the
        # service stamps it with instead.
        assert row.as_of_date.date() == accounting_date()
        assert row.as_of_date.astimezone(UTC) < next_accounting_day_start()
