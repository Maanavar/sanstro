from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Index, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class NumerologyNameSession(TimestampMixin, Base):
    """A spelling the user is considering, saved against one chart (NUM-58).

    **This table stores the question, never the answer.** No score, no verdict,
    no alternatives and no prose are persisted — only the inputs needed to ask
    the engine again. Three reasons, and they are the whole design:

    1. The interpretive corpus is unreviewed (``CONTENT_REVIEWED`` is False), so
       a reading computed today carries no prose. Freezing that into a row would
       produce saved sessions that stay mute forever, including after the Tamil
       review lands and every live reading has gained its explanation.
    2. The doctrine flags are *designed* to be flipped —
       ``numerology_personal_year_epoch``, ``numerology_compatibility_basis``.
       A stored verdict would silently contradict the flag that governs it, and
       nobody would find out, because a saved row is exactly the thing nobody
       re-derives.
    3. Recomputation is cheap here. Scoring a name is integer arithmetic over a
       26-letter table, and the alignment reuses a chart context the list
       endpoint loads once for the whole page.

    ``saved_calculation_version`` is therefore not a cache key — it is a
    *receipt*. It records which engine version the user was looking at when they
    saved, so a later read can say the reading has been recalculated since,
    rather than quietly showing a different number than they remember.

    ``candidate_name`` is stored in plaintext, following ``BirthProfile
    .display_name``. The encrypted columns in this codebase (``EncryptedDate``,
    ``EncryptedTime``, ``EncryptedFloat``) protect *birth* data — the date, time
    and coordinates that reconstruct a chart. A name the user typed into a
    name-correction box is the same class of data as the display name sitting
    beside it, and inventing a second policy for one column would imply the
    existing one is wrong without fixing it.
    """

    __tablename__ = "numerology_name_sessions"
    __table_args__ = (
        Index("idx_numerology_name_sessions_owner", "owner_user_id"),
        Index("idx_numerology_name_sessions_chart", "chart_id"),
    )

    numerology_name_session_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    chart_id: Mapped[UUID] = mapped_column(
        ForeignKey("charts.chart_id", ondelete="CASCADE"), nullable=False
    )
    #: The spelling under consideration. Latin-only (doctrine D3) — validated at
    #: save time, so a row can never hold a name the engine will later refuse.
    candidate_name: Mapped[str] = mapped_column(String(120), nullable=False)
    #: The user's own note: "for the passport", "amma's suggestion".
    label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    max_edits: Mapped[int] = mapped_column(
        Integer, nullable=False, default=2, server_default=text("2")
    )
    #: Receipt, not cache key — see the class docstring.
    saved_calculation_version: Mapped[str] = mapped_column(String(64), nullable=False)
