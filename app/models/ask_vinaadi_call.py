from __future__ import annotations

from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, Index, Integer, String, func, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AskVinaadiCall(Base):
    """One call to the model provider for Ask Vinaadi (admin spec L7).

    The daily spend cap sums `cost_paise` over `spend_date`, so every call that
    reached the provider gets a row, answered or not. Deliberately carries no
    user, chart or question text: cost and topic counts are all the cap and the
    owner's figures need, and a row that cannot name anyone is not a
    personal-data store (`app/privacy/registry.py`). Transcripts arrive with the
    L+30 review list, in a table of their own with its own consent and retention.
    """

    __tablename__ = "ask_vinaadi_calls"
    __table_args__ = (Index("ix_ask_vinaadi_calls_spend_date", "spend_date"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    #: The accounting day (`app.core.clock.accounting_date`) the cost counts against.
    spend_date: Mapped[date] = mapped_column(Date, nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(32), nullable=False)
    model: Mapped[str] = mapped_column(String(64), nullable=False)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    cache_read_tokens: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    cache_write_tokens: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    #: Rounded up, so the cap errs toward stopping early.
    cost_paise: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    #: answered | unusable (billed, but no answer could be read) | provider_error
    outcome: Mapped[str] = mapped_column(String(16), nullable=False)
    #: Sensitive-topic categories the question touched (`ask_vinaadi_topics`).
    flags: Mapped[list[str]] = mapped_column(
        ARRAY(String(24)), nullable=False, server_default=text("'{}'::varchar[]")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class AskSpendAlert(Base):
    """An owner alert already sent for one day and threshold, so each goes once."""

    __tablename__ = "ask_spend_alerts"

    spend_date: Mapped[date] = mapped_column(Date, primary_key=True)
    threshold_pct: Mapped[int] = mapped_column(Integer, primary_key=True)
    spent_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    cap_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
