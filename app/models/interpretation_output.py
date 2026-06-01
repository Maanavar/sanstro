from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class InterpretationOutput(TimestampMixin, Base):
    __tablename__ = "interpretation_outputs"

    interpretation_output_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    chart_id: Mapped[UUID | None] = mapped_column(ForeignKey("charts.chart_id"), nullable=True)
    family_vault_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("family_vaults.family_vault_id"),
        nullable=True,
        index=True,
    )
    output_type: Mapped[str] = mapped_column(String(64), nullable=False)
    language: Mapped[str] = mapped_column(String(8), nullable=False)
    structured_input: Mapped[dict] = mapped_column(JSONB, nullable=False)
    output_text: Mapped[dict] = mapped_column(JSONB, nullable=False)
    safety_flags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
