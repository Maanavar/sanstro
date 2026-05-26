from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class QaGoldenCase(Base):
    __tablename__ = "qa_golden_cases"

    golden_case_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    case_name: Mapped[str] = mapped_column(String(255), nullable=False)
    case_type: Mapped[str] = mapped_column(String(64), nullable=False)
    input_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    expected_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    tolerance_payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
