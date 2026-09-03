from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class NewsletterSubscriber(Base):
    """Email addresses that explicitly opt in to Vinaadi newsletter updates."""

    __tablename__ = "newsletter_subscribers"
    __table_args__ = ()

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    source: Mapped[str] = mapped_column(
        String(64), nullable=False, default="web_home", server_default="web_home"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
