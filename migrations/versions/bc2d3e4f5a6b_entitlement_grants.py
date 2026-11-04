"""products.entitlement_keys becomes entitlement_grants: key -> days (ARC-43).

`entitlement_keys` was a JSONB array of keys and no code ever read it, so a
one-time SKU configured with one granted nothing at all — silently, with the
support panel correctly showing no entitlement to revoke. Ruled 2026-11-04:
read it, but not in that shape.

An array cannot say *for how long*. An entitlement row needs `ends_at`, and a
key with no duration is either meaningless or a permanent give-away bought for
₹99. So the column becomes an object, `{"premium": 30}` — the key and the days
it buys — and `apply_order_paid` mints a real `entitlements` row from it with
`source="purchase"`, which `apply_refund` revokes.

No data is converted because none exists to convert: the array held no duration,
so there is nothing to carry over, and every seeded value today is either `[]`
(the one-time SKUs, which grant credits) or `["premium"]` on the two
subscription SKUs — where it must never be read at all. A subscription's access
is computed live from `subscriptions`, whose period end is the provider's fact
(ARC-13); minting a second answer from a product row would drift on every
renewal and retry. The new CHECK makes that impossible rather than discouraged:
only a `one_time` SKU may carry grants.

The downgrade restores the old column and its old contents: the object's keys as
an array, and `["premium"]` back on the subscription SKUs. The days are lost on
the way down, which is the point — the old shape could not hold them.

Revision ID: bc2d3e4f5a6b
Revises: ab1c2d3e4f5a
Create Date: 2026-11-04 14:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "bc2d3e4f5a6b"
down_revision = "ab1c2d3e4f5a"
branch_labels = None
depends_on = None

_CONSTRAINT = "ck_products_entitlement_grants_one_time_only"


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "entitlement_grants",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )
    op.drop_column("products", "entitlement_keys")
    op.create_check_constraint(
        _CONSTRAINT,
        "products",
        "kind = 'one_time' OR entitlement_grants = '{}'::jsonb",
    )


def downgrade() -> None:
    op.drop_constraint(_CONSTRAINT, "products", type_="check")
    op.add_column(
        "products",
        sa.Column(
            "entitlement_keys",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    # The keys an object carries, back as the array the old column held.
    op.execute(
        """
        UPDATE products
           SET entitlement_keys = COALESCE(
                   (SELECT jsonb_agg(k ORDER BY k)
                      FROM jsonb_object_keys(entitlement_grants) AS k),
                   '[]'::jsonb)
        """
    )
    # And what the subscription SKUs were seeded with before this revision.
    op.execute(
        """
        UPDATE products
           SET entitlement_keys = '["premium"]'::jsonb
         WHERE kind = 'subscription'
        """
    )
    op.drop_column("products", "entitlement_grants")
