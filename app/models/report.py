from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.encrypted_types import EncryptedBytes

#: What a report can be. One `kind` per credit key in `payment.CREDIT_KEYS`.
REPORT_KINDS = ("jadhagam", "porutham")

#: What paid for a report. `included` spent a month's Premium inclusion,
#: `credit` spent a bought report credit from `credit_ledger`.
REPORT_SOURCES = ("included", "credit")


class Report(Base):
    """One delivered report: the PDF a jadhagam_report / porutham_report credit
    (or a month's Premium inclusion) was spent on.

    The rendered bytes live in the row. A report is the thing the person paid
    for, so it must not change or disappear underneath them: regenerating it on
    each download would make a paid artifact move with every chart edit, every
    doctrine ruling and every engine version, and would fail outright once the
    chart it was built from is deleted. `chart_id` is therefore SET NULL and
    informational — the report outlives its inputs.

    `credit_spend_key` is the `credit_ledger` key of the spend, so a delivery
    that dies after the credit is taken can hand it back by the same key
    (`payment_service.return_credit`). It is NULL for an inclusion.
    """

    __tablename__ = "reports"
    __table_args__ = (
        CheckConstraint("kind IN ('jadhagam', 'porutham')", name="kind"),
        CheckConstraint("source IN ('included', 'credit')", name="source"),
        CheckConstraint("byte_size > 0", name="byte_size_positive"),
        # A credit spend names its ledger key; an inclusion has none. Without
        # this, an inclusion row could carry a key that `return_credit` would
        # later refund a credit nobody spent.
        CheckConstraint(
            "(source = 'credit') = (credit_spend_key IS NOT NULL)",
            name="credit_spend_key_matches_source",
        ),
        # The two reads: the person's own list, and the month's inclusion count.
        Index("ix_reports_user_id_created_at", "user_id", "created_at"),
        Index("ix_reports_user_id_kind_source", "user_id", "kind", "source"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    #: The language the document was written in. A report is not re-rendered,
    #: so this is a fact about the artifact, not a display preference.
    lang: Mapped[str] = mapped_column(String(2), nullable=False, default="en")
    source: Mapped[str] = mapped_column(String(16), nullable=False)
    credit_spend_key: Mapped[str | None] = mapped_column(String(160), nullable=True)
    #: The subject chart, and the partner's chart for a porutham. Kept for the
    #: list's title and nothing else; the PDF does not read them back.
    chart_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("charts.chart_id", ondelete="SET NULL"), nullable=True
    )
    partner_chart_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("charts.chart_id", ondelete="SET NULL"), nullable=True
    )
    #: The date the reading was taken as of — the dasha, transits and year
    #: guidance inside the document are all relative to it.
    as_of_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    #: What the title page shows, so a deleted chart does not blank the list.
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    #: The engine version that wrote it, for a support ticket about its contents.
    calculation_version: Mapped[str] = mapped_column(String(64), nullable=False)
    #: The document, encrypted at rest (A12 Option C). It repeats the birth
    #: place, the birth date and the planet longitudes, every one of which is
    #: ciphertext in `birth_profiles`, `charts` and `chart_planets` by owner
    #: ruling -- a plaintext blob here would put all of them back into a
    #: readable dump through a new table. The PDF's own compression is not
    #: protection: ASCII85-decode, inflate, and the birth place is a substring.
    pdf: Mapped[bytes] = mapped_column(EncryptedBytes, nullable=False)
    #: Of the plaintext document, not of the stored ciphertext -- the
    #: ciphertext is ~4/3 the size, and this number is what the client shows
    #: and what a support ticket compares against a downloaded file.
    byte_size: Mapped[int] = mapped_column(Integer, nullable=False)
    #: Of the bytes above. Proves the file a person downloaded twice is the
    #: same file, which is the whole point of storing it.
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    download_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_downloaded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
