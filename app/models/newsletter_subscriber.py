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

    # Client-side ``default=uuid4``, deliberately, where the migration uses
    # ``server_default=gen_random_uuid()``. Do not "align" them: gen_random_uuid()
    # does not exist on SQLite, so a server default would break
    # test_newsletter_subscriber_table_is_portable_to_sqlite, which is the whole
    # reason this table is kept portable.
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    source: Mapped[str] = mapped_column(
        String(64), nullable=False, default="web_home", server_default="web_home"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
