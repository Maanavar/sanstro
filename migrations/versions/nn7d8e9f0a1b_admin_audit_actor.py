"""Record which admin performed each audited action

P1-4(c). `admin_audit_log` recorded the action, the target, an IP and a
timestamp — but not the person. So the log says a user was deleted or a feature
flag was flipped, and cannot say by whom, which is the first question an
incident review asks. It is also the reason the shared `X-Admin-Key` is
unattributable by construction: every caller holding it looks identical.

Nullable, deliberately, and three separate reasons:
  - rows written before this column existed have no actor and must not be
    invented;
  - a genuine server-to-server caller on the retained X-Admin-Key path has no
    user to name;
  - `ON DELETE SET NULL`, not CASCADE — deleting a user must never erase the
    record of what that user did. CASCADE would let an admin delete their own
    account and take their audit trail out with it, which is worse than having
    no audit trail at all because it looks intact.

Adding a nullable column with no default is a metadata-only change in
Postgres: no table rewrite, no lock held for the length of a scan, safe on a
populated `admin_audit_log`.

Revision ID: nn7d8e9f0a1b
Revises: mm6c7d8e9f0a
Create Date: 2026-09-01 13:10:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "nn7d8e9f0a1b"
down_revision: Union[str, Sequence[str], None] = "mm6c7d8e9f0a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("admin_audit_log") as batch_op:
        batch_op.add_column(
            sa.Column("actor_user_id", sa.Uuid(), nullable=True)
        )
        batch_op.create_foreign_key(
            "fk_admin_audit_log_actor_user_id",
            "users",
            ["actor_user_id"],
            ["user_id"],
            ondelete="SET NULL",
        )
    op.create_index("idx_audit_actor", "admin_audit_log", ["actor_user_id"])


def downgrade() -> None:
    op.drop_index("idx_audit_actor", table_name="admin_audit_log")
    with op.batch_alter_table("admin_audit_log") as batch_op:
        batch_op.drop_constraint(
            "fk_admin_audit_log_actor_user_id", type_="foreignkey"
        )
        batch_op.drop_column("actor_user_id")
