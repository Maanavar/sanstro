"""merge_heads_h2b3c4d5e6f7_and_i3c4d5e6f7a8

Revision ID: 9940dd93fdbb
Revises: h2b3c4d5e6f7, i3c4d5e6f7a8
Create Date: 2026-05-29 15:33:31.323809

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9940dd93fdbb'
down_revision: Union[str, Sequence[str], None] = ('h2b3c4d5e6f7', 'i3c4d5e6f7a8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
