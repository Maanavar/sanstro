"""Record DPDP Act 2023 §6 consent on the user

Two nullable columns, no backfill, no data rewrite. `consent_given_at` says a
consent action happened; `consent_policy_version` says which text it was given
for. Both, because "informed consent" is a claim about the text — a timestamp
alone records that somebody clicked on a date and not what they were shown.

**Existing rows are deliberately left NULL.** Backfilling a timestamp for
accounts that never performed a consent action would manufacture a record of
something that did not happen, which is worse than having no record: it is a
false one, and it is the exact record a regulator would ask to see. Null means
"has not consented", `app.core.privacy_policy.consent_is_current` treats it that
way, and those users are asked on their next authenticated request.

Metadata-only, so it is fast and takes no meaningful lock even on a large
`users`. Fully reversible: `downgrade()` drops both columns, and the only thing
lost is the consent record itself — which is why you would not run it after
launch without deciding that is acceptable.

Revision ID: pp9f0a1b2c3d
Revises: oo8e9f0a1b2c
Create Date: 2026-09-03 23:10:00.000000

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "pp9f0a1b2c3d"
down_revision = "oo8e9f0a1b2c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("consent_given_at", sa.DateTime(timezone=True), nullable=True))
        # 32 chars is generous for a "YYYY-MM" version string and leaves room for
        # a scheme change without another migration.
        batch.add_column(sa.Column("consent_policy_version", sa.String(length=32), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_column("consent_policy_version")
        batch.drop_column("consent_given_at")
