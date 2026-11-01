from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RuntimeSetting(Base):
    """One persisted override of a flag, kill switch or operational setting.

    ADM-09: overrides used to live in a module-level dict, so each worker held
    its own copy and a restart lost all of them. A kill switch that reaches one
    worker in four is not a kill switch. This row is what every worker reads
    (through a short cache, `app/services/feature_flags.py`).

    No row means "the code default". Doctrine flags are never stored here: a
    persisted doctrine override would be a ruling made outside §16–§18.
    """

    __tablename__ = "runtime_settings"

    name: Mapped[str] = mapped_column(String(120), primary_key=True)
    #: JSON so booleans, integers, strings and lists keep their type.
    value: Mapped[object] = mapped_column(JSONB, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    updated_by_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class RuntimeSettingChange(Base):
    """Append-only history: who changed which setting, from what, to what, and why.

    `new_value` is NULL when the change was a reset to the code default, and
    `old_value` is NULL when there was no override before. Rollback replays a
    row's `old_value`, so history is also the undo log.
    """

    __tablename__ = "runtime_setting_changes"
    __table_args__ = (Index("ix_runtime_setting_changes_name_created", "name", "created_at"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    old_value: Mapped[object | None] = mapped_column(JSONB, nullable=True)
    new_value: Mapped[object | None] = mapped_column(JSONB, nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    actor_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
