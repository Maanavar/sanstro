from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Index, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class UserContext(TimestampMixin, Base):
    __tablename__ = "user_contexts"
    __table_args__ = (
        UniqueConstraint("owner_user_id", "chart_id", name="uq_user_contexts_owner_chart"),
        Index("idx_user_contexts_owner", "owner_user_id"),
        Index("idx_user_contexts_chart", "chart_id"),
    )

    context_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    chart_id: Mapped[UUID] = mapped_column(ForeignKey("charts.chart_id"), nullable=False)
    life_situation: Mapped[dict[str, object]] = mapped_column(JSON, nullable=False, default=dict)
    active_events: Mapped[list[dict[str, object]]] = mapped_column(JSON, nullable=False, default=list)
    reaction_history: Mapped[list[dict[str, object]]] = mapped_column(JSON, nullable=False, default=list)

