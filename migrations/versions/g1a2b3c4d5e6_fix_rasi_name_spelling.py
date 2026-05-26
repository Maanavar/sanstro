"""Fix rasi name spelling: Midhunam->Mithunam, Thulaam->Thulam, Vrichigam->Viruchigam

Revision ID: g1a2b3c4d5e6
Revises: f5b2c8d1a3e4
Create Date: 2026-05-26 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "g1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "f5b2c8d1a3e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_RENAMES = [
    ("Midhunam",  "Mithunam"),
    ("Thulaam",   "Thulam"),
    ("Vrichigam", "Viruchigam"),
]


def upgrade() -> None:
    bind = op.get_bind()
    for old, new in _RENAMES:
        bind.execute(
            sa.text("UPDATE chart_planets SET rasi = :new WHERE rasi = :old"),
            {"new": new, "old": old},
        )
        for col in ("lagna_rasi", "moon_rasi"):
            bind.execute(
                sa.text(f"UPDATE charts SET {col} = :new WHERE {col} = :old"),
                {"new": new, "old": old},
            )


def downgrade() -> None:
    bind = op.get_bind()
    for old, new in _RENAMES:
        bind.execute(
            sa.text("UPDATE chart_planets SET rasi = :old WHERE rasi = :new"),
            {"new": new, "old": old},
        )
        for col in ("lagna_rasi", "moon_rasi"):
            bind.execute(
                sa.text(f"UPDATE charts SET {col} = :old WHERE {col} = :new"),
                {"new": new, "old": old},
            )
