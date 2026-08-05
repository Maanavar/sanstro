"""Add children status to birth_profiles

The 5th house may only be read as progeny when this column says so. Until it
was added, `age_phase_service.get_active_life_phases` derived progeny from age
and gender alone — see the 2026-08-05 commit that removed that claim.

Nullable with no server default, deliberately: NULL means "we have not asked",
which is a different state from an explicit "none", and only one of them may
ever be treated as a settled answer.

Revision ID: ll5b6c7d8e9f
Revises: kk4a5b6c7d8e
Create Date: 2026-08-05 09:20:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "ll5b6c7d8e9f"
down_revision: Union[str, Sequence[str], None] = "kk4a5b6c7d8e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    cols = {c["name"] for c in sa.inspect(bind).get_columns("birth_profiles")}

    if "children" not in cols:
        op.add_column("birth_profiles", sa.Column("children", sa.String(32), nullable=True))


def downgrade() -> None:
    op.drop_column("birth_profiles", "children")
